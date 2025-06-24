
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  console.log('=== VERIFY TOPUP PAYMENT ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error('Missing session_id');
    }

    console.log('Verifying session:', session_id);

    // Get Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    console.log('Payment verified as paid');

    // Update topup session status
    const { error: updateError } = await supabase
      .from('topup_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', session_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update session status');
    }

    console.log('Session updated to completed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and wallet updated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Verification error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
