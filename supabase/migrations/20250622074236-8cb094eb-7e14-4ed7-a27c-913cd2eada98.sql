
-- Add user_phone column to wallets table if it doesn't exist
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS user_phone TEXT;

-- Create index on user_phone for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_phone ON public.wallets(user_phone);

-- Update existing wallets to use phone numbers from profiles
UPDATE public.wallets 
SET user_phone = profiles.phone 
FROM public.profiles 
WHERE wallets.user_id = profiles.id 
AND wallets.user_phone IS NULL 
AND profiles.phone IS NOT NULL;

-- Create RLS policies for wallets based on phone numbers
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Service role can manage all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Authenticated users can insert their own wallet" ON public.wallets;

CREATE POLICY "Users can view their own wallet by phone or email" 
ON public.wallets 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  user_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid()) OR
  user_email = auth.email()
);

CREATE POLICY "Service role can manage all wallets" 
ON public.wallets 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert their own wallet" 
ON public.wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
