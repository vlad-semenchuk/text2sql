import { Module } from '@nestjs/common';
import { Text2SqlService } from './services/text2sql.service';
import { DatasourceModule } from '@modules/datasource';
import { LLMModule } from '@modules/llm';
import { GraphsModule } from './graphs';

@Module({
  imports: [DatasourceModule.forRootFromEnv(), LLMModule.forRootFromEnv(), GraphsModule],
  providers: [Text2SqlService],
  exports: [Text2SqlService],
})
export class Text2SqlModule {}
