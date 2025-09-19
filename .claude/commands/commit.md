# Intelligent Commit System

Analyzes changes, suggests commit splits for complex changes, and generates highly searchable commit messages: $
ARGUMENTS

## Instructions:

Perform an intelligent git commit workflow with change analysis and optional splitting:

### Step 1: Initial Analysis

```bash
git status --porcelain
git diff --name-only
git diff --cached --name-only
```

Determine current state and identify all modified files.

### Step 2: Comprehensive Change Analysis

```bash
git diff --stat
git diff --cached --stat
git diff --name-status
git diff --cached --name-status
```

Analyze changes to categorize by:

- **File types**: source code, config, docs, tests, assets
- **Change types**: new files, deletions, renames, modifications
- **Scope**: features, fixes, refactoring, dependencies, infrastructure
- **Components**: identify affected modules/directories

### Step 3: Commit Split Detection

Based on analysis, determine if changes should be split into multiple commits:

**Split Criteria:**

- Mix of unrelated features/fixes
- Documentation changes + code changes
- Configuration changes + feature work
- Test additions + implementation changes
- Dependency updates + feature work
- Multiple modules/components affected

**When to split:**

- More than 10 files changed
- Changes span multiple directories/modules
- Mix of different change types (feat/fix/docs/config)
- Deletions mixed with new features

### Step 4A: Single Commit Path

If changes are cohesive, stage all and proceed to Step 6.

```bash
git add .
```

### Step 4B: Multi-Commit Path

If split is recommended:

1. **Present split suggestions** with rationale
2. **Stage changes selectively** by category:
   ```bash
   git add [specific files for commit 1]
   ```
3. **Generate and execute first commit**
4. **Repeat for remaining commits**
5. **Verify no unstaged changes remain**

### Step 5: Enhanced Message Generation

Create searchable commit messages with this format:

```
[type]: [action] [specific component/file]

Details:
• [Most important change with specific file/path names]
• [Secondary change if significantly different]
• [Additional change only if necessary - max 5 total]
```

**Enhanced Summary Requirements:**

- Include specific file/folder names when relevant
- Use precise action verbs: create, delete, rename, extract, consolidate
- Mention technology stack: NestJS, TypeScript, PostgreSQL, etc.
- Include component/module names from project structure
- Reference specific functions/classes when applicable

**Searchable Details Requirements:**

- **Minimal but specific**: 1-2 points for simple changes, max 5 for complex
- **File Operations**: "Delete src/old-module/", "Create src/modules/auth/"
- **Component Names**: "Update UserService class", "Refactor PaymentController"
- **Technology Specific**: "Add NestJS guards", "Update TypeORM entities"
- **Path References**: "Move utils from src/lib/ to src/shared/"
- **Integration Points**: "Connect Redis cache", "Add PostgreSQL migration"
- **Focus on impact**: Combine related changes into single points when possible

### Step 6: Commit Execution

```bash
git commit -m "[generated detailed message]"
```

Repeat for each commit in a split scenario.

### Step 7: Verification

```bash
git status
git log --oneline -n [number of new commits]
```

Confirm all changes committed and review commit history.

**DO NOT PUSH** - Only commit changes locally.

## Enhanced Examples:

### Feature Addition:

```
feat: create user authentication system

Details:
• Create src/modules/auth/ with AuthController and JWT middleware
• Add UserEntity with TypeORM decorators and PostgreSQL schema
```

### Bug Fix:

```
fix: resolve SQL injection in QueryBuilder

Details:
• Sanitize user input and add validation in src/database/query-builder.ts
• Update WHERE clause construction and add security tests
```

### Refactoring:

```
refactor: extract payment utilities to shared module

Details:
• Move PaymentValidator and currency utils to src/shared/
• Consolidate error handling across PaymentService and OrderController
```

### Deletion:

```
chore: remove deprecated authentication module

Details:
• Delete src/modules/old-auth/ directory and migration files
• Remove AuthV1Controller references from app.module.ts and package.json
```

### Configuration:

```
config: update environment configuration structure

Details:
• Rename .env.example variables and add DATABASE_SSL_MODE option
• Update ValidateEnv schema and add Redis configuration variables
```

## Split Workflow Example:

For mixed changes, create separate commits:

1. **Dependencies**: `chore: update NestJS to v10.2.1`
2. **Feature**: `feat: add query validation service`
3. **Tests**: `test: add validation service unit tests`
4. **Docs**: `docs: update text2sql endpoint documentation`

Execute each commit individually with precise staging and detailed, searchable messages.
