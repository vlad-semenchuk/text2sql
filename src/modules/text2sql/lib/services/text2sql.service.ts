import { Injectable, Logger } from '@nestjs/common';

// const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

@Injectable()
export class Text2SqlService {
  private readonly logger = new Logger(Text2SqlService.name);

  async query(query: string) {
    this.logger.log({ msg: '🚀 Starting query process for:', query });
  }
}
