---
description: Complete push workflow - review, commit, push, and create/update PR automatically
---

Use the **git-workflow-coordinator** agent with intent to push changes and manage PR.

## Target Branch

```bash
TARGET_BRANCH=${1:-main}
echo "Target: $TARGET_BRANCH"
```

## Current State

```bash
git status --short
git branch --show-current
```

## Instructions

Push changes and manage PR automatically to `$TARGET_BRANCH`.

The git-workflow-coordinator should:
1. Review and commit uncommitted changes
2. Offer rebase if branch is behind
3. Push to remote
4. Delegate to **git-pr-specialist** (auto creates/updates PR)

## Usage Examples

- `/git-push` - complete push workflow to main
- `/git-push development` - push workflow to development branch

The coordinator will handle the complete push and PR workflow.
