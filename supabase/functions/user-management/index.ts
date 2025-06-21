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
        
        // First, fetch users from registration table
        const { data: registrationUsers, error: registrationError } = await supabase
          .from('registration')
          .select('*')
          .order('created_at', { ascending: false })

        if (registrationError) {
          console.error('Error fetching registration users:', registrationError)
        }

        // Fetch users from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
        }

        // Fetch all identity verification requests
        const { data: verificationRequests, error: verificationError } = await supabase
          .from('identity_verification_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (verificationError) {
          console.error('Error fetching verification requests:', verificationError)
        }

        // Combine and merge the data
        let allUsers: any[] = []

        // Add registration users
        if (registrationUsers) {
          allUsers = registrationUsers.map(user => ({
            ...user,
            identity_verification_requests: []
          }))
        }

        // Add profile users not already in registration
        if (profiles) {
          profiles.forEach(profile => {
            const existingUser = allUsers.find(user => user.email === profile.email || user.id === profile.id)
            if (!existingUser && profile.email) {
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

        // Attach verification requests to users
        if (verificationRequests) {
          verificationRequests.forEach(request => {
            const user = allUsers.find(u => u.email === request.user_email || u.id === request.user_id)
            if (user) {
              if (!user.identity_verification_requests) {
                user.identity_verification_requests = []
              }
              user.identity_verification_requests.push(request)
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
        let updateBody
        try {
          updateBody = await req.json()
        } catch (parseError) {
          console.error('Error parsing request body:', parseError)
          return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Update request body:', JSON.stringify(updateBody, null, 2))
        
        const { id, verification_status, email: userEmail, action } = updateBody
        
        if (!id) {
          console.error('User ID is required but not provided')
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log(`Processing verification status update: User ID: ${id}, Status: ${verification_status}, Action: ${action}`)

        // Handle verification status updates specifically
        if (verification_status && (action === 'update_verification' || !action)) {
          console.log('Updating verification status in registration table...')
          
          // Update verification status in registration table
          const { data: regUpdateData, error: regUpdateError } = await supabase
            .from('registration')
            .update({ 
              verification_status,
              updated_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select()

          if (regUpdateError) {
            console.error('Error updating registration verification status:', regUpdateError)
            return new Response(JSON.stringify({ 
              error: 'Failed to update user verification status',
              details: regUpdateError.message 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('Registration update result:', regUpdateData)

          // Update related identity verification requests if user email is provided
          if (userEmail) {
            console.log('Updating verification requests for email:', userEmail)
            
            const { data: verifyUpdateData, error: verifyUpdateError } = await supabase
              .from('identity_verification_requests')
              .update({ 
                status: verification_status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'Admin'
              })
              .eq('user_email', userEmail)
              .select()

            if (verifyUpdateError) {
              console.error('Error updating verification request:', verifyUpdateError)
            } else {
              console.log('Verification requests updated:', verifyUpdateData)
            }
          }

          console.log('Verification status update completed successfully')
          return new Response(JSON.stringify({ 
            success: true, 
            message: `User ${verification_status} successfully`,
            data: regUpdateData 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Handle other user updates
        const { verification_status: _, action: __, ...otherUpdates } = updateBody
        
        if (Object.keys(otherUpdates).length > 1) { // More than just 'id'
          console.log('Updating other user details...')
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('registration')
            .update({ ...otherUpdates, updated_at: new Date().toISOString() })
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
          if (otherUpdates.full_name || otherUpdates.phone || otherUpdates.email) {
            const profileUpdates: any = {}
            if (otherUpdates.full_name) profileUpdates.full_name = otherUpdates.full_name
            if (otherUpdates.phone) profileUpdates.phone = otherUpdates.phone
            if (otherUpdates.email) profileUpdates.email = otherUpdates.email
            
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
        }

        return new Response(JSON.stringify({ error: 'No valid updates provided' }), {
          status: 400,
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
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
