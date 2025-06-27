
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action } = await req.json()

    if (action === 'get_all_transactions') {
      console.log('Fetching all transactions for admin...')
      
      // Fetch all transactions using service role (bypasses RLS)
      const { data: transactions, error: transactionError } = await supabaseClient
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch transactions' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`Found ${transactions?.length || 0} transactions`)

      // Fetch user profiles for each transaction
      const transactionsWithDetails = []
      
      if (transactions) {
        for (const transaction of transactions) {
          let userDetails = null
          
          if (transaction.user_id) {
            const { data: profileData } = await supabaseClient
              .from('profiles')
              .select('email, full_name, phone')
              .eq('id', transaction.user_id)
              .single()
            
            userDetails = profileData
          }

          transactionsWithDetails.push({
            ...transaction,
            user_email: userDetails?.email,
            user_name: userDetails?.full_name,
            user_phone: userDetails?.phone
          })
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          transactions: transactionsWithDetails
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in admin-operations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
