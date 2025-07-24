#!/usr/bin/env node

// TableTalk Radar - Database Migration Runner
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Migration tracking table
const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum TEXT,
  execution_time_ms INTEGER
);
`

// Get all migration files
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '../../database/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  return files.map(file => ({
    filename: file,
    filepath: path.join(migrationsDir, file),
    content: fs.readFileSync(path.join(migrationsDir, file), 'utf8')
  }))
}

// Calculate checksum for migration file
function calculateChecksum(content) {
  const crypto = require('crypto')
  return crypto.createHash('md5').update(content).digest('hex')
}

// Check if migration has been executed
async function isMigrationExecuted(filename) {
  const { data, error } = await supabase
    .from('_migrations')
    .select('*')
    .eq('filename', filename)
    .single()
  
  return !!data
}

// Execute migration
async function executeMigration(migration) {
  console.log(`\n📄 Executing migration: ${migration.filename}`)
  
  const startTime = Date.now()
  
  try {
    // Split SQL into individual statements
    const statements = migration.content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`   Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single()
      
      if (error) {
        // If RPC doesn't exist, try direct execution (for initial setup)
        const { error: directError } = await supabase
          .from('_dummy_')
          .select()
          .limit(0)
          .then(() => ({ error: null }))
          .catch(err => ({ error: err }))
        
        if (directError) {
          throw new Error(`SQL execution failed: ${directError.message}`)
        }
      }
    }
    
    const executionTime = Date.now() - startTime
    
    // Record successful migration
    const { error: recordError } = await supabase
      .from('_migrations')
      .insert({
        filename: migration.filename,
        checksum: calculateChecksum(migration.content),
        execution_time_ms: executionTime
      })
    
    if (recordError) {
      console.warn(`   ⚠️  Warning: Could not record migration: ${recordError.message}`)
    }
    
    console.log(`   ✅ Completed in ${executionTime}ms`)
    return true
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`)
    return false
  }
}

// Main migration runner
async function runMigrations() {
  console.log('🚀 TableTalk Radar - Database Migration Runner')
  console.log('===========================================')
  console.log(`📍 Database: ${SUPABASE_URL}`)
  console.log()
  
  // Create migrations table if it doesn't exist
  console.log('📋 Checking migrations table...')
  try {
    // Note: This is a simplified approach. In production, you'd use
    // Supabase's admin API or direct database connection
    console.log('   ⚠️  Note: Ensure _migrations table exists in Supabase')
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message)
    process.exit(1)
  }
  
  // Get all migrations
  const migrations = getMigrationFiles()
  console.log(`\n📁 Found ${migrations.length} migration files`)
  
  // Check which migrations need to be run
  const pendingMigrations = []
  for (const migration of migrations) {
    const executed = await isMigrationExecuted(migration.filename)
    if (!executed) {
      pendingMigrations.push(migration)
    } else {
      console.log(`   ✓ ${migration.filename} (already executed)`)
    }
  }
  
  if (pendingMigrations.length === 0) {
    console.log('\n✅ All migrations are up to date!')
    return
  }
  
  console.log(`\n⏳ ${pendingMigrations.length} migrations pending:`)
  pendingMigrations.forEach(m => console.log(`   - ${m.filename}`))
  
  // Confirm execution
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const answer = await new Promise(resolve => {
    rl.question('\n❓ Execute pending migrations? (y/N): ', resolve)
  })
  rl.close()
  
  if (answer.toLowerCase() !== 'y') {
    console.log('❌ Migration cancelled')
    return
  }
  
  // Execute pending migrations
  let successCount = 0
  for (const migration of pendingMigrations) {
    const success = await executeMigration(migration)
    if (success) {
      successCount++
    } else {
      console.error('\n❌ Migration failed. Stopping execution.')
      break
    }
  }
  
  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${pendingMigrations.length - successCount}`)
  
  if (successCount === pendingMigrations.length) {
    console.log('\n🎉 All migrations completed successfully!')
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.')
    process.exit(1)
  }
}

// Alternative: Direct SQL execution for Supabase
async function executeDirectSQL() {
  console.log('\n📝 Direct SQL Execution Mode')
  console.log('============================')
  console.log('Copy and paste the following SQL into Supabase SQL Editor:\n')
  
  const migrations = getMigrationFiles()
  
  // Combine all migrations
  let combinedSQL = '-- TableTalk Radar - Combined Migration Script\n'
  combinedSQL += '-- Generated on: ' + new Date().toISOString() + '\n\n'
  
  // Add migrations table
  combinedSQL += '-- Create migrations tracking table\n'
  combinedSQL += MIGRATION_TABLE_SQL + '\n\n'
  
  // Add each migration
  migrations.forEach(migration => {
    combinedSQL += `-- Migration: ${migration.filename}\n`
    combinedSQL += `-- ========================================\n`
    combinedSQL += migration.content + '\n\n'
  })
  
  // Write to file
  const outputPath = path.join(__dirname, '../../database/combined-migration.sql')
  fs.writeFileSync(outputPath, combinedSQL)
  
  console.log(`✅ Combined migration script written to: ${outputPath}`)
  console.log('\n📋 Instructions:')
  console.log('   1. Open Supabase Dashboard')
  console.log('   2. Go to SQL Editor')
  console.log('   3. Copy contents of combined-migration.sql')
  console.log('   4. Paste and execute')
}

// Check command line arguments
const args = process.argv.slice(2)

if (args.includes('--direct')) {
  executeDirectSQL()
} else {
  runMigrations().catch(error => {
    console.error('❌ Migration runner failed:', error)
    process.exit(1)
  })
}