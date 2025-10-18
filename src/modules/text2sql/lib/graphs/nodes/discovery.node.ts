import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DatabaseService } from '../services/database.service';
import { createDiscoveryPrompt } from '../prompts';
import { SystemMessage } from '@langchain/core/messages';

@Injectable()
export class DiscoveryNode extends BaseNode {
  private readonly logger = new Logger(DiscoveryNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly db: DatabaseService;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Processing discovery request...`);

    const { description, exampleQuestions } = this.db.discoveryContent;

    const n = Math.floor(Math.random() * 2) + 3; // Random number between 3 and 4
    const selectedQuestions = this.getRandomQuestions(exampleQuestions, n);

    const systemPrompt = await createDiscoveryPrompt(description, selectedQuestions, state.intent.reason);
    const systemMessage = new SystemMessage(systemPrompt);

    const response = await this.llm.invoke([systemMessage, ...state.messages]);

    return {
      answer: response.content as string,
    };
  }

  private getRandomQuestions(questions: string[], count: number): string[] {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
