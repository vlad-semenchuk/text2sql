import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseNode } from './base.node';
import { State } from '../state';
import { LLM } from '@modules/llm';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DatabaseService } from '../services/database.service';

@Injectable()
export class DiscoveryNode extends BaseNode {
  private readonly logger = new Logger(DiscoveryNode.name);
  private tableInfo: string;

  @Inject(LLM) private readonly llm: BaseChatModel;
  @Inject() private readonly db: DatabaseService;

  async execute(state: State): Promise<Partial<State>> {
    this.logger.debug(`Processing discovery request: ${state.question}`);

    const answer = await this.generateDiscoveryResponse(state.question);

    return {
      ...state,
      answer,
    };
  }

  private async generateDiscoveryResponse(question: string): Promise<string> {
    const prompt = `You are a helpful assistant for querying a specific database. Based on the schema provided, give a friendly, general response.

Database Schema:
${this.db.tableInfo}

Current Date: ${new Date().toDateString()}

User Question:
${question}

Instructions:
Analyze the database schema to understand what data is available, then respond appropriately:

1. If it's a GREETING or CASUAL CHAT (like "Hi", "How are you?", "Hello"):
   - Respond warmly and acknowledge the greeting
   - Say "I can help you find data about [list main data areas based on schema]"
   - Add "Here are some questions you can ask:" followed by 3-4 example questions
   - Make examples EXACTLY as users would type them - ready to copy and paste

2. If it's asking WHAT YOU CAN DO (like "What can I ask?", "Help", "What data do you have?"):
   - Say "I can help you query data about [main areas inferred from schema]"
   - Follow with: "Here are some questions you can ask:"
   - List 3-4 ready-to-use example questions

3. If it's OFF-TOPIC (unrelated to the database):
   - Politely say you can only help with data about [main areas from this specific schema]
   - Suggest one relevant question they can copy and ask

Response Format Rules:
- Infer the domain and data types from the actual schema provided
- Generate examples that make sense for THIS specific database
- Example questions should be EXACTLY what a user would type - no variables or placeholders
- Make questions direct and simple - as if speaking naturally
- Each example should work if copied and pasted exactly
- DO NOT mention table or column names directly

Example Query Variety Requirements:
- Generate 3-4 diverse example questions that showcase different capabilities
- Include AT MOST 1 date-based query (only if date fields exist and use actual years from samples)
- Balance your examples across these query types:
  * Text search/filtering (e.g., "Find items containing [word]", "Show all [category] items")
  * Counting/aggregation (e.g., "How many...", "What's the total...", "Show top 5...")
  * Relationship queries (e.g., "Which customers have...", "Find items with...")
  * Comparison queries (e.g., "Show items over $50", "Find items longer than 2 hours")
  * Listing/browsing (e.g., "List all...", "Show me all...")

Date Query Rules (if including one):
- EXAMINE sample data for actual dates first
- If data is old (years before Current Date), use specific years from samples
- If data is current, can use relative terms
- Never make more than 1 of your 3-4 examples date-based

Focus on demonstrating the variety of data exploration possible, not just time-based queries.`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
