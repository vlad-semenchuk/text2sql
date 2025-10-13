import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CompiledStateGraph, END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { WriteQueryNode } from '../nodes/write-query.node';
import { ExecuteQueryNode } from '../nodes/execute-query.node';
import { GenerateAnswerNode } from '../nodes/generate-answer.node';
import { ValidateInputNode } from '../nodes/validate-input.node';
import { DiscoveryNode } from '../nodes/discovery.node';
import { InputType, State, StateAnnotation } from '../state';

@Injectable()
export class Text2SqlGraph implements OnModuleInit {
  @Inject() private readonly validateInputNode: ValidateInputNode;
  @Inject() private readonly writeQueryNode: WriteQueryNode;
  @Inject() private readonly executeQueryNode: ExecuteQueryNode;
  @Inject() private readonly generateAnswerNode: GenerateAnswerNode;
  @Inject() private readonly discoveryNode: DiscoveryNode;

  private graph: CompiledStateGraph<State, Partial<State>, any>;

  onModuleInit(): void {
    const checkpointer = new MemorySaver();
    this.graph = this.createGraph().compile({ checkpointer });
  }

  async execute(question: string, threadId: string): Promise<string> {
    const config = { configurable: { thread_id: threadId } };
    const result = await this.graph.invoke({ question }, config);

    return result.answer as string;
  }

  private createGraph() {
    return new StateGraph({
      stateSchema: StateAnnotation,
    })
      .addNode(ValidateInputNode.name, (state: State) => this.validateInputNode.execute(state))
      .addNode(WriteQueryNode.name, (state: State) => this.writeQueryNode.execute(state))
      .addNode(ExecuteQueryNode.name, (state: State) => this.executeQueryNode.execute(state))
      .addNode(GenerateAnswerNode.name, (state: State) => this.generateAnswerNode.execute(state))
      .addNode(DiscoveryNode.name, (state: State) => this.discoveryNode.execute(state))
      .addEdge(START, ValidateInputNode.name)
      .addConditionalEdges(ValidateInputNode.name, (state: State) => {
        if (!state.questionType) {
          return DiscoveryNode.name;
        }

        switch (state.questionType) {
          case InputType.VALID_QUERY:
            return WriteQueryNode.name;
          case InputType.DISCOVERY_REQUEST:
          default:
            return DiscoveryNode.name;
        }
      })
      .addEdge(WriteQueryNode.name, ExecuteQueryNode.name)
      .addEdge(ExecuteQueryNode.name, GenerateAnswerNode.name)
      .addEdge(DiscoveryNode.name, END)
      .addEdge(GenerateAnswerNode.name, END);
  }
}
