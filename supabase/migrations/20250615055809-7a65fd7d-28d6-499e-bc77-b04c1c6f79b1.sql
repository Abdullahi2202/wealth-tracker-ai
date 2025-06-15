
-- Create categories table for better management
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT NOT NULL DEFAULT 'CreditCard',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (readable by all authenticated users, editable by admins)
CREATE POLICY "Categories are viewable by authenticated users" 
  ON public.categories 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Categories are editable by admins" 
  ON public.categories 
  FOR ALL 
  TO authenticated 
  USING (public.is_admin());

-- Insert default categories
INSERT INTO public.categories (name, description, color, icon) VALUES
  ('Food & Dining', 'Restaurants, groceries, and food delivery', '#F59E0B', 'Utensils'),
  ('Shopping', 'Retail purchases and online shopping', '#EC4899', 'ShoppingCart'),
  ('Housing', 'Rent, mortgage, and home expenses', '#06B6D4', 'Home'),
  ('Transportation', 'Gas, public transit, and car expenses', '#8B5CF6', 'Car'),
  ('Entertainment', 'Movies, games, and recreation', '#10B981', 'Gamepad2'),
  ('Healthcare', 'Medical expenses and insurance', '#EF4444', 'Heart'),
  ('Education', 'Tuition, books, and courses', '#6366F1', 'GraduationCap'),
  ('Utilities', 'Electricity, water, and internet', '#84CC16', 'Lightbulb'),
  ('Technology', 'Gadgets, software, and tech services', '#3B82F6', 'Smartphone'),
  ('Travel', 'Flights, hotels, and vacation expenses', '#F97316', 'Plane'),
  ('Business', 'Work-related expenses and investments', '#1F2937', 'Briefcase'),
  ('Gifts & Donations', 'Presents and charitable contributions', '#DB2777', 'Gift'),
  ('Investment', 'Investments and savings', '#059669', 'TrendingUp'),
  ('Miscellaneous', 'Other uncategorized expenses', '#6B7280', 'CreditCard')
ON CONFLICT (name) DO NOTHING;

-- Create function to update category updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at_trigger ON public.categories;
CREATE TRIGGER update_categories_updated_at_trigger
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
