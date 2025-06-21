
-- Add wallet_number column to wallets table
ALTER TABLE public.wallets
ADD COLUMN wallet_number integer;

-- Create sequence for 8-digit wallet numbers
CREATE SEQUENCE IF NOT EXISTS wallet_number_seq
START WITH 10000000
INCREMENT BY 1
MINVALUE 10000000
MAXVALUE 99999999;

-- Set default value for wallet_number column to use the sequence
ALTER TABLE public.wallets
ALTER COLUMN wallet_number SET DEFAULT nextval('wallet_number_seq');

-- Update existing wallets to have wallet numbers
UPDATE public.wallets
SET wallet_number = nextval('wallet_number_seq')
WHERE wallet_number IS NULL;

-- Make wallet_number NOT NULL after setting values
ALTER TABLE public.wallets
ALTER COLUMN wallet_number SET NOT NULL;

-- Add unique constraint to wallet_number
ALTER TABLE public.wallets
ADD CONSTRAINT wallets_wallet_number_unique UNIQUE (wallet_number);
