'use client';

import React, { useState } from 'react';

/**
 * GitHubIntegration Component
 * 
 * This component provides a UI for integrating with GitHub using MCP
 */
export default function GitHubIntegration() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runGitHubMcp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the GitHub MCP
      // through the appropriate server action or API route
      const response = await fetch('/api/github-mcp', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data.message || 'GitHub MCP executed successfully');
    } catch (err) {
      console.error('Failed to run GitHub MCP:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">GitHub Integration</h2>
      
      <p className="mb-4">
        Connect your application with GitHub using the Smithery MCP.
      </p>
      
      <button
        onClick={runGitHubMcp}
        disabled={loading}
        className={`px-4 py-2 rounded-md ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Connecting...' : 'Connect to GitHub'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {result}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>
          This integration uses the Smithery GitHub MCP with the following command:
        </p>
        <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
          npx -y @smithery/cli@latest run @smithery-ai/github --key d1d3af66-3abc-45aa-afa1-fcfcc9213721
        </pre>
      </div>
    </div>
  );
} 