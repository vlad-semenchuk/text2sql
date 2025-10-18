import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createRejectionPrompt } from '../prompts';

@Injectable()
export class RejectionNode extends BaseNode {
  private readonly logger = new Logger(RejectionNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Rejecting the request. Reason: ${state.rejectionReason}`);

    const prompt = await createRejectionPrompt(state.rejectionReason);
    const response = await this.llm.invoke(prompt);

    return {
      answer: response.content as string,
    };
  }
}
