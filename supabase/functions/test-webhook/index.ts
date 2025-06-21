
import { corsHeaders } from '../_shared/cors.ts'

// This function is no longer needed - we use success URL verification instead
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return new Response(JSON.stringify({ 
    message: 'Test webhook function deprecated - using success URL verification instead' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
