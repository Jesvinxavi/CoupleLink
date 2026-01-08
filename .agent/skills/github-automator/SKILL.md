---
name: github-automator
description: Use when interactions with GitHub are required. Can create repos, manage issues, and create pull requests using the `gh` CLI.
---

# GitHub Automator Skill

Automate GitHub interactions using the `gh` CLI.

## Capabilities

### 1. Repository Creation
Create a new public/private repository and push local code.
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

## Prerequisites
- `gh` CLI must be installed.
- User must be authenticated (`gh auth login`).

## Verification
- [ ] Check `gh auth status` before running commands.
- [ ] Handle failures gracefully (e.g., repo already exists).
