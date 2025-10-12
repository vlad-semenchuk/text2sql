import { Test, TestingModule } from '@nestjs/testing';
import { CommandHandler } from '../lib/handlers/command.handler';

describe('CommandHandler', () => {
  let handler: CommandHandler;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CommandHandler],
    }).compile();

    handler = module.get<CommandHandler>(CommandHandler);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('handleStart', () => {
    it('should reply with welcome message', async () => {
      const mockCtx = {
        reply: jest.fn(),
      };

      await handler.handleStart(mockCtx as any);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to Text2SQL Bot!')
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🤖')
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Show me all users')
      );
    });
  });

  describe('handleHelp', () => {
    it('should reply with help message', async () => {
      const mockCtx = {
        reply: jest.fn(),
      };

      await handler.handleHelp(mockCtx as any);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Text2SQL Bot Help')
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📖')
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('/start')
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('/help')
      );
    });
  });
});