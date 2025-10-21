import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createPregenerateDiscoveryPrompt } from '../prompts';
import { z } from 'zod';
import { DiscoveryCacheService } from './discovery-cache.service';

const DiscoveryContentSchema = z.object({
  description: z.string().describe('A 1-2 sentence description of what data is available in the database'),
  exampleQuestions: z.array(z.string()).min(10).max(15).describe('10-15 diverse example questions users can ask'),
});

type DiscoveryContent = z.infer<typeof DiscoveryContentSchema>;

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject(DiscoveryCacheService) private readonly cacheService: DiscoveryCacheService;

  private dbSchema: string;
  private dbDiscoveryContent: DiscoveryContent;

  get tableInfo(): string {
    return this.dbSchema;
  }

  get discoveryContent(): DiscoveryContent {
    return this.dbDiscoveryContent;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Loading database schema...');
      this.dbSchema = await this.db.getTableInfo();

      const schemaHash = this.cacheService.calculateSchemaHash(this.dbSchema);
      const cached = await this.cacheService.get(schemaHash);

      if (cached) {
        this.dbDiscoveryContent = cached.content;
        this.logger.log('Discovery content loaded from cache');
      } else {
        this.logger.log('Pregenerating discovery content...');
        await this.pregenerateDiscoveryContent();
        await this.cacheService.set(schemaHash, this.dbDiscoveryContent);
      }

      this.logger.log('Finished loading the database schema');
    } catch (_) {
      throw new Error('Database service initialization failed');
    }
  }

  private async pregenerateDiscoveryContent(): Promise<void> {
    try {
      const prompt = await createPregenerateDiscoveryPrompt(this.dbSchema);
      const structuredLlm = this.llm.withStructuredOutput<DiscoveryContent>(DiscoveryContentSchema);

      this.dbDiscoveryContent = await structuredLlm.invoke(prompt);

      this.logger.debug(`Pregenerated ${this.dbDiscoveryContent.exampleQuestions.length} example questions`);
    } catch (_) {
      throw new Error('Discovery content pregeneration failed');
    }
  }
}
