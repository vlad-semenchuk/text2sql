import { Module } from '@nestjs/common';
import { Text2SqlModule } from './modules/text2sql';
import { BotModule } from '@modules/bot';
import { TerminusModule } from '@nestjs/terminus';
import { VectorStoreModule } from '@modules/vector-store';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [Text2SqlModule, BotModule, TerminusModule, VectorStoreModule.forRootFromEnv()],
  controllers: [HealthController],
})
export class AppModule {}
