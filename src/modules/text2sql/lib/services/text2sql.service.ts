import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database';
import { LangChainService } from '@libs/langchain';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

@Injectable()
export class Text2SqlService {
  private readonly logger = new Logger(Text2SqlService.name);

  @Inject() private readonly database: DatabaseService;
  @Inject() private readonly langchain: LangChainService;

  async query(query: string) {
    this.logger.log({ msg: '🚀 Starting query process for:', query });
  }
}
