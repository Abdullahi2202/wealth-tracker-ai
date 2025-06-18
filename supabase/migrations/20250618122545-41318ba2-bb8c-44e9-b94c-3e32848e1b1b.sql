
-- Add image_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS image_url TEXT;
