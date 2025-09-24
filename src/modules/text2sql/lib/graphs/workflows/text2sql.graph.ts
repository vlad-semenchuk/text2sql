import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CompiledStateGraph, END, START, StateGraph } from '@langchain/langgraph';
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
      .addNode(ValidateInputNode.name, this.validateInputNode.execute.bind(this.validateInputNode))
      .addNode(WriteQueryNode.name, this.writeQueryNode.execute.bind(this.writeQueryNode))
      .addNode(ExecuteQueryNode.name, this.executeQueryNode.execute.bind(this.executeQueryNode))
      .addNode(GenerateAnswerNode.name, this.generateAnswerNode.execute.bind(this.generateAnswerNode))
      .addNode(DiscoveryNode.name, this.discoveryNode.execute.bind(this.discoveryNode))
      .addEdge(START, ValidateInputNode.name)
      .addConditionalEdges(ValidateInputNode.name, (state: State) => {
        switch (state.questionType) {
          case InputType.VALID_QUERY:
            return WriteQueryNode.name;
          case InputType.DISCOVERY_REQUEST:
            return DiscoveryNode.name;
          case InputType.INVALID_INPUT:
          default:
            return GenerateAnswerNode.name;
        }
      })
      .addEdge(WriteQueryNode.name, ExecuteQueryNode.name)
      .addEdge(ExecuteQueryNode.name, GenerateAnswerNode.name)
      .addEdge(DiscoveryNode.name, END)
      .addEdge(GenerateAnswerNode.name, END);
  }
}
