
-- Drop existing policies that might conflict and recreate them
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can view their transfers" ON money_transfers;
DROP POLICY IF EXISTS "Users can create transfers as sender" ON money_transfers;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;

-- Add QR code data storage for payments (check if columns don't exist first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'money_transfers' AND column_name = 'qr_code_data') THEN
        ALTER TABLE money_transfers ADD COLUMN qr_code_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'money_transfers' AND column_name = 'bank_account_data') THEN
        ALTER TABLE money_transfers ADD COLUMN bank_account_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'money_transfers' AND column_name = 'transfer_metadata') THEN
        ALTER TABLE money_transfers ADD COLUMN transfer_metadata JSONB;
    END IF;
END $$;

-- Create QR codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  qr_type TEXT NOT NULL CHECK (qr_type IN ('wallet', 'bank_account')),
  qr_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_qr_codes
CREATE POLICY "Users can view their own QR codes" 
  ON user_qr_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QR codes" 
  ON user_qr_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" 
  ON user_qr_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR codes" 
  ON user_qr_codes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow public read access to active QR codes for scanning
CREATE POLICY "Public can read active QR codes for scanning" 
  ON user_qr_codes 
  FOR SELECT 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create wallet policies
CREATE POLICY "Users can view their own wallet" 
  ON wallets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
  ON wallets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create money transfer policies
CREATE POLICY "Users can view their transfers" 
  ON money_transfers 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create transfers as sender" 
  ON money_transfers 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Create transaction policies (handle both text and uuid types safely)
CREATE POLICY "Users can view their own transactions" 
  ON transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
  ON transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_wallets_user_phone ON wallets(user_phone);
CREATE INDEX IF NOT EXISTS idx_wallets_user_email ON wallets(user_email);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_active ON user_qr_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_money_transfers_sender ON money_transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_money_transfers_recipient ON money_transfers(recipient_id);
