import { Inject, Injectable, Logger } from '@nestjs/common';
import { Text2SqlService } from '@modules/text2sql';
import { randomUUID } from 'crypto';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private threadId: string;

  @Inject() private readonly text2SqlService: Text2SqlService;

  constructor() {
    this.threadId = randomUUID();
  }

  clearState(): void {
    this.threadId = randomUUID();
    this.logger.log(`Thread ID reset to: ${this.threadId}`);
  }

  async processTextQuery(question: string): Promise<string> {
    try {
      this.logger.log(`Processing query: ${question}`);

      // Validate input
      if (!question || question.trim().length === 0) {
        return 'Please provide a valid question.';
      }

      const result = await this.text2SqlService.query(question.trim(), this.threadId);

      return this.formatResponse(result);
    } catch (error) {
      this.logger.error(`Error processing query: ${error.message}`, error.stack);
      return 'Sorry, I encountered an error while processing your question. Please try again.';
    }
  }

  private formatResponse(result: any): string {
    try {
      // Handle different result types
      if (typeof result === 'string') {
        return result;
      }

      if (typeof result === 'object') {
        // Format JSON results for readability
        return `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
      }

      return String(result);
    } catch (error) {
      this.logger.error(`Error formatting response: ${error.message}`);
      return 'Result processed successfully, but there was an issue formatting the response.';
    }
  }
}
