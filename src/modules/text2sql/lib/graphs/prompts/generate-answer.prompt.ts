import { PromptTemplate } from '@langchain/core/prompts';

export const generateAnswerPrompt =
  PromptTemplate.fromTemplate(`Given the following user question, corresponding SQL query, and SQL result, answer the user question.

Question: {question}
SQL Query: {query}
SQL Result: {result}

Instructions for formatting the response:
1. Answer the question using ONLY the relevant information from the results
2. NEVER show internal database identifiers (IDs, keys, or column names like film_id, customer_id, etc.)
3. NEVER mention technical database terms or expose the schema structure
4. Present data in a natural, readable format
5. If showing lists, include only meaningful information that users would care about
6. Format movie titles, names, and other text data appropriately (proper capitalization if needed)
7. Include relevant details like ratings, dates, or amounts when they add value, but skip internal references
8. If no data is found, simply say "No results found" or similar, without technical explanations
9. Keep the response conversational and helpful
10. You may offer to provide more information if appropriate, but phrase it naturally (e.g., "Would you like more details?" not "Would you like to see other columns?")`);

export const createGenerateAnswerPrompt = async (question: string, query: string, result: string) => {
  return await generateAnswerPrompt.format({
    question,
    query,
    result,
  });
};
