import { Module } from '@nestjs/common';
import { DatasourceModule } from '@modules/datasource';
import { WriteQueryNode } from './nodes/write-query.node';
import { LLMModule } from '@modules/llm';
import { ExecuteQueryNode } from './nodes/execute-query.node';
import { GenerateAnswerNode } from './nodes/generate-answer.node';
import { ValidateInputNode } from './nodes/validate-input.node';
import { Text2SqlGraph } from './workflows/text2sql.graph';

@Module({
  imports: [DatasourceModule.forFeature(), LLMModule.forFeature()],
  providers: [ValidateInputNode, WriteQueryNode, ExecuteQueryNode, GenerateAnswerNode, Text2SqlGraph],
  exports: [Text2SqlGraph],
})
export class GraphsModule {}
