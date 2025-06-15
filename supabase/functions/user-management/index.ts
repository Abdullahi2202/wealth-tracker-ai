
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
    const { method } = req

    console.log('Request method:', method)

    switch (method) {
      case 'GET':
        // Default to listing users if no specific action
        console.log('Fetching users list...')
        const { data: users, error } = await supabase
          .from('users')
          .select(`
            id,
            email,
            full_name,
            phone,
            passport_number,
            image_url,
            verification_status,
            document_type,
            created_at,
            is_active,
            updated_at
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching users:', error)
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Users fetched successfully:', users?.length || 0)
        return new Response(JSON.stringify(users || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'PUT':
        const updateBody = await req.json()
        console.log('Update request body:', updateBody)
        
        const { id, action, ...updates } = updateBody
        
        if (action === 'update') {
          const { data: user, error: updateError } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating user:', updateError)
            return new Response(JSON.stringify({ error: updateError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('User updated successfully:', user)
          return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'DELETE':
        const deleteBody = await req.json()
        console.log('Delete request body:', deleteBody)
        
        const { id: deleteId } = deleteBody
        
        if (deleteId) {
          // Delete from auth (will cascade to other tables)
          const { error: authError } = await supabase.auth.admin.deleteUser(deleteId)
          if (authError) {
            console.error('Error deleting user from auth:', authError)
            return new Response(JSON.stringify({ error: authError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('User deleted successfully:', deleteId)
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'POST':
        const createBody = await req.json()
        console.log('Create request body:', createBody)
        
        const { email, full_name, phone, passport_number, image_url, document_type } = createBody
        
        // Try to get the auth user first to get their ID
        const { data: authUser, error: authFetchError } = await supabase.auth.admin.listUsers()
        
        let userId = null
        if (!authFetchError && authUser?.users) {
          const foundUser = authUser.users.find(user => user.email === email)
          if (foundUser) {
            userId = foundUser.id
            console.log('Found existing auth user:', userId)
          }
        }

        if (!userId) {
          // If no auth user found, create one
          const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: Math.random().toString(36).slice(-8), // Temporary password
            email_confirm: true,
            user_metadata: { full_name, phone, passport_number, document_type }
          })

          if (authError) {
            console.error('Error creating auth user:', authError)
            return new Response(JSON.stringify({ error: authError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          userId = newAuthUser.user.id
          console.log('Created new auth user:', userId)
        }

        // Create user in public.users table
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email,
            full_name,
            phone,
            passport_number,
            image_url: image_url || null,
            document_type: document_type || 'passport',
            verification_status: 'pending',
            is_active: true
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user record:', userError)
          return new Response(JSON.stringify({ error: userError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create wallet for user
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance: 0,
            currency: 'USD'
          })

        if (walletError) {
          console.error('Error creating user wallet:', walletError)
          // Don't throw here, user is created successfully
        } else {
          console.log('Wallet created successfully for user:', userId)
        }

        console.log('User created successfully:', user)
        return new Response(JSON.stringify({ user, user_id: userId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ error: 'Invalid request method or missing parameters' }), {
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
