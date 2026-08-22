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
