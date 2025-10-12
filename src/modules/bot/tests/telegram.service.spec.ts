import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from '../lib/services/telegram.service';
import { Text2SqlService } from '@modules/text2sql';

describe('TelegramService', () => {
  let service: TelegramService;
  let mockText2SqlService: jest.Mocked<Text2SqlService>;
  let module: TestingModule;

  beforeEach(async () => {
    const mockText2Sql = {
      query: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: Text2SqlService,
          useValue: mockText2Sql,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    mockText2SqlService = module.get(Text2SqlService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('processTextQuery', () => {
    it('should process valid query and return string result', async () => {
      const question = 'How many users are there?';
      const expectedResult = 'There are 100 users in the database.';

      mockText2SqlService.query.mockResolvedValue(expectedResult);

      const result = await service.processTextQuery(question);

      expect(result).toBe(expectedResult);
      expect(mockText2SqlService.query).toHaveBeenCalledWith(question);
    });

    it('should format JSON result with code blocks', async () => {
      const question = 'Get user data';
      const queryResult = { count: 100, users: ['Alice', 'Bob'] };

      mockText2SqlService.query.mockResolvedValue(queryResult);

      const result = await service.processTextQuery(question);

      expect(result).toContain('```json');
      expect(result).toContain(JSON.stringify(queryResult, null, 2));
      expect(result).toContain('```');
      expect(mockText2SqlService.query).toHaveBeenCalledWith(question);
    });

    it('should handle empty or whitespace-only input', async () => {
      const result1 = await service.processTextQuery('');
      const result2 = await service.processTextQuery('   ');

      expect(result1).toBe('Please provide a valid question.');
      expect(result2).toBe('Please provide a valid question.');
      expect(mockText2SqlService.query).not.toHaveBeenCalled();
    });

    it('should handle null or undefined input', async () => {
      const result1 = await service.processTextQuery(null as any);
      const result2 = await service.processTextQuery(undefined as any);

      expect(result1).toBe('Please provide a valid question.');
      expect(result2).toBe('Please provide a valid question.');
      expect(mockText2SqlService.query).not.toHaveBeenCalled();
    });

    it('should handle errors from Text2SqlService gracefully', async () => {
      const question = 'Invalid query';
      const error = new Error('Database connection failed');

      mockText2SqlService.query.mockRejectedValue(error);

      const result = await service.processTextQuery(question);

      expect(result).toBe('Sorry, I encountered an error while processing your question. Please try again.');
      expect(mockText2SqlService.query).toHaveBeenCalledWith(question);
    });

    it('should trim whitespace from input', async () => {
      const question = '  How many users?  ';
      const expectedResult = 'Result';

      mockText2SqlService.query.mockResolvedValue(expectedResult);

      await service.processTextQuery(question);

      expect(mockText2SqlService.query).toHaveBeenCalledWith('How many users?');
    });

    it('should handle non-string, non-object results', async () => {
      const question = 'Count something';
      const numberResult = 42;

      mockText2SqlService.query.mockResolvedValue(numberResult);

      const result = await service.processTextQuery(question);

      expect(result).toBe('42');
      expect(mockText2SqlService.query).toHaveBeenCalledWith(question);
    });

    it('should handle formatting errors gracefully', async () => {
      const question = 'Test query';
      // Create a circular reference that would cause JSON.stringify to fail
      const circularObj: any = { prop: 'value' };
      circularObj.circular = circularObj;

      mockText2SqlService.query.mockResolvedValue(circularObj);

      const result = await service.processTextQuery(question);

      expect(result).toBe('Result processed successfully, but there was an issue formatting the response.');
      expect(mockText2SqlService.query).toHaveBeenCalledWith(question);
    });
  });
});