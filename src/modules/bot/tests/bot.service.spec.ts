import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from '../lib/services/bot.service';
import { CommandHandler } from '../lib/handlers/command.handler';
import { MessageHandler } from '../lib/handlers/message.handler';

// Mock Grammy Bot
const mockBot = {
  start: jest.fn(),
  stop: jest.fn(),
  command: jest.fn(),
  on: jest.fn(),
  catch: jest.fn(),
};

jest.mock('grammy', () => ({
  Bot: jest.fn().mockImplementation(() => mockBot),
}));

// Mock config
jest.mock('../lib/config/bot.config', () => ({
  getBotConfig: jest.fn().mockReturnValue({
    botToken: 'test-token',
    enabled: true,
  }),
}));

describe('BotService', () => {
  let service: BotService;
  let mockCommandHandler: jest.Mocked<CommandHandler>;
  let mockMessageHandler: jest.Mocked<MessageHandler>;
  let module: TestingModule;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const mockCommand = {
      handleStart: jest.fn(),
      handleHelp: jest.fn(),
    };

    const mockMessage = {
      handleTextMessage: jest.fn(),
      handleNonTextMessage: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        BotService,
        {
          provide: CommandHandler,
          useValue: mockCommand,
        },
        {
          provide: MessageHandler,
          useValue: mockMessage,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
    mockCommandHandler = module.get(CommandHandler);
    mockMessageHandler = module.get(MessageHandler);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('Bot initialization', () => {
    it('should initialize bot with correct token', () => {
      const { Bot } = require('grammy');
      expect(Bot).toHaveBeenCalledWith('test-token');
    });

    it('should setup command handlers during initialization', () => {
      expect(mockBot.command).toHaveBeenCalledWith('start', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('help', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message:text', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockBot.catch).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('onModuleInit', () => {
    it('should start bot when enabled', async () => {
      mockBot.start.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockBot.start).toHaveBeenCalled();
    });

    it('should not start bot when disabled', async () => {
      // Mock disabled config
      const { getBotConfig } = require('../lib/config/bot.config');
      getBotConfig.mockReturnValueOnce({
        botToken: 'test-token',
        enabled: false,
      });

      // Create new service instance with disabled config
      const disabledModule = await Test.createTestingModule({
        providers: [
          BotService,
          {
            provide: CommandHandler,
            useValue: mockCommandHandler,
          },
          {
            provide: MessageHandler,
            useValue: mockMessageHandler,
          },
        ],
      }).compile();

      const disabledService = disabledModule.get<BotService>(BotService);
      await disabledService.onModuleInit();

      expect(mockBot.start).not.toHaveBeenCalled();
      await disabledModule.close();
    });

    it('should handle bot start errors', async () => {
      const error = new Error('Failed to start bot');
      mockBot.start.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Failed to start bot');
    });
  });

  describe('onModuleDestroy', () => {
    it('should stop bot when enabled', async () => {
      mockBot.stop.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockBot.stop).toHaveBeenCalled();
    });

    it('should not stop bot when disabled', async () => {
      // Mock disabled config
      const { getBotConfig } = require('../lib/config/bot.config');
      getBotConfig.mockReturnValueOnce({
        botToken: 'test-token',
        enabled: false,
      });

      // Create new service instance with disabled config
      const disabledModule = await Test.createTestingModule({
        providers: [
          BotService,
          {
            provide: CommandHandler,
            useValue: mockCommandHandler,
          },
          {
            provide: MessageHandler,
            useValue: mockMessageHandler,
          },
        ],
      }).compile();

      const disabledService = disabledModule.get<BotService>(BotService);
      await disabledService.onModuleDestroy();

      expect(mockBot.stop).not.toHaveBeenCalled();
      await disabledModule.close();
    });

    it('should handle bot stop errors gracefully', async () => {
      const error = new Error('Failed to stop bot');
      mockBot.stop.mockRejectedValue(error);

      // Should not throw
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('Handler registration', () => {
    it('should register command and message handlers', () => {
      expect(mockBot.command).toHaveBeenCalledWith('start', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('help', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message:text', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockBot.catch).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should delegate /start command to CommandHandler', async () => {
      const commandCalls = mockBot.command.mock.calls;
      const startHandler = commandCalls.find(call => call[0] === 'start')?.[1];
      const mockCtx = { reply: jest.fn() };

      await startHandler(mockCtx);

      expect(mockCommandHandler.handleStart).toHaveBeenCalledWith(mockCtx);
    });

    it('should delegate /help command to CommandHandler', async () => {
      const commandCalls = mockBot.command.mock.calls;
      const helpHandler = commandCalls.find(call => call[0] === 'help')?.[1];
      const mockCtx = { reply: jest.fn() };

      await helpHandler(mockCtx);

      expect(mockCommandHandler.handleHelp).toHaveBeenCalledWith(mockCtx);
    });

    it('should delegate text messages to MessageHandler', async () => {
      const onCalls = mockBot.on.mock.calls;
      const textHandler = onCalls.find(call => call[0] === 'message:text')?.[1];
      const mockCtx = { message: { text: 'test' } };

      await textHandler(mockCtx);

      expect(mockMessageHandler.handleTextMessage).toHaveBeenCalledWith(mockCtx);
    });

    it('should delegate non-text messages to MessageHandler', async () => {
      const onCalls = mockBot.on.mock.calls;
      const messageHandler = onCalls.find(call => call[0] === 'message')?.[1];
      const mockCtx = { message: {} };

      await messageHandler(mockCtx);

      expect(mockMessageHandler.handleNonTextMessage).toHaveBeenCalledWith(mockCtx);
    });
  });
});