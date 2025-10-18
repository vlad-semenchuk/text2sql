import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage } from '@langchain/core/messages';
import { createClarificationPrompt } from '../prompts';

@Injectable()
export class ClarificationNode extends BaseNode {
  private readonly logger = new Logger(ClarificationNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Clarifying the query...`);

    const systemPrompt = await createClarificationPrompt(state.intent.reason);
    const systemMessage = new SystemMessage(systemPrompt);

    const response = await this.llm.invoke([systemMessage, ...state.messages]);

    return {
      answer: response.content as string,
    };
  }
}
