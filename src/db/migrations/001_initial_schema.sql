-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE,
  smart_account_address TEXT UNIQUE,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  proposal_id TEXT NOT NULL,
  choice TEXT NOT NULL,
  power TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegations table
CREATE TABLE IF NOT EXISTS delegations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dao_id TEXT NOT NULL,
  token_address TEXT NOT NULL,
  delegated_to TEXT NOT NULL,
  amount TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal cache table
CREATE TABLE IF NOT EXISTS proposal_cache (
  id TEXT PRIMARY KEY,
  dao_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  choices JSONB NOT NULL,
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_smart_account ON users(smart_account_address);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_delegations_user_id ON delegations(user_id);
CREATE INDEX IF NOT EXISTS idx_delegations_dao_token ON delegations(dao_id, token_address);
CREATE INDEX IF NOT EXISTS idx_proposal_cache_dao_id ON proposal_cache(dao_id);
CREATE INDEX IF NOT EXISTS idx_proposal_cache_status ON proposal_cache(status);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_cache ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Votes policies
CREATE POLICY "Users can read their own votes"
  ON votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delegations policies
CREATE POLICY "Users can read their own delegations"
  ON delegations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own delegations"
  ON delegations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Proposal cache policies
CREATE POLICY "Anyone can read proposal cache"
  ON proposal_cache FOR SELECT
  USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_delegations_updated_at
  BEFORE UPDATE ON delegations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proposal_cache_updated_at
  BEFORE UPDATE ON proposal_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 