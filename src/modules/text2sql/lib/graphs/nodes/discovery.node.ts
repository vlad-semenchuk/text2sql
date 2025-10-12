import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DatabaseService } from '../services/database.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { createDiscoveryPrompt } from '../prompts/discovery.prompt';

@Injectable()
export class DiscoveryNode extends BaseNode {
  private readonly logger = new Logger(DiscoveryNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly db: DatabaseService;
  @Inject() private readonly inputSanitization: InputSanitizationService;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Processing discovery request: ${state.question}`);

    // Sanitize user input for security
    const sanitizationResult = await this.inputSanitization.sanitizeInput(state.question, {
      maxLength: 500,
      allowEmptyInput: false,
      logSuspiciousActivity: true,
    });

    if (sanitizationResult.securityWarnings.length > 0) {
      this.logger.warn(
        `Security warnings for discovery input: ${JSON.stringify({
          warnings: sanitizationResult.securityWarnings,
          wasModified: sanitizationResult.wasModified,
          safeVersion: this.inputSanitization.createSafeLogVersion(state.question),
        })}`,
      );
    }

    const answer = await this.generateDiscoveryResponse(sanitizationResult.sanitizedInput);

    return {
      ...state,
      answer,
    };
  }

  private async generateDiscoveryResponse(question: string): Promise<string> {
    // Additional escaping for prompt safety
    const escapedQuestion = this.inputSanitization.escapeForPrompt(question);

    const prompt = await createDiscoveryPrompt(this.db.tableInfo, escapedQuestion);

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
