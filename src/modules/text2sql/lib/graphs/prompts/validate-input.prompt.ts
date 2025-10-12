import { PromptTemplate } from '@langchain/core/prompts';
import { InputType } from '../state';

export const validateInputPrompt =
  PromptTemplate.fromTemplate(`You are a database question classifier. Your job is to classify user inputs into two categories:

1. {validQueryType}: Questions requiring database queries
2. {discoveryRequestType}: Everything else (greetings, help requests, off-topic questions, or unclear inputs)

Database Schema Information:
{tableInfo}

{validQueryType} examples:
- "How many users are there?"
- "Show me the top 10 products by sales"
- "What is the average order value?"
- Questions asking for specific data from available tables

{discoveryRequestType} examples:
- "What can you help me with?"
- "What's in this database?"
- "Show me what data is available"
- "What kind of questions can I ask?"
- "Give me some example questions"
- Greetings (hi, hello, good morning)
- General conversation or chitchat
- Questions about weather, sports, general knowledge
- Empty or unclear inputs
- Non-database related questions

User input: "{userInput}"

If it's clearly asking for specific data from the database tables, classify as {validQueryType}.
Otherwise, classify as {discoveryRequestType} - the discovery system will handle all non-query inputs appropriately.`);

export const createValidateInputPrompt = async (tableInfo: string, userInput: string) => {
  return await validateInputPrompt.format({
    validQueryType: InputType.VALID_QUERY,
    discoveryRequestType: InputType.DISCOVERY_REQUEST,
    tableInfo,
    userInput,
  });
};
