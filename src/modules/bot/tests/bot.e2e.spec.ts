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

const createMockContext = (message?: string): MockContext => {
  const replyMock = jest.fn().mockResolvedValue({});
  const replyWithChatActionMock = jest.fn().mockResolvedValue({});

  return {
    message: message
      ? ({
          message_id: 1,
          date: Date.now(),
          chat: {
            id: 123456,
            type: 'private' as const,
          },
          text: message,
        } as any)
      : undefined,
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

    it('should have a unique threadId initialized', () => {
      // Access private property through reflection for testing
      const threadId = (telegramService as any).threadId;
      expect(threadId).toBeDefined();
      expect(typeof threadId).toBe('string');
      expect(threadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should process text query successfully', async () => {
      const question = 'Show me all users';
      const result = await telegramService.processTextQuery(question);

      expect(text2SqlService.query).toHaveBeenCalledWith(
        question,
        expect.any(String), // threadId
      );
      expect(result).toBe('SELECT * FROM users;');
    });

    it('should handle empty question', async () => {
      const result = await telegramService.processTextQuery('');
      expect(result).toBe('Please provide a valid question.');
    });

    it('should handle text2sql service errors', async () => {
      const queryMock = text2SqlService.query as jest.MockedFunction<typeof text2SqlService.query>;
      queryMock.mockRejectedValueOnce(new Error('Service error'));

      const result = await telegramService.processTextQuery('test question');
      expect(result).toBe('Sorry, I encountered an error while processing your question. Please try again.');
    });

    it('should clear state and generate new threadId', () => {
      const originalThreadId = (telegramService as any).threadId;

      telegramService.clearState();

      const newThreadId = (telegramService as any).threadId;
      expect(newThreadId).not.toBe(originalThreadId);
      expect(newThreadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should use new threadId after clearing state', async () => {
      // Clear state to get new threadId
      telegramService.clearState();
      const newThreadId = (telegramService as any).threadId;

      await telegramService.processTextQuery('test question');

      expect(text2SqlService.query).toHaveBeenCalledWith('test question', newThreadId);
    });
  });

  describe('Command Handler', () => {
    it('should be defined', () => {
      expect(commandHandler).toBeDefined();
    });

    it('should handle /clear command', async () => {
      const mockCtx = createMockContext() as Context;
      const originalThreadId = (telegramService as any).threadId;

      await commandHandler.handleClear(mockCtx);

      const newThreadId = (telegramService as any).threadId;
      expect(newThreadId).not.toBe(originalThreadId);
      expect(mockCtx.reply).toHaveBeenCalledWith('State cleared');
    });
  });

  describe('Message Handler', () => {
    it('should be defined', () => {
      expect(messageHandler).toBeDefined();
    });

    it('should handle text messages', async () => {
      const mockCtx = createMockContext('Show me all users') as Context;

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).toHaveBeenCalledWith('typing');
      expect(mockCtx.reply).toHaveBeenCalledWith('SELECT * FROM users;', { parse_mode: 'Markdown' });
    });

    it('should skip command messages', async () => {
      const mockCtx = createMockContext('/start') as Context;

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle messages without text', async () => {
      const mockCtx = createMockContext() as Context;

      await messageHandler.handleTextMessage(mockCtx);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle telegram service errors', async () => {
      const mockCtx = createMockContext('test question') as Context;
      text2SqlService.query.mockRejectedValueOnce(new Error('Service error'));

      await messageHandler.handleTextMessage(mockCtx);

      // The service catches the error and returns its own error message
      expect(mockCtx.reply).toHaveBeenCalledWith(
        'Sorry, I encountered an error while processing your question. Please try again.',
        { parse_mode: 'Markdown' },
      );
    });

    it('should handle non-text messages', async () => {
      const mockCtx = createMockContext() as Context;

      await messageHandler.handleNonTextMessage(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        'I can only process text messages. Please send me a text question about your database.',
      );
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full conversation workflow', async () => {
      const mockCtx = createMockContext('Show me all active users') as Context;
      const originalThreadId = (telegramService as any).threadId;

      // 1. User sends a text message
      await messageHandler.handleTextMessage(mockCtx);

      // Verify the workflow
      expect(mockCtx.replyWithChatAction).toHaveBeenCalledWith('typing');
      expect(text2SqlService.query).toHaveBeenCalledWith('Show me all active users', originalThreadId);
      expect(mockCtx.reply).toHaveBeenCalledWith('SELECT * FROM users;', { parse_mode: 'Markdown' });

      // 2. User clears the conversation
      const clearCtx = createMockContext() as Context;
      await commandHandler.handleClear(clearCtx);

      // Verify state is cleared
      const newThreadId = (telegramService as any).threadId;
      expect(newThreadId).not.toBe(originalThreadId);
      expect(clearCtx.reply).toHaveBeenCalledWith('State cleared');

      // 3. User sends another message with new thread context
      const newMsgCtx = createMockContext('Count total orders') as Context;
      await messageHandler.handleTextMessage(newMsgCtx);

      // Verify new threadId is used
      expect(text2SqlService.query).toHaveBeenCalledWith('Count total orders', newThreadId);
    });

    it('should handle multiple conversation states independently', async () => {
      // Create a new module for second instance to simulate different bot instances
      const module2 = await Test.createTestingModule({
        imports: [BotModule],
      })
        .overrideProvider(Text2SqlService)
        .useValue(text2SqlService)
        .compile();

      const service1 = telegramService; // Use existing instance
      const service2 = module2.get<TelegramService>(TelegramService);

      const threadId1 = (service1 as any).threadId;
      const threadId2 = (service2 as any).threadId;

      // Different instances should have different threadIds
      expect(threadId1).not.toBe(threadId2);

      // Both should work independently
      await service1.processTextQuery('Query 1');
      await service2.processTextQuery('Query 2');

      expect(text2SqlService.query).toHaveBeenCalledWith('Query 1', threadId1);
      expect(text2SqlService.query).toHaveBeenCalledWith('Query 2', threadId2);

      await module2.close();
    });

    it('should maintain thread context across multiple queries', async () => {
      const threadId = (telegramService as any).threadId;

      // Send multiple queries
      await telegramService.processTextQuery('First query');
      await telegramService.processTextQuery('Second query');
      await telegramService.processTextQuery('Third query');

      // All should use same threadId
      expect(text2SqlService.query).toHaveBeenNthCalledWith(1, 'First query', threadId);
      expect(text2SqlService.query).toHaveBeenNthCalledWith(2, 'Second query', threadId);
      expect(text2SqlService.query).toHaveBeenNthCalledWith(3, 'Third query', threadId);
    });
  });
});
