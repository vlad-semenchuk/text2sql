import { Inject, Injectable, Logger } from '@nestjs/common';
import { Context } from 'grammy';
import { TelegramService } from '../services/telegram.service';

@Injectable()
export class MessageHandler {
  private readonly logger = new Logger(MessageHandler.name);

  @Inject() private readonly telegramService: TelegramService;

  async handleTextMessage(ctx: Context): Promise<void> {
    try {
      const userMessage = ctx.message?.text;
      const userId = ctx.from?.id;

      if (!userMessage) {
        return;
      }

      if (!userId) {
        await ctx.reply('Unable to identify user. Please try again.');
        return;
      }

      // Skip if it's a command
      if (userMessage.startsWith('/')) {
        return;
      }

      // Show typing indicator
      await ctx.replyWithChatAction('typing');

      const response = await this.telegramService.processTextQuery(userMessage, userId);

      await ctx.reply(response, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      await ctx.reply('Sorry, I encountered an error processing your message. Please try again.');
    }
  }

  async handleNonTextMessage(ctx: Context): Promise<void> {
    await ctx.reply('I can only process text messages. Please send me a text question about your database.');
  }
}
