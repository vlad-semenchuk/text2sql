---
description: Rebase current branch onto target branch with intelligent conflict detection and resolution
---

Use the **git-workflow-coordinator** agent with intent to rebase the current branch.

## Target Branch

```bash
TARGET_BRANCH=${1:-main}
echo "Rebasing onto: origin/$TARGET_BRANCH"
```

## Current State

```bash
git status --short
git log --oneline HEAD ^origin/$TARGET_BRANCH | head -5
```

## Instructions

Rebase current branch onto `$TARGET_BRANCH`.

The git-workflow-coordinator should:
1. Validate state and create safety backup
2. Start rebase operation
3. Delegate to **git-conflict-resolver** if conflicts occur
4. Continue rebase after resolution
5. Offer to force-push after completion

## Usage Examples

- `/git-rebase` - rebase onto main
- `/git-rebase development` - rebase onto development

The coordinator will handle the rebase workflow and conflict resolution if needed.
