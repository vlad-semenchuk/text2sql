import { Inject, Injectable } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { SQL_DATASOURCE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { QuerySqlTool } from 'langchain/tools/sql';

@Injectable()
export class ExecuteQueryNode extends BaseNode {
  @Inject(SQL_DATASOURCE) private readonly db: SqlDatabase;

  async execute(state: State): Promise<Partial<State>> {
    const executeQueryTool = new QuerySqlTool(this.db);
    const result = await executeQueryTool.invoke(state.query);

    return { result };
  }
}
