import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  const orderId = req.nextUrl.searchParams.get('order_id');

  if (!sessionId || !orderId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/payment-failed', req.url));
    }

    await supabase
      .from('orders')
      .update({
        status: 'received',
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.redirect(new URL('/order-confirmed', req.url));
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
