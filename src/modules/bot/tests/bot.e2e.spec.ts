/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Context } from 'grammy';
import { BotModule } from '../lib/bot.module';
import { BotService } from '../lib/services/bot.service';
import { TelegramService } from '../lib/services/telegram.service';
import { CommandHandler } from '../lib/handlers/command.handler';
import { MessageHandler } from '../lib/handlers/message.handler';
import { Text2SqlService } from '@modules/text2sql';

// Mock Grammy Context with proper method typing
interface MockContext extends Partial<Context> {
  reply: jest.MockedFunction<any>;
  replyWithChatAction: jest.MockedFunction<any>;
}

const createMockContext = (message?: string, userId = 123456): MockContext => {
  const replyMock = jest.fn().mockResolvedValue({});
  const replyWithChatActionMock = jest.fn().mockResolvedValue({});

  return {
    message: message
      ? ({
          message_id: 1,
          date: Date.now(),
          chat: {
            id: userId,
            type: 'private' as const,
          },
          text: message,
        } as any)
      : undefined,
    from: {
      id: userId,
      is_bot: false,
      first_name: 'Test',
    } as any,
    reply: replyMock,
    replyWithChatAction: replyWithChatActionMock,
  };
};

// Mock Bot Config
jest.mock('../lib/config/bot.config', () => ({
  getBotConfig: () => ({
    botToken: 'test-bot-token',
    enabled: false, // Disabled for testing
  }),
}));

// Mock Grammy Bot
jest.mock('grammy', () => ({
  Bot: jest.fn().mockImplementation(() => ({
    command: jest.fn(),
    on: jest.fn(),
    catch: jest.fn(),
    start: jest.fn().mockResolvedValue({}),
    stop: jest.fn().mockResolvedValue({}),
  })),
}));

describe('Bot End-to-End Workflow', () => {
  let module: TestingModule;
  let botService: BotService;
  let telegramService: TelegramService;
  let commandHandler: CommandHandler;
  let messageHandler: MessageHandler;
  let text2SqlService: jest.Mocked<Text2SqlService>;

  beforeEach(async () => {
    const text2SqlServiceMock = {
      query: jest.fn().mockResolvedValue('SELECT * FROM users;'),
    };

    module = await Test.createTestingModule({
      imports: [BotModule],
    })
      .overrideProvider(Text2SqlService)
      .useValue(text2SqlServiceMock)
      .compile();

    botService = module.get<BotService>(BotService);
    telegramService = module.get<TelegramService>(TelegramService);
    commandHandler = module.get<CommandHandler>(CommandHandler);
    messageHandler = module.get<MessageHandler>(MessageHandler);
    text2SqlService = jest.mocked(module.get(Text2SqlService));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Bot Service', () => {
    it('should be defined', () => {
      expect(botService).toBeDefined();
    });

    it('should initialize without starting bot when disabled', async () => {
      // Bot is disabled in config, so onModuleInit should not start the bot
      await expect(botService.onModuleInit()).resolves.not.toThrow();
    });

    it('should stop gracefully', async () => {
      await expect(botService.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('Telegram Service', () => {
    it('should be defined', () => {
      expect(telegramService).toBeDefined();
    });

    it('should create unique threadId per user', async () => {
      const userId1 = 123456;
      const userId2 = 789012;

      // Process queries for different users
      await telegramService.processTextQuery('test1', userId1);
      await telegramService.processTextQuery('test2', userId2);

      // Verify different thread IDs are used
      const calls = text2SqlService.query.mock.calls;
      expect(calls[0][1]).not.toBe(calls[1][1]); // Different thread IDs
      expect(calls[0][1]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(calls[1][1]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should process text query successfully', async () => {
      const question = 'Show me all users';
      const userId = 123456;
      const result = await telegramService.processTextQuery(question, userId);

      expect(text2SqlService.query).toHaveBeenCalledWith(
        question,
        expect.any(String), // threadId
      );
      expect(result).toBe('SELECT * FROM users;');
    });

    it('should handle empty question', async () => {
      const result = await telegramService.processTextQuery('', 123456);
      expect(result).toBe('Please provide a valid question.');
    });

    it('should handle text2sql service errors', async () => {
      const queryMock = text2SqlService.query as jest.MockedFunction<typeof text2SqlService.query>;
      queryMock.mockRejectedValueOnce(new Error('Service error'));

      const result = await telegramService.processTextQuery('test question', 123456);
      expect(result).toBe('Sorry, I encountered an error while processing your question. Please try again.');
    });

    it('should clear user state and generate new threadId for specific user', async () => {
      const userId = 123456;

      // Get initial thread ID by making a query
      await telegramService.processTextQuery('first query', userId);
      const originalThreadId = text2SqlService.query.mock.calls[0][1];

      // Clear user state
      telegramService.clearUserState(userId);

      // Make another query to get new thread ID
      await telegramService.processTextQuery('second query', userId);
      const newThreadId = text2SqlService.query.mock.calls[1][1];

      expect(newThreadId).not.toBe(originalThreadId);
      expect(newThreadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should maintain same threadId for same user across queries', async () => {
      const userId = 123456;

      await telegramService.processTextQuery('first query', userId);
      await telegramService.processTextQuery('second query', userId);

      const calls = text2SqlService.query.mock.calls;
      expect(calls[0][1]).toBe(calls[1][1]); // Same thread ID for same user
    });
  });

  describe('Command Handler', () => {
    it('should be defined', () => {
      expect(commandHandler).toBeDefined();
    });

    it('should handle /clear command', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('', userId) as Context;

      // Get initial thread ID by making a query
      await telegramService.processTextQuery('initial query', userId);
      const originalThreadId = text2SqlService.query.mock.calls[0][1];

      // Clear user state
      await commandHandler.handleClear(mockCtx);

      // Make another query to verify new thread ID
      await telegramService.processTextQuery('after clear query', userId);
      const newThreadId = text2SqlService.query.mock.calls[1][1];

      expect(newThreadId).not.toBe(originalThreadId);
      expect(mockCtx.reply).toHaveBeenCalledWith('Your conversation state has been cleared');
    });

    it('should handle /clear command without user ID', async () => {
      const mockCtx = createMockContext() as Context;
      mockCtx.from = undefined; // Simulate missing user info

      await commandHandler.handleClear(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Unable to identify user. Please try again.');
    });
  });

  describe('Message Handler', () => {
    it('should be defined', () => {
      expect(messageHandler).toBeDefined();
    });

    it('should handle text messages', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('Show me all users', userId) as Context;

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).toHaveBeenCalledWith('typing');
      expect(mockCtx.reply).toHaveBeenCalledWith('SELECT * FROM users;', { parse_mode: 'Markdown' });
    });

    it('should skip command messages', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('/start', userId) as Context;

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle messages without text', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('', userId) as Context;
      mockCtx.message = undefined; // No message

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle messages without user ID', async () => {
      const mockCtx = createMockContext('test message') as Context;
      mockCtx.from = undefined; // No user info

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockCtx.reply).toHaveBeenCalledWith('Unable to identify user. Please try again.');
    });

    it('should handle telegram service errors', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('test question', userId) as Context;
      text2SqlService.query.mockRejectedValueOnce(new Error('Service error'));

      await messageHandler.handleTextMessage(mockCtx);

      // The service catches the error and returns its own error message
      expect(mockCtx.reply).toHaveBeenCalledWith(
        'Sorry, I encountered an error while processing your question. Please try again.',
        { parse_mode: 'Markdown' },
      );
    });

    it('should handle non-text messages', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('', userId) as Context;
      mockCtx.message = undefined; // Non-text message

      await messageHandler.handleNonTextMessage(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        'I can only process text messages. Please send me a text question about your database.',
      );
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full conversation workflow', async () => {
      const userId = 123456;
      const mockCtx = createMockContext('Show me all active users', userId) as Context;

      // 1. User sends a text message
      await messageHandler.handleTextMessage(mockCtx);

      // Get the thread ID from the first call
      const originalThreadId = text2SqlService.query.mock.calls[0][1];

      // Verify the workflow
      expect(mockCtx.replyWithChatAction).toHaveBeenCalledWith('typing');
      expect(text2SqlService.query).toHaveBeenCalledWith('Show me all active users', originalThreadId);
      expect(mockCtx.reply).toHaveBeenCalledWith('SELECT * FROM users;', { parse_mode: 'Markdown' });

      // 2. User clears the conversation
      const clearCtx = createMockContext('', userId) as Context;
      await commandHandler.handleClear(clearCtx);

      // Verify state is cleared
      expect(clearCtx.reply).toHaveBeenCalledWith('Your conversation state has been cleared');

      // 3. User sends another message with new thread context
      const newMsgCtx = createMockContext('Count total orders', userId) as Context;
      await messageHandler.handleTextMessage(newMsgCtx);

      // Verify new threadId is used
      const newThreadId = text2SqlService.query.mock.calls[1][1];
      expect(newThreadId).not.toBe(originalThreadId);
      expect(text2SqlService.query).toHaveBeenCalledWith('Count total orders', newThreadId);
    });

    it('should handle multiple users independently', async () => {
      const user1Id = 123456;
      const user2Id = 789012;

      // Both users send queries
      await telegramService.processTextQuery('User 1 Query', user1Id);
      await telegramService.processTextQuery('User 2 Query', user2Id);

      // Verify different thread IDs are used
      const calls = text2SqlService.query.mock.calls;
      const user1ThreadId = calls[0][1];
      const user2ThreadId = calls[1][1];

      expect(user1ThreadId).not.toBe(user2ThreadId);
      expect(text2SqlService.query).toHaveBeenCalledWith('User 1 Query', user1ThreadId);
      expect(text2SqlService.query).toHaveBeenCalledWith('User 2 Query', user2ThreadId);

      // User 1 clears their state
      telegramService.clearUserState(user1Id);

      // Both users send more queries
      await telegramService.processTextQuery('User 1 After Clear', user1Id);
      await telegramService.processTextQuery('User 2 Continues', user2Id);

      const user1NewThreadId = calls[2][1];
      const user2ContinuedThreadId = calls[3][1];

      // User 1 should have new thread ID, User 2 should keep the same
      expect(user1NewThreadId).not.toBe(user1ThreadId);
      expect(user2ContinuedThreadId).toBe(user2ThreadId);
    });

    it('should maintain thread context across multiple queries for same user', async () => {
      const userId = 123456;

      // Send multiple queries for same user
      await telegramService.processTextQuery('First query', userId);
      await telegramService.processTextQuery('Second query', userId);
      await telegramService.processTextQuery('Third query', userId);

      const calls = text2SqlService.query.mock.calls;
      const threadId = calls[0][1];

      // All should use same threadId for same user
      expect(text2SqlService.query).toHaveBeenNthCalledWith(1, 'First query', threadId);
      expect(text2SqlService.query).toHaveBeenNthCalledWith(2, 'Second query', threadId);
      expect(text2SqlService.query).toHaveBeenNthCalledWith(3, 'Third query', threadId);
    });
  });
});
