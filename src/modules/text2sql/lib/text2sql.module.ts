import { Module } from '@nestjs/common';
import { Text2SqlService } from './services/text2sql.service';
import { Text2SqlController } from './controllers/text2sql.controller';
import { DatasourceModule } from '@modules/datasource';
import { LLMModule } from '@modules/llm';
import { GraphsModule } from './graphs';

@Module({
  imports: [DatasourceModule.forRootFromEnv(), LLMModule.forRootFromEnv(), GraphsModule],
  controllers: [Text2SqlController],
  providers: [Text2SqlService],
})
export class Text2SqlModule {}
