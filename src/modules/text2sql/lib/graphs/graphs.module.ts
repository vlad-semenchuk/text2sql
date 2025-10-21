import { Module } from '@nestjs/common';
import { DatasourceModule } from '@modules/datasource';
import { LLMModule } from '@modules/llm';
import { Text2SqlGraph } from './workflows/text2sql.graph';
import { DatabaseService } from './services/database.service';
import { DiscoveryCacheService } from './services/discovery-cache.service';
import { IntentNode } from './nodes/intent.node';
import { DiscoveryNode } from './nodes/discovery.node';
import { GreetingNode } from './nodes/greeting.node';
import { ClarificationNode } from './nodes/clarification.node';
import { RejectionNode } from './nodes/rejection.node';
import { WriteQueryNode } from './nodes/write-query.node';
import { ExecuteQueryNode } from './nodes/execute-query.node';
import { GenerateAnswerNode } from './nodes/generate-answer.node';

@Module({
  imports: [DatasourceModule.forFeature(), LLMModule.forFeature()],
  providers: [
    Text2SqlGraph,
    DatabaseService,
    DiscoveryCacheService,
    IntentNode,
    GreetingNode,
    ClarificationNode,
    RejectionNode,
    DiscoveryNode,
    WriteQueryNode,
    ExecuteQueryNode,
    GenerateAnswerNode,
  ],
  exports: [Text2SqlGraph],
})
export class GraphsModule {}
