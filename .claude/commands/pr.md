# Pull Request Creation System

Create intelligent pull requests from the current branch with auto-generated titles and descriptions based on commit
analysis.

## Usage

This command creates a PR from the current branch to a target branch. Examples:

- Create PR to main (default): `/pr`
- Create PR to specific branch: `/pr development`
- Create PR to feature branch: `/pr feature/base`

## Instructions:

Perform an intelligent pull request creation workflow with commit analysis and description generation:

## Workflow Overview:

1. **Pre-PR Validation**: Verify branch state and target branch existence
2. **Commit Analysis**: Compare commits between current and target branch
3. **Content Generation**: Generate PR title and description from commits
4. **PR Creation**: Create pull request using GitHub CLI
5. **Post-Creation Verification**: Confirm successful creation and display URL

### Step 1: Pre-PR Validation and Setup

```bash
# Extract target branch from command arguments (default to main if not provided)
# When user runs "/pr development", the first argument is "development"
TARGET_BRANCH=${1:-main}

# Verify clean working directory
git status --porcelain
```

**Validation Checks:**

- **Clean Working Directory**: Ensure no uncommitted changes exist
- **Current Branch**: Verify not on target branch
- **Target Branch Exists**: Confirm target branch exists locally or remotely
- **GitHub CLI Auth**: Verify gh is authenticated

**If uncommitted changes exist:**

```bash
echo "Working directory must be clean before creating PR"
echo "Options:"
echo "1. Commit changes: Use /commit command"
echo "2. Stash changes: git stash push -m 'pre-pr stash'"
echo "3. Reset changes: git reset --hard HEAD (DESTRUCTIVE)"
exit 1
```

**If on target branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
    echo "Cannot create PR from target branch '$TARGET_BRANCH' to itself"
    echo "Switch to a feature branch first"
    exit 1
fi
```

**If target branch doesn't exist:**

```bash
git fetch origin
git show-ref --verify --quiet refs/remotes/origin/$TARGET_BRANCH || {
    echo "Target branch '$TARGET_BRANCH' not found on remote"
    git branch -r | grep -E "(main|master|develop|development)"
    echo "Available target branches shown above"
    exit 1
}
```

### Step 2: Commit Analysis and Comparison

```bash
# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Fetch latest changes
git fetch origin

# Get commits that will be included in PR
git log --oneline origin/$TARGET_BRANCH..HEAD

# Get detailed commit information for analysis
git log --format="%h|%s|%b" origin/$TARGET_BRANCH..HEAD
```

**Commit Analysis Process:**

1. **Extract Commits**: Get all commits between target branch and current branch
2. **Parse Commit Messages**: Extract type, scope, and description from each commit
3. **Categorize Changes**: Group commits by type (feat, fix, refactor, docs, etc.)
4. **Identify Primary Change**: Determine the main purpose of the PR

**If no commits to include:**

```bash
COMMIT_COUNT=$(git rev-list --count origin/$TARGET_BRANCH..HEAD)
if [ "$COMMIT_COUNT" -eq 0 ]; then
    echo "No new commits to include in PR"
    echo "Current branch is up to date with $TARGET_BRANCH"
    exit 1
fi
```

### Step 3: PR Title Generation

**Title Generation Logic:**

Based on commit analysis, generate concise, descriptive titles:

- **Single Feature**: `feat: add user authentication system`
- **Single Fix**: `fix: resolve SQL injection vulnerability`
- **Multiple Related**: `feat: enhance text2sql conversion workflow`
- **Mixed Changes**: `refactor: improve database schema and validation`
- **Documentation**: `docs: update API documentation and examples`

**Title Format Rules:**

- Use primary commit type as prefix
- Maximum 50 characters
- Describe the main change or theme
- Use active voice and imperative mood
- Include component/module name when relevant

### Step 4: PR Description Generation

**Description Structure:**

```markdown
## Summary

• [Primary change description with specific components]
• [Secondary change if significantly different]
• [Additional change only if necessary - max 5 total]

## Changes by Type

### Features

- [List feature commits with brief descriptions]

### Bug Fixes

- [List fix commits with brief descriptions]

### Refactoring

- [List refactor commits with brief descriptions]

### Documentation

- [List docs commits with brief descriptions]
```

**Description Generation Rules:**

- **Concise Summary**: 1-3 bullet points covering main changes
- **Categorized Changes**: Group commits by type for clarity
- **Specific Components**: Mention affected modules, files, or services
- **Technology Context**: Reference NestJS, TypeScript, PostgreSQL when relevant
- **No Assignees**: Don't assign reviewers or assignees

### Step 5: PR Creation

```bash
# Generate PR title based on commit analysis
PR_TITLE="[generated title]"

# Create PR using GitHub CLI with HEREDOC for proper formatting
gh pr create --title "$PR_TITLE" --body "$(cat <<'EOF'
## Summary
[Generated summary based on commits]

## Changes by Type
[Categorized changes from commit analysis]
EOF
)"
```

**PR Creation Options:**

- **Title**: Auto-generated from commit analysis
- **Body**: Structured description with summary and categorized changes
- **Target Branch**: Specified target or default main
- **No Reviewers**: Leave reviewer assignment for manual selection
- **Labels**: Let project maintainers add appropriate labels

### Step 6: Post-Creation Verification

```bash
# Get the created PR URL
PR_URL=$(gh pr view --json url --jq '.url')

# Display success information
echo "✅ Pull Request created successfully"
echo "📋 Title: $PR_TITLE"
echo "🎯 Target: $TARGET_BRANCH"
echo "🔗 URL: $PR_URL"

# Show PR status
gh pr view --json number,title,headRefName,baseRefName --jq '"PR #\(.number): \(.title)\nFrom: \(.headRefName)\nTo: \(.baseRefName)"'
```

**Verification Checklist:**

- ✅ PR created successfully on GitHub
- ✅ Title accurately reflects changes
- ✅ Description includes relevant details
- ✅ Target branch is correct
- ✅ All commits included in PR
- ✅ No automatic reviewer assignments

### Step 7: Additional GitHub CLI Integration

**Advanced PR Operations:**

```bash
# View PR in browser (optional)
gh pr view --web

# Check PR status and checks
gh pr checks

# View PR diff
gh pr diff
```

## Commit Message Analysis Patterns

### Pattern Recognition

**Feature Commits:**

- `feat:`, `feature:`, `add:`, `create:`
- Group into "Features" section
- Use for primary PR type if majority

**Bug Fix Commits:**

- `fix:`, `bug:`, `resolve:`, `correct:`
- Group into "Bug Fixes" section
- Highlight security fixes prominently

**Refactoring Commits:**

- `refactor:`, `restructure:`, `reorganize:`, `extract:`
- Group into "Refactoring" section
- Mention performance improvements

**Documentation Commits:**

- `docs:`, `doc:`, `readme:`, `comment:`
- Group into "Documentation" section
- Note API documentation changes

**Configuration Commits:**

- `config:`, `env:`, `setup:`, `deps:`
- Group into "Configuration" section
- Note dependency changes

### Title Generation Examples

**Single Feature PR:**

```
feat: implement text2sql query validation system
```

**Bug Fix PR:**

```
fix: resolve PostgreSQL connection timeout issues
```

**Mixed Changes PR:**

```
refactor: enhance database schema and query validation
```

**Documentation PR:**

```
docs: update API documentation and setup guide
```

## Error Handling and Recovery

### Common Error Scenarios

**Authentication Issues:**

```bash
gh auth status || {
    echo "GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
}
```

**Branch Already Has PR:**

```bash
EXISTING_PR=$(gh pr list --head $CURRENT_BRANCH --json number --jq '.[0].number')
if [ -n "$EXISTING_PR" ]; then
    echo "PR already exists for branch $CURRENT_BRANCH: #$EXISTING_PR"
    echo "View: gh pr view $EXISTING_PR"
    exit 1
fi
```

**Remote Branch Not Pushed:**

```bash
git ls-remote --exit-code --heads origin $CURRENT_BRANCH || {
    echo "Current branch not pushed to remote"
    echo "Push first: git push -u origin $CURRENT_BRANCH"
    exit 1
}
```

### Recovery Options

```bash
# If PR creation fails, show manual commands
echo "PR creation failed. Manual creation commands:"
echo "gh pr create --title \"[manual title]\" --body \"[manual description]\""
echo "Or create via web interface: https://github.com/[repo]/compare/$TARGET_BRANCH...$CURRENT_BRANCH"
```

## Integration with Project Workflow

This PR command integrates seamlessly with the existing development workflow:

- **Commit Command Integration**: Works with commit messages from `/commit` command
- **Rebase Command Compatibility**: Can be used after `/rebase` to create clean PRs
- **NestJS Awareness**: Understands module structure for component-specific descriptions
- **TypeScript Integration**: Recognizes type-related changes and testing needs
- **Database Changes**: Identifies schema/migration changes for thorough validation

**Best Practices:**

1. **Clean Commits**: Use `/commit` command first for clean, analyzable commits
2. **Rebase First**: Consider `/rebase main` before creating PR for linear history
3. **Scope Coverage**: Ensure description covers all significant changes
4. **Component Focus**: Highlight specific modules or services affected
5. **Manual Review**: Always review generated title and description before approval

**DO NOT PUSH** automatically - the command assumes the branch is already pushed or will handle the push as part of PR
creation process.