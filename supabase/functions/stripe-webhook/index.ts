
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  console.log('=== STRIPE WEBHOOK ===');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        console.log('Webhook signature verified');
      } else {
        event = JSON.parse(body);
        console.log('Processing without signature verification');
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook Error', { status: 400, headers: corsHeaders });
    }

    console.log('Processing event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id);

        if (session.metadata?.type === 'wallet_topup') {
          console.log('Processing wallet topup completion');

          // Update topup session status
          const { error: updateError } = await supabase
            .from('topup_sessions')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id);

          if (updateError) {
            console.error('Error updating topup session:', updateError);
          } else {
            console.log('Topup session updated successfully');
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('Checkout expired:', session.id);

        if (session.metadata?.type === 'wallet_topup') {
          await supabase
            .from('topup_sessions')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
