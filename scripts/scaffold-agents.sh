#!/bin/bash
# =================================================================================
# AGENT SCAFFOLDING SCRIPT (REMOTE)
# =================================================================================
# This script initializes the .agent env by pulling skills from a central repo.
#
# Repository: https://github.com/jesvinxavi/agent-skills
# =================================================================================

set -e  # Exit on error

REPO_URL="https://github.com/jesvinxavi/agent-skills.git"
SOURCE_DIR=".agent/.source-repo"
LOCAL_DEV_PATH="agent-skills-package" # Fallback for local testing before push

echo "🚀 Starting Agent Scaffolding..."

# 1. Check Prerequisites
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed."
    exit 1
fi

# 2. Prepare Directories
mkdir -p .agent/{skills,workflows,cache}
mkdir -p backlog/{docs,decisions,tasks,specs}

# 3. Source Acquisition Strategy
if [ -d "$LOCAL_DEV_PATH" ]; then
    echo "⚠️  Found local '$LOCAL_DEV_PATH'. Installing from LOCAL source..."
    # Local install (simulation)
    # Clear old source cache
    rm -rf "$SOURCE_DIR"
    mkdir -p "$SOURCE_DIR"
    cp -R "$LOCAL_DEV_PATH/"* "$SOURCE_DIR/"
else
    echo "🌐 attempting to clone from GitHub ($REPO_URL)..."
    # Remote install
    if [ -d "$SOURCE_DIR/.git" ]; then
        echo "🔄 Updating existing source..."
        cd "$SOURCE_DIR" && git pull origin main && cd - > /dev/null
    else
        echo "📥 Cloning fresh source..."
        rm -rf "$SOURCE_DIR"
        git clone "$REPO_URL" "$SOURCE_DIR"
    fi
fi

# 4. Installation (Sync)
echo "📂 Installing Skills..."
if [ -d "$SOURCE_DIR/skills" ]; then
    cp -R "$SOURCE_DIR/skills/"* .agent/skills/
    echo "   ✅ Skills synced"
else
    echo "   ❌ Error: Skills directory missing in source!"
    exit 1
fi

echo "📂 Installing Workflows..."
if [ -d "$SOURCE_DIR/workflows" ]; then
    cp -R "$SOURCE_DIR/workflows/"* .agent/workflows/
    echo "   ✅ Workflows synced"
else
    echo "   ⚠️  Workflows directory missing in source"
fi

echo "📂 Installing Documentation..."
if [ -f "$SOURCE_DIR/docs/SKILLS-SYSTEM.md" ]; then
    mkdir -p backlog/docs
    cp "$SOURCE_DIR/docs/SKILLS-SYSTEM.md" backlog/docs/
    echo "   ✅ SKILLS-SYSTEM.md synced"
fi

# 5. Final Message
echo ""
echo "✅ Done! Agent Environment Scaffolded."
echo "   Skills Source: ${LOCAL_DEV_PATH:-$REPO_URL}"
echo ""
echo "To update skills in the future:"
echo "1. Run this script again."
