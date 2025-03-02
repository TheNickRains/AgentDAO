import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import config from '../config/config';

async function runMigrations() {
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    console.log('Starting database migrations...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing statement: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        throw error;
      }
    }

    console.log('Migrations completed successfully!');

    // Verify the tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
    } else {
      console.log('Tables verified successfully!');
    }

  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 