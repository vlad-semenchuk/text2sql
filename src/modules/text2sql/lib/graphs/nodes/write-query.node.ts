import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseNode } from './base.node';
import { InputStateAnnotation, StateAnnotation } from '../state';
import { z } from 'zod';

const queryOutput = z.object({
  query: z.string().describe('Syntactically valid SQL query.'),
});

@Injectable()
export class WriteQueryNode extends BaseNode implements OnModuleInit {
  private readonly logger = new Logger(WriteQueryNode.name);
  private queryPromptTemplate: ChatPromptTemplate;
  private tableInfo: string;

  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;

  async onModuleInit(): Promise<void> {
    this.queryPromptTemplate = await pull<ChatPromptTemplate>('langchain-ai/sql-query-system-prompt');

    // TODO: vector store
    this.tableInfo = await this.db.getTableInfo();
  }

  async execute(state: typeof InputStateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
    this.logger.debug(`Writing sql query for question: ${state.question}`);
    const structuredLlm = this.llm.withStructuredOutput(queryOutput);
    const promptValue = await this.queryPromptTemplate.invoke({
      dialect: this.db.appDataSourceOptions.type,
      top_k: 10,
      table_info: this.tableInfo,
      input: state.question,
    });
    const result = await structuredLlm.invoke(promptValue);

    return { ...state, query: result.query };
  }
}
