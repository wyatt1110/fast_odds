/**
 * FILE STRUCTURE MIGRATION HELPER
 * 
 * This script helps with the migration process from the old file structure to the new one.
 * It provides utilities to:
 * 1. List files that need to be migrated
 * 2. Check which imports need to be updated
 * 3. Generate migration commands for specific files
 */

const fs = require('fs');
const path = require('path');

// Maps old file paths to new file paths
const fileMapping = {
  // Pages
  'src/app/page.tsx': 'src/frontend-ui/pages/home-landing-page.tsx',
  'src/app/dashboard/page.tsx': 'src/frontend-ui/pages/betting-dashboard-page.tsx',
  'src/app/login/page.tsx': 'src/frontend-ui/pages/user-login-page.tsx',
  'src/app/forgot-password/page.tsx': 'src/frontend-ui/pages/password-recovery-page.tsx',
  'src/app/reset-password/page.tsx': 'src/frontend-ui/pages/password-reset-page.tsx',
  
  // Components
  'src/components/bets/BetForm.tsx': 'src/frontend-ui/components/betting/bet-entry-form.tsx',
  'src/components/bets/BetSpreadsheet.tsx': 'src/frontend-ui/components/betting/bet-history-table.tsx',
  'src/components/assistants/RacingAssistant.tsx': 'src/frontend-ui/components/betting/racing-assistant-interface.tsx',
  'src/components/chat/ChatInterface.tsx': 'src/frontend-ui/components/chat/ai-betting-assistant-chat.tsx',
  
  // APIs
  'src/app/api/bets/route.ts': 'src/api-endpoints/betting/bets-crud-api.ts',
  'src/app/api/bets/[id]/route.ts': 'src/api-endpoints/betting/single-bet-management-api.ts',
  'src/app/api/stats/route.ts': 'src/api-endpoints/statistics/betting-statistics-api.ts',
  'src/app/api/admin/route.ts': 'src/api-endpoints/user-management/admin-operations-api.ts',
  'src/app/api/ai/claude/route.ts': 'src/api-endpoints/ai-services/claude-ai-api.ts',
  'src/app/api/ai/deepseek/route.ts': 'src/api-endpoints/ai-services/deepseek-ai-api.ts', 
  'src/app/api/chat/route.ts': 'src/api-endpoints/ai-services/general-chat-api.ts',
  'src/app/api/chat/racing/route.ts': 'src/api-endpoints/ai-services/racing-assistant-api.ts',
  'src/app/api/racing/uk/route.ts': 'src/api-endpoints/racing-data/uk-racing-data-api.ts',
  'src/app/api/equibase/route.ts': 'src/api-endpoints/racing-data/us-equibase-data-api.ts',

  // Services
  'src/lib/supabase/client.ts': 'src/services/database/supabase-database-client.ts',
  'src/lib/auth/auth-utils.ts': 'src/services/authentication/user-authentication-service.ts',
  'src/lib/claude/client.ts': 'src/services/ai-models/claude-ai-client.ts',
  'src/lib/deepseek/client.ts': 'src/services/ai-models/deepseek-ai-client.ts',
  'src/lib/ai/router.ts': 'src/services/ai-models/ai-model-selector.ts',
  'src/lib/racing/uk-client.ts': 'src/services/external-apis/uk-racing-api-client.ts',
  'src/lib/services/racing-api.ts': 'src/services/external-apis/racing-results-service.ts',
  'src/app/api/equibase/scraper.ts': 'src/services/external-apis/equibase-web-scraper.ts',
  'src/lib/equibase/scraper-agent.ts': 'src/services/external-apis/equibase-scraper-agent.ts',
  'src/lib/ai/bet-parser.ts': 'src/services/data-processing/betting-data-parser.ts',
  'src/lib/workflows/bet-assistant-workflow.ts': 'src/services/data-processing/betting-assistant-workflow.ts',
  'src/lib/workflows/racing-bet-workflow.ts': 'src/services/data-processing/racing-bet-processing.ts',
  
  // Data and Config
  'src/lib/data/racing-bets-knowledge.ts': 'src/data-types/racing-bet-schema.ts',
  'src/lib/data/track-codes.ts': 'src/config/racetrack-codes.ts',
  'src/lib/data/uk-tracks.ts': 'src/config/uk-racetrack-data.ts',
  'src/types/supabase.ts': 'src/data-types/database-schemas.ts',
  
  // AI Prompts
  'src/lib/prompts/equibase-scraper-prompt.ts': 'src/ai-prompts/equibase-data-extraction-prompt.ts',
  'src/lib/prompts/premium-racing-prompt.ts': 'src/ai-prompts/premium-racing-assistant-prompt.ts',
  'src/lib/prompts/racing-assistant-prompt.ts': 'src/ai-prompts/general-racing-assistant-prompt.ts',
};

function listUnmigratedFiles() {
  console.log('Files that need to be migrated:');
  Object.entries(fileMapping).forEach(([oldPath, newPath]) => {
    if (!fs.existsSync(newPath)) {
      console.log(`- ${oldPath} => ${newPath}`);
    }
  });
}

function generateMigrationCommands() {
  console.log('Commands to migrate files:');
  Object.entries(fileMapping).forEach(([oldPath, newPath]) => {
    // Create directories if needed
    const dir = path.dirname(newPath);
    console.log(`mkdir -p ${dir}`);
    
    // Copy file
    console.log(`cp ${oldPath} ${newPath}`);
  });
}

function findImportsToUpdate(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const oldPaths = Object.keys(fileMapping);
  
  console.log(`Checking imports in ${filePath}:`);
  oldPaths.forEach(oldPath => {
    // Strip extension and convert to import path
    const importPath = oldPath.replace(/\.[^/.]+$/, '');
    if (content.includes(importPath)) {
      console.log(`- Found import from: ${importPath}`);
      console.log(`  Should be updated to: ${fileMapping[oldPath].replace(/\.[^/.]+$/, '')}`);
    }
  });
}

// Usage
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    listUnmigratedFiles();
    break;
  case 'generate':
    generateMigrationCommands();
    break;
  case 'check-imports':
    if (!arg) {
      console.log('Please provide a file path to check');
      break;
    }
    findImportsToUpdate(arg);
    break;
  default:
    console.log(`
Migration Helper

Usage:
  node migrate-structure.js list                 - List files that need migration
  node migrate-structure.js generate             - Generate migration commands
  node migrate-structure.js check-imports [file] - Check imports in a specific file
`);
} 