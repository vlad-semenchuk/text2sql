import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface IndexInfo {
  indexname: string;
  is_unique: boolean;
  indexdef: string;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  index_count: number;
  has_unique_index: boolean;
  indexes: IndexInfo[];
}

interface ColumnInfo {
  columnName: string;
  columnType: string;
  nullable: boolean;
  is_pk: boolean;
  is_fk: boolean;
  fk_schema?: string;
  fk_table?: string;
  fk_column?: string;
  fk_name?: string;
}

@Injectable()
export class DatasourceService {
  constructor(private readonly dataSource: DataSource) {}

  async getDatabaseSchema(): Promise<string> {
    const tables = await this.describeDatasource();

    const schemaPromptParts = await Promise.all(
      tables.map(async (tableInfo) => {
        const tableName = `${tableInfo.table_schema}.${tableInfo.table_name}`;
        const columns = await this.describeTable(tableName);
        const sampleData = await this.getSampleData(tableName);

        let tableDescription = `- ${tableName}\n`;
        tableDescription += `${columns
          .map((column) => {
            let columnDesc = `  - ${column.columnName}: ${column.columnType}`;

            const flags: string[] = [];
            if (column.is_pk) flags.push('PK');
            if (column.is_fk) flags.push('FK');
            if (!column.nullable) flags.push('NOT NULL');

            if (flags.length > 0) {
              columnDesc += ` (${flags.join(', ')})`;
            }

            if (column.is_fk && column.fk_schema && column.fk_table && column.fk_column) {
              columnDesc += ` -> ${column.fk_schema}.${column.fk_table}.${column.fk_column}`;
            }

            return columnDesc;
          })
          .join('\n')}`;

        if (tableInfo.indexes && tableInfo.indexes.length > 0) {
          tableDescription += `\n  Indexes (${tableInfo.index_count}):\n`;
          tableInfo.indexes.forEach((index) => {
            const uniqueFlag = index.is_unique ? ' (UNIQUE)' : '';
            tableDescription += `    - ${index.indexname}${uniqueFlag}\n`;
          });
        }

        if (sampleData.length > 0) {
          tableDescription += `\n  Sample data:\n`;
          sampleData.forEach((row, index) => {
            tableDescription += `    ${index + 1}. ${JSON.stringify(row)}\n`;
          });
        }

        return tableDescription;
      }),
    );

    return schemaPromptParts.join('\n');
  }

  private async describeDatasource(): Promise<TableInfo[]> {
    const query = `
      SELECT
        t.table_schema,
        t.table_name,
        COUNT(i.indexname) AS index_count,
        BOOL_OR(i.is_unique) AS has_unique_index,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'indexname', i.indexname,
            'is_unique', i.is_unique,
            'indexdef', i.indexdef
          ) ORDER BY i.indexname
        ) FILTER (WHERE i.indexname IS NOT NULL) AS indexes
      FROM information_schema.tables t
      LEFT JOIN LATERAL (
        SELECT
          ix.indexname,
          ix.indexdef,
          (ix.indexdef ILIKE '%UNIQUE%') AS is_unique
        FROM pg_indexes ix
        WHERE ix.schemaname = t.table_schema
          AND ix.tablename  = t.table_name
      ) i ON TRUE
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_schema, t.table_name
      ORDER BY t.table_schema, t.table_name
    `;

    const rows = await this.dataSource.query(query);
    return rows as TableInfo[];
  }

  private async describeTable(table: string): Promise<ColumnInfo[]> {
    const [schema, tableName] = table.split('.');

    const query = `
      SELECT
        c.column_name                          AS "columnName",
        c.data_type                            AS "columnType",
        (c.is_nullable = 'YES')::boolean       AS nullable,

        -- primary key flag
        (tc_pk.constraint_type = 'PRIMARY KEY')::boolean AS is_pk,

        -- foreign key flag
        (tc_fk.constraint_type = 'FOREIGN KEY')::boolean AS is_fk,

        -- foreign key details
        ccu_fk.table_schema                    AS fk_schema,
        ccu_fk.table_name                      AS fk_table,
        ccu_fk.column_name                     AS fk_column,
        tc_fk.constraint_name                  AS fk_name

      FROM information_schema.columns c

      -- PK join
      LEFT JOIN information_schema.key_column_usage kcu_pk
        ON  kcu_pk.table_schema = c.table_schema
        AND kcu_pk.table_name   = c.table_name
        AND kcu_pk.column_name  = c.column_name
      LEFT JOIN information_schema.table_constraints tc_pk
        ON  tc_pk.constraint_schema = kcu_pk.table_schema
        AND tc_pk.table_name        = kcu_pk.table_name
        AND tc_pk.constraint_name   = kcu_pk.constraint_name
        AND tc_pk.constraint_type   = 'PRIMARY KEY'

      -- FK join
      LEFT JOIN information_schema.key_column_usage kcu_fk
        ON  kcu_fk.table_schema = c.table_schema
        AND kcu_fk.table_name   = c.table_name
        AND kcu_fk.column_name  = c.column_name
      LEFT JOIN information_schema.table_constraints tc_fk
        ON  tc_fk.constraint_schema = kcu_fk.table_schema
        AND tc_fk.table_name        = kcu_fk.table_name
        AND tc_fk.constraint_name   = kcu_fk.constraint_name
        AND tc_fk.constraint_type   = 'FOREIGN KEY'
      LEFT JOIN information_schema.constraint_column_usage ccu_fk
        ON  ccu_fk.constraint_schema = tc_fk.constraint_schema
        AND ccu_fk.constraint_name   = tc_fk.constraint_name

      WHERE c.table_schema = '${schema}'
        AND c.table_name   = '${tableName}'
      ORDER BY c.ordinal_position
    `;

    const rows = await this.dataSource.query(query);
    return rows as ColumnInfo[];
  }

  private async getSampleData(table: string): Promise<any[]> {
    try {
      const query = `SELECT * FROM ${table} LIMIT 3`;
      const rows = await this.dataSource.query(query);
      return rows;
    } catch (_error) {
      return [];
    }
  }
}
