import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SQL_DATABASE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';

@Injectable()
export class DatabaseService implements OnModuleInit {
  @Inject(SQL_DATABASE) private readonly db: SqlDatabase;

  private dbSchema: string;

  get tableInfo(): string {
    return this.dbSchema;
  }

  async onModuleInit(): Promise<void> {
    this.dbSchema = await this.db.getTableInfo();
  }
}
