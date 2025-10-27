# Shared Error Handling Contract

This document defines the standard error handling contract for all git specialist agents.

## Exit Status Communication

**Usage Context**: These patterns are for **TERMINAL OUTPUT ONLY** (user-facing feedback).

**NEVER use emojis in:**
- Commit messages or bodies
- Git logs
- API responses
- Source code files

### Success Pattern

```
✅ [Action completed]

[Summary of what was done]
[Details: files, commits, branches affected]

Next: [Suggested next steps]
```

### Failure Pattern

```
❌ [Action failed]: [Reason]

Cause: [What went wrong]
Impact: [Current repository/operation state]

Solutions:
1. [Option 1]
2. [Option 2]

Current state: [Where things stand now]
```

### Partial Success Pattern

```
⚠️  [Action partially completed]

Progress:
• [Step 1] ✅
• [Step 2] ❌ [Why it failed]

[Additional context]

Solutions:
1. [Option 1]
2. [Option 2]

Current state: [Safe state description]
```

### Info Pattern (Not an error)

```
ℹ️  [Information message]

[Context and details]

Next steps:
• [Action 1]
• [Action 2]
```

## Error Categories Framework

Agents should categorize errors into these types:

### Validation Errors (Pre-flight checks)
Caught before any action is taken. Always safe to exit.

**Examples:**
- No changes to commit
- Working directory not clean
- Invalid input parameters
- Required conditions not met

### Execution Errors (During action)
Errors that occur while performing the operation.

**Examples:**
- Git command failed
- Permission denied
- Network errors
- API failures

### State Errors (Repository state)
Issues with the current git repository state.

**Examples:**
- Repository not initialized
- Not on a branch
- Rebase/merge in progress
- Detached HEAD state

### GitHub/Remote Errors (External services)
Issues with GitHub API or remote operations.

**Examples:**
- Authentication failed
- Rate limit exceeded
- Repository not found
- Insufficient permissions

## Error Propagation Rules

1. **Validation failures** → Exit immediately with ❌, explain cause, provide solutions
2. **Execution failures** → Show git/command error + interpretation + recovery steps
3. **State errors** → Explain current state + safe actions + how to reach valid state
4. **Never leave repo broken** → If operation starts, either complete or clean rollback
5. **Preserve progress** → When partial completion occurs, clearly document what succeeded

## Communication Rules

### Always Include:
- Status indicator: ✅ ❌ ⚠️ ℹ️
- Clear cause of success/failure
- Impact on repository/operation state
- Actionable solutions (not vague suggestions)
- Current state description

### Never:
- Leave user guessing what happened
- Use technical jargon without explanation
- Provide solutions without context
- Skip the "Current state" section
- Hide partial progress

## Example Templates

### Validation Failure Example

```
❌ [Operation] failed: [Validation issue]

Cause: [Why validation failed]
Impact: No changes made to repository

[Context: show relevant files/state if helpful]

Solutions:
1. [Most common fix]
2. [Alternative approach]
3. [Manual command if needed]

Current state: [Repository is safe/unchanged]
```

### Execution Failure Example

```
❌ [Operation] failed: [Command/action error]

Cause: [command] returned exit code [N]
Impact: [What partial state exists, if any]

Git/Command error: "[actual error message]"

Solutions:
1. [Fix for most likely cause]
2. [Alternative fix]
3. [Abort/rollback option if applicable]

Current state: [Describe exact state for recovery]
```

### State Error Example

```
❌ [Operation] failed: [State issue]

Cause: Repository is in [state]
Impact: Cannot perform [operation] in this state

Solutions:
1. [How to complete current operation]
2. [How to abort and return to normal]
3. [Check state command]

Current state: [Describe state and how to inspect it]
```

## Agent-Specific Extensions

Each agent should:

1. **Include this contract** by referencing this file
2. **Define specific error categories** relevant to their operations
3. **Provide concrete examples** with actual file paths, commands, and error messages
4. **Document recovery procedures** specific to their workflows

## Usage in Agent Files

In your agent file, reference this contract:

```markdown
## Error Handling Contract

This agent follows the [git-error-handler](file://.claude/agents/git-error-handler.md) contract.

### Agent-Specific Error Categories

[Define categories specific to this agent's operations]

### Agent-Specific Examples

[Provide concrete examples for this agent's error scenarios]
```

## Best Practices

1. **Fail fast on validation** - Don't start operations that will likely fail
2. **Show progress** - For multi-step operations, show what completed
3. **Be specific** - Use actual file names, command output, error codes
4. **Provide commands** - Give exact git/gh commands for recovery
5. **Maintain safety** - Always ensure user can recover or rollback
6. **Test error paths** - Verify error messages are actually helpful

## Error Message Checklist

Before returning an error, verify it includes:

- [ ] Status indicator (✅ ❌ ⚠️ ℹ️)
- [ ] Clear problem statement
- [ ] Root cause explanation
- [ ] Impact on current state
- [ ] 2-3 actionable solutions
- [ ] Current state description
- [ ] Next steps or commands to run

Remember: Error messages are part of the user experience. Make them helpful, actionable, and respectful of the user's time.