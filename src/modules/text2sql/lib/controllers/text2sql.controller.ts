import { Body, Controller, Inject, Post, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Text2SqlService } from '../services/text2sql.service';

@Controller('text2sql')
export class Text2SqlController {
  @Inject() private readonly text2sql: Text2SqlService;

  @Post('query')
  async generatePlan(@Body('question') question: string) {
    return await this.text2sql.query(question);
  }

  @Sse('query/stream')
  queryStream(@Query('question') question: string): Observable<MessageEvent> {
    return new Observable((observer) => {
      void (async () => {
        try {
          for await (const chunk of this.text2sql.queryStream(question)) {
            observer.next({
              data: chunk,
              type: 'message',
            } as MessageEvent);
          }
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }
}
