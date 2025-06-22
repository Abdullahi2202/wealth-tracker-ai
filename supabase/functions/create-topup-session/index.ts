
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error('Invalid or missing user');

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    const phone = profile?.phone || '';

    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON in request body');
    }

    const amount = Number(body.amount);
    if (!amount || isNaN(amount) || amount < 1) {
      throw new Error('Invalid amount. Must be at least $1.00');
    }

    const amountInCents = Math.round(amount * 100);

    const customerList = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customer =
      customerList.data[0] ||
      (await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, phone },
      }));

    const origin = req.headers.get('origin') || 'https://your-app.com';
    const success = `${origin}/payments/topup?success=true&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`;
    const cancel = `${origin}/payments/topup?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Wallet Top-Up' },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success,
      cancel_url: cancel,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id,
        phone,
        amount_dollars: amount.toString(),
      },
    });

    const { data, error } = await supabase
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

    if (error) throw new Error('Database insert failed');

    return new Response(
      JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
        success: true,
        topup_session_id: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
