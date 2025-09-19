# Intelligent Commit System

Analyzes changes, suggests commit splits for complex changes, and generates highly searchable commit messages.

## Instructions:

Perform an intelligent git commit workflow with change analysis and optional splitting:

## Workflow Overview:

1. **Priority Order**: Always commit staged files FIRST, then process unstaged files
2. **Staged Files**: Analyze and commit immediately without combining with unstaged changes
3. **Unstaged Files**: Only process after all staged files are committed
4. **Split Logic**: Apply split detection separately to staged and unstaged file groups

### Step 1: Initial Analysis

```bash
git status --porcelain
git diff --name-only
git diff --cached --name-only
```

Determine current state and identify all modified files.

### Step 2: Staged Files Priority Processing

**If staged files exist, process them FIRST before unstaged changes:**

1. **Analyze staged changes separately:**
   ```bash
   git diff --cached --stat
   git diff --cached --name-status
   ```

2. **Generate commit for staged files:**
   - Categorize staged changes by type and scope
   - Create appropriate commit message following format guidelines
   - Execute commit for staged files:
     ```bash
     git commit -m "[generated message for staged files]"
     ```

3. **Verify staged commit:**
   ```bash
   git log --oneline -1
   git status
   ```

4. **Only after staged files are committed, proceed to unstaged changes**

### Step 3: Comprehensive Change Analysis (for remaining unstaged files)

```bash
git diff --stat
git diff --name-status
```

Analyze remaining unstaged changes to categorize by:

- **File types**: source code, config, docs, tests, assets
- **Change types**: new files, deletions, renames, modifications
- **Scope**: features, fixes, refactoring, dependencies, infrastructure
- **Components**: identify affected modules/directories

### Step 4: Commit Split Detection

Based on analysis, determine if changes should be split into multiple commits:

**Split Criteria:**

- Mix of unrelated features/fixes
- Documentation changes + code changes
- Configuration changes + feature work
- Test additions + implementation changes
- Multiple modules/components affected

**When to split:**

- More than 10 files changed
- Changes span multiple directories/modules
- Mix of different change types (feat/fix/docs/config)
- Deletions mixed with new features

**Keep Together:**

- **Dependencies + Implementation**: Always commit dependency additions (package.json/package-lock.json) with the feature implementation that requires them
- **Dependencies + Configuration**: Commit dependency changes with related environment variables, config files, or module setup
- **Dependencies + Cleanup**: Commit dependency removals with code cleanup/removal that no longer needs them
- **Feature Cohesion**: All components of a single feature (deps, implementation, config, types) should be in one commit
- **Environment Variables**: New env vars should be committed with the code that uses them

**NEVER Split:**

- package.json/package-lock.json from the implementation that requires the new dependencies
- Environment configuration from the modules that consume those variables
- Type definitions from the implementation that uses them
- Related module files that work together as a single feature

### Step 5A: Single Commit Path (for unstaged files)

If remaining unstaged changes are cohesive, stage all and proceed to Step 6.

```bash
git add .
```

### Step 5B: Multi-Commit Path (for unstaged files)

If split is recommended for unstaged changes:

1. **Present split suggestions** with rationale
2. **Stage changes selectively** by category:
   ```bash
   git add [specific files for commit 1]
   ```
3. **Generate and execute first commit**
4. **Repeat for remaining commits**
5. **Verify no unstaged changes remain**

### Step 6: Enhanced Message Generation

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

### Step 7: Commit Execution

```bash
git commit -m "[generated detailed message]"
```

**CRITICAL**: Never include Claude Code attribution, AI assistance references, or any template signatures like "🤖 Generated with [Claude Code]" or "Co-Authored-By: Claude" in commit messages. Keep messages professional and focused on the technical changes only.

**Commit Message Format Only:**
```
[type]: [action] [specific component/file]

Details:
• [Change description]
• [Additional change if needed]
```

Repeat for each commit in a split scenario.

### Step 8: Final Verification

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

1. **Feature with deps**: `feat: add query validation service with zod dependency`
2. **Tests**: `test: add validation service unit tests`
3. **Docs**: `docs: update text2sql endpoint documentation`

Execute each commit individually with precise staging and detailed, searchable messages.
