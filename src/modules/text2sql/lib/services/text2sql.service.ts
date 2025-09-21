import { Inject, Injectable } from '@nestjs/common';
import { Text2SqlGraph } from '../graphs';

@Injectable()
export class Text2SqlService {
  @Inject() private readonly text2SqlGraph: Text2SqlGraph;

  async query(question: string) {
    return this.text2SqlGraph.execute(question);
  }

  async *queryStream(question: string): AsyncIterable<string> {
    yield* this.text2SqlGraph.executeStream(question);
  }
}
