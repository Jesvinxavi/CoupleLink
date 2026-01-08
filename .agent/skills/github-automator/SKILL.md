---
name: github-automator
description: Use when interactions with GitHub are required. Can create repos, manage issues, and create pull requests using the `gh` CLI.
---

# GitHub Automator Skill

Automate GitHub interactions using the `gh` CLI.

## Capabilities

### 1. Repository Creation
Create a new public/private repository and push local code.

**Validation (Before Create):**
```bash
gh repo view <owner>/<repo> >/dev/null 2>&1 && echo "Repo exists" || echo "Repo does not exist"
```

**Creation:**
```bash
gh repo create <name> --public --source=. --remote=origin --push
```

### 2. Issue Management
Create issues for bugs or features.
```bash
gh issue create --title "Bug: Login fails" --body "Details..."
```

### 3. Pull Requests
Create PRs for review.
```bash
gh pr create --title "feat: add login" --body "Closes #123"
```

### 4. Branch Protection (Elite)
Enforce PR reviews and status checks on main.

```bash
gh api -X PUT "repos/:owner/:repo/branches/main/protection" \
    -f required_status_checks.strict=true \
    -f required_status_checks.contexts[]="build" \
    -f enforce_admins=true \
    -f required_pull_request_reviews.dismiss_stale_reviews=true \
    -f required_pull_request_reviews.require_code_owner_reviews=true \
    -f required_pull_request_reviews.required_approving_review_count=1
```

## Prerequisites
- `gh` CLI must be installed.
- User must be authenticated (`gh auth login`).

## Verification
- [ ] Check `gh auth status` before running commands.
- [ ] Handle failures gracefully (e.g., repo already exists).
