
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Setting up wallet numbers...')
    
    // Add wallet_number column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Add wallet_number column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallets' AND column_name = 'wallet_number'
          ) THEN
            ALTER TABLE public.wallets ADD COLUMN wallet_number integer;
          END IF;
          
          -- Create sequence if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'wallet_number_seq') THEN
            CREATE SEQUENCE wallet_number_seq
            START WITH 10000000
            INCREMENT BY 1
            MINVALUE 10000000
            MAXVALUE 99999999;
          END IF;
          
          -- Set default value for wallet_number
          ALTER TABLE public.wallets 
          ALTER COLUMN wallet_number SET DEFAULT nextval('wallet_number_seq');
          
          -- Update existing wallets that don't have wallet numbers
          UPDATE public.wallets 
          SET wallet_number = nextval('wallet_number_seq')
          WHERE wallet_number IS NULL;
          
          -- Make wallet_number NOT NULL and unique
          ALTER TABLE public.wallets 
          ALTER COLUMN wallet_number SET NOT NULL;
          
          -- Add unique constraint if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'wallets_wallet_number_unique'
            ) THEN
              ALTER TABLE public.wallets 
              ADD CONSTRAINT wallets_wallet_number_unique UNIQUE (wallet_number);
            END IF;
          END;
          $$;
        END $$;
      `
    })

    if (alterError) {
      console.error('Error setting up wallet numbers:', alterError)
      throw alterError
    }

    console.log('Wallet numbers setup completed successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Wallet numbers setup completed' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(JSON.stringify({ 
      error: 'Setup failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
