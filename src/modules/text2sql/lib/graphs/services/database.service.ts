import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;

  private dbSchema: string;

  get tableInfo(): string {
    return this.dbSchema;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.dbSchema = await this.db.getTableInfo();
    } catch (error) {
      this.logger.error('Failed to load database schema', error);
      throw new Error('Database schema initialization failed');
    }
  }
}
