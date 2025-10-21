/**
 * Jest test setup file
 * Sets required environment variables for tests
 */

// PostgreSQL Configuration
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_USER = 'test_user';
process.env.POSTGRES_PASSWORD = 'test_password';
process.env.POSTGRES_DB = 'test_db';
process.env.POSTGRES_SCHEMA = 'public';

// ChromaDB Configuration
process.env.CHROMA_HOST = 'localhost';
process.env.CHROMA_PORT = '8000';
process.env.CHROMA_SSL = 'false';
process.env.CHROMA_COLLECTION_NAME = 'test-collection';

// LLM Configuration
process.env.LLM_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_MODEL = 'gpt-4';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.ANTHROPIC_MODEL = 'claude-3-sonnet';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.OPENROUTER_MODEL = 'openai/gpt-4';
process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Telegram Bot Configuration
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.TELEGRAM_BOT_ENABLED = 'false';
