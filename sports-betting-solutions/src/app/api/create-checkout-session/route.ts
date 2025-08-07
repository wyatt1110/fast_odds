import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCT_IDS } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { tier, successUrl, cancelUrl } = await request.json();
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Validate tier
    const validTiers = ['tier-1', 'tier-2', 'tier-3'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get price ID for the tier
    const priceId = STRIPE_PRODUCT_IDS[tier as keyof typeof STRIPE_PRODUCT_IDS];
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/account?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/membership?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier: tier,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
} 