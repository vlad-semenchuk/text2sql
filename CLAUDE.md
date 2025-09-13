# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS TypeScript application for text-to-SQL conversion. The project uses a modular library architecture with shared components and follows NestJS conventions.

## Development Commands

### Project Setup
```bash
npm install
```

### Building and Running
```bash
npm run build              # Build the project
npm run start             # Start in production mode
npm run start:dev         # Start in development with watch mode
npm run start:debug       # Start in debug mode with watch
npm run start:prod        # Start from built dist files
```

### Code Quality
```bash
npm run lint              # Run ESLint with auto-fix
npm run format           # Format code with Prettier
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:cov         # Run tests with coverage
```

## Architecture

### Module Structure
The project uses a library-based modular architecture located in `src/libs/`:

- **Shared Libraries** (`src/libs/shared/`):
  - `config` - Environment configuration and validation
  - `core` - Core application utilities including the AppBuilder pattern
  - `data-access-postgres` - PostgreSQL database access layer

- **Feature Libraries** (`src/libs/text2sql/`):
  - Contains the main text2sql conversion functionality and controllers

### Path Aliases
TypeScript path mapping is configured for clean imports:
- `@libs/config` → shared config library
- `@libs/core` → shared core utilities
- `@libs/data-access-postgres` → PostgreSQL access layer
- `@libs/text2sql` → text2sql feature module

### Application Bootstrap
The app uses a custom `AppBuilder` pattern from `@libs/core` that provides:
- Fluent API for application configuration
- Built-in validation pipe setup
- Static asset serving capabilities
- Hook system for pre-start configuration

### Database Integration
- Uses TypeORM with PostgreSQL
- Database configuration handled through the shared config library
- Schema utilities available in the data-access-postgres library

### Development Setup
- TypeScript with strict configuration
- ESLint for linting with Prettier integration
- Jest for testing with module name mapping for path aliases
- NestJS CLI for code generation and build management

## Git Commit Guidelines

- Use single-line commit messages only (maximum 50 characters)
- Use imperative mood (e.g., "Add feature" not "Added feature")
- Focus on what the commit does, not how it does it
- Do not mention Claude or AI assistance in commit messages

### Examples:
- "Add user authentication"
- "Fix SQL query validation"
- "Update README"
- "Remove deprecated imports"