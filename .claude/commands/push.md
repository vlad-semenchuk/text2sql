# Auto Commit & Push

Automatically stage, commit, and push changes: $ARGUMENTS

## Instructions:

Perform a complete git workflow by executing these steps in sequence:

### Step 1: Stage Changes

```bash
git add .
```

### Step 2: Analyze Changes

```bash
git diff --cached --stat
git diff --cached --name-only
```

Review the staged files to understand what changed.

### Step 3: Generate Commit Message

Based on the changes, create a single-line commit message that:

- Is 50 characters or less
- Uses conventional commit format: `type: brief description`
- Uses imperative mood (add, fix, update, remove, etc.)
- Does NOT mention Claude or AI generation
- Accurately describes the main change

### Step 4: Commit

```bash
git commit -m "[generated message]"
```

### Step 5: Push

```bash
git push
```

## Example Messages:

- `feat: add user authentication`
- `fix: resolve login validation bug`
- `docs: update API documentation`
- `style: format code with prettier`
- `refactor: simplify payment logic`
- `test: add unit tests for utils`

Execute all steps automatically and provide a summary of what was committed and pushed.
