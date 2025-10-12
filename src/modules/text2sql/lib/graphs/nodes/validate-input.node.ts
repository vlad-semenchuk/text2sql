import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { InputState, InputType, State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { DatabaseService } from '../services/database.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { createValidateInputPrompt } from '../prompts/validate-input.prompt';

const validationOutput = z.object({
  questionType: z
    .enum([InputType.VALID_QUERY, InputType.DISCOVERY_REQUEST])
    .describe('Type of question: database query or discovery request'),
  rejectionReason: z.string().describe('Reason for rejection if not valid'),
});

@Injectable()
export class ValidateInputNode extends BaseNode {
  private readonly logger = new Logger(ValidateInputNode.name);

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly db: DatabaseService;
  @Inject() private readonly inputSanitization: InputSanitizationService;

  async execute(state: InputState): Promise<Partial<State>> {
    this.logger.debug(`Validating input: ${state.question}`);

    // Sanitize user input before validation
    const sanitizationResult = await this.inputSanitization.sanitizeInput(state.question, {
      maxLength: 1000,
      allowEmptyInput: false,
      logSuspiciousActivity: true,
    });

    if (sanitizationResult.securityWarnings.length > 0) {
      this.logger.warn(
        `Security warnings for validation input: ${JSON.stringify({
          warnings: sanitizationResult.securityWarnings,
          wasModified: sanitizationResult.wasModified,
          safeVersion: this.inputSanitization.createSafeLogVersion(state.question),
        })}`,
      );
    }

    const structuredLlm = this.llm.withStructuredOutput(validationOutput);

    const prompt = await createValidateInputPrompt(
      this.db.tableInfo,
      this.inputSanitization.escapeForPrompt(sanitizationResult.sanitizedInput),
    );

    const result = await structuredLlm.invoke(prompt);

    this.logger.debug(`Validation result:`, result);

    return {
      ...state,
      question: sanitizationResult.sanitizedInput,
      questionType: result.questionType,
      rejectionReason: result.rejectionReason || '',
    };
  }
}
