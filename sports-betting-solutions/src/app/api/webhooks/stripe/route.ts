import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { MEMBERSHIP_TIERS } from '@/lib/stripe';
import { config } from '@/lib/config';

const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled relevant event: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: any) {
  const { userId, tier } = session.metadata;
  
  if (!userId || !tier) {
    console.error('Missing userId or tier in session metadata');
    return;
  }

  const membershipTier = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

  // Update user's membership in Supabase
  const { error } = await supabase
    .from('user_profiles')
    .update({
      membership_tier: membershipTier,
      membership_end_date: endDate.toISOString(),
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user membership:', error);
    throw error;
  }

  console.log(`Updated membership for user ${userId} to ${membershipTier}`);
}

async function handleSubscriptionUpdated(subscription: any) {
  const { userId, tier } = subscription.metadata;
  
  if (!userId || !tier) {
    console.error('Missing userId or tier in subscription metadata');
    return;
  }

  const membershipTier = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS];
  const endDate = new Date(subscription.current_period_end * 1000);

  // Update user's membership in Supabase
  const { error } = await supabase
    .from('user_profiles')
    .update({
      membership_tier: membershipTier,
      membership_end_date: endDate.toISOString(),
      stripe_subscription_id: subscription.id,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`Updated subscription for user ${userId} to ${membershipTier}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Downgrade user to free tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      membership_tier: 'Free',
      membership_end_date: null,
      stripe_subscription_id: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error downgrading user membership:', error);
    throw error;
  }

  console.log(`Downgraded user ${userId} to free tier`);
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionResponse = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const subscription = subscriptionResponse as any; // Type assertion to handle Stripe response
  const { userId, tier } = subscription.metadata;
  
  if (!userId || !tier) {
    console.error('Missing userId or tier in subscription metadata');
    return;
  }

  const membershipTier = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS];
  const endDate = new Date(subscription.current_period_end * 1000);

  // Extend user's membership
  const { error } = await supabase
    .from('user_profiles')
    .update({
      membership_tier: membershipTier,
      membership_end_date: endDate.toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error extending membership:', error);
    throw error;
  }

  console.log(`Extended membership for user ${userId} to ${membershipTier}`);
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionResponse = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const subscription = subscriptionResponse as any; // Type assertion to handle Stripe response
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Downgrade user to free tier due to payment failure
  const { error } = await supabase
    .from('user_profiles')
    .update({
      membership_tier: 'Free',
      membership_end_date: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error downgrading user due to payment failure:', error);
    throw error;
  }

  console.log(`Downgraded user ${userId} to free tier due to payment failure`);
} 