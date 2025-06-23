
-- Drop the trigger and function properly with CASCADE
DROP TRIGGER IF EXISTS trg_enforce_completed_status ON public.topup_sessions CASCADE;
DROP FUNCTION IF EXISTS public.enforce_completed_status_on_insert() CASCADE;

-- Update the topup_sessions table to allow 'pending' status
ALTER TABLE public.topup_sessions 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add trigger to update wallet balance when topup session is completed
CREATE OR REPLACE FUNCTION public.update_wallet_on_topup_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update wallet if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update wallet balance using the RPC function
    PERFORM public.increment_wallet_balance(NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic wallet updates
DROP TRIGGER IF EXISTS update_wallet_on_topup_completion_trigger ON public.topup_sessions;
CREATE TRIGGER update_wallet_on_topup_completion_trigger
  AFTER UPDATE ON public.topup_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_topup_completion();

-- Ensure wallets table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_phone ON public.wallets(user_phone);
CREATE INDEX IF NOT EXISTS idx_wallets_user_email ON public.wallets(user_email);

-- Ensure topup_sessions has proper indexes
CREATE INDEX IF NOT EXISTS idx_topup_sessions_user_id ON public.topup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_topup_sessions_stripe_session_id ON public.topup_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_topup_sessions_status ON public.topup_sessions(status);
