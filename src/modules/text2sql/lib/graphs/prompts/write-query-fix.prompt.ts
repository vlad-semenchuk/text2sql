import { PromptTemplate } from '@langchain/core/prompts';

export const writeQueryFixPrompt =
  PromptTemplate.fromTemplate(`You are an expert SQL query fixer. Your task is to fix a syntactically invalid SQL query based on the database error message.

Database Schema Information:
{tableInfo}

Database Dialect: {dialect}

Invalid Query:
{invalidQuery}

Database Error:
{errorMessage}

Please fix the SQL query to make it syntactically valid and executable. Focus on:
- Correcting syntax errors
- Fixing column/table name issues
- Ensuring proper SQL dialect compatibility
- Maintaining the original query intent

Return only the corrected SQL query.`);

export const createWriteQueryFixPrompt = async (
  tableInfo: string,
  dialect: string,
  invalidQuery: string,
  errorMessage: string,
) => {
  return await writeQueryFixPrompt.format({
    tableInfo,
    dialect,
    invalidQuery,
    errorMessage,
  });
};
