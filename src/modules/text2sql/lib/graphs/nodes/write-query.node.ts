import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseNode } from './base.node';
import { InputStateAnnotation, StateAnnotation } from '../state';
import { z } from 'zod';
import { DatabaseService } from '../services/database.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { createWriteQueryFixPrompt } from '../prompts/write-query-fix.prompt';

const queryOutput = z.object({
  query: z.string().describe('Syntactically valid SQL query.'),
});

@Injectable()
export class WriteQueryNode extends BaseNode implements OnModuleInit {
  private readonly logger = new Logger(WriteQueryNode.name);
  private queryPromptTemplate: ChatPromptTemplate;

  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly dbService: DatabaseService;
  @Inject() private readonly inputSanitization: InputSanitizationService;

  async onModuleInit(): Promise<void> {
    this.queryPromptTemplate = await pull<ChatPromptTemplate>('langchain-ai/sql-query-system-prompt');
  }

  async validateQuery(sqlQuery: string): Promise<{ isValid: boolean; errorMessage?: string }> {
    try {
      await this.db.run(`EXPLAIN ${sqlQuery}`);
      return { isValid: true };
    } catch (error) {
      this.logger.error(`Query validation failed: ${error.message}`);
      return { isValid: false, errorMessage: error.message };
    }
  }

  async fixQuery(invalidQuery: string, errorMessage: string): Promise<string> {
    this.logger.debug(`Attempting to fix invalid query: ${this.inputSanitization.createSafeLogVersion(invalidQuery)}`);

    const structuredLlm = this.llm.withStructuredOutput(queryOutput);

    const fixPrompt = await createWriteQueryFixPrompt(
      this.dbService.tableInfo,
      this.db.appDataSourceOptions.type,
      invalidQuery,
      errorMessage,
    );

    const result = await structuredLlm.invoke(fixPrompt);
    this.logger.debug(`Fixed query: ${result.query}`);

    return result.query;
  }

  async execute(state: typeof InputStateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
    this.logger.debug(`Writing sql query for question: ${this.inputSanitization.createSafeLogVersion(state.question)}`);

    // Additional sanitization check for SQL generation context
    const sanitizationResult = await this.inputSanitization.sanitizeInput(state.question, {
      maxLength: 500,
      allowEmptyInput: false,
      logSuspiciousActivity: true,
    });

    if (sanitizationResult.securityWarnings.length > 0) {
      this.logger.warn(
        `Security warnings for SQL generation input: ${JSON.stringify({
          warnings: sanitizationResult.securityWarnings,
          wasModified: sanitizationResult.wasModified,
          safeVersion: this.inputSanitization.createSafeLogVersion(state.question),
        })}`,
      );
    }

    const structuredLlm = this.llm.withStructuredOutput(queryOutput);
    const promptValue = await this.queryPromptTemplate.invoke({
      dialect: this.db.appDataSourceOptions.type,
      top_k: 10,
      table_info: this.dbService.tableInfo,
      input: sanitizationResult.sanitizedInput,
    });
    const result = await structuredLlm.invoke(promptValue);

    const validation = await this.validateQuery(result.query as string);

    if (!validation.isValid) {
      this.logger.warn(`Generated query failed validation: ${result.query}. Error: ${validation.errorMessage}`);

      const fixedQuery = await this.fixQuery(result.query as string, validation.errorMessage!);

      const fixedValidation = await this.validateQuery(fixedQuery);

      if (!fixedValidation.isValid) {
        throw new Error(
          `Failed to generate valid SQL query. Original error: ${validation.errorMessage}. Fixed query also failed: ${fixedValidation.errorMessage}`,
        );
      }

      this.logger.debug(`Successfully fixed invalid query. Using fixed query: ${fixedQuery}`);
      return { ...state, query: fixedQuery };
    }

    return { ...state, query: result.query };
  }
}
