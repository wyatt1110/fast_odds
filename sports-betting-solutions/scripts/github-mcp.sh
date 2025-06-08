#!/bin/bash

# GitHub MCP Script
# This script runs the GitHub MCP command using Smithery CLI

echo "Running GitHub MCP with Smithery CLI..."
npx -y @smithery/cli@latest run @smithery-ai/github --key d1d3af66-3abc-45aa-afa1-fcfcc9213721

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "GitHub MCP command completed successfully!"
else
  echo "GitHub MCP command failed. Please check the errors above."
  exit 1
fi 