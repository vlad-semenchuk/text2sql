import { Inject, Injectable } from '@nestjs/common';
import { Context } from 'grammy';
import { TelegramService } from '../services/telegram.service';

@Injectable()
export class CommandHandler {
  @Inject() private readonly telegramService: TelegramService;

  async handleClear(ctx: Context): Promise<void> {
    this.telegramService.clearState();
    await ctx.reply('State cleared');
  }
}
