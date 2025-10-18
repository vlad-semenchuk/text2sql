import { PromptTemplate } from '@langchain/core/prompts';

export const queryPromptTemplate = PromptTemplate.fromTemplate(`
You are a SQL query generator. Your task is to analyze the user's input and either generate a valid SQL query or provide a rejection reason.

First, determine if the user's input is related to the database schema and if a SQL query can be generated:
- Check if the question relates to the available tables and columns
- Verify if the requested information can be retrieved from the database
- Ensure the question is asking for data retrieval (not modifications, greetings, or unrelated topics)

Only use the following tables:
{tableInfo}

If the input is NOT related to the database schema OR it's impossible to create a valid SQL query:
- Leave query as an empty string
- Set rejectionReason with a clear explanation (e.g., "The question is not related to the available database schema", "The requested table/column does not exist", "The question cannot be answered with a SQL query")

If the input IS related to the database schema and a query can be generated:
- Create a syntactically correct {dialect} query
- Unless the user specifies a specific number of examples, limit results to at most {limit}
- Order results by a relevant column to return the most interesting examples
- Only query for relevant columns, never all columns from a table
- Use only column names that exist in the schema description
- Pay attention to which column is in which table
- Leave rejectionReason as an empty string
`);

export const createWriteQueryPrompt = async (params: {
  dialect: string;
  tableInfo: string;
  input: string;
  limit?: number;
}) => {
  return await queryPromptTemplate.format({
    dialect: params.dialect,
    tableInfo: params.tableInfo,
    input: params.input,
    limit: params.limit || 10,
  });
};
