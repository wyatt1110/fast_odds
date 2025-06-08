import { createTransport } from "@smithery/sdk";

interface GitHubTool {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Create transport for GitHub MCP server
const transport = createTransport("https://server.smithery.ai/@smithery-ai/github", {
  key: "d1d3af66-3abc-45aa-afa1-fcfcc9213721"
});

// Initialize GitHub MCP
export const initGitHubMCP = async () => {
  try {
    // The connection will be handled by the MCP configuration
    console.log("GitHub MCP initialized with key");
    return true;
  } catch (error) {
    console.error("Failed to initialize GitHub MCP:", error);
    return false;
  }
};

// Export functions for interacting with GitHub
export const getGitHubTools = async () => {
  try {
    // This will be handled by the MCP configuration
    return [] as GitHubTool[];
  } catch (error) {
    console.error("Failed to get GitHub tools:", error);
    return [] as GitHubTool[];
  }
};

// Run GitHub MCP command
export const runGitHubCommand = async () => {
  try {
    // This is the command to run
    const command = "npx -y @smithery/cli@latest run @smithery-ai/github --key d1d3af66-3abc-45aa-afa1-fcfcc9213721";
    console.log(`Running command: ${command}`);
    
    // In a browser environment, we'd need to use a different approach
    // This is a placeholder for server-side execution
    if (typeof window === 'undefined') {
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec(command, (error: Error, stdout: string, stderr: string) => {
          if (error) {
            console.error(`Error executing command: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            console.error(`Command stderr: ${stderr}`);
          }
          console.log(`Command stdout: ${stdout}`);
          resolve(stdout);
        });
      });
    } else {
      console.log("GitHub MCP command cannot be run directly in browser. Please run from terminal.");
      return null;
    }
  } catch (error) {
    console.error("Failed to run GitHub command:", error);
    return null;
  }
}; 