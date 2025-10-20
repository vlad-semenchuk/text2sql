import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotConfig, getBotConfig } from '../config/bot.config';
import { CommandHandler, MessageHandler } from '../handlers';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Bot;
  private config: BotConfig;

  @Inject() private readonly commandHandler: CommandHandler;
  @Inject() private readonly messageHandler: MessageHandler;

  constructor() {
    this.config = getBotConfig();
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log('Bot is disabled via configuration');
      return;
    }

    try {
      this.logger.log('Initializing Telegram bot...');
      this.bot = new Bot(this.config.botToken);
      this.setupHandlers();
      this.logger.log('Starting Telegram bot...');

      // Start bot in background without blocking app initialization
      this.bot.start().catch((error) => {
        this.logger.error(`Bot polling error: ${error.message}`, error.stack);
      });

      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize and start bot: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (!this.config.enabled || !this.bot) {
      return;
    }

    try {
      this.logger.log('Stopping Telegram bot...');
      await this.bot.stop();
      this.logger.log('Telegram bot stopped successfully');
    } catch (error) {
      this.logger.error(`Error stopping bot: ${error.message}`, error.stack);
    }
  }

  private setupHandlers() {
    // Handle /clear command
    this.bot.command('clear', (ctx) => this.commandHandler.handleClear(ctx));

    // Handle text messages
    this.bot.on('message:text', (ctx) => this.messageHandler.handleTextMessage(ctx));

    // Handle non text messages
    this.bot.on('message', (ctx) => this.messageHandler.handleNonTextMessage(ctx));

    // Error handling
    this.bot.catch((err) => {
      this.logger.error(`Bot error: ${err.message}`, err.stack);
    });
  }
}
