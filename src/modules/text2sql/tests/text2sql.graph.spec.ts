import { Test, TestingModule } from '@nestjs/testing';
import { Text2SqlGraph } from '../lib/graphs/workflows/text2sql.graph';
import { LLM } from '@modules/llm';
import { SQL_DATABASE } from '@modules/datasource';
import { InputType } from '../lib/graphs/state';
import { DatabaseService } from '../lib/graphs/services/database.service';
import { ValidateInputNode } from '../lib/graphs/nodes/validate-input.node';
import { WriteQueryNode } from '../lib/graphs/nodes/write-query.node';
import { ExecuteQueryNode } from '../lib/graphs/nodes/execute-query.node';
import { GenerateAnswerNode } from '../lib/graphs/nodes/generate-answer.node';
import { DiscoveryNode } from '../lib/graphs/nodes/discovery.node';

// Mock langchain hub
jest.mock('langchain/hub', () => ({
  pull: jest.fn().mockResolvedValue({
    invoke: jest.fn().mockResolvedValue('mocked prompt'),
  }),
}));

describe('Text2SqlGraph', () => {
  let graph: Text2SqlGraph;
  let mockLLM: any;
  let mockDatabase: any;

  const mockTableInfo = `Table: users
Columns: id (integer), name (varchar), email (varchar), created_at (timestamp)

Table: orders
Columns: id (integer), user_id (integer), total (decimal), status (varchar), created_at (timestamp)`;

  beforeEach(async () => {
    const mockInvokeForStructured = jest.fn();
    const mockInvokeForNormal = jest.fn();

    // Create mock LLM with separate invoke implementations
    mockLLM = {
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: mockInvokeForStructured,
      }),
      invoke: mockInvokeForNormal,
    };

    // Create mock database
    mockDatabase = {
      appDataSourceOptions: { type: 'postgres' },
      getTableInfo: jest.fn().mockResolvedValue(mockTableInfo),
      run: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Text2SqlGraph,
        ValidateInputNode,
        WriteQueryNode,
        ExecuteQueryNode,
        GenerateAnswerNode,
        DiscoveryNode,
        DatabaseService,
        {
          provide: LLM,
          useValue: mockLLM,
        },
        {
          provide: SQL_DATABASE,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    graph = module.get<Text2SqlGraph>(Text2SqlGraph);
    const dbService = module.get<DatabaseService>(DatabaseService);
    const writeQueryNode = module.get<WriteQueryNode>(WriteQueryNode);

    // Initialize database service manually for testing
    await dbService.onModuleInit();

    // Mock WriteQueryNode's prompt template to avoid langchain hub call
    await writeQueryNode.onModuleInit();

    // Initialize graph
    graph.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Query Path', () => {
    it('should execute valid query workflow', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock validation response (ValidateInputNode) - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        questionType: InputType.VALID_QUERY,
        rejectionReason: '',
      });

      // Mock query generation (WriteQueryNode) - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT COUNT(*) as count FROM users',
      });

      // Mock answer generation (GenerateAnswerNode) - normal invoke
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'There are 100 users in the database.',
      });

      // Mock database query execution
      mockDatabase.run.mockResolvedValueOnce([{ count: 100 }]);

      const result = await graph.execute('How many users are there?');

      expect(result).toBe('There are 100 users in the database.');
      expect(mockDatabase.run).toHaveBeenCalled();
    });

    it('should handle query validation and fix invalid queries', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock validation response - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        questionType: InputType.VALID_QUERY,
        rejectionReason: '',
      });

      // Mock initial invalid query - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT * FROM invalid_table',
      });

      // Mock fixed query - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT * FROM users LIMIT 10',
      });

      // Mock answer generation - normal invoke
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Here are the users.',
      });

      // First EXPLAIN fails, second succeeds
      mockDatabase.run
        .mockRejectedValueOnce(new Error('table "invalid_table" does not exist'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1, name: 'Test' }]);

      const result = await graph.execute('Show me all users');

      expect(result).toBe('Here are the users.');
    });
  });

  describe('Discovery Path', () => {
    it('should execute discovery workflow for non-query questions', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock validation response routing to discovery - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        questionType: InputType.DISCOVERY_REQUEST,
        rejectionReason: '',
      });

      // Mock discovery response - normal invoke
      mockLLM.invoke.mockResolvedValueOnce({
        content:
          'This database contains users and orders tables. You can ask questions like: How many users are there? What are the recent orders?',
      });

      const result = await graph.execute('What can you help me with?');

      expect(result).toContain('users and orders tables');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should handle greetings as discovery requests', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock validation - structured
      structuredLlm.invoke.mockResolvedValueOnce({
        questionType: InputType.DISCOVERY_REQUEST,
        rejectionReason: '',
      });

      // Mock discovery response - normal invoke
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hello! I can help you query the database.',
      });

      const result = await graph.execute('Hello');

      expect(result).toContain('Hello');
    });
  });
});
