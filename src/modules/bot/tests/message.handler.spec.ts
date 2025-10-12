import { Test, TestingModule } from '@nestjs/testing';
import { MessageHandler } from '../lib/handlers/message.handler';
import { TelegramService } from '../lib/services/telegram.service';

describe('MessageHandler', () => {
  let handler: MessageHandler;
  let mockTelegramService: jest.Mocked<TelegramService>;
  let module: TestingModule;

  beforeEach(async () => {
    const mockTelegram = {
      processTextQuery: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        MessageHandler,
        {
          provide: TelegramService,
          useValue: mockTelegram,
        },
      ],
    }).compile();

    handler = module.get<MessageHandler>(MessageHandler);
    mockTelegramService = module.get(TelegramService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('handleTextMessage', () => {
    it('should process non-command text messages', async () => {
      const mockCtx = {
        message: { text: 'How many users are there?' },
        replyWithChatAction: jest.fn(),
        reply: jest.fn(),
      };

      mockTelegramService.processTextQuery.mockResolvedValue('There are 100 users.');

      await handler.handleTextMessage(mockCtx as any);

      expect(mockCtx.replyWithChatAction).toHaveBeenCalledWith('typing');
      expect(mockTelegramService.processTextQuery).toHaveBeenCalledWith('How many users are there?');
      expect(mockCtx.reply).toHaveBeenCalledWith('There are 100 users.', { parse_mode: 'Markdown' });
    });

    it('should skip command messages', async () => {
      const mockCtx = {
        message: { text: '/start' },
        replyWithChatAction: jest.fn(),
        reply: jest.fn(),
      };

      await handler.handleTextMessage(mockCtx as any);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockTelegramService.processTextQuery).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle missing text message', async () => {
      const mockCtx = {
        message: {},
        replyWithChatAction: jest.fn(),
        reply: jest.fn(),
      };

      await handler.handleTextMessage(mockCtx as any);

      expect(mockCtx.replyWithChatAction).not.toHaveBeenCalled();
      expect(mockTelegramService.processTextQuery).not.toHaveBeenCalled();
      expect(mockCtx.reply).not.toHaveBeenCalled();
    });

    it('should handle errors in text processing', async () => {
      const mockCtx = {
        message: { text: 'Test query' },
        replyWithChatAction: jest.fn(),
        reply: jest.fn(),
      };

      mockTelegramService.processTextQuery.mockRejectedValue(new Error('Processing failed'));

      await handler.handleTextMessage(mockCtx as any);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        'Sorry, I encountered an error processing your message. Please try again.'
      );
    });
  });

  describe('handleNonTextMessage', () => {
    it('should handle non-text messages', async () => {
      const mockCtx = {
        reply: jest.fn(),
      };

      await handler.handleNonTextMessage(mockCtx as any);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        'I can only process text messages. Please send me a text question about your database.'
      );
    });
  });
});