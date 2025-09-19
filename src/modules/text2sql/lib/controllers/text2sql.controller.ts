import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Text2SqlService } from '../services/text2sql.service';

@Controller('text2sql')
export class Text2SqlController {
  @Inject() private readonly text2sql: Text2SqlService;

  @Post('query')
  async generatePlan(@Body('query') query: string) {
    return await this.text2sql.query(query);
  }
}
