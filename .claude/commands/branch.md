# Standardized Branch Creation System

Create new git branches with standardized naming conventions based on branch type and description.

## Usage

This command creates a new branch with standardized naming. Examples:

- Create branch with description: `/branch feature add user authentication`
- Create branch with type only: `/branch fix`
- Create branch without args: `/branch` (will prompt for details)

## Instructions:

Perform an intelligent branch creation workflow with standardized naming and validation:

## Workflow Overview:

1. **Pre-Branch Validation**: Verify working directory state and branch status
2. **Input Processing**: Parse command arguments or prompt for branch details
3. **Name Generation**: Create standardized branch name from type and description
4. **Branch Creation**: Create and switch to the new branch
5. **Post-Creation Verification**: Confirm successful creation and display status

### Step 1: Pre-Branch Validation

```bash
# Verify current git status
git status --porcelain

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
```

**Validation Checks:**

- **Clean Working Directory**: Warn if uncommitted changes exist (but allow creation)
- **Current Branch**: Display current branch for context
- **Git Repository**: Verify we're in a git repository
- **Branch Name Collision**: Check if target branch already exists

**If uncommitted changes exist:**

```bash
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "Changes will remain in working directory after branch creation"
    echo ""
    git status --short
    echo ""
    echo "Consider committing or stashing before creating new branch"
    echo ""
fi
```

### Step 2: Input Processing and Type Selection

**Branch Type Standards:**

- `feature/` - New features and enhancements
- `fix/` - Bug fixes and issue resolutions
- `docs/` - Documentation updates and additions
- `refactor/` - Code refactoring and restructuring
- `test/` - Test additions and test improvements
- `chore/` - Maintenance, dependencies, configuration

**Parse Command Arguments:**

When user runs `/branch feature add user authentication`:
- First argument: branch type (`feature`)
- Remaining arguments: description (`add user authentication`)

**If no arguments provided:**

Ask user for branch details using structured questions:

1. **Branch Type**: Select from standard types (feature, fix, docs, refactor, test, chore)
2. **Description**: Short description of the branch purpose (3-5 words recommended)

**If type provided but no description:**

Ask user only for description while using the provided type.

**Example Parsing:**

```bash
# Extract arguments
ARGS=("$@")
TYPE="${ARGS[0]}"
DESCRIPTION="${ARGS[@]:1}"

# Validate type against standards
case "$TYPE" in
    feature|fix|docs|refactor|test|chore)
        BRANCH_TYPE="$TYPE"
        ;;
    *)
        echo "Invalid branch type: $TYPE"
        echo "Valid types: feature, fix, docs, refactor, test, chore"
        exit 1
        ;;
esac
```

### Step 3: Branch Name Generation

**Name Generation Rules:**

1. **Prefix**: Use branch type with trailing slash (`feature/`, `fix/`, etc.)
2. **Description Processing**:
   - Convert to lowercase
   - Replace spaces with underscores
   - Remove special characters except underscores and hyphens
   - Limit to 50 characters total
   - Use descriptive but concise naming

**Name Generation Examples:**

| Input | Generated Branch Name |
|-------|----------------------|
| `feature Add User Authentication` | `feature/add_user_authentication` |
| `fix SQL Injection Query Builder` | `fix/sql_injection_query_builder` |
| `docs Update API Documentation` | `docs/update_api_documentation` |
| `refactor Extract Payment Utils` | `refactor/extract_payment_utils` |
| `test Add Integration Tests` | `test/add_integration_tests` |
| `chore Update Dependencies` | `chore/update_dependencies` |

**Name Processing Algorithm:**

```bash
# Generate branch name from type and description
generate_branch_name() {
    local type=$1
    local description=$2

    # Convert to lowercase and replace spaces with underscores
    local clean_desc=$(echo "$description" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

    # Remove special characters except underscore and hyphen
    clean_desc=$(echo "$clean_desc" | sed 's/[^a-z0-9_-]//g')

    # Limit length (50 chars total - type prefix length)
    local max_desc_len=$((50 - ${#type} - 1))
    clean_desc=${clean_desc:0:$max_desc_len}

    # Construct final branch name
    echo "${type}/${clean_desc}"
}
```

### Step 4: Branch Existence Validation

```bash
# Check if branch already exists locally
BRANCH_NAME="[generated name]"

if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "❌ Branch '$BRANCH_NAME' already exists locally"
    echo ""
    echo "Options:"
    echo "1. Switch to existing branch: git checkout $BRANCH_NAME"
    echo "2. Delete existing branch: git branch -D $BRANCH_NAME (then retry)"
    echo "3. Choose different description for new branch"
    exit 1
fi

# Check if branch exists on remote
git fetch origin --quiet
if git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
    echo "⚠️  Branch '$BRANCH_NAME' exists on remote"
    echo "Checking out remote branch instead of creating new one"
    git checkout -b $BRANCH_NAME origin/$BRANCH_NAME
    exit 0
fi
```

### Step 5: Branch Creation and Checkout

```bash
# Create and switch to new branch
echo "Creating branch: $BRANCH_NAME"
echo "From: $CURRENT_BRANCH"
echo ""

git checkout -b $BRANCH_NAME

# Verify creation was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully created and switched to branch: $BRANCH_NAME"
else
    echo "❌ Failed to create branch"
    exit 1
fi
```

**Branch Creation Notes:**

- Branch is created from current HEAD position
- All uncommitted changes remain in working directory
- No remote tracking is set up initially (set on first push)
- Uses `git checkout -b` for create and switch in one command

### Step 6: Post-Creation Verification and Display

```bash
# Display current branch status
echo ""
echo "📋 Branch Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current branch: $(git branch --show-current)"
echo "Based on: $CURRENT_BRANCH"
echo "Type: ${BRANCH_TYPE}"
echo ""

# Show git status
git status --short

echo ""
echo "Next steps:"
echo "• Make your changes"
echo "• Use /commit to commit changes with standardized messages"
echo "• Use /push to push branch to remote"
echo "• Use /pr to create pull request when ready"
```

**Verification Checklist:**

- ✅ New branch created successfully
- ✅ Switched to new branch
- ✅ Branch name follows conventions
- ✅ Working directory state preserved
- ✅ User informed of next steps

### Step 7: Integration with Workflow Commands

**Workflow Integration:**

This branch command integrates with the existing development workflow:

1. **Create Branch**: `/branch feature add auth` → creates `feature/add_auth`
2. **Make Changes**: Edit code, add files
3. **Commit Changes**: `/commit` → creates standardized commit messages
4. **Push Branch**: `/push` → pushes to remote with upstream tracking
5. **Create PR**: `/pr` → creates pull request with auto-generated description

**Branch Type to Commit Type Mapping:**

| Branch Type | Common Commit Types |
|------------|---------------------|
| `feature/` | `feat:`, `test:` |
| `fix/` | `fix:`, `test:` |
| `docs/` | `docs:` |
| `refactor/` | `refactor:`, `test:` |
| `test/` | `test:` |
| `chore/` | `chore:`, `deps:`, `config:` |

## Error Handling and Edge Cases

### Not in Git Repository

```bash
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    echo "Initialize git: git init"
    exit 1
fi
```

### Empty Description

```bash
if [ -z "$DESCRIPTION" ]; then
    echo "❌ Branch description cannot be empty"
    echo "Provide description: /branch $TYPE [description]"
    exit 1
fi
```

### Invalid Characters in Description

```bash
# Already handled by name generation algorithm
# Special characters automatically removed during processing
# User informed if significant changes made to their input
```

### Detached HEAD State

```bash
if git symbolic-ref -q HEAD > /dev/null; then
    : # Normal branch state
else
    echo "⚠️  Currently in detached HEAD state"
    echo "New branch will be created from current commit"
    echo ""
    git log -1 --oneline
    echo ""
fi
```

## Branch Naming Best Practices

### Good Branch Names

✅ `feature/user_authentication` - Clear, specific feature
✅ `fix/sql_injection_query` - Describes specific bug fix
✅ `docs/api_endpoints` - Clear documentation scope
✅ `refactor/payment_service` - Specific refactoring target
✅ `test/integration_auth` - Clear test scope
✅ `chore/update_nestjs` - Specific maintenance task

### Avoid

❌ `feature/update` - Too vague
❌ `fix/bug` - Not descriptive
❌ `feature/new_feature` - Redundant
❌ `test/tests` - Not specific enough
❌ `feature/implement-the-entire-user-authentication-system-with-jwt-and-oauth` - Too long

### Naming Guidelines

- **Be Specific**: Mention component or feature name
- **Be Concise**: 3-5 words is ideal
- **Use Lowercase**: All branch names in lowercase
- **Use Underscores**: Separate words with underscores
- **Avoid Redundancy**: Don't repeat the type in description
- **Maximum Length**: Keep under 50 characters total

## Advanced Usage Examples

### Creating Feature Branch

```bash
# Command
/branch feature add text2sql caching

# Generated
Branch: feature/add_text2sql_caching

# Usage Flow
→ Create branch
→ Implement caching logic
→ /commit (creates "feat: add query result caching")
→ /push (pushes to origin/feature/add_text2sql_caching)
→ /pr (creates PR "feat: add text2sql query caching")
```

### Creating Fix Branch

```bash
# Command
/branch fix memory leak postgres connection

# Generated
Branch: fix/memory_leak_postgres_connection

# Usage Flow
→ Create branch
→ Fix connection pooling
→ /commit (creates "fix: resolve PostgreSQL connection pool leak")
→ /push
→ /pr
```

### Creating Documentation Branch

```bash
# Command
/branch docs update setup guide

# Generated
Branch: docs/update_setup_guide

# Usage Flow
→ Create branch
→ Update README and documentation
→ /commit (creates "docs: update installation and setup guide")
→ /push
→ /pr
```

## Interactive Mode Flow

When run without arguments (`/branch`), the command should:

1. **Ask for Branch Type**:
   ```
   Select branch type:
   • feature - New features and enhancements
   • fix - Bug fixes and issue resolutions
   • docs - Documentation updates
   • refactor - Code refactoring
   • test - Test additions
   • chore - Maintenance and configuration
   ```

2. **Ask for Description**:
   ```
   Enter branch description (3-5 words):
   Example: "add user authentication system"
   ```

3. **Confirm Creation**:
   ```
   Create branch: feature/add_user_authentication_system
   Based on: main

   Proceed? (y/n)
   ```

4. **Execute Creation**: Follow standard creation workflow

## Integration with NestJS Project

This command is aware of the NestJS project structure and common patterns:

**Module-Based Naming:**
- `feature/auth_module` - New authentication module
- `feature/text2sql_service` - New text2sql service
- `refactor/postgres_module` - Refactor database module

**Common NestJS Patterns:**
- `feature/add_[module]_controller` - New controller
- `feature/add_[module]_service` - New service
- `test/[module]_e2e` - End-to-end tests
- `refactor/extract_[module]_utils` - Extract utilities

**Database Changes:**
- `feature/add_[entity]_entity` - New TypeORM entity
- `fix/[table]_migration` - Fix database migration
- `refactor/[entity]_schema` - Refactor entity schema

The command helps maintain consistency across the development workflow and ensures branch names are searchable, descriptive, and follow team standards.
