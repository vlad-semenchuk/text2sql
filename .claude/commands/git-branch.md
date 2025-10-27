---
description: Create a new git branch with intelligent naming from natural language
---

Use the **git-workflow-coordinator** agent with intent to create a new branch.

## Current State

```bash
git branch --show-current
git status --short
```

## User Input

```bash
USER_INPUT="$*"
echo "Branch description: $USER_INPUT"
```

## Instructions for git-workflow-coordinator

Create a new branch from the natural language description: `$USER_INPUT`

The coordinator should:

1. **Validate current state**
   - Check for uncommitted changes (warn but allow)
   - Verify repository is initialized

2. **Parse description** into standardized branch name
   - Format: `<type>/<description-in-kebab-case>`
   - Infer type from keywords if not explicit
   - Ask for clarification if ambiguous

3. **Validate branch name**
   - Check branch doesn't already exist
   - If exists, offer to switch or choose different name

4. **Create branch**
   - Execute: `git checkout -b <branch-name>`
   - Confirm creation with success message

5. **Suggest next steps**
   - Make code changes
   - Commit: `/git-commit`
   - Push and create PR: `/git-push`

## Examples

| User Input | Expected Branch |
|------------|----------------|
| `feature user authentication` | `feature/user-authentication` |
| `fix the api timeout issue` | `fix/api-timeout-issue` |
| `add email validation` | `feature/email-validation` |
| `refactor database connection` | `refactor/database-connection` |
| `update README` | `docs/update-readme` |
