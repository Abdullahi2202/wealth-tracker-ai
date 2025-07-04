
-- Create notifications table for admin notification tracking
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all notifications" 
  ON public.notifications 
  FOR ALL 
  USING (is_admin());

CREATE POLICY "Service role bypass notifications" 
  ON public.notifications 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON public.notifications(sent_at);
