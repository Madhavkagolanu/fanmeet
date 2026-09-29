import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, eventId, ticketCount, tierTitle } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Backend validation: Verify event is active, not past, and not sold out
    if (eventId && isSupabaseConfigured()) {
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('is_active, capacity, from_time, to_time, ticket_tiers')
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

      const eventEndTime = new Date(eventData.to_time || eventData.from_time).getTime();
      if (!isNaN(eventEndTime) && eventEndTime < Date.now()) {
        return NextResponse.json(
          { message: 'Cannot create an order for an event that has already ended.' },
          { status: 400 }
        );
      }

      // Check current booking count
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('ticket_count, tier_title')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'pending']);

      const bookedCount = (bookingsData || []).reduce(
        (sum: number, b: any) => sum + (Number(b.ticket_count) || 1),
        0
      );

      const remainingSeats = Math.max(0, eventData.capacity - bookedCount);
      const requestedTickets = Number(ticketCount) || 1;

      if (remainingSeats < requestedTickets) {
        return NextResponse.json(
          { message: remainingSeats === 0 ? 'Event is sold out.' : `Only ${remainingSeats} tickets available.` },
          { status: 400 }
        );
      }

      // Check tier-specific capacity if tierTitle is provided
      if (tierTitle && Array.isArray(eventData.ticket_tiers)) {
        const foundTier = eventData.ticket_tiers.find(
          (t: any) => (t.title || '').trim().toLowerCase() === String(tierTitle).trim().toLowerCase()
        );
        if (foundTier && foundTier.capacity && Number(foundTier.capacity) > 0) {
          const tierBooked = (bookingsData || []).reduce((sum: number, b: any) => {
            if ((b.tier_title || '').trim().toLowerCase() === String(tierTitle).trim().toLowerCase()) {
              return sum + (Number(b.ticket_count) || 1);
            }
            return sum;
          }, 0);
          const tierRemaining = Math.max(0, Number(foundTier.capacity) - tierBooked);
          if (tierRemaining < requestedTickets) {
            return NextResponse.json(
              {
                message:
                  tierRemaining === 0
                    ? `Passes for "${foundTier.title}" are completely sold out.`
                    : `Only ${tierRemaining} spots available for "${foundTier.title}".`,
              },
              { status: 400 }
            );
          }
        }
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
