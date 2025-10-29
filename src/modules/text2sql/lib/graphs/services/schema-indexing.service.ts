import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VectorStoreService } from '@modules/vector-store';
import { DatabaseService } from './database.service';
import { DiscoveryCacheService } from './discovery-cache.service';
import { promises as fs } from 'fs';
import { join } from 'path';

interface SchemaIndexCache {
  schemaHash: string;
  indexedAt: string;
  tableCount: number;
}

@Injectable()
export class SchemaIndexingService implements OnModuleInit {
  private readonly logger = new Logger(SchemaIndexingService.name);
  private readonly cacheDir = join(process.cwd(), '.cache');
  private readonly cacheFile = join(this.cacheDir, 'schema-index.json');

  @Inject(DatabaseService) private readonly dbService: DatabaseService;
  @Inject(VectorStoreService) private readonly vectorStore: VectorStoreService;
  @Inject(DiscoveryCacheService) private readonly cacheService: DiscoveryCacheService;

  async onModuleInit(): Promise<void> {
    try {
      const currentSchemaHash = this.cacheService.calculateSchemaHash(this.dbService.tableInfo);
      const cachedIndex = await this.getCachedIndex();

      if (cachedIndex && cachedIndex.schemaHash === currentSchemaHash) {
        this.logger.log(`Schema index up-to-date (${cachedIndex.tableCount} tables indexed)`);
        return;
      }

      this.logger.log('Schema changed or not indexed. Starting schema indexing...');
      await this.indexSchema();
    } catch (error) {
      this.logger.error(`Schema indexing failed: ${(error as Error).message}`);
      throw new Error('Schema indexing failed');
    }
  }

  private async indexSchema(): Promise<void> {
    const schema = this.dbService.tableInfo;
    const tables = this.parseSchemaIntoTables(schema);

    if (tables.length === 0) {
      this.logger.warn('No tables found in schema');
      return;
    }

    this.logger.log(`Parsed ${tables.length} tables from schema`);

    // Delete existing schema documents
    await this.deleteExistingSchemaDocuments();

    // Index new tables
    const ids = tables.map((t) => t.id);
    const documents = tables.map((t) => t.document);
    const metadatas = tables.map((t) => t.metadata);

    await this.vectorStore.addDocuments({ ids, documents, metadatas });

    this.logger.log(`Indexed ${tables.length} tables into vector store`);

    // Save cache
    const schemaHash = this.cacheService.calculateSchemaHash(schema);
    await this.saveCachedIndex(schemaHash, tables.length);
  }

  private parseSchemaIntoTables(schema: string): Array<{
    id: string;
    document: string;
    metadata: { type: string; schema: string; table: string };
  }> {
    const tables: Array<{
      id: string;
      document: string;
      metadata: { type: string; schema: string; table: string };
    }> = [];

    const lines = schema.split('\n');
    let currentTable: string | null = null;
    let currentTableContent: string[] = [];

    for (const line of lines) {
      // Check if line starts with "- " (table name)
      if (line.match(/^- [a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*/)) {
        // Save previous table if exists
        if (currentTable && currentTableContent.length > 0) {
          const [schemaName, tableName] = currentTable.split('.');
          tables.push({
            id: `table:${currentTable}`,
            document: currentTableContent.join('\n'),
            metadata: {
              type: 'schema',
              schema: schemaName,
              table: tableName,
            },
          });
        }

        // Start new table
        currentTable = line.substring(2).trim(); // Remove "- " prefix
        currentTableContent = [line];
      } else if (currentTable) {
        // Add line to current table content
        currentTableContent.push(line);
      }
    }

    // Save last table
    if (currentTable && currentTableContent.length > 0) {
      const [schemaName, tableName] = currentTable.split('.');
      tables.push({
        id: `table:${currentTable}`,
        document: currentTableContent.join('\n'),
        metadata: {
          type: 'schema',
          schema: schemaName,
          table: tableName,
        },
      });
    }

    return tables;
  }

  private async deleteExistingSchemaDocuments(): Promise<void> {
    try {
      await this.vectorStore.deleteDocuments({
        where: { type: 'schema' },
      });
      this.logger.log('Deleted existing schema documents');
    } catch (error) {
      // It's okay if no documents exist yet
      this.logger.debug(`No existing schema documents to delete: ${(error as Error).message}`);
    }
  }

  private async getCachedIndex(): Promise<SchemaIndexCache | null> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      return JSON.parse(content) as SchemaIndexCache;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.log('No schema index cache found');
      }
      return null;
    }
  }

  private async saveCachedIndex(schemaHash: string, tableCount: number): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const cache: SchemaIndexCache = {
        schemaHash,
        indexedAt: new Date().toISOString(),
        tableCount,
      };
      await fs.writeFile(this.cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
      this.logger.log('Schema index cache updated');
    } catch (error) {
      this.logger.error(`Error saving schema index cache: ${(error as Error).message}`);
    }
  }
}
