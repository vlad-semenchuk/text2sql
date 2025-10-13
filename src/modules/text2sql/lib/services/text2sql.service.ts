import { Inject, Injectable } from '@nestjs/common';
import { Text2SqlGraph } from '../graphs';

@Injectable()
export class Text2SqlService {
  @Inject() private readonly text2SqlGraph: Text2SqlGraph;

  async query(question: string, threadId: string): Promise<string> {
    return this.text2SqlGraph.execute(question, threadId);
  }
}
