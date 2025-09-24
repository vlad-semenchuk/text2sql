import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseNode } from './base.node';
import { InputState, InputType, State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';

const validationOutput = z.object({
  questionType: z
    .enum([InputType.VALID_QUERY, InputType.DISCOVERY_REQUEST, InputType.INVALID_INPUT])
    .describe('Type of question: database query, discovery request, or invalid input'),
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

    const prompt = `You are a database question classifier. Your job is to classify user inputs into three categories:

1. ${InputType.VALID_QUERY}: Questions requiring database queries
2. ${InputType.DISCOVERY_REQUEST}: Questions about database capabilities, schema, or sample questions
3. ${InputType.INVALID_INPUT}: Non-database related inputs

Database Schema Information:
${this.tableInfo}

${InputType.VALID_QUERY} examples:
- "How many users are there?"
- "Show me the top 10 products by sales"
- "What is the average order value?"
- Questions asking for specific data from available tables

${InputType.DISCOVERY_REQUEST} examples:
- "What can you help me with?"
- "What's in this database?"
- "Show me what data is available"
- "What kind of questions can I ask?"
- "Give me some example questions"
- "What are the capabilities?"
- "What tables do you have?"

${InputType.INVALID_INPUT} examples:
- Greetings (hi, hello, good morning)
- General conversation or chitchat
- Questions about weather, sports, general knowledge
- Empty or unclear inputs
- Non-database related questions

User input: "${state.question}"

Classify this input and provide a brief reason if it's not a valid query.`;

    const result = await structuredLlm.invoke(prompt);

    this.logger.debug(`Validation result:`, result);

    return {
      ...state,
      questionType: result.questionType,
      rejectionReason: result.rejectionReason || '',
    };
  }
}
