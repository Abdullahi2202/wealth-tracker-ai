
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
        console.log('Fetching all users with verification data...')
        
        // Fetch users from registration table with their verification requests
        const { data: users, error: usersError } = await supabase
          .from('registration')
          .select(`
            *,
            identity_verification_requests (
              id,
              document_type,
              document_number,
              image_url,
              status,
              created_at,
              reviewed_by,
              reviewed_at
            )
          `)
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return new Response(JSON.stringify({ error: usersError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Also try to fetch from profiles table to get additional user data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        let allUsers = users || []

        // Merge profile data if available
        if (profiles && !profilesError) {
          profiles.forEach(profile => {
            const existingUser = allUsers.find(user => user.email === profile.email)
            if (!existingUser && profile.email) {
              // Add profile as a user if not already in registration
              allUsers.push({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                phone: profile.phone,
                created_at: profile.created_at,
                verification_status: 'pending',
                identity_verification_requests: []
              })
            }
          })
        }

        console.log('Total users found:', allUsers.length)
        return new Response(JSON.stringify(allUsers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'POST':
        const createBody = await req.json()
        console.log('Create request body:', createBody)
        
        const { email, full_name, phone, passport_number, document_type } = createBody
        
        if (!email || !full_name) {
          return new Response(JSON.stringify({ error: 'Email and full name are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create user in auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
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

        const userId = authUser.user.id

        // Create user in registration table
        const { data: regUser, error: regError } = await supabase
          .from('registration')
          .insert({
            id: userId,
            email,
            full_name,
            phone: phone || null,
            passport_number: passport_number || null,
            document_type: document_type || 'passport',
            verification_status: 'pending',
            password: 'temp_password'
          })
          .select()
          .single()

        if (regError) {
          console.error('Error creating registration record:', regError)
        }

        // Create user in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name,
            phone: phone || null
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        // Create wallet for user
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            user_email: email,
            balance: 0,
            currency: 'USD'
          })

        if (walletError) {
          console.error('Error creating wallet:', walletError)
        }

        console.log('User created successfully:', userId)
        return new Response(JSON.stringify({ 
          user: regUser || { id: userId, email, full_name }, 
          user_id: userId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'PUT':
        const updateBody = await req.json()
        console.log('Update request body:', updateBody)
        
        const { id, action, verification_status, ...updates } = updateBody
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Handle verification status updates
        if (verification_status) {
          // Update verification status in registration table
          const { error: regUpdateError } = await supabase
            .from('registration')
            .update({ 
              verification_status,
              updated_at: new Date().toISOString() 
            })
            .eq('id', id)

          if (regUpdateError) {
            console.error('Error updating registration verification status:', regUpdateError)
          }

          // Update related identity verification requests
          const { error: verifyUpdateError } = await supabase
            .from('identity_verification_requests')
            .update({ 
              status: verification_status,
              reviewed_at: new Date().toISOString(),
              reviewed_by: 'Admin'
            })
            .eq('user_email', updates.email || '')

          if (verifyUpdateError) {
            console.error('Error updating verification request:', verifyUpdateError)
          }
        }

        // Update other user details
        const { data: updatedUser, error: updateError } = await supabase
          .from('registration')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating user:', updateError)
          return new Response(JSON.stringify({ error: 'Failed to update user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Also update profiles table if relevant fields changed
        if (updates.full_name || updates.phone || updates.email) {
          const profileUpdates: any = {}
          if (updates.full_name) profileUpdates.full_name = updates.full_name
          if (updates.phone) profileUpdates.phone = updates.phone
          if (updates.email) profileUpdates.email = updates.email
          
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', id)

          if (profileUpdateError) {
            console.error('Error updating profile:', profileUpdateError)
          }
        }

        console.log('User updated successfully:', updatedUser)
        return new Response(JSON.stringify(updatedUser), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        const deleteBody = await req.json()
        console.log('Delete request body:', deleteBody)
        
        const { id: deleteId } = deleteBody
        
        if (!deleteId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Delete from registration table first
        const { error: regDeleteError } = await supabase
          .from('registration')
          .delete()
          .eq('id', deleteId)

        // Delete identity verification requests
        const { error: verifyDeleteError } = await supabase
          .from('identity_verification_requests')
          .delete()
          .eq('user_email', deleteBody.email || '')

        // Delete from auth (this will cascade to profiles due to foreign key)
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(deleteId)
        
        if (authDeleteError) {
          console.error('Error deleting user from auth:', authDeleteError)
          return new Response(JSON.stringify({ error: authDeleteError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User deleted successfully:', deleteId)
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('User management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
