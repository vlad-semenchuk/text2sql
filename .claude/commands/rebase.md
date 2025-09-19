# Interactive Rebase System

Performs interactive git rebase against a target branch with comprehensive merge conflict resolution guidance.

## Usage

This command takes a target branch name as an argument. Examples:

- Rebase current branch against main: `/rebase main`
- Rebase current branch against develop: `/rebase develop`
- Rebase current branch against feature/base: `/rebase feature/base`

## Instructions:

Perform an intelligent git rebase workflow with conflict detection and resolution:

## Workflow Overview:

1. **Pre-rebase Safety Checks**: Verify repository state and target branch
2. **Rebase Execution**: Start interactive rebase with proper configuration
3. **Conflict Resolution**: Handle merge conflicts systematically
4. **Post-rebase Verification**: Confirm successful completion

### Step 1: Pre-rebase Analysis and Safety Checks

```bash
git status --porcelain
git fetch origin
git branch -r | grep "origin/$TARGET_BRANCH"
git log --oneline HEAD ^origin/$TARGET_BRANCH
```

**Safety Validations:**

- **Clean Working Directory**: Ensure no uncommitted changes exist
- **Target Branch Exists**: Verify the target branch exists locally or remotely
- **Fetch Latest**: Update remote tracking branches
- **Commit History**: Show commits that will be rebased

**If uncommitted changes exist:**

```bash
echo "Working directory must be clean before rebasing"
echo "Options:"
echo "1. Commit changes: git add . && git commit -m 'wip: temporary commit'"
echo "2. Stash changes: git stash push -m 'pre-rebase stash'"
echo "3. Reset changes: git reset --hard HEAD (DESTRUCTIVE)"
exit 1
```

**If target branch doesn't exist locally:**

```bash
git checkout -b $TARGET_BRANCH origin/$TARGET_BRANCH 2>/dev/null || {
    echo "Target branch '$TARGET_BRANCH' not found locally or remotely"
    git branch -a | grep $TARGET_BRANCH
    exit 1
}
git checkout -
```

### Step 2: Start Interactive Rebase

```bash
git rebase -i origin/$TARGET_BRANCH
```

**Rebase Editor Instructions:**

The interactive rebase editor will open showing commits to be rebased. Common operations:

- `pick` (p): Use commit as-is
- `reword` (r): Edit commit message
- `edit` (e): Stop to amend commit
- `squash` (s): Combine with previous commit
- `fixup` (f): Like squash but discard commit message
- `drop` (d): Remove commit entirely

**Save and close the editor to start the rebase process.**

### Step 3: Merge Conflict Resolution

If conflicts occur during rebase, the process will pause. Handle conflicts systematically:

#### 3A: Identify Conflicts

```bash
git status
git diff --name-only --diff-filter=U
```

This shows:

- Current rebase state
- Files with unresolved conflicts (marked with `U`)

#### 3B: Examine Conflict Details

For each conflicted file:

```bash
git diff $CONFLICTED_FILE
```

**Conflict Markers Explanation:**

```
<<<<<<< HEAD (current branch)
Your changes
=======
Changes from target branch
>>>>>>> commit-hash (incoming commit)
```

#### 3C: Resolve Conflicts

**Manual Resolution Process:**

1. **Open each conflicted file** in your editor
2. **Locate conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)
3. **Choose the correct content:**
    - Keep current branch changes (above `=======`)
    - Keep target branch changes (below `=======`)
    - Combine both changes intelligently
    - Write entirely new solution
4. **Remove all conflict markers** completely
5. **Test the resolution** if possible

**Common Conflict Resolution Strategies:**

- **Import conflicts**: Merge import lists, remove duplicates
- **Function conflicts**: Keep the most recent implementation or combine logic
- **Configuration conflicts**: Prefer newer configuration or merge settings
- **Documentation conflicts**: Combine documentation improvements

#### 3D: Stage Resolved Files

```bash
git add $RESOLVED_FILE
# Or stage all resolved files:
git add .
```

#### 3E: Continue Rebase

```bash
git rebase --continue
```

**If additional conflicts occur, repeat steps 3A-3E.**

### Step 4: Alternative Rebase Actions

If rebase becomes too complex or you need to abort:

#### Abort Rebase

```bash
git rebase --abort
```

This returns to the original state before rebase started.

#### Skip Problematic Commit

```bash
git rebase --skip
```

Skip the current commit that's causing conflicts (use carefully).

#### Edit Current Commit

If rebase stops for editing:

```bash
# Make your changes
git add .
git rebase --continue
```

### Step 5: Post-rebase Verification

After successful rebase completion:

```bash
git status
git log --oneline -10
git log --graph --oneline HEAD ^origin/$TARGET_BRANCH
```

**Verification Checklist:**

- ✅ Working directory is clean
- ✅ All commits successfully rebased
- ✅ Commit history is linear and clean
- ✅ No merge commits in the rebased range
- ✅ All conflicts resolved properly

### Step 6: Force Push (if needed)

**ONLY if rebasing a previously pushed branch:**

```bash
git push --force-with-lease origin $(git branch --show-current)
```

**⚠️ WARNING**: Force pushing rewrites history. Only do this on:

- Feature branches you own
- Branches not shared with other developers
- Never force push to main/develop/master branches

## Advanced Conflict Resolution Techniques

### Large-scale Conflicts

For complex conflicts affecting many files:

```bash
# See all conflicted files
git diff --name-only --diff-filter=U

# Use merge tool for complex conflicts
git mergetool $CONFLICTED_FILE

# Set up a merge tool (one-time setup)
git config merge.tool vimdiff  # or code, meld, etc.
```

### Conflict Resolution Tools

**Command Line Tools:**

```bash
# View three-way diff
git show :1:$FILE  # common ancestor
git show :2:$FILE  # current branch (HEAD)
git show :3:$FILE  # incoming branch

# Use vimdiff for side-by-side comparison
vimdiff $FILE
```

## Common Rebase Scenarios

### Scenario 1: Simple Fast-forward

No conflicts, commits are replayed cleanly on target branch.

### Scenario 2: Content Conflicts

Files modified in both branches require manual resolution.

### Scenario 3: Structural Conflicts

Files moved/renamed/deleted in different ways between branches.

### Scenario 4: Complex History

Multiple commits with interdependent changes requiring careful resolution.

## Error Recovery

### Recovering from Failed Rebase

If rebase fails catastrophically:

```bash
# Find the original HEAD before rebase
git reflog
# Look for entry like: "rebase: checkout origin/main"

# Reset to original state
git reset --hard HEAD@{n}  # where n is the reflog entry number
```

### Backup Strategy

Before complex rebases:

```bash
# Create backup branch
git branch backup-$(date +%Y%m%d-%H%M%S)

# Or create a tag
git tag backup-rebase-$(date +%Y%m%d-%H%M%S)
```

## Best Practices

1. **Always fetch first**: `git fetch origin` before rebasing
2. **Clean working directory**: Commit or stash changes before rebasing
3. **Small, focused commits**: Easier to rebase and resolve conflicts
4. **Test after rebase**: Run tests to ensure functionality is preserved
5. **Communicate with team**: Coordinate when rebasing shared branches
6. **Use descriptive commit messages**: Helps during conflict resolution
7. **Create backups**: For complex rebases, create backup branches

## Integration with Project

This rebase command integrates with the project's development workflow:

- **Compatible with NestJS structure**: Understands module-based conflicts
- **TypeScript awareness**: Handles import/export conflicts intelligently
- **Test integration**: Runs project-specific test commands after rebase
- **Lint integration**: Validates code style after conflict resolution

**DO NOT PUSH** automatically - let the user decide when to push rebased changes.