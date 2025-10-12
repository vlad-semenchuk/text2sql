import { Module } from '@nestjs/common';
import { Text2SqlModule } from '@modules/text2sql';
import { BotService } from './services/bot.service';
import { TelegramService } from './services/telegram.service';
import { CommandHandler, MessageHandler } from './handlers';

@Module({
  imports: [Text2SqlModule],
  providers: [BotService, TelegramService, CommandHandler, MessageHandler],
  exports: [BotService, TelegramService, CommandHandler, MessageHandler],
})
export class BotModule {}