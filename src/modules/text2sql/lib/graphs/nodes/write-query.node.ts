import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SQL_DATASOURCE } from '@modules/datasource';
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
  private queryPromptTemplate: ChatPromptTemplate;

  @Inject(SQL_DATASOURCE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;

  async onModuleInit(): Promise<void> {
    this.queryPromptTemplate = await pull<ChatPromptTemplate>('langchain-ai/sql-query-system-prompt');
  }

  async execute(state: typeof InputStateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
    const structuredLlm = this.llm.withStructuredOutput(queryOutput);
    const promptValue = await this.queryPromptTemplate.invoke({
      dialect: this.db.appDataSourceOptions.type,
      top_k: 10,
      table_info: await this.db.getTableInfo(),
      input: state.question,
    });
    const result = await structuredLlm.invoke(promptValue);

    return { ...state, query: result.query };
  }
}
