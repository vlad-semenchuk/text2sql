import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database';

@Injectable()
export class Text2SqlService {
  private readonly logger = new Logger(Text2SqlService.name);

  @Inject() private readonly database: DatabaseService;

  async query(query: string) {
    this.logger.log({ msg: '🚀 Starting query process for:', query });
  }
}
