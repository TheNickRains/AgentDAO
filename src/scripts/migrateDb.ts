import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Add your migration SQL here
    const migrations = [
      `
      -- Initial schema
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        wallet_address TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS governance_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        token_address TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        delegated_to TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, token_address, chain_id)
      );

      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        proposal_id TEXT NOT NULL,
        choice TEXT NOT NULL,
        tx_hash TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      `
    ];

    // Execute each migration
    for (const migration of migrations) {
      const { error } = await supabase.from('migrations').select('*').limit(1);
      if (error) {
        // If migrations table doesn't exist, create it
        await supabase.rpc('exec', { sql: migration });
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 