---
description: Smart git workflow orchestrator - handles review, commit, push, and PR based on context
---

Use the **git-workflow-coordinator** agent to analyze the current git state and execute the appropriate workflow.

## Current State

Check the git status:

```bash
git status
```

Check the current branch:

```bash
git branch --show-current
```

Recent commits:

```bash
git log --oneline -5
```

## Instructions for git-workflow-coordinator

Understand the user's intent and guide them through the appropriate workflow:

- **Feature complete** → Review → Commit → Push → PR
- **Quick commit** → Commit → Offer push/PR
- **Rebase** → Handle conflicts if needed → Offer force push
- **Create PR** → Validate → Generate content → Create

The coordinator will analyze the state and delegate to appropriate specialist agents (git-commit-specialist, git-pr-specialist, git-conflict-resolver, pragmatic-code-reviewer) as needed.
