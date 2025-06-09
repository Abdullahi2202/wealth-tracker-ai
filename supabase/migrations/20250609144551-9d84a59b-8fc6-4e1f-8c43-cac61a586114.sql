
-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create fraud alerts table
CREATE TABLE public.fraud_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id),
  user_email TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'false_positive')),
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create chatbot conversations table
CREATE TABLE public.chatbot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  intent_detected TEXT,
  satisfaction_score INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system metrics table
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for admin tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all support tickets" ON public.support_tickets FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all fraud alerts" ON public.fraud_alerts FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all chatbot conversations" ON public.chatbot_conversations FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all admin activity logs" ON public.admin_activity_logs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all system metrics" ON public.system_metrics FOR ALL USING (public.is_admin());

-- Insert sample data for fraud alerts
INSERT INTO public.fraud_alerts (user_email, alert_type, risk_score, description) VALUES
('user1@example.com', 'Suspicious Transaction Pattern', 85, 'Multiple high-value transactions in short timeframe'),
('user2@example.com', 'Location Anomaly', 92, 'Transaction from unusual geographic location'),
('user3@example.com', 'Velocity Check Failed', 78, 'Transaction frequency exceeds normal pattern');

-- Insert sample support tickets
INSERT INTO public.support_tickets (user_email, subject, description, priority) VALUES
('user1@example.com', 'Payment Failed', 'My payment to merchant ABC failed but amount was deducted', 'high'),
('user2@example.com', 'Account Verification', 'Need help with identity verification process', 'medium'),
('user3@example.com', 'Transaction Dispute', 'Unauthorized transaction on my account', 'critical');

-- Insert sample chatbot conversations
INSERT INTO public.chatbot_conversations (user_email, session_id, message, response, intent_detected, satisfaction_score, response_time_ms) VALUES
('user1@example.com', 'sess_001', 'How do I reset my password?', 'You can reset your password by clicking the forgot password link on the login page.', 'password_reset', 5, 250),
('user2@example.com', 'sess_002', 'What are the transaction limits?', 'Daily transaction limit is $5000 for verified accounts.', 'transaction_limits', 4, 180),
('user3@example.com', 'sess_003', 'How to verify my identity?', 'Upload your government ID and proof of address in the profile section.', 'identity_verification', 5, 320);

-- Insert sample system metrics
INSERT INTO public.system_metrics (metric_name, metric_value, metric_type) VALUES
('active_users_daily', 1250, 'user_metric'),
('transactions_per_hour', 45, 'transaction_metric'),
('api_response_time_ms', 120, 'performance_metric'),
('fraud_detection_rate', 94.5, 'security_metric'),
('system_uptime_percent', 99.8, 'system_metric');
