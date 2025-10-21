# Text2SQL

A sophisticated TypeScript application built with NestJS that converts natural language queries into SQL statements using AI-powered graph workflows. The system intelligently classifies user intent, generates SQL queries, validates them, executes them against your database, and provides natural language responses.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Graph Workflow](#graph-workflow)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Docker Architecture](#docker-architecture)
- [API Usage](#api-usage)

## Features

- **Intelligent Intent Classification**: Automatically determines user intent (query request, greeting, clarification needed, etc.)
- **Natural Language to SQL**: Converts plain English questions into syntactically valid SQL queries
- **Multi-LLM Support**: Works with OpenAI, Anthropic Claude, and OpenRouter
- **Database Schema Discovery**: Automatically analyzes and understands your database structure
- **Query Validation & Auto-Fix**: Validates generated SQL and attempts automatic fixes if needed
- **Conversational Context**: Maintains chat history with per-user session management
- **Vector Store Integration**: ChromaDB-powered vector store for semantic search and document storage
- **Telegram Bot Integration**: Access text2sql functionality through a Telegram bot
- **PostgreSQL Support**: Currently supports PostgreSQL databases with TypeORM
- **Docker Support**: Full containerization with Docker Compose for easy deployment

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Module Structure

```
src/modules/
├── shared/
│   ├── config/         # Environment configuration and AppBuilder
│   ├── datasource/     # Database connection and schema services
│   ├── llm/           # LLM provider abstraction (OpenAI, Anthropic, OpenRouter)
│   └── vector-store/  # ChromaDB vector store integration
├── text2sql/          # Core text2sql feature module
│   ├── graphs/        # LangGraph state machine and nodes
│   ├── services/      # Business logic services
│   └── prompts/       # LLM prompt templates
└── bot/              # Telegram bot integration
```

### Key Components

- **LangGraph State Machine**: Uses LangGraph to orchestrate the text2sql workflow as a directed graph
- **Node-Based Processing**: Each step in the workflow is implemented as a node (Intent, WriteQuery, ExecuteQuery, etc.)
- **State Management**: Thread-based conversation state with MemorySaver checkpointer
- **Database Service**: Introspects database schema including tables, columns, relationships, and sample data

## Graph Workflow

The text2sql system operates as a state machine with the following workflow:

![Text2SQL Graph Workflow](./docs/text2sql-graph.png)

### Workflow Nodes

1. **Intent Node** (Entry Point)
   - Classifies user input into one of five intent types
   - Routes to appropriate handler based on classification
   - **Intent Types**:
     - `QUERY_REQUEST`: Valid data query → WriteQuery Node
     - `GREETING`: Casual greeting → Greeting Node
     - `AMBIGUOUS_QUERY`: Unclear request → Clarification Node
     - `INVALID_QUERY`: Inappropriate/dangerous query → Rejection Node
     - `DISCOVERY_REQUEST`: Schema exploration → Discovery Node

2. **Write Query Node** ✅
   - Generates SQL query from natural language
   - Uses database schema context for accurate query generation
   - Validates query syntax with `EXPLAIN` command
   - Attempts automatic fix if validation fails
   - Routes to Rejection Node if query cannot be generated safely

3. **Execute Query Node**
   - Runs validated SQL query against the database
   - Captures query results
   - Passes results to answer generation

4. **Generate Answer Node**
   - Converts SQL results into natural language response
   - Formats data in user-friendly way
   - Returns final answer to user

5. **Supporting Nodes**:
   - **Greeting Node**: Responds to casual greetings
   - **Clarification Node**: Asks for more information when request is ambiguous
   - **Rejection Node**: Politely declines dangerous or invalid requests
   - **Discovery Node**: Provides database schema information (pre-generated)

### State Flow

```typescript
State {
  messages: TextMessage[]        // Conversation history
  intent: { type, reason }       // Classified intent
  rejectionReason: string        // Why query was rejected (if applicable)
  query: string                  // Generated SQL query
  result: string                 // Query execution results
  answer: string                 // Final natural language response
}
```

## Technology Stack

### Core Framework
- **NestJS**: Backend framework with dependency injection
- **TypeScript**: Strongly-typed JavaScript
- **TypeORM**: Database ORM for PostgreSQL

### AI & LLM
- **LangChain**: LLM application framework
- **LangGraph**: State machine orchestration for AI workflows
- **OpenAI**: GPT-4/5 model support
- **Anthropic**: Claude model support
- **OpenRouter**: Multi-provider LLM access

### Database & Storage
- **PostgreSQL**: Primary database (introspection-based schema discovery)
- **ChromaDB**: Vector database for semantic search and embeddings

### Bot Integration
- **Grammy**: Telegram bot framework

### Containerization
- **Docker**: Application containerization
- **Docker Compose**: Multi-container orchestration with health checks

## Getting Started

### Prerequisites

**Option 1: Docker (Recommended)**
- Docker and Docker Compose
- API key for at least one LLM provider (OpenAI, Anthropic, or OpenRouter)

**Option 2: Local Development**
- Node.js 18+ and npm
- PostgreSQL database instance
- ChromaDB instance (optional, for vector store features)
- API key for at least one LLM provider (OpenAI, Anthropic, or OpenRouter)

### Installation

#### Docker Setup (Recommended)

1. Clone the repository and navigate to the project directory

2. Create a `.env` file in the root directory:

```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dvdrental

# ChromaDB Configuration
CHROMA_COLLECTION_NAME=text2sql-docs

# LLM Provider (choose one: openai | anthropic | openrouter)
LLM_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-your-key-here
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Telegram Bot (optional)
BOT_TOKEN=your-telegram-bot-token
BOT_ENABLED=false
```

3. Start the application with Docker Compose:

```bash
# Start all services (PostgreSQL, ChromaDB, and the application)
npm run docker:start

# Stop all services
npm run docker:stop
```

The application will be available at:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **ChromaDB**: http://localhost:8000
- **PostgreSQL**: localhost:5432

#### Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your local database configuration:

```bash
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dvdrental
POSTGRES_SCHEMA=public

# ChromaDB Configuration (optional)
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
CHROMA_COLLECTION_NAME=text2sql-docs

# LLM Provider Configuration (same as Docker setup above)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o

# Telegram Bot (optional)
BOT_TOKEN=your-telegram-bot-token
BOT_ENABLED=false
```

3. Run the application:

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Configuration

### LLM Provider Selection

The application supports three LLM providers. Set `LLM_PROVIDER` in your `.env` file:

- `openai`: OpenAI GPT models
- `anthropic`: Anthropic Claude models
- `openrouter`: Access multiple providers through OpenRouter

### Database Connection

**Docker Setup:**
Database configuration is handled automatically through Docker Compose. The PostgreSQL service includes:
- Automatic database initialization with the DVD Rental sample database
- Health checks for service readiness
- Persistent volume for data storage

**Local Setup:**
Configure individual PostgreSQL connection parameters:
- `POSTGRES_HOST`: Database host (default: localhost)
- `POSTGRES_PORT`: Database port (default: 5432)
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name
- `POSTGRES_SCHEMA`: Schema name (default: public)

### ChromaDB Vector Store

The vector store is optional but recommended for enhanced semantic search capabilities:

**Docker Setup:**
ChromaDB runs automatically as a service with:
- Persistent storage for vector embeddings
- Health monitoring
- Automatic collection initialization

**Local Setup:**
Configure ChromaDB connection:
- `CHROMA_HOST`: ChromaDB host (default: localhost)
- `CHROMA_PORT`: ChromaDB port (default: 8000)
- `CHROMA_SSL`: Use SSL connection (default: false)
- `CHROMA_COLLECTION_NAME`: Collection name for document storage

## Project Structure

```
text2sql/
├── src/
│   ├── modules/
│   │   ├── shared/
│   │   │   ├── config/           # Environment & app configuration
│   │   │   ├── datasource/       # Database connection & schema services
│   │   │   ├── llm/             # LLM provider abstraction
│   │   │   └── vector-store/    # ChromaDB vector store service
│   │   ├── text2sql/
│   │   │   ├── graphs/
│   │   │   │   ├── nodes/       # Graph workflow nodes
│   │   │   │   ├── prompts/     # LLM prompt templates
│   │   │   │   ├── services/    # Database introspection service
│   │   │   │   ├── workflows/   # LangGraph workflow definition
│   │   │   │   ├── state.ts     # State annotation
│   │   │   │   └── types.ts     # Type definitions
│   │   │   └── services/        # Text2SQL service layer
│   │   └── bot/                 # Telegram bot module
│   ├── app.module.ts
│   └── main.ts
├── db-init/                     # PostgreSQL initialization scripts
├── scripts/
│   └── docker-start.sh         # Docker startup script
├── .env.example                 # Environment template
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Application Docker image
├── Dockerfile.chromadb        # ChromaDB Docker image
├── CLAUDE.md                   # Project instructions for Claude Code
├── nest-cli.json              # NestJS CLI configuration
├── tsconfig.json              # TypeScript configuration
└── package.json

```

### Key Files

- `src/modules/text2sql/lib/graphs/workflows/text2sql.graph.ts`: Main graph workflow definition
- `src/modules/text2sql/lib/graphs/nodes/*.node.ts`: Individual workflow nodes
- `src/modules/shared/datasource/lib/datasource.service.ts`: Database schema introspection
- `src/modules/shared/llm/lib/llm.config.ts`: LLM provider configuration
- `src/modules/shared/vector-store/lib/vector-store.service.ts`: ChromaDB vector store service
- `docker-compose.yml`: Multi-container orchestration configuration
- `Dockerfile`: Application container definition

## Development

### Available Commands

```bash
# Docker Commands
npm run docker:start       # Start all services with Docker Compose
npm run docker:stop        # Stop all Docker services

# Build
npm run build              # Compile TypeScript to JavaScript

# Development
npm run start              # Start in production mode
npm run start:dev          # Start with hot-reload (watch mode)
npm run start:debug        # Start in debug mode with watch

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting without fixing
```

### Testing

```bash
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Generate test coverage report
```

### Adding New Nodes

To extend the graph workflow with new nodes:

1. Create a new node class extending `BaseNode` in `src/modules/text2sql/lib/graphs/nodes/`
2. Implement the `execute(state: State)` method
3. Add the node to the graph in `text2sql.graph.ts`
4. Update state routing logic in conditional edges

## Docker Architecture

The application uses a multi-container Docker setup orchestrated by Docker Compose:

### Services

1. **PostgreSQL** (`text2sql-postgres`)
   - Image: `postgres:16-alpine`
   - Port: 5432
   - Features:
     - Automatic initialization with DVD Rental sample database
     - Health checks for service readiness
     - Persistent volume storage
     - Custom initialization scripts in `db-init/`

2. **ChromaDB** (`text2sql-chromadb`)
   - Custom image based on `chromadb/chroma:latest`
   - Port: 8000
   - Features:
     - Vector database for semantic search
     - Persistent storage for embeddings
     - Health monitoring via HTTP endpoint
     - Telemetry disabled for privacy

3. **Application** (`text2sql-app`)
   - Multi-stage build (builder + production)
   - Port: 3000
   - Features:
     - Non-root user execution for security
     - Built-in health checks
     - Automatic dependency on database services
     - Persistent cache directory

### Health Monitoring

All services include health checks:
- **PostgreSQL**: `pg_isready` command (10s interval)
- **ChromaDB**: HTTP heartbeat endpoint (10s interval)
- **Application**: HTTP health endpoint at `/health` (30s interval)

The application waits for both PostgreSQL and ChromaDB to be healthy before starting.

### Volumes

- `postgres_data`: PostgreSQL database files
- `chroma_data`: ChromaDB vector embeddings
- `cache_data`: Application cache directory

### Network

All services communicate via a dedicated bridge network (`text2sql-network`), providing isolation and service discovery.

## API Usage

### Programmatic Usage

```typescript
import { Text2SqlService } from '@modules/text2sql';

// Inject the service
constructor(private readonly text2SqlService: Text2SqlService) {}

// Query the database with natural language
async queryDatabase(question: string, userId: string) {
  const answer = await this.text2SqlService.query(
    question,
    userId  // Used as thread_id for conversation history
  );
  return answer;
}
```

### Example Queries

```
"How many users do we have?"
"What are the top 5 products by revenue?"
"Show me recent orders from the last week"
"List all customers from California"
```

### Telegram Bot

If `BOT_ENABLED=true`, users can interact with the system via Telegram:

1. Start a conversation with your bot
2. Send natural language queries
3. Receive natural language responses

## License

UNLICENSED
