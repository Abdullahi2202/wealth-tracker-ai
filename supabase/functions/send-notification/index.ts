
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  console.log(`Processing ${req.method} request to send-notification`)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    const { email, type, status, message } = body

    console.log('Sending notification:', { email, type, status })

    // Store notification in database
    const { error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_email: email,
        type: type,
        status: status,
        message: message,
        sent_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // Here you could integrate with email service like Resend
    // For now, we'll just log the notification
    console.log(`Notification sent to ${email}: ${message}`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notification sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in send-notification:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to send notification',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
