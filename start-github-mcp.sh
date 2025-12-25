#!/bin/bash
# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Run the MCP server
npx -y @modelcontextprotocol/server-github
