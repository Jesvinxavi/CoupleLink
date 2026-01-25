#!/bin/bash
# =================================================================================
# AGENT SCAFFOLDING SCRIPT (ELITE EDITION)
# =================================================================================
# This script initializes the .agent env by pulling skills from a central repo.
# It handles versioning, config merging, and intelligent setup.
#
# Repository: https://github.com/jesvinxavi/agent-skills
#
# NOTE: The entire script is wrapped in a main() function to support `curl | bash`.
# This ensures the script is fully downloaded before execution begins.
# =================================================================================

main() {
    VERSION="2.2.0"
    REPO_URL="https://github.com/Jesvinxavi/Backlog-Agent-Orchastration.git"
    SOURCE_DIR=".agent/.source-repo"
    LOCAL_DEV_PATH="agent-skills-package" # Fallback for local testing before push

    # =================================================================================
    # 0. Version Check & Flags
    # =================================================================================

    if [[ "$1" == "--check-updates" ]]; then
        echo "🔍 Checking for updates..."
        # Fetch raw script from main branch
        REMOTE_VERSION=$(curl -sL https://raw.githubusercontent.com/Jesvinxavi/Backlog-Agent-Orchastration/main/scripts/scaffold-agents.sh | grep 'VERSION="' | head -1 | cut -d'"' -f2)
        
        if [[ "$VERSION" != "$REMOTE_VERSION" ]]; then
            echo "⚠️  Update Available: v$REMOTE_VERSION (Current: v$VERSION)"
            echo "   Run: curl -sL ... | bash to upgrade."
        else
            echo "✅ You are on the latest version (v$VERSION)."
        fi
        return 0
    fi

    echo "🚀 Starting Agent Scaffolding v$VERSION..."

    # =================================================================================
    # 1. Pre-flight Checks
    # =================================================================================

    set -e  # Exit on error

    if ! command -v git &> /dev/null; then
        echo "❌ Error: git is not installed."
        return 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "❌ Error: npm is not installed."
        return 1
    fi

    # 1b. Install Backlog.md if not present
    USE_NPX=false

    if ! command -v backlog &> /dev/null; then
        echo "📦 Installing backlog.md globally..."
        
        # Attempt 1: Standard install (works for nvm users or if permissions are ok)
        # Note: We use "|| true" to prevent "set -e" from exiting the script on failure
        INSTALL_OUTPUT=$(npm install -g backlog.md 2>&1) || true
        
        # Check if installation succeeded by looking for success indicators
        if echo "$INSTALL_OUTPUT" | grep -qE "added [0-9]+ packages|up to date"; then
            echo "   ✅ Successfully installed backlog.md"
        elif echo "$INSTALL_OUTPUT" | grep -qiE "EACCES|permission denied|EPERM"; then
            # Permission error - try sudo
            echo "   🚫 Permission denied. Trying with elevated permissions..."
            
            # Attempt 2: Sudo install
            if sudo npm install -g backlog.md; then
                echo "   ✅ Successfully installed backlog.md (via sudo)"
            else
                echo ""
                echo "   ⚠️  Could not install globally. Falling back to npx mode."
                echo "      (All features work, but no shell tab-completion)"
                USE_NPX=true
            fi
        else
            # Some other error (network, package not found, etc)
            echo "   ❌ Installation failed:"
            echo "$INSTALL_OUTPUT"
            echo ""
            echo "   Please check your network connection and try again."
            return 1
        fi
    fi

    # 1c. Shell Completion (Best Effort - only if global install succeeded)
    if [[ "$USE_NPX" == "false" ]] && command -v backlog &> /dev/null; then
        SHELL_NAME=$(basename "$SHELL")
        if [[ "$SHELL_NAME" == "zsh" || "$SHELL_NAME" == "bash" ]]; then
            echo "🐚 Attempting shell completion install ($SHELL_NAME)..."
            # We mask error output because this might fail if user strictly manages dotfiles
            backlog completion install --shell "$SHELL_NAME" 2>/dev/null || true
        fi
    elif [[ "$USE_NPX" == "true" ]]; then
        echo "⏭️  Skipping shell completion (npx mode)."
    fi

    # =================================================================================
    # 2. Create Project Structure
    # =================================================================================
    # Note: We skip `npx backlog.md init` because:
    # 1. It prompts for input which breaks curl|bash
    # 2. We create all needed directories below
    # 3. We copy our own optimized config.yml from the source

    echo "📁 Creating project structure..."
    mkdir -p .agent/{skills,workflows,cache}
    mkdir -p backlog/{docs,decisions,tasks,specs,templates}
    echo "   ✅ Directories created"

    # =================================================================================
    # 3. Source Acquisition
    # =================================================================================

    if [ -d "$LOCAL_DEV_PATH" ]; then
        echo "⚠️  Found local '$LOCAL_DEV_PATH'. Installing from LOCAL source..."
        rm -rf "$SOURCE_DIR"
        mkdir -p "$SOURCE_DIR"
        cp -R "$LOCAL_DEV_PATH/"* "$SOURCE_DIR/"
    else
        echo "🌐 Fetching skills from GitHub..."
        if [ -d "$SOURCE_DIR/.git" ]; then
            echo "   🔄 Updating existing source..."
            cd "$SOURCE_DIR" && git pull origin main && cd - > /dev/null || {
                echo "   ⚠️  Git pull failed. Using existing cached source."
            }
        else
            echo "   📥 Cloning fresh source..."
            rm -rf "$SOURCE_DIR"
            if ! git clone --depth 1 "$REPO_URL" "$SOURCE_DIR" 2>&1; then
                echo "   ❌ Error: Failed to clone repository."
                echo "      URL: $REPO_URL"
                echo "      Please check your internet connection."
                return 1
            fi
            echo "   ✅ Source acquired"
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
        return 1
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

    # C4. Update project name to match current directory
    PROJECT_NAME=$(basename "$(pwd)")
    if [ -f "backlog/config.yml" ]; then
        # Replace the placeholder project name with actual directory name
        if grep -q 'project_name: "CoupleLink"' backlog/config.yml; then
            sed -i.tmp "s/project_name: \"CoupleLink\"/project_name: \"$PROJECT_NAME\"/" backlog/config.yml
            rm -f backlog/config.yml.tmp
            echo "   ✅ Project name set to: $PROJECT_NAME"
        fi
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
}

# Run main function with all arguments
# This pattern ensures the entire script is downloaded before execution when using curl | bash
main "$@"
