import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { POSTGRESQL_PROMPT_TEMPLATE_INSTRUCTIONS } from '@libs/data-access-postgres';

@Injectable()
export class DatabaseService implements OnModuleInit {
  @InjectEntityManager() private readonly entityManager: EntityManager;

  private readonly logger = new Logger(DatabaseService.name);
  private databaseSchema: string;

  get schema() {
    return this.databaseSchema;
  }

  get promptTemplateInstructions() {
    return POSTGRESQL_PROMPT_TEMPLATE_INSTRUCTIONS;
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Getting database schema');
    this.databaseSchema = await this.getDatabaseSchema();
  }

  async getDatabaseSchema(): Promise<string> {
    const tables = await this.describeDatasource();

    const schemaPromptParts = await Promise.all(
      tables.map(async (table) => {
        const columns = await this.describeTable(table);
        return `- ${table}\n${columns.map((column) => `  - ${column.columnName}: ${column.columnType}`).join('\n')}`;
      }),
    );

    return schemaPromptParts.join('\n');
  }

  private async describeDatasource(): Promise<string[]> {
    const result = await this.entityManager.query(
      `
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_name NOT IN ('migrations')
      `,
    );
    return result.map((row: any) => `${row.table_schema}.${row.table_name}`);
  }

  private async describeTable(table: string): Promise<{ columnName: string; columnType: string; nullable: boolean }[]> {
    const [schema, tableName] = table.split('.');

    const result = await this.entityManager.query(
      `
        SELECT
            column_name as "columnName",
            data_type as "columnType",
            is_nullable = 'YES' as nullable
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = $2
        ORDER BY ordinal_position
      `,
      [schema, tableName],
    );

    return result as { columnName: string; columnType: string; nullable: boolean }[];
  }
}
