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
    this.bot = new Bot(this.config.botToken);
    this.setupHandlers();
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log('Bot is disabled via configuration');
      return;
    }

    try {
      this.logger.log('Starting Telegram bot...');
      await this.bot.start();
      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error(`Failed to start bot: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (!this.config.enabled) {
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
