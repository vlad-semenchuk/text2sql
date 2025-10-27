---
description: Analyze changes and create atomic, searchable commits with conventional commit messages
---

Use the **git-workflow-coordinator** agent with intent to create commits.

## Current State

```bash
git status --short
```

## Instructions

Create commits from current changes.

The git-workflow-coordinator should:
1. Delegate to **git-commit-specialist** for commit creation
2. Offer to push after commits are created
3. Suggest creating PR if branch is ready

The coordinator will analyze the changes and route to the appropriate specialist agent.
