
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !stripeKey) {
  console.error('Missing required environment variables');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  console.log('=== CREATE TOPUP SESSION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Method not allowed. Use POST.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing Authorization header' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { user: !!user, error: userError });

    if (userError || !user) {
      console.log('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or missing user authentication' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    console.log('User authenticated:', { id: user.id, email: user.email });

    // Parse request body - read it only once
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body text:', bodyText);
      
      if (!bodyText.trim()) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Body parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or empty request body. Please provide a valid JSON with amount field.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Validate amount
    const amount = Number(requestBody.amount);
    console.log('Amount validation:', { original: requestBody.amount, parsed: amount });

    if (!amount || isNaN(amount) || amount < 1) {
      console.log('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid amount. Must be at least $1.00' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const amountInCents = Math.round(amount * 100);
    console.log('Amount in cents:', amountInCents);

    // Get user profile for phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    console.log('Profile fetch result:', { profile, error: profileError });
    const phone = profile?.phone || '';

    // Check for existing Stripe customer
    console.log('Looking for existing Stripe customer with email:', user.email);
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
    console.log('Origin for redirects:', origin);

    const successUrl = `${origin}/payments/topup?success=true&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`;
    const cancelUrl = `${origin}/payments/topup?canceled=true`;

    console.log('Redirect URLs:', { successUrl, cancelUrl });

    // Handle payment with existing saved card
    if (requestBody.payment_method_id) {
      console.log('Processing payment with existing card:', requestBody.payment_method_id);
      
      // Get payment method from database
      const { data: paymentMethod, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', requestBody.payment_method_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (pmError || !paymentMethod) {
        console.error('Payment method not found:', pmError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment method not found or not accessible' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400 
          }
        );
      }

      console.log('Found payment method:', paymentMethod);
    }

    // Create Stripe checkout session
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
        payment_method_id: requestBody.payment_method_id || '',
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          type: 'wallet_topup',
          payment_method_id: requestBody.payment_method_id || '',
        }
      }
    });

    console.log('Stripe session created:', { id: session.id, url: session.url });

    // Save session to database with 'pending' status
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
      console.error('Database insert error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save session to database' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    console.log('Topup session saved:', topupSession.id);
    console.log('=== CREATE TOPUP SESSION COMPLETED SUCCESSFULLY ===');

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
    console.error('=== CREATE TOPUP SESSION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({ 
        success: false, 
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
