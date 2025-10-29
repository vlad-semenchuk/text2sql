import { Inject, Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '@modules/vector-store';

@Injectable()
export class TableRetrievalService {
  private readonly logger = new Logger(TableRetrievalService.name);
  private readonly defaultTopK = 5;

  @Inject(VectorStoreService) private readonly vectorStore: VectorStoreService;

  /**
   * Retrieve relevant table schemas based on user query using RAG
   * @param userQuery The natural language query from the user
   * @param topK Number of tables to retrieve (default: 5)
   * @returns Formatted table schemas string, same format as getDatabaseSchema()
   */
  async getRelevantTables(userQuery: string, topK: number = this.defaultTopK): Promise<string> {
    try {
      this.logger.debug(`Retrieving top-${topK} relevant tables for query: "${userQuery}"`);

      const results = await this.vectorStore.queryDocuments({
        queryTexts: [userQuery],
        nResults: topK,
        where: { type: 'schema' }, // Filter to only schema documents
      });

      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        this.logger.warn('No relevant tables found in vector store');
        return '';
      }

      const retrievedDocuments = results.documents[0];
      const distances = results.distances?.[0] || [];
      const metadatas = results.metadatas?.[0] || [];

      this.logger.debug(`Retrieved ${retrievedDocuments.length} tables:`);
      retrievedDocuments.forEach((doc, i) => {
        const metadata = metadatas[i] as { schema?: string; table?: string };
        const distance = distances[i];
        const tableName = metadata ? `${metadata.schema}.${metadata.table}` : 'unknown';
        this.logger.debug(`  ${i + 1}. ${tableName} (distance: ${distance?.toFixed(4)})`);
      });

      // Join all retrieved table schemas
      const formattedSchema = retrievedDocuments.join('\n');

      return formattedSchema;
    } catch (error) {
      this.logger.error(`Error retrieving relevant tables: ${(error as Error).message}`);
      throw new Error('Failed to retrieve relevant tables from vector store');
    }
  }

  /**
   * Retrieve relevant table names only (without full schema)
   * Useful for logging or debugging
   */
  async getRelevantTableNames(userQuery: string, topK: number = this.defaultTopK): Promise<string[]> {
    try {
      const results = await this.vectorStore.queryDocuments({
        queryTexts: [userQuery],
        nResults: topK,
        where: { type: 'schema' },
      });

      if (!results.metadatas || !results.metadatas[0]) {
        return [];
      }

      const metadatas = results.metadatas[0];
      return metadatas
        .map((metadata) => {
          const m = metadata as { schema?: string; table?: string };
          return m && m.schema && m.table ? `${m.schema}.${m.table}` : null;
        })
        .filter((name): name is string => name !== null);
    } catch (error) {
      this.logger.error(`Error retrieving relevant table names: ${(error as Error).message}`);
      return [];
    }
  }
}
