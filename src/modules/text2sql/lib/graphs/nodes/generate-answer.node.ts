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

    const promptValue = `Given the following user question, corresponding SQL query, and SQL result, answer the user question.

Question: ${state.question}
SQL Query: ${state.query}
SQL Result: ${state.result}

Instructions for formatting the response:
1. Answer the question using ONLY the relevant information from the results
2. NEVER show internal database identifiers (IDs, keys, or column names like film_id, customer_id, etc.)
3. NEVER mention technical database terms or expose the schema structure
4. Present data in a natural, readable format
5. If showing lists, include only meaningful information that users would care about
6. Format movie titles, names, and other text data appropriately (proper capitalization if needed)
7. Include relevant details like ratings, dates, or amounts when they add value, but skip internal references
8. If no data is found, simply say "No results found" or similar, without technical explanations
9. Keep the response conversational and helpful
10. You may offer to provide more information if appropriate, but phrase it naturally (e.g., "Would you like more details?" not "Would you like to see other columns?")`;

    const response = await this.llm.invoke(promptValue);
    return { answer: response.content as string };
  }
}
