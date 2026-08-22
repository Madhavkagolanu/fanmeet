import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, eventId, ticketCount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Backend validation: Verify event is active
    if (eventId && isSupabaseConfigured()) {
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('is_active, capacity')
        .eq('id', eventId)
        .maybeSingle();

      if (eventErr || !eventData) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 });
      }

      if (eventData.is_active === false) {
        return NextResponse.json(
          { message: 'Bookings for this event are currently paused or closed by the creator.' },
          { status: 400 }
        );
      }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isRazorpayConfigured = Boolean(
      keyId &&
      keySecret &&
      !keyId.includes('sample') &&
      !keySecret.includes('sample')
    );

    if (!isRazorpayConfigured) {
      // Mock Order Generation for seamless preview
      return NextResponse.json({
        isMock: true,
        orderId: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        keyId: 'mock_key',
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId as string,
      key_secret: keySecret as string,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${eventId ? eventId.substring(0, 8) : 'fmt'}_${Date.now()}`,
      notes: {
        eventId: eventId || '',
        ticketCount: String(ticketCount || 1),
      },
    });

    return NextResponse.json({
      isMock: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { message: error?.message || 'Error generating Razorpay order' },
      { status: 500 }
    );
  }
}
