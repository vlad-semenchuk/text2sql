import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CompiledStateGraph, END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { State, StateAnnotation } from '../state';
import { HumanMessage } from '@langchain/core/messages';
import { IntentNode } from '../nodes/intent.node';
import { IntentType } from '../types';
import { DiscoveryNode } from '../nodes/discovery.node';
import { GreetingNode } from '../nodes/greeting.node';
import { ClarificationNode } from '../nodes/clarification.node';
import { RejectionNode } from '../nodes/rejection.node';
import { WriteQueryNode } from '../nodes/write-query.node';
import { ExecuteQueryNode } from '../nodes/execute-query.node';
import { GenerateAnswerNode } from '../nodes/generate-answer.node';

@Injectable()
export class Text2SqlGraph implements OnModuleInit {
  @Inject() private readonly intentNode: IntentNode;
  @Inject() private readonly greetingNode: GreetingNode;
  @Inject() private readonly clarificationNode: ClarificationNode;
  @Inject() private readonly rejectionNode: RejectionNode;
  @Inject() private readonly discoveryNode: DiscoveryNode;
  @Inject() private readonly writeQueryNode: WriteQueryNode;
  @Inject() private readonly executeQueryNode: ExecuteQueryNode;
  @Inject() private readonly generateAnswerNode: GenerateAnswerNode;

  private graph: CompiledStateGraph<State, Partial<State>, any>;

  onModuleInit(): void {
    const checkpointer = new MemorySaver();
    this.graph = this.createGraph().compile({ checkpointer });
  }

  async execute(question: string, threadId: string): Promise<string> {
    const config = { configurable: { thread_id: threadId } };
    const result = await this.graph.invoke({ messages: [new HumanMessage(question)] }, config);

    return result.answer as string;
  }

  private createGraph() {
    return new StateGraph({
      stateSchema: StateAnnotation,
    })
      .addNode(IntentNode.name, (state: State) => this.intentNode.execute(state))
      .addNode(GreetingNode.name, (state: State) => this.greetingNode.execute(state))
      .addNode(ClarificationNode.name, (state: State) => this.clarificationNode.execute(state))
      .addNode(RejectionNode.name, (state: State) => this.rejectionNode.execute(state))
      .addNode(DiscoveryNode.name, (state: State) => this.discoveryNode.execute(state))
      .addNode(WriteQueryNode.name, (state: State) => this.writeQueryNode.execute(state))
      .addNode(ExecuteQueryNode.name, (state: State) => this.executeQueryNode.execute(state))
      .addNode(GenerateAnswerNode.name, (state: State) => this.generateAnswerNode.execute(state))
      .addEdge(START, IntentNode.name)
      .addConditionalEdges(IntentNode.name, (state: State) => {
        if (!state.intent.type) {
          return END;
        }

        switch (state.intent.type) {
          case IntentType.QUERY_REQUEST:
            return WriteQueryNode.name;
          case IntentType.GREETING:
            return GreetingNode.name;
          case IntentType.AMBIGUOUS_QUERY:
            return ClarificationNode.name;
          case IntentType.INVALID_QUERY:
            return RejectionNode.name;
          case IntentType.DISCOVERY_REQUEST:
            return DiscoveryNode.name;
          default:
            return END;
        }
      })
      .addConditionalEdges(WriteQueryNode.name, (state: State) => {
        return state.rejectionReason ? RejectionNode.name : ExecuteQueryNode.name;
      })
      .addEdge(GreetingNode.name, END)
      .addEdge(ClarificationNode.name, END)
      .addEdge(RejectionNode.name, END)
      .addEdge(DiscoveryNode.name, END)
      .addEdge(ExecuteQueryNode.name, GenerateAnswerNode.name)
      .addEdge(GenerateAnswerNode.name, END);
  }
}
