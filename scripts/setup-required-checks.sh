#!/bin/bash
# Setup required status checks for branch protection on main branch
# This script adds the CI workflow as a required check before merging

set -e

echo "🔒 Setting up required status checks for branch protection..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Check current branch protection
echo "📋 Current branch protection settings:"
gh api repos/$REPO/branches/main/protection --jq '.required_status_checks // "No required status checks configured"'
echo ""

# Update branch protection to add required status checks
echo "⚙️  Adding CI workflow as required status check..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$REPO/branches/main/protection \
  --input - <<'EOF' > /dev/null
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {
        "context": "ci"
      }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "require_code_owner_reviews": true,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Successfully configured required status checks!"
    echo ""
    echo "📝 Configuration:"
    echo "   • Required check: ci (from CI workflow)"
    echo "   • Strict mode: enabled (branches must be up-to-date)"
    echo ""
    echo "🔐 This means:"
    echo "   • All PRs must pass the CI workflow before merging"
    echo "   • Branches must be up-to-date with main before merging"
    echo "   • CI includes: lint, format check, build, and tests"
    echo ""
    echo "✨ Branch protection is now enforcing tests!"
else
    echo "❌ Failed to configure required status checks"
    echo "Make sure you have admin access to the repository"
    exit 1
fi
