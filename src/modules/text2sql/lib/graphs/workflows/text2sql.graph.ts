import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CompiledStateGraph, END, START, StateGraph } from '@langchain/langgraph';
import { WriteQueryNode } from '../nodes/write-query.node';
import { ExecuteQueryNode } from '../nodes/execute-query.node';
import { GenerateAnswerNode } from '../nodes/generate-answer.node';
import { State, StateAnnotation } from '../state';

@Injectable()
export class Text2SqlGraph implements OnModuleInit {
  @Inject() private readonly writeQueryNode: WriteQueryNode;
  @Inject() private readonly executeQueryNode: ExecuteQueryNode;
  @Inject() private readonly generateAnswerNode: GenerateAnswerNode;

  private graph: CompiledStateGraph<State, Partial<State>, any>;

  onModuleInit(): void {
    this.graph = this.createGraph().compile();
  }

  async execute(question: string): Promise<string> {
    const result = await this.graph.invoke({ question });

    return result.answer as string;
  }

  private createGraph() {
    return new StateGraph({
      stateSchema: StateAnnotation,
    })
      .addNode('writeQuery', this.writeQueryNode.execute.bind(this.writeQueryNode))
      .addNode('executeQuery', this.executeQueryNode.execute.bind(this.executeQueryNode))
      .addNode('generateAnswer', this.generateAnswerNode.execute.bind(this.generateAnswerNode))
      .addEdge(START, 'writeQuery')
      .addEdge('writeQuery', 'executeQuery')
      .addEdge('executeQuery', 'generateAnswer')
      .addEdge('generateAnswer', END);
  }
}
