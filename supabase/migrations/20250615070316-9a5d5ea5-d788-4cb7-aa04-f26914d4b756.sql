
-- Create settings table that was missing from the previous migration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admin only access" ON public.settings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Insert some default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('app_name', '"WalletMaster"', 'Application name'),
  ('app_version', '"1.0.0"', 'Application version'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('require_2fa', 'false', 'Require two-factor authentication'),
  ('default_currency', '"USD"', 'Default currency for transactions'),
  ('transaction_fee', '2.5', 'Transaction fee percentage'),
  ('min_transaction_amount', '1', 'Minimum transaction amount'),
  ('max_transaction_amount', '10000', 'Maximum transaction amount');

-- Create index for performance
CREATE INDEX idx_settings_key ON public.settings(key);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
