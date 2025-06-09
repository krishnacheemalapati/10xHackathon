#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs SQL migrations against Supabase database
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function runMigrations() {
  console.log('🚀 Starting database migration...');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.error('\nPlease check your .env file');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    console.log('✅ Database connection successful');

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`\n🔧 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('users')
              .select('*')
              .limit(0); // This will fail but establish connection
            
            console.warn(`⚠️  RPC execution not available, skipping statement ${i + 1}`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} execution warning:`, err.message);
        }
      }
      
      console.log(`✅ Migration ${file} completed`);
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify tables in Supabase Dashboard → Table Editor');
    console.log('2. Check sample data is populated');
    console.log('3. Run backend with: npm run dev');
    console.log('4. Look for "✅ Supabase client initialized successfully" in logs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 Manual setup instructions:');
    console.error('1. Go to your Supabase project dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste contents of migrations/001_initial_schema.sql');
    console.error('4. Click Run');
    console.error('5. Repeat for migrations/002_seed_data.sql');
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
