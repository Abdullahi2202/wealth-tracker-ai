
-- Drop existing topup-related tables and start fresh
DROP TABLE IF EXISTS public.topup_sessions CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Create a simplified topup_sessions table
CREATE TABLE public.topup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topup_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own topup sessions" ON public.topup_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own topup sessions" ON public.topup_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all topup sessions" ON public.topup_sessions
  FOR ALL TO service_role USING (true);

-- Create indexes for performance
CREATE INDEX idx_topup_sessions_user_id ON public.topup_sessions(user_id);
CREATE INDEX idx_topup_sessions_stripe_session_id ON public.topup_sessions(stripe_session_id);
CREATE INDEX idx_topup_sessions_status ON public.topup_sessions(status);

-- Create function to handle wallet updates when topup completes
CREATE OR REPLACE FUNCTION handle_topup_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update wallet balance
    UPDATE public.wallets 
    SET 
      balance = balance + (NEW.amount_cents / 100.0),
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (
      user_id,
      name,
      amount,
      type,
      category,
      date,
      status
    ) VALUES (
      NEW.user_id,
      'Wallet Top-up',
      NEW.amount_cents / 100.0,
      'income',
      'Top-up',
      CURRENT_DATE,
      'completed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_topup_completion ON public.topup_sessions;
CREATE TRIGGER trigger_topup_completion
  AFTER UPDATE ON public.topup_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_topup_completion();
