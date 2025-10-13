import { Inject, Injectable } from '@nestjs/common';
import { Context } from 'grammy';
import { TelegramService } from '../services/telegram.service';

@Injectable()
export class CommandHandler {
  @Inject() private readonly telegramService: TelegramService;

  async handleClear(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Unable to identify user. Please try again.');
      return;
    }

    this.telegramService.clearUserState(userId);
    await ctx.reply('Your conversation state has been cleared');
  }
}
