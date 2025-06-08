# GitHub MCP Integration

This document explains how to use the GitHub Magic Component Provider (MCP) integration in the Sports Betting Solutions application.

## Overview

The GitHub MCP allows you to interact with GitHub repositories directly from your application, enabling features like:

- Repository management
- Issue tracking
- Pull request management
- Code analysis
- CI/CD pipeline integration

## Configuration

The GitHub MCP is configured with an API key that should be kept secure. The key is already configured in the MCP files.

## Usage

### Running the GitHub MCP Command

You can run the GitHub MCP command in two ways:

#### Option 1: Using the shell script

```bash
# Navigate to the project root
cd /path/to/sports-betting-solutions

# Run the script
./scripts/github-mcp.sh
```

#### Option 2: Using the TypeScript API

```typescript
import { runGitHubCommand } from '@/config/github-mcp';

// In an async function
const result = await runGitHubCommand();
console.log(result);
```

### Programmatic Usage

The GitHub MCP can be used programmatically in your application code:

```typescript
import { initGitHubMCP, getGitHubTools } from '@/config/github-mcp';

// Initialize the GitHub MCP
await initGitHubMCP();

// Get available GitHub tools
const tools = await getGitHubTools();
```

## Troubleshooting

If you encounter issues with the GitHub MCP:

1. Check that the API key is valid and has not expired
2. Ensure you have the necessary permissions for the requested operations
3. Check your network connection
4. Look for error messages in the console or logs

## Resources

- [Smithery CLI Documentation](https://smithery.ai/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest) 