import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  console.log(`Processing ${req.method} request to user-management`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (req.method) {
      case 'GET':
        return await handleGetUsers(supabase)
      case 'POST':
        return await handleCreateUser(req, supabase)
      case 'PUT':
        return await handleUpdateUser(req, supabase)
      case 'DELETE':
        return await handleDeleteUser(req, supabase)
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Unhandled error in user-management:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleGetUsers(supabase: any) {
  try {
    console.log('Fetching all users...')
    
    // Fetch users from registration table
    const { data: registrationUsers, error: registrationError } = await supabase
      .from('registration')
      .select('*')
      .order('created_at', { ascending: false })

    if (registrationError) {
      console.error('Registration error:', registrationError)
    }

    // Fetch users from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Profiles error:', profilesError)
    }

    // Fetch verification requests with document URLs
    const { data: verificationRequests, error: verificationError } = await supabase
      .from('identity_verification_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (verificationError) {
      console.error('Verification error:', verificationError)
    }

    // Combine data
    let allUsers: any[] = []

    if (registrationUsers) {
      allUsers = registrationUsers.map(user => ({
        ...user,
        identity_verification_requests: []
      }))
    }

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

    // Attach verification requests and documents to users
    if (verificationRequests) {
      verificationRequests.forEach(request => {
        const user = allUsers.find(u => u.email === request.user_email || u.id === request.user_id)
        if (user) {
          if (!user.identity_verification_requests) {
            user.identity_verification_requests = []
          }
          user.identity_verification_requests.push(request)
          // Also add document info directly to user for easy access
          if (!user.documents) {
            user.documents = []
          }
          user.documents.push({
            type: request.document_type,
            number: request.document_number,
            image_url: request.image_url,
            status: request.status,
            created_at: request.created_at
          })
        }
      })
    }

    console.log(`Found ${allUsers.length} users`)
    return new Response(JSON.stringify(allUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in handleGetUsers:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch users',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleCreateUser(req: Request, supabase: any) {
  try {
    const body = await req.json()
    const { email, full_name, phone, passport_number, document_type } = body
    
    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email and full name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
      user_metadata: { full_name, phone, passport_number, document_type }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = authUser.user.id

    // Create in registration table
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
      console.error('Registration error:', regError)
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name,
        phone: phone || null
      })

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    // Create wallet with automatic wallet number assignment
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        user_email: email,
        balance: 0,
        currency: 'USD'
      })
      .select('wallet_number')
      .single()

    if (walletError) {
      console.error('Wallet error:', walletError)
    } else {
      console.log('Wallet created with number:', walletData?.wallet_number)
    }

    return new Response(JSON.stringify({ 
      user: regUser || { id: userId, email, full_name }, 
      user_id: userId,
      wallet_number: walletData?.wallet_number 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in handleCreateUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create user',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleUpdateUser(req: Request, supabase: any) {
  try {
    const body = await req.json()
    console.log('Update request body:', body)
    
    const { id, verification_status, email: userEmail, action } = body
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle verification status updates
    if (verification_status && (action === 'update_verification' || !action)) {
      console.log(`Updating verification status for user ${id} to ${verification_status}`)
      
      // Update registration table
      const { data: updatedUser, error: updateError } = await supabase
        .from('registration')
        .update({ 
          verification_status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Registration update error:', updateError)
        
        // If registration update fails, try updating by email
        if (userEmail) {
          const { data: updatedByEmail, error: emailUpdateError } = await supabase
            .from('registration')
            .update({ 
              verification_status,
              updated_at: new Date().toISOString() 
            })
            .eq('email', userEmail)
            .select()
            .single()

          if (emailUpdateError) {
            console.error('Email-based update also failed:', emailUpdateError)
            return new Response(JSON.stringify({ 
              error: 'Failed to update verification status',
              details: emailUpdateError.message 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          updatedUser = updatedByEmail
        } else {
          return new Response(JSON.stringify({ 
            error: 'Failed to update verification status',
            details: updateError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Update verification requests if email provided
      if (userEmail) {
        const { error: verifyError } = await supabase
          .from('identity_verification_requests')
          .update({ 
            status: verification_status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'Admin'
          })
          .eq('user_email', userEmail)

        if (verifyError) {
          console.error('Verification request update warning:', verifyError)
          // Don't fail the main request if this fails
        }
      }

      console.log('Verification status updated successfully')
      return new Response(JSON.stringify({ 
        success: true, 
        message: `User ${verification_status} successfully`,
        data: updatedUser 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle other updates
    const { verification_status: _, action: __, ...otherUpdates } = body
    
    if (Object.keys(otherUpdates).length > 1) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('registration')
        .update({ ...otherUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('General update error:', updateError)
        return new Response(JSON.stringify({ 
          error: 'Failed to update user',
          message: updateError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(updatedUser), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'No valid updates provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in handleUpdateUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process update',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleDeleteUser(req: Request, supabase: any) {
  try {
    const body = await req.json()
    const { id: deleteId, email } = body
    
    if (!deleteId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete from registration
    await supabase.from('registration').delete().eq('id', deleteId)

    // Delete verification requests
    if (email) {
      await supabase.from('identity_verification_requests').delete().eq('user_email', email)
    }

    // Delete from auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(deleteId)
    
    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError)
      return new Response(JSON.stringify({ error: authDeleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in handleDeleteUser:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to delete user',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
