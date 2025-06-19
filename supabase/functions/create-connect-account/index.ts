
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { account_type = 'express', country = 'US' } = await req.json()

    console.log('Creating Stripe Connect account for user:', user.id)

    // Check if user already has a connect account
    const { data: existingAccount } = await supabase
      .from('connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingAccount) {
      return new Response(JSON.stringify({ 
        error: 'User already has a connect account',
        account: existingAccount 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: account_type,
      country: country,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    console.log('Stripe account created:', account.id)

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/profile?refresh=true`,
      return_url: `${req.headers.get('origin')}/profile?success=true`,
      type: 'account_onboarding',
    })

    // Store in database
    const { data: dbAccount, error: dbError } = await supabase
      .from('connect_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        account_type: account_type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        onboarding_url: accountLink.url
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save account to database')
    }

    console.log('Connect account saved to database')

    return new Response(JSON.stringify({
      account: dbAccount,
      onboarding_url: accountLink.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create connect account error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
