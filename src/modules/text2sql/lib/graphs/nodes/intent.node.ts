import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { IntentType } from '../types';
import { SystemMessage } from '@langchain/core/messages';
import { IntentSystemPrompt } from '../prompts';

const IntentOutputSchema = z.object({
  type: z.nativeEnum(IntentType).describe('The classified intent type of the user message'),
  reason: z.string().describe('Explanation for the classified intent'),
});

type IntentOutputType = z.infer<typeof IntentOutputSchema>;

@Injectable()
export class IntentNode extends BaseNode {
  private readonly logger = new Logger(IntentNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Classifying message intent...`);

    const structuredLlm = this.llm.withStructuredOutput<IntentOutputType>(IntentOutputSchema);

    const systemMessage = new SystemMessage(IntentSystemPrompt);

    const { type, reason } = await structuredLlm.invoke([systemMessage, ...state.messages]);

    this.logger.debug(`Intent ${type}. Reason: ${reason}`);

    return {
      intent: { type, reason },
      rejectionReason: type === IntentType.INVALID_QUERY ? reason : '',
    };
  }
}
