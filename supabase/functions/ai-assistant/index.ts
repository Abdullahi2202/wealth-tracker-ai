
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context, userInfo } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client for real data access
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch real user data if userInfo is provided
    let realDataContext = "";
    if (userInfo && userInfo.email) {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userInfo.email)
          .single();

        if (profile) {
          // Get spending data
          const { data: expenses } = await supabase
            .from('transactions')
            .select('amount, category, name, date')
            .eq('user_id', profile.id)
            .eq('type', 'expense')
            .order('date', { ascending: false })
            .limit(20);

          // Get income data
          const { data: income } = await supabase
            .from('transactions')
            .select('amount, category, name, date')
            .eq('user_id', profile.id)
            .eq('type', 'income')
            .order('date', { ascending: false })
            .limit(10);

          // Get wallet balance
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', profile.id)
            .single();

          // Calculate spending insights
          const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
          const totalIncome = income?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
          
          // Category breakdown
          const categoryTotals: Record<string, number> = {};
          expenses?.forEach(exp => {
            const category = exp.category || 'Misc';
            categoryTotals[category] = (categoryTotals[category] || 0) + Number(exp.amount);
          });

          const topSpendingCategory = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)[0];

          realDataContext = `
REAL USER FINANCIAL DATA:
- Current Wallet Balance: $${wallet?.balance || 0}
- Total Recent Expenses (last 20 transactions): $${totalExpenses}
- Total Recent Income (last 10 transactions): $${totalIncome}
- Top Spending Category: ${topSpendingCategory?.[0] || 'None'} ($${topSpendingCategory?.[1] || 0})
- Recent Expenses: ${expenses?.slice(0, 5).map(e => `$${e.amount} on ${e.name} (${e.category})`).join(', ') || 'None'}
- Recent Income: ${income?.slice(0, 3).map(i => `$${i.amount} from ${i.name}`).join(', ') || 'None'}

SPENDING INSIGHTS:
- Spending vs Income Ratio: ${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 'N/A'}%
- Category Breakdown: ${Object.entries(categoryTotals).map(([cat, amt]) => `${cat}: $${amt}`).join(', ')}
          `;
        }
      } catch (error) {
        console.error('Error fetching real data:', error);
        realDataContext = "Unable to fetch real financial data at this time.";
      }
    }

    const systemPrompt = `You are WalletMaster AI, a helpful financial assistant for the WalletMaster wallet application. You help users with:

- Wallet management and balance inquiries
- Payment processing questions
- Financial advice and budgeting based on REAL spending data
- Transaction history and analytics using actual user data
- Investment guidance and portfolio analysis
- Security and verification concerns
- General financial literacy

User Context:
${userInfo ? `
- User Name: ${userInfo.name || 'Not provided'}
- User Email: ${userInfo.email || 'Not provided'}
- Account Type: ${userInfo.isAdmin ? 'Administrator' : 'Regular User'}
` : 'No user information available'}

${realDataContext}

IMPORTANT: Use the real financial data provided above to give personalized, actionable advice. Reference specific amounts, categories, and patterns you see in their actual spending. Provide concrete suggestions based on their real financial behavior.

Be concise, helpful, and professional. Always prioritize user security and provide accurate financial guidance. You can reference the user by name when appropriate to make the conversation more personal. When giving advice, use their actual spending patterns and amounts from the real data above.

For investment advice, consider their current balance and spending habits. If they ask about investments, factor in their actual financial capacity based on the real data.

${context || 'General assistance context'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
