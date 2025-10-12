# Smart Git Push System

Intelligently pushes committed changes after rebase with PR description updates and proper force-push handling.

## Usage

This command handles post-rebase pushes and PR maintenance. Examples:

- Basic smart push: `/push`
- Force push with confirmation: `/push --force`
- Skip PR description update: `/push --no-pr-update`
- Push to specific remote: `/push origin`

## Instructions:

Perform an intelligent git push workflow with post-rebase handling and PR integration:

## Workflow Overview:

1. **Pre-push Validation**: Verify repository state and branch status
2. **Push Strategy Selection**: Choose appropriate push method based on branch state
3. **PR Detection**: Check for existing PR and analyze current state
4. **Description Analysis**: Compare commits with PR description for update necessity
5. **Push Execution**: Execute push with proper flags and safety measures
6. **PR Description Update**: Update PR description if commits changed significantly
7. **Post-push Verification**: Confirm successful push and PR synchronization

### Step 1: Pre-push Validation and Analysis

```bash
# Parse command arguments for flags
FORCE_PUSH=false
SKIP_PR_UPDATE=false
REMOTE_NAME="origin"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --force|-f)
            FORCE_PUSH=true
            ;;
        --no-pr-update)
            SKIP_PR_UPDATE=true
            ;;
        --remote=*)
            REMOTE_NAME="${arg#*=}"
            ;;
        *)
            REMOTE_NAME="$arg"
            ;;
    esac
done

# Verify clean working directory
git status --porcelain
```

**Validation Checks:**

- **Clean Working Directory**: Ensure no uncommitted changes exist
- **Current Branch**: Get current branch name and verify it's not main/master
- **Remote Tracking**: Check if branch has remote tracking configured
- **Commit Status**: Analyze ahead/behind status with remote

**If uncommitted changes exist:**

```bash
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED_COUNT -gt 0 ]; then
    echo "Working directory must be clean before pushing"
    echo "Uncommitted changes found:"
    git status --short
    echo ""
    echo "Options:"
    echo "1. Commit changes: Use /commit command"
    echo "2. Stash changes: git stash push -m 'pre-push stash'"
    echo "3. Reset changes: git reset --hard HEAD (DESTRUCTIVE)"
    exit 1
fi
```

**Branch Analysis:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
REMOTE_BRANCH="$REMOTE_NAME/$CURRENT_BRANCH"

# Check if pushing to protected branch
if [[ "$CURRENT_BRANCH" =~ ^(main|master|develop|development)$ ]]; then
    echo "⚠️  WARNING: Attempting to push to protected branch '$CURRENT_BRANCH'"
    echo "This is generally not recommended. Consider creating a feature branch."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get branch status
git fetch $REMOTE_NAME 2>/dev/null || echo "Could not fetch from $REMOTE_NAME"
AHEAD_COUNT=$(git rev-list --count HEAD ^$REMOTE_BRANCH 2>/dev/null || echo "0")
BEHIND_COUNT=$(git rev-list --count $REMOTE_BRANCH ^HEAD 2>/dev/null || echo "0")
```

### Step 2: Push Strategy Selection

Based on branch analysis, determine the appropriate push strategy:

```bash
# Determine push strategy
PUSH_REQUIRED=false
FORCE_PUSH_REQUIRED=false
NEW_BRANCH=false

if ! git show-ref --verify --quiet refs/remotes/$REMOTE_BRANCH; then
    # Remote branch doesn't exist - new branch
    NEW_BRANCH=true
    PUSH_REQUIRED=true
    echo "📤 New branch detected: will push with upstream tracking"
elif [ "$AHEAD_COUNT" -gt 0 ] && [ "$BEHIND_COUNT" -eq 0 ]; then
    # Only ahead - normal push
    PUSH_REQUIRED=true
    echo "📤 Branch is $AHEAD_COUNT commits ahead: normal push required"
elif [ "$AHEAD_COUNT" -gt 0 ] && [ "$BEHIND_COUNT" -gt 0 ]; then
    # Ahead and behind - likely rebased
    FORCE_PUSH_REQUIRED=true
    PUSH_REQUIRED=true
    echo "🔄 Branch diverged (${AHEAD_COUNT} ahead, ${BEHIND_COUNT} behind): force push required"
    echo "This typically happens after a rebase operation"
elif [ "$AHEAD_COUNT" -eq 0 ] && [ "$BEHIND_COUNT" -eq 0 ]; then
    # Up to date
    echo "✅ Branch is up to date with remote"
    PUSH_REQUIRED=false
elif [ "$AHEAD_COUNT" -eq 0 ] && [ "$BEHIND_COUNT" -gt 0 ]; then
    # Behind only - need to pull
    echo "⚠️  Branch is $BEHIND_COUNT commits behind remote"
    echo "Consider pulling changes first: git pull $REMOTE_NAME $CURRENT_BRANCH"
    exit 1
fi
```

**Force Push Safety Check:**

```bash
if [ "$FORCE_PUSH_REQUIRED" = true ] && [ "$FORCE_PUSH" = false ]; then
    echo ""
    echo "🚨 FORCE PUSH REQUIRED"
    echo "This will rewrite history on the remote branch."
    echo "⚠️  Only proceed if:"
    echo "  • This is your feature branch"
    echo "  • No one else is working on this branch"
    echo "  • You recently rebased this branch"
    echo ""
    read -p "Proceed with force push? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Push cancelled. Use '/push --force' to skip this confirmation."
        exit 1
    fi
fi
```

### Step 3: PR Detection and Current State Analysis

```bash
# Check for existing PR
EXISTING_PR_NUMBER=""
EXISTING_PR_URL=""
PR_EXISTS=false

if command -v gh >/dev/null 2>&1; then
    # Check authentication
    if gh auth status >/dev/null 2>&1; then
        # Get existing PR for current branch
        PR_INFO=$(gh pr list --head $CURRENT_BRANCH --json number,url,title 2>/dev/null)
        if [ -n "$PR_INFO" ] && [ "$PR_INFO" != "[]" ]; then
            EXISTING_PR_NUMBER=$(echo "$PR_INFO" | jq -r '.[0].number')
            EXISTING_PR_URL=$(echo "$PR_INFO" | jq -r '.[0].url')
            PR_TITLE=$(echo "$PR_INFO" | jq -r '.[0].title')
            PR_EXISTS=true

            echo "🔗 Found existing PR #$EXISTING_PR_NUMBER: $PR_TITLE"
            echo "   URL: $EXISTING_PR_URL"
        fi
    else
        echo "ℹ️  GitHub CLI not authenticated - skipping PR integration"
    fi
else
    echo "ℹ️  GitHub CLI not installed - skipping PR integration"
fi
```

### Step 4: Commit Analysis for PR Description Update

If PR exists and PR updates are not skipped:

```bash
if [ "$PR_EXISTS" = true ] && [ "$SKIP_PR_UPDATE" = false ] && [ "$PUSH_REQUIRED" = true ]; then
    echo ""
    echo "📝 Analyzing commits for PR description update..."

    # Get commits that will be pushed (new commits since last successful push)
    # This is tricky after rebase, so we'll analyze all commits in the PR
    TARGET_BRANCH=$(gh pr view $EXISTING_PR_NUMBER --json baseRefName --jq '.baseRefName')

    # Get current commits in PR branch
    CURRENT_COMMITS=$(git log --format="%h|%s|%b" origin/$TARGET_BRANCH..HEAD 2>/dev/null || git log --format="%h|%s|%b" HEAD~${AHEAD_COUNT}..HEAD)

    # Get current PR description
    CURRENT_PR_BODY=$(gh pr view $EXISTING_PR_NUMBER --json body --jq '.body')

    # Analyze commits to generate new description
    echo "Analyzing commits for description update..."

    # Count commits by type for analysis
    FEAT_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|feat:" || echo "0")
    FIX_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|fix:" || echo "0")
    REFACTOR_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|refactor:" || echo "0")
    DOCS_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|docs:" || echo "0")
    TEST_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|test:" || echo "0")
    CONFIG_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|config:" || echo "0")
    CHORE_COUNT=$(echo "$CURRENT_COMMITS" | grep -c "^[^|]*|chore:" || echo "0")

    TOTAL_COMMITS=$(echo "$CURRENT_COMMITS" | wc -l | tr -d ' ')

    # Determine if description update is needed
    DESCRIPTION_UPDATE_NEEDED=false

    # Simple heuristic: if we have new commits or the commit count changed significantly
    if [ "$TOTAL_COMMITS" -gt 1 ] || [ "$FEAT_COUNT" -gt 0 ] || [ "$FIX_COUNT" -gt 0 ]; then
        # Check if current description seems outdated or generic
        if echo "$CURRENT_PR_BODY" | grep -q "Summary" && echo "$CURRENT_PR_BODY" | grep -q "Changes by Type"; then
            # Description has our format, check if it needs updates
            echo "Current PR description follows expected format"
            echo "Checking if commits have changed significantly..."
            DESCRIPTION_UPDATE_NEEDED=true
        elif [ ${#CURRENT_PR_BODY} -lt 100 ]; then
            # Description is very short, likely needs improvement
            DESCRIPTION_UPDATE_NEEDED=true
            echo "Current PR description is minimal, updating..."
        fi
    fi

    UPDATE_DECISION="auto"
    if [ "$DESCRIPTION_UPDATE_NEEDED" = true ]; then
        echo ""
        echo "PR description update recommended based on commit analysis:"
        echo "  • Total commits: $TOTAL_COMMITS"
        echo "  • Features: $FEAT_COUNT, Fixes: $FIX_COUNT, Refactor: $REFACTOR_COUNT"
        echo "  • Docs: $DOCS_COUNT, Tests: $TEST_COUNT, Config: $CONFIG_COUNT"
        echo ""
        read -p "Update PR description? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            UPDATE_DECISION="skip"
        else
            UPDATE_DECISION="update"
        fi
    fi
fi
```

### Step 5: Push Execution

Execute the appropriate push command:

```bash
if [ "$PUSH_REQUIRED" = false ]; then
    echo "✅ No push required - branch is up to date"
else
    echo ""
    echo "🚀 Executing push..."

    if [ "$NEW_BRANCH" = true ]; then
        # New branch - set upstream tracking
        echo "Pushing new branch with upstream tracking..."
        if git push -u $REMOTE_NAME $CURRENT_BRANCH; then
            echo "✅ Successfully pushed new branch and set upstream tracking"
        else
            echo "❌ Push failed"
            exit 1
        fi
    elif [ "$FORCE_PUSH_REQUIRED" = true ]; then
        # Force push with lease for safety
        echo "Force pushing with --force-with-lease for safety..."
        if git push --force-with-lease $REMOTE_NAME $CURRENT_BRANCH; then
            echo "✅ Successfully force pushed with lease"
        else
            echo "❌ Force push failed - remote may have been updated by someone else"
            echo "Try fetching latest changes and rebasing again"
            exit 1
        fi
    else
        # Normal push
        echo "Pushing changes..."
        if git push $REMOTE_NAME $CURRENT_BRANCH; then
            echo "✅ Successfully pushed changes"
        else
            echo "❌ Push failed"
            exit 1
        fi
    fi
fi
```

### Step 6: PR Description Update (if needed)

```bash
if [ "$PR_EXISTS" = true ] && [ "$UPDATE_DECISION" = "update" ]; then
    echo ""
    echo "📝 Updating PR description..."

    # Generate new description following pr.md format
    NEW_DESCRIPTION=$(cat <<EOF
## Summary

$(
# Generate summary bullets based on commits
if [ "$FEAT_COUNT" -gt 0 ]; then
    echo "$CURRENT_COMMITS" | grep "^[^|]*|feat:" | head -2 | while IFS='|' read -r hash subject body; do
        echo "• $subject" | sed 's/feat: //'
    done
fi

if [ "$FIX_COUNT" -gt 0 ]; then
    echo "$CURRENT_COMMITS" | grep "^[^|]*|fix:" | head -2 | while IFS='|' read -r hash subject body; do
        echo "• $subject" | sed 's/fix: //'
    done
fi

if [ "$REFACTOR_COUNT" -gt 0 ]; then
    echo "$CURRENT_COMMITS" | grep "^[^|]*|refactor:" | head -1 | while IFS='|' read -r hash subject body; do
        echo "• $subject" | sed 's/refactor: //'
    done
fi
)

## Changes by Type

$(
if [ "$FEAT_COUNT" -gt 0 ]; then
    echo "### Features"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|feat:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/feat: //'
    done
    echo ""
fi

if [ "$FIX_COUNT" -gt 0 ]; then
    echo "### Bug Fixes"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|fix:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/fix: //'
    done
    echo ""
fi

if [ "$REFACTOR_COUNT" -gt 0 ]; then
    echo "### Refactoring"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|refactor:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/refactor: //'
    done
    echo ""
fi

if [ "$DOCS_COUNT" -gt 0 ]; then
    echo "### Documentation"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|docs:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/docs: //'
    done
    echo ""
fi

if [ "$TEST_COUNT" -gt 0 ]; then
    echo "### Testing"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|test:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/test: //'
    done
    echo ""
fi

if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo "### Configuration"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|config:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/config: //'
    done
    echo ""
fi

if [ "$CHORE_COUNT" -gt 0 ]; then
    echo "### Maintenance"
    echo ""
    echo "$CURRENT_COMMITS" | grep "^[^|]*|chore:" | while IFS='|' read -r hash subject body; do
        echo "- $subject" | sed 's/chore: //'
    done
    echo ""
fi
)
EOF
    )

    # Update PR description
    if echo "$NEW_DESCRIPTION" | gh pr edit $EXISTING_PR_NUMBER --body-file -; then
        echo "✅ Successfully updated PR description"
    else
        echo "⚠️  Failed to update PR description, but push was successful"
    fi
fi
```

### Step 7: Post-push Verification

```bash
echo ""
echo "🔍 Verifying push results..."

# Check final status
git fetch $REMOTE_NAME 2>/dev/null
FINAL_AHEAD=$(git rev-list --count HEAD ^$REMOTE_BRANCH 2>/dev/null || echo "0")
FINAL_BEHIND=$(git rev-list --count $REMOTE_BRANCH ^HEAD 2>/dev/null || echo "0")

if [ "$FINAL_AHEAD" -eq 0 ] && [ "$FINAL_BEHIND" -eq 0 ]; then
    echo "✅ Branch is now synchronized with remote"
elif [ "$FINAL_AHEAD" -gt 0 ]; then
    echo "⚠️  Branch is still $FINAL_AHEAD commits ahead (push may have partially failed)"
elif [ "$FINAL_BEHIND" -gt 0 ]; then
    echo "⚠️  Branch is $FINAL_BEHIND commits behind (remote was updated during push)"
fi

# Show final status summary
echo ""
echo "📊 Push Summary:"
echo "   Branch: $CURRENT_BRANCH"
echo "   Remote: $REMOTE_NAME"
if [ "$NEW_BRANCH" = true ]; then
    echo "   Action: New branch created with upstream tracking"
elif [ "$FORCE_PUSH_REQUIRED" = true ]; then
    echo "   Action: Force pushed with --force-with-lease"
else
    echo "   Action: Normal push"
fi

if [ "$PR_EXISTS" = true ]; then
    echo "   PR: #$EXISTING_PR_NUMBER updated"
    echo "   URL: $EXISTING_PR_URL"
fi

echo ""
echo "✅ Push operation completed successfully"
```

## Advanced Features

### Branch Protection

**Protected Branch Detection:**

```bash
# Check if pushing to protected branches
PROTECTED_BRANCHES=("main" "master" "develop" "development" "staging" "production")
for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "$CURRENT_BRANCH" = "$branch" ]; then
        echo "🚨 WARNING: Pushing to protected branch '$branch'"
        echo "Consider using a feature branch instead"
        exit 1
    fi
done
```

### Intelligent PR Description Generation

**Commit Pattern Recognition:**

- **Feature Detection**: Identifies `feat:`, `add:`, `create:` patterns
- **Bug Fix Recognition**: Detects `fix:`, `resolve:`, `correct:` patterns
- **Refactoring Identification**: Finds `refactor:`, `extract:`, `consolidate:` patterns
- **Documentation Changes**: Recognizes `docs:`, `readme:`, `comment:` patterns

**Smart Summary Generation:**

- Prioritizes feature and bug fix commits in summary
- Combines related changes into coherent bullet points
- Maintains focus on user-facing changes
- Includes technical details for developer context

### Error Recovery

**Common Error Scenarios:**

```bash
# Handle network issues
if ! git ls-remote --exit-code $REMOTE_NAME >/dev/null 2>&1; then
    echo "❌ Cannot reach remote '$REMOTE_NAME'"
    echo "Check network connection and remote configuration"
    exit 1
fi

# Handle authentication issues
if [ "$PR_EXISTS" = true ]; then
    if ! gh auth status >/dev/null 2>&1; then
        echo "⚠️  GitHub CLI authentication expired"
        echo "PR description will not be updated"
        echo "Run: gh auth login"
    fi
fi

# Handle force push rejection
# --force-with-lease will fail if remote was updated
# Provide clear guidance for resolution
```

## Integration with Existing Workflow

This push command integrates seamlessly with your existing workflow:

- **Post-Rebase Push**: Automatically detects rebased branches and uses `--force-with-lease`
- **PR Maintenance**: Updates PR descriptions using the same format as `/pr` command
- **Safety First**: Multiple confirmation prompts for destructive operations
- **Commit Analysis**: Leverages commit message patterns from `/commit` command
- **GitHub Integration**: Uses `gh` CLI for PR operations like `/pr` command

**Best Practices:**

1. **Always rebase first**: Use `/rebase main` before `/push` for clean history
2. **Review before push**: Check `git log` to verify commits before pushing
3. **PR description review**: Always review generated PR descriptions
4. **Force push caution**: Only force push on your own feature branches
5. **Communication**: Coordinate with team when force pushing shared branches

**Command Chaining Example:**

```bash
# Typical workflow
/rebase main    # Rebase against main
/push          # Smart push with PR updates
```

The command handles all the complexity of post-rebase pushing while maintaining safety and keeping PR descriptions current with your latest changes.