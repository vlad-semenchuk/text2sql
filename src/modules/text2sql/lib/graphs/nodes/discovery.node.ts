import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';

@Injectable()
export class DiscoveryNode extends BaseNode implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryNode.name);
  private tableInfo: string;

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;

  async onModuleInit(): Promise<void> {
    this.tableInfo = await this.db.getTableInfo();
  }

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Processing discovery request: ${state.question}`);

    const answer = await this.generateDiscoveryResponse();

    return {
      ...state,
      answer,
    };
  }

  private async generateDiscoveryResponse(): Promise<string> {
    const prompt = `Based on the following database schema, provide a simple, friendly response that includes:

1. One sentence about what this database is about
2. 3-4 example questions users can ask (keep them simple and natural)

Database Schema:
${this.tableInfo}

Keep the response conversational, brief, and easy to understand. Don't use technical jargon. Format example questions as a simple numbered list.`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
