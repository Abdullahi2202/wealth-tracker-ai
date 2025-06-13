
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
    const { method, url } = req
    const urlObj = new URL(url)
    const action = urlObj.searchParams.get('action')

    switch (method) {
      case 'POST':
        if (action === 'create') {
          const { email, full_name, phone, passport_number, image_url } = await req.json()
          
          // Create user in auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: Math.random().toString(36).slice(-8), // Temporary password
            email_confirm: true,
            user_metadata: { full_name }
          })

          if (authError) throw authError

          // Create user in public.users table
          const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
              id: authUser.user.id,
              email,
              full_name,
              phone,
              passport_number,
              image_url
            })
            .select()
            .single()

          if (userError) throw userError

          // Create wallet for user
          const { error: walletError } = await supabase
            .from('user_wallets')
            .insert({
              user_id: authUser.user.id,
              balance: 0
            })

          if (walletError) throw walletError

          return new Response(JSON.stringify({ user, auth_user: authUser.user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'GET':
        if (action === 'list') {
          const { data: users, error } = await supabase
            .from('users')
            .select(`
              *,
              user_wallets(balance, currency, is_frozen),
              stored_payment_methods(count)
            `)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(JSON.stringify(users), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'get') {
          const userId = urlObj.searchParams.get('id')
          const { data: user, error } = await supabase
            .from('users')
            .select(`
              *,
              user_wallets(*),
              stored_payment_methods(*),
              payment_transactions(*),
              transaction_logs(*)
            `)
            .eq('id', userId)
            .single()

          if (error) throw error

          return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'PUT':
        if (action === 'update') {
          const { id, ...updates } = await req.json()
          
          const { data: user, error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (error) throw error

          return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'DELETE':
        if (action === 'delete') {
          const userId = urlObj.searchParams.get('id')
          
          // Delete from auth (will cascade to other tables)
          const { error: authError } = await supabase.auth.admin.deleteUser(userId!)
          if (authError) throw authError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('User management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
