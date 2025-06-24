
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

console.log('Environment check:', {
  supabaseUrl: !!supabaseUrl,
  supabaseServiceKey: !!supabaseServiceKey,
  stripeKey: !!stripeKey
});

if (!supabaseUrl || !supabaseServiceKey || !stripeKey) {
  console.error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');
const stripe = new Stripe(stripeKey || '', { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  console.log('=== CREATE TOPUP SESSION STARTED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('User auth result:', { user: !!user, error: userError });

    if (userError || !user) {
      console.log('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    console.log('User authenticated:', { id: user.id, email: user.email });

    // Parse request body
    const requestBody = await req.json();
    console.log('Request body:', requestBody);

    // Validate amount
    const amount = Number(requestBody.amount);
    console.log('Amount validation:', { original: requestBody.amount, parsed: amount });

    if (!amount || isNaN(amount) || amount < 1) {
      console.log('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Must be at least $1.00' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const amountInCents = Math.round(amount * 100);
    console.log('Amount in cents:', amountInCents);

    // Get user profile for phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    const phone = profile?.phone || '';
    console.log('User phone:', phone);

    // Check for existing Stripe customer
    console.log('Looking for existing Stripe customer:', user.email);
    const customerList = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customer;
    if (customerList.data.length > 0) {
      customer = customerList.data[0];
      console.log('Found existing customer:', customer.id);
    } else {
      console.log('Creating new customer for:', user.email);
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { 
          user_id: user.id, 
          phone: phone 
        },
      });
      console.log('Created new customer:', customer.id);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://your-app.com';
    console.log('Origin:', origin);

    const successUrl = `${origin}/payments/topup?success=true&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`;
    const cancelUrl = `${origin}/payments/topup?canceled=true`;

    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: 'Wallet Top-Up',
              description: `Add $${amount} to your wallet`
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id,
        phone: phone,
        amount_dollars: amount.toString(),
      },
    });

    console.log('Stripe session created:', { id: session.id, url: session.url });

    // Save session to database
    console.log('Saving topup session to database...');
    const { data: topupSession, error: dbError } = await supabase
      .from('topup_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amountInCents,
        currency: 'usd',
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save session' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    console.log('Session saved:', topupSession.id);
    console.log('=== SUCCESS ===');

    return new Response(
      JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
        success: true,
        topup_session_id: topupSession.id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
