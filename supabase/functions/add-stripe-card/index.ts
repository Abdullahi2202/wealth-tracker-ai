
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, label, paymentMethodId } = await req.json();
    if (!email || !paymentMethodId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Set up Stripe
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      console.error("Stripe secret key not found");
      return new Response(JSON.stringify({ error: "Stripe secret key not found" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    // Log only the type of key to help debug
    console.log("[DEBUG] Stripe secret key starts with:", stripeSecret.slice(0, 8));
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    // 2. Find/create Stripe customer for this email
    let customerId = "";
    // Try to find an existing customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data && existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      // Create customer if not found
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    // 3. Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // 4. Set as a valid payment method for future payments
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });

    // 5. Get payment method details
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    // @ts-ignore
    const { brand, last4, exp_month, exp_year } = pm.card || {};

    // 6. Insert card into Supabase DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/payment_methods`, {
      method: "POST",
      headers: {
        "apikey": supabaseAnon,
        "Authorization": `Bearer ${supabaseAnon}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        user_email: email,
        type: "card",
        label: label || (brand ? `${brand.charAt(0).toUpperCase() + brand.slice(1)} Card` : "Card"),
        details: { last4 },
        stripe_payment_method_id: paymentMethodId,
        brand,
        last4,
        exp_month,
        exp_year,
        is_active: true
      }),
    });
    const inserted = await insertRes.json();
    if (!insertRes.ok || !Array.isArray(inserted) || !inserted[0]) {
      return new Response(JSON.stringify({ error: "Failed to save payment method", details: inserted }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      id: inserted[0].id,
      brand,
      last4,
      exp_month,
      exp_year,
      label: inserted[0].label,
      stripe_payment_method_id: paymentMethodId
    }), { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), { status: 500, headers: corsHeaders });
  }
});
