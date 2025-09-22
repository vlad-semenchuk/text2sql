import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LangGraphRunnableConfig } from '@langchain/langgraph';

@Injectable()
export class GenerateAnswerNode extends BaseNode {
  private readonly logger = new Logger(GenerateAnswerNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State, config?: LangGraphRunnableConfig): Promise<Partial<State>> {
    this.logger.debug(`Generating answer`, state);

    const promptValue =
      'Given the following user question, corresponding SQL query, ' +
      'and SQL result, answer the user question.\n\n' +
      `Question: ${state.question}\n` +
      `SQL Query: ${state.query}\n` +
      `SQL Result: ${state.result}\n`;

    if (config?.writer) {
      let fullAnswer = '';

      for await (const chunk of await this.llm.stream(promptValue)) {
        const content = chunk.content as string;
        if (content) {
          fullAnswer += content;
          config.writer(content);
        }
      }

      return { answer: fullAnswer };
    } else {
      const response = await this.llm.invoke(promptValue);
      return { answer: response.content as string };
    }
  }
}
