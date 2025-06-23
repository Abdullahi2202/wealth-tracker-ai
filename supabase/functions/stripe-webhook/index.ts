
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
  console.error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  console.log('=== STRIPE WEBHOOK HANDLER STARTED ===');
  console.log('Event type:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    console.log('Webhook signature present:', !!sig);
    console.log('Body length:', body.length);

    let event;
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        console.log('Webhook signature verified successfully');
      } else {
        console.log('No webhook secret configured, parsing body directly');
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing webhook event:', event.type);
    console.log('Event ID:', event.id);

    const now = new Date().toISOString();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('=== CHECKOUT SESSION COMPLETED ===');
        console.log('Session ID:', session.id);
        console.log('Session metadata:', session.metadata);

        if (session.metadata?.type === 'wallet_topup') {
          console.log('Processing wallet topup completion');

          // Find the topup session
          const { data: topupSession, error: sessionError } = await supabase
            .from('topup_sessions')
            .select('*')
            .eq('stripe_session_id', session.id)
            .single();

          if (sessionError || !topupSession) {
            console.error('Topup session not found:', sessionError);
            break;
          }

          console.log('Found topup session:', topupSession.id);

          // Update topup session status to completed
          const { error: updateSessionError } = await supabase
            .from('topup_sessions')
            .update({ 
              status: 'completed',
              updated_at: now
            })
            .eq('stripe_session_id', session.id);

          if (updateSessionError) {
            console.error('Error updating topup session:', updateSessionError);
          } else {
            console.log('Topup session updated successfully');
          }

          // Get current wallet balance
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', topupSession.user_id)
            .single();

          if (walletError) {
            console.error('Error fetching wallet:', walletError);
            break;
          }

          const currentBalance = Number(wallet?.balance || 0);
          const topupAmountDollars = Number(topupSession.amount) / 100;
          const newBalance = currentBalance + topupAmountDollars;

          console.log('Wallet update:', {
            currentBalance,
            topupAmountDollars,
            newBalance,
            userId: topupSession.user_id
          });

          // Update wallet balance
          const { error: walletUpdateError } = await supabase
            .from('wallets')
            .update({ 
              balance: newBalance,
              updated_at: now
            })
            .eq('user_id', topupSession.user_id);

          if (walletUpdateError) {
            console.error('Error updating wallet balance:', walletUpdateError);
          } else {
            console.log('Wallet balance updated successfully');
          }

          // Record transaction
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: topupSession.user_id,
              name: 'Wallet Top-up',
              amount: topupAmountDollars,
              type: 'income',
              category: 'Top-up',
              date: now.split('T')[0],
              status: 'completed'
            });

          if (transactionError) {
            console.error('Error recording transaction:', transactionError);
          } else {
            console.log('Transaction recorded successfully');
          }

          console.log('=== WALLET TOPUP COMPLETED SUCCESSFULLY ===');
        } else {
          console.log('Session metadata type is not wallet_topup:', session.metadata?.type);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);
        
        const { error } = await supabase
          .from('payment_transactions')
          .update({ 
            status: 'succeeded',
            processed_at: now
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating payment transaction:', error);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        console.log('Payment intent failed:', failedPayment.id);
        
        const { error } = await supabase
          .from('payment_transactions')
          .update({ 
            status: 'failed',
            processed_at: now
          })
          .eq('stripe_payment_intent_id', failedPayment.id);

        if (error) {
          console.error('Error updating failed payment transaction:', error);
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object;
        console.log('Payout paid:', payout.id);
        
        const { error } = await supabase
          .from('payouts')
          .update({ 
            status: 'paid',
            updated_at: now
          })
          .eq('stripe_payout_id', payout.id);

        if (error) {
          console.error('Error updating payout status:', error);
        }
        break;
      }

      case 'payout.failed': {
        const failedPayout = event.data.object;
        console.log('Payout failed:', failedPayout.id);
        
        // Update payout status
        const { error: payoutUpdateError } = await supabase
          .from('payouts')
          .update({ 
            status: 'failed',
            updated_at: now
          })
          .eq('stripe_payout_id', failedPayout.id);

        if (payoutUpdateError) {
          console.error('Error updating failed payout:', payoutUpdateError);
          break;
        }

        // Refund the amount back to user's wallet
        const { data: payoutRecord, error: payoutFetchError } = await supabase
          .from('payouts')
          .select('user_id, amount')
          .eq('stripe_payout_id', failedPayout.id)
          .single();

        if (payoutFetchError || !payoutRecord) {
          console.error('Error fetching payout record:', payoutFetchError);
          break;
        }

        const { data: userWallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', payoutRecord.user_id)
          .single();

        if (walletFetchError || !userWallet) {
          console.error('Error fetching user wallet for refund:', walletFetchError);
          break;
        }

        const refundAmountDollars = Number(payoutRecord.amount) / 100;
        const currentBalance = Number(userWallet.balance);
        const refundBalance = currentBalance + refundAmountDollars;
        
        // Update wallet with refund
        const { error: walletRefundError } = await supabase
          .from('wallets')
          .update({ 
            balance: refundBalance,
            updated_at: now
          })
          .eq('user_id', payoutRecord.user_id);

        if (walletRefundError) {
          console.error('Error refunding to wallet:', walletRefundError);
          break;
        }

        // Record refund transaction
        const { error: refundTransactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: payoutRecord.user_id,
            name: 'Payout Failed - Refund',
            amount: refundAmountDollars,
            type: 'income',
            category: 'Refund',
            date: now.split('T')[0],
            status: 'completed'
          });

        if (refundTransactionError) {
          console.error('Error recording refund transaction:', refundTransactionError);
        }

        console.log('Payout failed, wallet refunded successfully');
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        console.log('Account updated:', account.id);
        
        const { error } = await supabase
          .from('connect_accounts')
          .update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            updated_at: now
          })
          .eq('stripe_account_id', account.id);

        if (error) {
          console.error('Error updating connect account:', error);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETED ===');
    return new Response(
      JSON.stringify({ received: true }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===');
    console.error('Error details:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
