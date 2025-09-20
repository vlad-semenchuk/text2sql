import { Module } from '@nestjs/common';
import { Text2SqlService } from './services/text2sql.service';
import { Text2SqlController } from './controllers/text2sql.controller';
import { DatasourceModule } from '@modules/datasource';
import { LLMModule } from '@modules/llm';

@Module({
  imports: [DatasourceModule.forRootFromEnv(), LLMModule.forRootFromEnv()],
  controllers: [Text2SqlController],
  providers: [Text2SqlService],
})
export class Text2SqlModule {}
