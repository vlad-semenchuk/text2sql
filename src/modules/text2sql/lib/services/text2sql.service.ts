import { Inject, Injectable, Logger } from '@nestjs/common';
import { SQL_DATASOURCE } from '@modules/datasource';
import { SqlDatabase } from 'langchain/sql_db';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class Text2SqlService {
  private readonly logger = new Logger(Text2SqlService.name);

  @Inject(SQL_DATASOURCE) private readonly db: SqlDatabase;
  @Inject(LLM) private readonly llm: BaseChatModel;

  async query(query: string) {
    this.logger.log({ msg: '🚀 Starting query process for:', query });

    await this.db.run('SELECT * FROM address_tags LIMIT 10;');

    await this.llm.invoke('Ping?');
  }
}
