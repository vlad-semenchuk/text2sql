import { SqlDatabase } from 'langchain/sql_db';
import { DataSource } from 'typeorm';
import { DatasourceService } from './datasource.service';

export class Database extends SqlDatabase {
  private datastoreService: DatasourceService;

  constructor(fields: { appDataSource: DataSource }, datastoreService: DatasourceService) {
    super(fields);
    this.datastoreService = datastoreService;
  }

  async getTableInfo(): Promise<string> {
    return this.datastoreService.getDatabaseSchema();
  }
}
