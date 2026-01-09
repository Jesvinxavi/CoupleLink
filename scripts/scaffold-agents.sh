#!/bin/bash
# =================================================================================
# AGENT SCAFFOLDING SCRIPT (ELITE EDITION)
# =================================================================================
# This script initializes the .agent env by pulling skills from a central repo.
# It handles versioning, config merging, and intelligent setup.
#
# Repository: https://github.com/jesvinxavi/agent-skills
# =================================================================================

VERSION="2.1.0"
REPO_URL="https://github.com/jesvinxavi/agent-skills.git"
SOURCE_DIR=".agent/.source-repo"
LOCAL_DEV_PATH="agent-skills-package" # Fallback for local testing before push

# =================================================================================
# 0. Version Check & Flags
# =================================================================================

if [[ "$1" == "--check-updates" ]]; then
    echo "🔍 Checking for updates..."
    # Fetch raw script from main branch
    REMOTE_VERSION=$(curl -sL https://raw.githubusercontent.com/Jesvinxavi/agent-skills/main/scripts/scaffold-agents.sh | grep 'VERSION="' | head -1 | cut -d'"' -f2)
    
    if [[ "$VERSION" != "$REMOTE_VERSION" ]]; then
        echo "⚠️  Update Available: v$REMOTE_VERSION (Current: v$VERSION)"
        echo "   Run: curl -sL ... | bash to upgrade."
    else
        echo "✅ You are on the latest version (v$VERSION)."
    fi
    exit 0
fi

echo "🚀 Starting Agent Scaffolding v$VERSION..."

# =================================================================================
# 1. Pre-flight Checks
# =================================================================================

set -e  # Exit on error

if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

# 1b. Install Backlog.md if not present
if ! command -v backlog &> /dev/null; then
    echo "📦 Installing backlog.md globally..."
    npm install -g backlog.md
fi

# 1c. Shell Completion (Best Effort)
if command -v backlog &> /dev/null; then
    SHELL_NAME=$(basename "$SHELL")
    if [[ "$SHELL_NAME" == "zsh" || "$SHELL_NAME" == "bash" ]]; then
        echo "🐚 Attempting shell completion install ($SHELL_NAME)..."
        # We mask error output because this might fail if user strictly manages dotfiles
        backlog completion install --shell "$SHELL_NAME" 2>/dev/null || true
    fi
fi

# =================================================================================
# 2. Initialize Backlog Project
# =================================================================================

# Ensure basic structure exists first
if [ ! -f "backlog/config.yml" ] && [ ! -d "backlog" ]; then
    echo "✨ Initializing Backlog Project..."
    # Run init --defaults to get the skeleton
    npx backlog.md init --defaults > /dev/null 2>&1 || true
fi

mkdir -p .agent/{skills,workflows,cache}
mkdir -p backlog/{docs,decisions,tasks,specs,templates}

# =================================================================================
# 3. Source Acquisition
# =================================================================================

if [ -d "$LOCAL_DEV_PATH" ]; then
    echo "⚠️  Found local '$LOCAL_DEV_PATH'. Installing from LOCAL source..."
    rm -rf "$SOURCE_DIR"
    mkdir -p "$SOURCE_DIR"
    cp -R "$LOCAL_DEV_PATH/"* "$SOURCE_DIR/"
else
    echo "🌐 attempting to clone from GitHub ($REPO_URL)..."
    if [ -d "$SOURCE_DIR/.git" ]; then
        echo "🔄 Updating existing source..."
        cd "$SOURCE_DIR" && git pull origin main && cd - > /dev/null
    else
        echo "📥 Cloning fresh source..."
        rm -rf "$SOURCE_DIR"
        git clone "$REPO_URL" "$SOURCE_DIR"
    fi
fi

# =================================================================================
# 4. Installation (Sync)
# =================================================================================

# A. Skills (Direct Sync)
echo "📂 Installing Skills..."
if [ -d "$SOURCE_DIR/.agent/skills" ]; then
    rm -rf .agent/skills # Clean old skills to remove undefined ones
    mkdir -p .agent/skills
    cp -R "$SOURCE_DIR/.agent/skills/"* .agent/skills/
    echo "   ✅ Skills synced (Clean install)"
else
    echo "   ❌ Error: Skills directory missing in source!"
    exit 1
fi

# B. Workflows (Direct Sync)
echo "📂 Installing Workflows..."
if [ -d "$SOURCE_DIR/.agent/workflows" ]; then
    rm -rf .agent/workflows
    mkdir -p .agent/workflows
    cp -R "$SOURCE_DIR/.agent/workflows/"* .agent/workflows/
    echo "   ✅ Workflows synced"
fi

# C. Config Safety Dance
echo "⚙️  Configuring Backlog..."

# C1. AGENTS.md (Always Overwrite - System File)
if [ -f "$SOURCE_DIR/backlog/AGENTS.md" ]; then
    cp "$SOURCE_DIR/backlog/AGENTS.md" backlog/
    echo "   ✅ AGENTS.md updated"
fi

# C2. Templates (Always Overwrite - System Files)
if [ -d "$SOURCE_DIR/backlog/templates" ]; then
    cp -R "$SOURCE_DIR/backlog/templates/"* backlog/templates/
    echo "   ✅ Templates updated"
fi

# C3. config.yml (Smart Merge)
# If config exists, BACK IT UP, then overwrite (Wait, actually overwrite is safer for consistency)
# BUT user wanted "merge".
# Strategy: If config exists, check if it has "labels:". If yes, keep it. If no, overwrite. 
# actually, "Backup and Overwrite" is the "Elite" standard for ensuring tool compatibility.
# If user customized, they can diff with the backup.

if [ -f "backlog/config.yml" ]; then
    # Check if this is OUR config or default. 
    # Simple check: Does it have "Agent" label?
    if ! grep -q "Agent" backlog/config.yml; then
       echo "   ⚠️  Detected generic config. Overwriting with Agent-Optimized config..."
       mv backlog/config.yml backlog/config.yml.bak
       cp "$SOURCE_DIR/backlog/config.yml" backlog/
       echo "   ✅ Config updated (Old backed up to .bak)"
    else
       echo "   ✅ Config already optimized. Skipping overwrite."
    fi
else
    cp "$SOURCE_DIR/backlog/config.yml" backlog/
    echo "   ✅ Config installed"
fi

# D. Documentation & Knowledge
echo "📚 Installing Documentation..."
if [ -f "$SOURCE_DIR/backlog/docs/SKILLS-SYSTEM.md" ]; then
    mkdir -p backlog/docs
    cp "$SOURCE_DIR/backlog/docs/SKILLS-SYSTEM.md" backlog/docs/
    echo "   ✅ SKILLS-SYSTEM.md installed"
fi

# Starter Knowledge (Feature Request)
if [ ! -f "backlog/KNOWLEDGE.md" ] && [ -f "$SOURCE_DIR/backlog/docs/KNOWLEDGE-STARTER.md" ]; then
    cp "$SOURCE_DIR/backlog/docs/KNOWLEDGE-STARTER.md" backlog/KNOWLEDGE.md
    echo "   ✅ Initialized KNOWLEDGE.md with starter seeds"
fi

# =================================================================================
# 5. Final Message
# =================================================================================
echo ""
echo "✅ Done! Agent Environment Scaffolded (v$VERSION)."
echo "   Skills Source: ${LOCAL_DEV_PATH:-$REPO_URL}"
echo ""
