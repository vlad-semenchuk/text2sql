import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class GenerateAnswerNode extends BaseNode {
  private readonly logger = new Logger(GenerateAnswerNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Generating answer`, state);

    if (!state.isValidQuestion) {
      const rejectionMessage = await this.generateRejectionResponse(state.question, state.rejectionReason);

      return { answer: rejectionMessage };
    }

    const promptValue = `Given the following user question, corresponding SQL query, and SQL result, answer the user question.

Question: ${state.question}
SQL Query: ${state.query}
SQL Result: ${state.result}`;

    const response = await this.llm.invoke(promptValue);

    return { answer: response.content as string };
  }

  private async generateRejectionResponse(question: string, reason: string): Promise<string> {
    const prompt = `You are a text-to-SQL assistant.

Input: "${question}"
Issue: ${reason}

Generate a very brief, friendly response (1-2 sentences max) that explains you help with database questions only.`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
