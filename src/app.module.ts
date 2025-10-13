import { Module } from '@nestjs/common';
import { Text2SqlModule } from './modules/text2sql';
import { BotModule } from '@modules/bot';

@Module({ imports: [Text2SqlModule, BotModule] })
export class AppModule {}
