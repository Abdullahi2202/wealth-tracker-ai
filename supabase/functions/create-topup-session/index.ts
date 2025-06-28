
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  console.log('=== CREATE TOPUP SESSION ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { amount, payment_method_id, save_card = false } = await req.json();
    const amountCents = Math.round(amount * 100);

    if (!amount || amountCents < 100) {
      throw new Error('Invalid amount. Minimum $1.00 required');
    }

    console.log('Processing amount:', amountCents, 'cents');

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log('Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      });
      console.log('Created new customer:', customer.id);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    let sessionConfig: any = {
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wallet Top-Up',
              description: `Add $${amount} to your wallet`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payments/topup?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payments/topup?cancelled=true`,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id,
        amount_cents: amountCents.toString(),
        save_card: save_card.toString(),
      },
      payment_method_types: ['card'],
    };

    // If save_card is true, configure setup for future payments
    if (save_card) {
      sessionConfig.payment_intent_data = {
        setup_future_usage: 'off_session',
      };
    }

    // If payment_method_id is provided, try to use existing payment method
    if (payment_method_id) {
      try {
        // Get the payment method from our database
        const { data: paymentMethodData } = await supabase
          .from('payment_methods')
          .select('stripe_payment_method_id')
          .eq('id', payment_method_id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (paymentMethodData?.stripe_payment_method_id) {
          console.log('Using existing payment method:', paymentMethodData.stripe_payment_method_id);
          
          // Attach the payment method to the customer if not already attached
          try {
            await stripe.paymentMethods.attach(paymentMethodData.stripe_payment_method_id, {
              customer: customer.id,
            });
          } catch (attachError: any) {
            // Payment method might already be attached, that's okay
            console.log('Payment method attach note:', attachError.message);
          }
        }
      } catch (error) {
        console.log('Could not use existing payment method, falling back to default:', error);
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Stripe session created:', session.id);

    // Save session to database
    const { error: dbError } = await supabase
      .from('topup_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount_cents: amountCents,
        status: 'pending',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save session');
    }

    console.log('Session saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error:', error.message);
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
