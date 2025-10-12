import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { InputState, InputType, State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { DatabaseService } from '../services/database.service';
import { InputSanitizationService } from '../services/input-sanitization.service';

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

    const prompt = `You are a database question classifier. Your job is to classify user inputs into two categories:

1. ${InputType.VALID_QUERY}: Questions requiring database queries
2. ${InputType.DISCOVERY_REQUEST}: Everything else (greetings, help requests, off-topic questions, or unclear inputs)

Database Schema Information:
${this.db.tableInfo}

${InputType.VALID_QUERY} examples:
- "How many users are there?"
- "Show me the top 10 products by sales"
- "What is the average order value?"
- Questions asking for specific data from available tables

${InputType.DISCOVERY_REQUEST} examples:
- "What can you help me with?"
- "What's in this database?"
- "Show me what data is available"
- "What kind of questions can I ask?"
- "Give me some example questions"
- Greetings (hi, hello, good morning)
- General conversation or chitchat
- Questions about weather, sports, general knowledge
- Empty or unclear inputs
- Non-database related questions

User input: "${this.inputSanitization.escapeForPrompt(sanitizationResult.sanitizedInput)}"

If it's clearly asking for specific data from the database tables, classify as ${InputType.VALID_QUERY}.
Otherwise, classify as ${InputType.DISCOVERY_REQUEST} - the discovery system will handle all non-query inputs appropriately.`;

    const result = await structuredLlm.invoke(prompt);

    this.logger.debug(`Validation result:`, result);

    return {
      ...state,
      question: sanitizationResult.sanitizedInput, // Use sanitized input going forward
      questionType: result.questionType,
      rejectionReason: result.rejectionReason || '',
    };
  }
}
