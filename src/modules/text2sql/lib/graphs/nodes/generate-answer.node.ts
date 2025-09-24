import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { InputType, State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class GenerateAnswerNode extends BaseNode {
  private readonly logger = new Logger(GenerateAnswerNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Generating answer`, state);

    if (state.questionType === InputType.INVALID_INPUT) {
      const rejectionMessage = await this.generateRejectionResponse(state.question, state.rejectionReason);
      return { answer: rejectionMessage };
    }

    if (state.questionType === InputType.VALID_QUERY && state.query && state.result) {
      const promptValue = `Given the following user question, corresponding SQL query, and SQL result, answer the user question.

Question: ${state.question}
SQL Query: ${state.query}
SQL Result: ${state.result}

Provide a clear, helpful answer based on the query results. If no data is found, simply say so without showing SQL code or technical suggestions. Keep the response conversational and user-friendly.`;

      const response = await this.llm.invoke(promptValue);
      return { answer: response.content as string };
    }

    // Fallback for any edge cases
    return { answer: 'I apologize, but I encountered an issue processing your request. Please try again.' };
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
