import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Only cancel orders that are still pending payment
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (order && order.status === 'pending_payment') {
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending_payment');
  }

  return NextResponse.redirect(new URL('/order-cancelled', req.url));
}
