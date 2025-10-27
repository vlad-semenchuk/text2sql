---
description: Create pull request from current branch with auto-generated title and description based on commit analysis
---

Use the **git-workflow-coordinator** agent with intent to create a pull request.

## Target Branch

```bash
TARGET_BRANCH=${1:-main}
echo "Creating PR to: $TARGET_BRANCH"
```

## Current State

```bash
git status --short
git log --oneline origin/$TARGET_BRANCH..HEAD
```

## Instructions

Create pull request to `$TARGET_BRANCH`.

The git-workflow-coordinator should:
1. Validate working directory is clean
2. Check branch exists on remote (push if needed)
3. Delegate to **git-pr-specialist** to analyze commits
4. Generate PR title and description
5. Create PR via GitHub CLI

## Usage Examples

- `/git-pr` - create PR to main
- `/git-pr development` - create PR to development

The coordinator will handle the complete PR creation workflow.
