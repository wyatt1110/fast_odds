const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Function to execute SQL directly via REST API
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    // Extract the hostname and project reference from the URL
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    // Define the request options
    const options = {
      hostname: hostname,
      path: '/rest/v1/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`Failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        // Execute SQL directly using the REST API
        await executeSql(statement);
        
      } catch (err) {
        console.error(`Error executing statement: ${err.message}`);
        console.error('Statement:', statement);
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 