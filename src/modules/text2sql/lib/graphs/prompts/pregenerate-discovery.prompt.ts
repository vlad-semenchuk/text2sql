import { PromptTemplate } from '@langchain/core/prompts';

export const pregenerateDiscoveryPrompt = PromptTemplate.fromTemplate(`
You are analyzing a database schema to prepare helpful discovery content for a Text-to-SQL application.

## Context:

Database Schema:
{tableInfo}

Current Date: {currentDate}

## Your Task:

Analyze the database schema and generate discovery content that will help users understand what they can query.

## Required Output Format:

Return a JSON object with this exact structure:
{{
  "description": "A 1-2 sentence description of what data is available",
  "exampleQuestions": [
    "Question 1",
    "Question 2",
    ...
    "Question 10-15"
  ]
}}

## Guidelines:

**Database Description:**
- 1-2 sentences describing what kind of data is available
- Use business terms, not technical table/column names
- Infer the domain from the schema (e.g., "movies and actors", "customers and orders", "products and sales")
- Be specific to THIS database

**Example Questions (10-15 total):**
- Generate 10-15 diverse, ready-to-use example questions
- Make questions EXACTLY as users would type them - ready to copy and paste
- Use actual concepts from the schema (e.g., "Show me action movies" not "Show [category] items")
- DO NOT use variables or placeholders like [category], [word], [field]
- DO NOT mention table or column names directly
- Each question should work if copied and pasted exactly

**Query Type Diversity:**
Balance your 10-15 examples across these query types:
- **Text search/filtering** (2-3 questions): "Find comedies", "Show Italian restaurants"
- **Counting/aggregation** (2-3 questions): "How many customers are there?", "What's the total revenue?"
- **Relationship queries** (2-3 questions): "Which customers ordered in December?", "Show actors in multiple movies"
- **Comparison queries** (2-3 questions): "Show products over $50", "Find movies longer than 2 hours"
- **Listing/browsing** (2-3 questions): "List all categories", "Show me recent orders"
- **Date-based queries** (1-2 questions max): Use actual dates from sample data if old, or relative terms if current

**Date Query Rules (CRITICAL):**
- **ALWAYS examine the actual sample data or table info for date ranges BEFORE generating date-based questions**
- **Current Date is: {currentDate}** - compare this to dates in the database
- If database dates are OLD (multiple years before Current Date):
  * Use specific years/dates from the actual sample data (e.g., "Show sales from 1996", "List movies released in 2005")
  * NEVER use relative terms like "last month", "this year", "recent" - they won't match old data
  * Pick years that actually appear in the sample data
- If database dates are CURRENT (within 1-2 years of Current Date):
  * Can use relative terms (e.g., "Show orders from last month", "List recent transactions")
  * Or use specific recent dates
- Include AT MOST 1-2 date-based queries out of 10-15 total
- **If you cannot determine date ranges from the schema, skip date-based questions entirely**

## Example Output (for a movie database with data from 1990-2000):

{{
  "description": "I can help you query data about movies, actors, directors, and ratings.",
  "exampleQuestions": [
    "Show me all science fiction movies",
    "How many movies were released in 1995?",
    "Which actors appeared in more than 5 movies?",
    "List movies with ratings above 8",
    "Find movies longer than 2 hours",
    "Show me all movies directed by Steven Spielberg",
    "What's the average rating for action movies?",
    "Which directors have the most movies?",
    "Show movies released between 1990 and 2000",
    "List all movie genres",
    "Find actors who also directed movies",
    "How many movies are rated PG-13?",
    "Show the top 10 highest rated movies",
    "Which movies have won awards?",
    "List all movies with Tom Hanks"
  ]
}}

Note: The date-based questions above ("How many movies were released in 1995?" and "Show movies released between 1990 and 2000") use SPECIFIC YEARS from the actual database date range, NOT relative terms like "recent" or "last month".

---

## Key Principles:

✓ Generate 10-15 diverse, specific questions
✓ Use real concepts from the schema, no placeholders
✓ Balance across different query types
✓ Make questions copy-paste ready
✓ Describe data in business terms
✓ Each question should be natural and conversational
✓ **CRITICAL: Check actual date ranges in sample data and use specific years if data is old**
✗ Don't mention table or column names
✗ Don't use placeholders like [category] or [word]
✗ Don't make more than 2 of 15 examples date-based
✗ Don't generate generic examples that don't fit the schema
✗ **NEVER use relative date terms ("recent", "last month") if database dates are old (years before Current Date)**

Return ONLY the JSON object, nothing else.`);

export const createPregenerateDiscoveryPrompt = async (tableInfo: string) => {
  return await pregenerateDiscoveryPrompt.format({
    tableInfo,
    currentDate: new Date().toDateString(),
  });
};
