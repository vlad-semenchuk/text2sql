import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage } from '@langchain/core/messages';
import { GreetingPrompt } from '../prompts';

@Injectable()
export class GreetingNode extends BaseNode {
  private readonly logger = new Logger(GreetingNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Greeting...`);

    const systemMessage = new SystemMessage(GreetingPrompt);

    const response = await this.llm.invoke([systemMessage, ...state.messages]);

    return {
      answer: response.content as string,
    };
  }
}
