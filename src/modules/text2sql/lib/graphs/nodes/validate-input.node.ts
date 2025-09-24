import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseNode } from './base.node';
import { InputState, State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';

const validationOutput = z.object({
  isValidQuestion: z.boolean().describe('Whether the input is a database-related question'),
  rejectionReason: z.string().describe('Reason for rejection if not valid'),
});

@Injectable()
export class ValidateInputNode extends BaseNode implements OnModuleInit {
  private readonly logger = new Logger(ValidateInputNode.name);
  private tableInfo: string;

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;

  async onModuleInit(): Promise<void> {
    this.tableInfo = await this.db.getTableInfo();
  }

  async execute(state: InputState): Promise<Partial<State>> {
    this.logger.debug(`Validating input: ${state.question}`);

    const structuredLlm = this.llm.withStructuredOutput(validationOutput);

    const prompt = `You are a database question classifier. Your job is to determine if the user's input is a genuine question that requires querying a database to answer.

Database Schema Information:
${this.tableInfo}

Valid database questions are those that:
- Ask for specific data or information that would be stored in the available database tables
- Request analysis, filtering, or aggregation of data from the existing tables
- Ask about records, counts, comparisons, or relationships in the available data
- Reference entities, fields, or concepts that exist in the database schema

Invalid inputs include:
- Greetings (hi, hello, good morning, etc.)
- General conversation or chitchat
- Questions about the system itself or how it works
- Questions about data that doesn't exist in the available database tables
- Non-database related questions (weather, sports, general knowledge)
- Empty or unclear inputs

User input: "${state.question}"

Based on the database schema above, classify this input and provide a brief reason if it's not valid.`;

    const result = await structuredLlm.invoke(prompt);

    this.logger.debug(`Validation result:`, result);

    return {
      ...state,
      isValidQuestion: result.isValidQuestion,
      rejectionReason: result.rejectionReason || '',
    };
  }
}
