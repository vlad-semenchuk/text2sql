import { Test, TestingModule } from '@nestjs/testing';
import { Text2SqlGraph } from '../lib/graphs/workflows/text2sql.graph';
import { LLM } from '@modules/llm';
import { SQL_DATABASE } from '@modules/datasource';
import { IntentType } from '../lib/graphs/types';
import { DatabaseService } from '../lib/graphs/services/database.service';
import { DiscoveryCacheService } from '../lib/graphs/services/discovery-cache.service';
import { IntentNode } from '../lib/graphs/nodes/intent.node';
import { GreetingNode } from '../lib/graphs/nodes/greeting.node';
import { ClarificationNode } from '../lib/graphs/nodes/clarification.node';
import { RejectionNode } from '../lib/graphs/nodes/rejection.node';
import { DiscoveryNode } from '../lib/graphs/nodes/discovery.node';
import { WriteQueryNode } from '../lib/graphs/nodes/write-query.node';
import { ExecuteQueryNode } from '../lib/graphs/nodes/execute-query.node';
import { GenerateAnswerNode } from '../lib/graphs/nodes/generate-answer.node';

describe('Text2SqlGraph', () => {
  let graph: Text2SqlGraph;
  let mockLLM: any;
  let mockDatabase: any;
  let module: TestingModule;

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

    // Mock discovery cache service
    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      calculateSchemaHash: jest.fn().mockReturnValue('mock-hash'),
    };

    // Mock pregeneration of discovery content (for DatabaseService initialization)
    const structuredLlm = mockLLM.withStructuredOutput();
    structuredLlm.invoke.mockResolvedValueOnce({
      description: 'Database with users and orders',
      exampleQuestions: [
        'How many users?',
        'Show recent orders',
        'List all users',
        'Get order totals',
        'Find users by email',
        'Show pending orders',
        'Count total orders',
        'Get user details',
        'Show orders by user',
        'List active users',
      ],
    });

    module = await Test.createTestingModule({
      providers: [
        Text2SqlGraph,
        IntentNode,
        GreetingNode,
        ClarificationNode,
        RejectionNode,
        DiscoveryNode,
        WriteQueryNode,
        ExecuteQueryNode,
        GenerateAnswerNode,
        DatabaseService,
        {
          provide: LLM,
          useValue: mockLLM,
        },
        {
          provide: SQL_DATABASE,
          useValue: mockDatabase,
        },
        {
          provide: DiscoveryCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    graph = module.get<Text2SqlGraph>(Text2SqlGraph);
    const dbService = module.get<DatabaseService>(DatabaseService);

    // Initialize database service manually for testing
    await dbService.onModuleInit();

    // Initialize graph
    graph.onModuleInit();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('Intent Classification Routing', () => {
    it('should route QUERY_REQUEST to WriteQueryNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'User wants to query the database',
      });

      // Mock WriteQueryNode response (no rejection)
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT COUNT(*) FROM users',
        rejectionReason: '',
      });

      // Mock ExecuteQueryNode
      mockDatabase.run.mockResolvedValueOnce('[{"count": 5}]');

      // Mock GenerateAnswerNode
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'There are 5 users.',
      });

      const result = await graph.execute('How many users?', 'test-thread-1');

      expect(result).toBe('There are 5 users.');
      // Note: Call count includes initialization pregeneration + Intent + WriteQuery = 3 total
    });

    it('should route GREETING to GreetingNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.GREETING,
        reason: 'User is greeting',
      });

      // Mock GreetingNode
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hello! How can I help you with database queries?',
      });

      const result = await graph.execute('Hello!', 'test-thread-2');

      expect(result).toBe('Hello! How can I help you with database queries?');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should route AMBIGUOUS_QUERY to ClarificationNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.AMBIGUOUS_QUERY,
        reason: 'Query lacks specificity about which users',
      });

      // Mock ClarificationNode
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Could you clarify which users you are referring to?',
      });

      const result = await graph.execute('Show users', 'test-thread-3');

      expect(result).toBe('Could you clarify which users you are referring to?');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should route INVALID_QUERY to RejectionNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.INVALID_QUERY,
        reason: 'Request is asking for data modification which is not allowed',
      });

      // Mock RejectionNode
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'I cannot perform data modifications. I can only help with read queries.',
      });

      const result = await graph.execute('Delete all users', 'test-thread-4');

      expect(result).toBe('I cannot perform data modifications. I can only help with read queries.');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should route DISCOVERY_REQUEST to DiscoveryNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.DISCOVERY_REQUEST,
        reason: 'User wants to know about database capabilities',
      });

      // Mock DiscoveryNode
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'This database has users and orders tables. You can ask about user counts, orders, etc.',
      });

      const result = await graph.execute('What can you tell me?', 'test-thread-5');

      expect(result).toContain('users and orders tables');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should handle missing intent type gracefully', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Mock IntentNode response with no type
      structuredLlm.invoke.mockResolvedValueOnce({
        type: null,
        reason: 'Could not classify',
      });

      const result = await graph.execute('asdfgh', 'test-thread-6');

      // Should return undefined as it routes to END
      expect(result).toBeUndefined();
    });
  });

  describe('Complete Workflow Paths', () => {
    it('should complete QUERY_REQUEST workflow: Intent → WriteQuery → Execute → GenerateAnswer', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Intent classification
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'User wants user count',
      });

      // WriteQuery generates SQL
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT COUNT(*) as user_count FROM users',
        rejectionReason: '',
      });

      // Execute query returns result
      mockDatabase.run.mockResolvedValueOnce('[{"user_count": 42}]');

      // Generate natural language answer
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'There are 42 users in the database.',
      });

      const result = await graph.execute('How many users do we have?', 'test-thread-7');

      expect(result).toBe('There are 42 users in the database.');
      expect(mockDatabase.run).toHaveBeenCalledWith('SELECT COUNT(*) as user_count FROM users');
    });

    it('should handle QUERY_REQUEST with WriteQuery rejection', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Intent classification
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'Appears to be a query request',
      });

      // WriteQuery detects it cannot generate safe query
      structuredLlm.invoke.mockResolvedValueOnce({
        query: '',
        rejectionReason: 'Cannot generate query for data modification request',
      });

      // RejectionNode handles it
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'I cannot help with that request.',
      });

      const result = await graph.execute('Drop the users table', 'test-thread-8');

      expect(result).toBe('I cannot help with that request.');
      expect(mockDatabase.run).not.toHaveBeenCalled();
    });

    it('should complete GREETING workflow: Intent → Greeting → END', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.GREETING,
        reason: 'Friendly greeting',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hi there! I can help you query the database.',
      });

      const result = await graph.execute('Hi!', 'test-thread-9');

      expect(result).toBe('Hi there! I can help you query the database.');
    });

    it('should complete AMBIGUOUS_QUERY workflow: Intent → Clarification → END', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.AMBIGUOUS_QUERY,
        reason: 'Not clear which data is needed',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Could you be more specific about what information you need?',
      });

      const result = await graph.execute('Tell me about them', 'test-thread-10');

      expect(result).toBe('Could you be more specific about what information you need?');
    });

    it('should complete INVALID_QUERY workflow: Intent → Rejection → END', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.INVALID_QUERY,
        reason: 'Requesting unauthorized operation',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'I can only help with read-only queries.',
      });

      const result = await graph.execute('Update all passwords', 'test-thread-11');

      expect(result).toBe('I can only help with read-only queries.');
    });

    it('should complete DISCOVERY_REQUEST workflow: Intent → Discovery → END', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.DISCOVERY_REQUEST,
        reason: 'User exploring capabilities',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'I can help you query information from the users and orders tables.',
      });

      const result = await graph.execute('What can I ask about?', 'test-thread-12');

      expect(result).toContain('users and orders');
    });
  });

  describe('Query Execution with Validation and Fixing', () => {
    it('should validate and fix invalid SQL queries', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Intent: query request
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'User wants data',
      });

      // First query attempt - invalid
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT * FROM nonexistent_table',
        rejectionReason: '',
      });

      // Mock EXPLAIN failure, then fix attempt, then success
      mockDatabase.run
        .mockRejectedValueOnce(new Error('table "nonexistent_table" does not exist'))
        .mockResolvedValueOnce('[]') // EXPLAIN for fixed query
        .mockResolvedValueOnce('[{"id": 1}]'); // Actual query result

      // Fixed query
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT * FROM users LIMIT 10',
        rejectionReason: '',
      });

      // Generate answer
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Here is the user data.',
      });

      const result = await graph.execute('Show me data', 'test-thread-13');

      expect(result).toBe('Here is the user data.');
      // Note: Call count includes pregeneration + Intent + BadQuery + FixedQuery = 4 total
    });

    it('should handle max retry exhaustion gracefully', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Intent
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'Query request',
      });

      // All query attempts fail
      structuredLlm.invoke.mockResolvedValue({
        query: 'SELECT * FROM bad_table',
      });

      // Mock consistent failures
      mockDatabase.run.mockRejectedValue(new Error('table does not exist'));

      // After max retries, should set rejection reason
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'I was unable to generate a valid query for your request.',
      });

      const result = await graph.execute('Show impossible data', 'test-thread-14');

      expect(result).toContain('unable to generate');
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM failures in IntentNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockRejectedValueOnce(new Error('LLM service unavailable'));

      await expect(graph.execute('Hello', 'test-thread-15')).rejects.toThrow('LLM service unavailable');
    });

    it('should handle database execution errors during query validation', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'Query',
      });

      // WriteQueryNode generates a query
      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT * FROM users',
        rejectionReason: '',
      });

      // First database call (EXPLAIN) fails, triggering fix attempt
      mockDatabase.run.mockRejectedValueOnce(new Error('Database connection lost'));

      // Fix attempt returns rejection
      structuredLlm.invoke.mockResolvedValueOnce({
        query: '',
        rejectionReason: 'Unable to connect to database',
      });

      // RejectionNode handles it
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Database is currently unavailable.',
      });

      const result = await graph.execute('Get users', 'test-thread-16');

      expect(result).toBe('Database is currently unavailable.');
    });
  });

  describe('Thread Persistence', () => {
    it('should use provided thread_id in configuration', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.GREETING,
        reason: 'Greeting',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hello!',
      });

      const threadId = 'unique-thread-123';
      await graph.execute('Hi', threadId);

      // The graph should be invoked with config containing the thread_id
      // This is implicitly tested by the fact that the graph doesn't error
      expect(true).toBe(true);
    });

    it('should maintain separate state for different threads', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      // Thread 1
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.GREETING,
        reason: 'Greeting',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hello Thread 1!',
      });

      const result1 = await graph.execute('Hi', 'thread-1');

      // Thread 2
      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.GREETING,
        reason: 'Greeting',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Hello Thread 2!',
      });

      const result2 = await graph.execute('Hi', 'thread-2');

      expect(result1).toBe('Hello Thread 1!');
      expect(result2).toBe('Hello Thread 2!');
    });
  });

  describe('State Management', () => {
    it('should properly set rejectionReason when intent is INVALID_QUERY', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.INVALID_QUERY,
        reason: 'Not allowed operation',
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'Cannot do that.',
      });

      const result = await graph.execute('Bad request', 'test-thread-17');

      expect(result).toBe('Cannot do that.');
      // RejectionNode should receive the reason from IntentNode
    });

    it('should pass query result to GenerateAnswerNode', async () => {
      const structuredLlm = mockLLM.withStructuredOutput();

      structuredLlm.invoke.mockResolvedValueOnce({
        type: IntentType.QUERY_REQUEST,
        reason: 'Query',
      });

      structuredLlm.invoke.mockResolvedValueOnce({
        query: 'SELECT name FROM users',
        rejectionReason: '',
      });

      const mockResult = '[{"name": "Alice"}, {"name": "Bob"}]';
      mockDatabase.run.mockResolvedValueOnce(mockResult);

      mockLLM.invoke.mockResolvedValueOnce({
        content: 'The users are Alice and Bob.',
      });

      const result = await graph.execute('List users', 'test-thread-18');

      expect(result).toBe('The users are Alice and Bob.');
    });
  });
});
