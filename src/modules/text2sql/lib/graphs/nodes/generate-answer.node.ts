import { Inject, Injectable } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class GenerateAnswerNode extends BaseNode {
  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    const promptValue =
      'Given the following user question, corresponding SQL query, ' +
      'and SQL result, answer the user question.\n\n' +
      `Question: ${state.question}\n` +
      `SQL Query: ${state.query}\n` +
      `SQL Result: ${state.result}\n`;
    const response = await this.llm.invoke(promptValue);

    return { answer: response.content as string };
  }
}
