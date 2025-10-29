import { Inject, Injectable, Logger } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseNode } from './base.node';
import { State, StateAnnotation } from '../state';
import { z } from 'zod';
import { DatabaseService } from '../services/database.service';
import { TableRetrievalService } from '../services/table-retrieval.service';
import { createWriteQueryFixPrompt } from '../prompts/write-query-fix.prompt';
import { createWriteQueryPrompt } from '../prompts';
import { SystemMessage } from '@langchain/core/messages';

const QueryOutputSchema = z.object({
  query: z.string().describe('Syntactically valid SQL query.'),
  rejectionReason: z.string().describe('The rejection reason.'),
});

type QueryOutputType = z.infer<typeof QueryOutputSchema>;

@Injectable()
export class WriteQueryNode extends BaseNode {
  private readonly logger = new Logger(WriteQueryNode.name);

  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly dbService: DatabaseService;
  @Inject() private readonly tableRetrievalService: TableRetrievalService;

  async validateQuery(sqlQuery: string): Promise<{ isValid: boolean; errorMessage?: string }> {
    try {
      await this.db.run(`EXPLAIN ${sqlQuery}`);
      return { isValid: true };
    } catch (error) {
      this.logger.error(`Query validation failed: ${error.message}`);
      return { isValid: false, errorMessage: error.message };
    }
  }

  async fixQuery(invalidQuery: string, errorMessage: string, relevantTables: string): Promise<QueryOutputType> {
    this.logger.debug(`Attempting to fix invalid query`);

    const structuredLlm = this.llm.withStructuredOutput<QueryOutputType>(QueryOutputSchema);

    const fixPrompt = await createWriteQueryFixPrompt({
      tableInfo: relevantTables,
      dialect: this.db.appDataSourceOptions.type,
      invalidQuery,
      errorMessage,
    });

    return await structuredLlm.invoke(fixPrompt);
  }

  async execute(state: State): Promise<Partial<typeof StateAnnotation.State>> {
    this.logger.debug(`Writing sql query`);

    const lastMessage = state.messages[state.messages.length - 1];

    // Retrieve relevant tables using RAG
    const userQuery = typeof lastMessage.content === 'string' ? lastMessage.content : '';
    const relevantTables = await this.tableRetrievalService.getRelevantTables(userQuery);

    if (!relevantTables) {
      this.logger.error('No relevant tables found for the query');
      return {
        rejectionReason: 'Unable to find relevant database tables for your question',
      };
    }

    const structuredLlm = this.llm.withStructuredOutput<QueryOutputType>(QueryOutputSchema);
    const systemPrompt = await createWriteQueryPrompt({
      dialect: this.db.appDataSourceOptions.type,
      tableInfo: relevantTables,
      input: userQuery,
    });

    const systemMessage = new SystemMessage(systemPrompt);

    const { query, rejectionReason } = await structuredLlm.invoke([systemMessage, ...state.messages]);

    if (rejectionReason) {
      this.logger.debug(`The input query is invalid`);
      return { rejectionReason };
    }

    const validation = await this.validateQuery(query);

    if (!validation.isValid) {
      this.logger.warn(`Generated query failed validation: ${query}. Error: ${validation.errorMessage}`);

      const fixedQuery = await this.fixQuery(query, validation.errorMessage!, relevantTables);

      if (fixedQuery.rejectionReason) {
        this.logger.error(`Failed to fix invalid query`);
        return {
          rejectionReason: fixedQuery.rejectionReason,
        };
      }

      const fixedValidation = await this.validateQuery(fixedQuery.query);

      if (!fixedValidation.isValid) {
        this.logger.error('Failed to generate a valid SQL query');
        return {
          rejectionReason: 'Failed to generate a valid SQL query',
        };
      }

      this.logger.debug(`Successfully fixed invalid query. Using fixed query: ${fixedQuery.query}`);
      return { query: fixedQuery.query };
    }

    return { query };
  }
}
