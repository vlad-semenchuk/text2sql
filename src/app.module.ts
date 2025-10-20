import { Module } from '@nestjs/common';
import { Text2SqlModule } from './modules/text2sql';
import { BotModule } from '@modules/bot';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [Text2SqlModule, BotModule, TerminusModule],
  controllers: [HealthController],
})
export class AppModule {}
