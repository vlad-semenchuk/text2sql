import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createGenerateAnswerPrompt } from '../prompts/generate-answer.prompt';

@Injectable()
export class GenerateAnswerNode extends BaseNode {
  private readonly logger = new Logger(GenerateAnswerNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Generating answer`, state);

    const promptValue = await createGenerateAnswerPrompt(state.question, state.query, state.result);

    const response = await this.llm.invoke(promptValue);
    return { answer: response.content as string };
  }
}
