
import { corsHeaders } from '../_shared/cors.ts'

// This webhook handler is deprecated - we now use success URL verification instead
Deno.serve(async (req) => {
  console.log('Webhook handler called - this is deprecated, payments are now verified via success URL')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return new Response(JSON.stringify({ 
    message: 'Webhook handler deprecated - using success URL verification instead' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
