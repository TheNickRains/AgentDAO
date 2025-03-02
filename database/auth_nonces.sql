-- Create auth_nonces table for storing wallet authentication nonces
CREATE TABLE IF NOT EXISTS auth_nonces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint on wallet_address to ensure only one active nonce per wallet
  CONSTRAINT unique_wallet_address UNIQUE (wallet_address)
);

-- Create an index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet_address ON auth_nonces (wallet_address);

-- Create a function to automatically clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth_nonces WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the cleanup function periodically
DROP TRIGGER IF EXISTS trigger_cleanup_expired_nonces ON auth_nonces;
CREATE TRIGGER trigger_cleanup_expired_nonces
AFTER INSERT ON auth_nonces
EXECUTE PROCEDURE cleanup_expired_nonces();

-- Add RLS (Row Level Security) policies
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage all nonces
CREATE POLICY service_manage_nonces ON auth_nonces
  FOR ALL
  TO service_role
  USING (true);

-- Comment on table and columns for documentation
COMMENT ON TABLE auth_nonces IS 'Stores nonces for wallet authentication';
COMMENT ON COLUMN auth_nonces.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN auth_nonces.nonce IS 'Random nonce to be signed by the wallet';
COMMENT ON COLUMN auth_nonces.expires_at IS 'Expiration timestamp for the nonce';
COMMENT ON COLUMN auth_nonces.created_at IS 'Timestamp when the nonce was created'; 