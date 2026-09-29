import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      userId,
      ticketCount,
      amountPaid,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      attendeeAddress,
      tierTitle,
      paymentId,
      orderId,
      signature,
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRazorpayConfigured = Boolean(
      keySecret && !keySecret.includes('sample')
    );

    // If live Razorpay is configured, verify cryptographic HMAC SHA256 signature
    if (isRazorpayConfigured && signature && orderId && paymentId) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret as string)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        return NextResponse.json(
          { message: 'Invalid payment signature verification' },
          { status: 400 }
        );
      }
    }

    // Call Supabase RPC for atomic capacity lock if configured
    if (isSupabaseConfigured()) {
      // Validate event date and status
      const { data: eventItem, error: eventErr } = await supabase
        .from('events')
        .select('id, capacity, from_time, to_time, is_active')
        .eq('id', eventId)
        .maybeSingle();

      if (eventErr || !eventItem) {
        return NextResponse.json(
          { message: 'Event not found or invalid' },
          { status: 404 }
        );
      }

      if (!eventItem.is_active) {
        return NextResponse.json(
          { message: 'Bookings for this event are closed' },
          { status: 400 }
        );
      }

      const eventEndTime = new Date(eventItem.to_time || eventItem.from_time).getTime();
      if (!isNaN(eventEndTime) && eventEndTime < Date.now()) {
        return NextResponse.json(
          { message: 'Cannot book passes for an event that has already ended' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc('book_event_tickets', {
        p_event_id: eventId,
        p_user_id: userId || null,
        p_ticket_count: ticketCount,
        p_amount_paid: amountPaid,
        p_attendee_name: attendeeName,
        p_attendee_email: attendeeEmail,
        p_attendee_phone: attendeePhone,
        p_attendee_address: attendeeAddress || '',
        p_payment_id: paymentId,
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_razorpay_signature: signature || '',
        p_tier_title: tierTitle || null,
      });

      if (error) {
        console.error('Supabase RPC Error:', error);
        return NextResponse.json(
          { message: error.message || 'Failed to book tickets. Event may be sold out.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        booking: data,
      });
    }

    // Fallback QR code for local preview
    const qrTicketCode = `FMT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      booking: {
        id: `bk_${Date.now()}`,
        qr_ticket_code: qrTicketCode,
        ticket_count: ticketCount,
        amount_paid: amountPaid,
        tier_title: tierTitle || undefined,
        event_id: eventId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
      },
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { message: error?.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
