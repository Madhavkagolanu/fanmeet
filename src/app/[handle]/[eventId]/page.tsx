'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Users,
  ShieldCheck,
  Share2,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { getCreatorByHandle, getEventById } from '@/lib/supabase/db';
import { EventItem, Creator, Booking } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { initializeRazorpayPayment } from '@/lib/razorpay-client';
import { getAppBaseUrl } from '@/lib/utils';
import QRCodeModal from '@/components/QRCodeModal';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import TicketBadge from '@/components/TicketBadge';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const handle = (params?.handle as string)?.toLowerCase();
  const eventId = params?.eventId as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventUrl, setEventUrl] = useState('');

  // Booking Form State
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeAddress, setAttendeeAddress] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (!handle || !eventId) return;

    setEventUrl(typeof window !== 'undefined' ? window.location.href : `${getAppBaseUrl()}/${handle}/${eventId}`);

    async function loadEventData() {
      try {
        setLoading(true);
        const [foundCreator, foundEvent] = await Promise.all([
          getCreatorByHandle(handle),
          getEventById(eventId),
        ]);
        setCreator(foundCreator);
        setEvent(foundEvent);
      } catch (err) {
        console.error('Error loading event data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEventData();
  }, [handle, eventId]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      if (!attendeeName) setAttendeeName(user.name || '');
      if (!attendeeEmail) setAttendeeEmail(user.email || '');
      if (!attendeePhone && user.phone_number) setAttendeePhone(user.phone_number);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black uppercase text-neutral-900 mb-2">
          Event Not Found
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          The requested event ID could not be located for @{handle}.
        </p>
        <Link
          href={`/${handle}`}
          className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-bold uppercase rounded-2xl hover:bg-neutral-800 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to @{handle}</span>
        </Link>
      </div>
    );
  }

  const bookedCount = event.booked_count || 0;
  const remainingSeats = Math.max(0, event.capacity - bookedCount);
  const isInactive = event.is_active === false;
  const isSoldOut = remainingSeats === 0 || isInactive;
  const totalPrice = ticketCount * event.offer_price;
  const totalSavings = ticketCount * Math.max(0, event.mrp - event.offer_price);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (isInactive) {
      setBookingError('Bookings for this event are currently paused by the creator.');
      return;
    }

    if (remainingSeats < ticketCount) {
      setBookingError('Sorry, this event is already fully booked.');
      return;
    }

    if (!attendeeName.trim() || !attendeeEmail.trim() || !attendeePhone.trim()) {
      setBookingError('Please fill in your name, email, and phone number.');
      return;
    }

    setIsProcessing(true);

    try {
      await initializeRazorpayPayment({
        amount: totalPrice,
        eventId: event.id,
        ticketCount: ticketCount,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        attendeeAddress,
        onSuccess: async (paymentData) => {
          // Verify on backend
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: event.id,
                userId: user?.id || null,
                ticketCount,
                amountPaid: totalPrice,
                attendeeName,
                attendeeEmail,
                attendeePhone,
                attendeeAddress,
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
                signature: paymentData.signature,
              }),
            });

            const result = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(result.message || 'Payment verification failed');
            }

            const newBooking: Booking = {
              id: result.booking?.id || `bk_${Date.now()}`,
              event_id: event.id,
              user_id: user?.id,
              payment_id: paymentData.paymentId,
              razorpay_order_id: paymentData.orderId,
              razorpay_payment_id: paymentData.paymentId,
              razorpay_signature: paymentData.signature,
              ticket_count: ticketCount,
              amount_paid: totalPrice,
              attendee_name: attendeeName,
              attendee_email: attendeeEmail,
              attendee_phone: attendeePhone,
              attendee_address: attendeeAddress,
              status: 'confirmed',
              qr_ticket_code: result.booking?.qr_ticket_code || `FMT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              created_at: new Date().toISOString(),
              event: event,
            };

            // Update UI state with confirmed booking
            setEvent((prev) => (prev ? { ...prev, booked_count: (prev.booked_count || 0) + ticketCount } : prev));
            setConfirmedBooking(newBooking);
            setIsProcessing(false);

            // Confetti burst
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch (err: any) {
            setBookingError(err?.message || 'Failed to confirm booking ticket.');
            setIsProcessing(false);
          }
        },
        onError: (err: any) => {
          setBookingError(err?.message || 'Payment failed or was cancelled.');
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setBookingError(err?.message || 'Failed to start payment checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Navigation Breadcrumb */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            href={`/${handle}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Events by @{handle}</span>
          </Link>

          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 bg-white hover:border-black text-xs font-bold text-neutral-800 transition-all shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Share Event</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Event Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Event Cover Banner */}
            <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-md">
              <Image
                src={event.image_url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'}
                alt={event.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                {isInactive ? (
                  <span className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                    BOOKINGS CLOSED
                  </span>
                ) : isSoldOut ? (
                  <span className="px-3.5 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                    SOLD OUT
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 bg-white/95 backdrop-blur-xs text-neutral-900 text-xs font-black uppercase tracking-wider rounded-full border border-neutral-300 shadow-md">
                    {remainingSeats} Seats Available
                  </span>
                )}
              </div>
            </div>

            {/* Title & Creator */}
            <div>
              <Link
                href={`/${handle}`}
                className="inline-block text-xs font-extrabold text-neutral-500 hover:text-black uppercase tracking-wider mb-2"
              >
                Hosted by @{handle}
              </Link>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 uppercase leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Event Timing & Location Card */}
            <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Date & Time</span>
                  <p className="text-sm font-bold text-neutral-900">
                    {new Date(event.from_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-neutral-600 font-medium mt-0.5">
                    {new Date(event.from_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(event.to_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 pt-3 border-t border-neutral-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Venue Location</span>
                    <p className="text-sm font-bold text-neutral-900 leading-snug">
                      {event.location}
                    </p>
                    {event.location_address && event.location_address !== event.location && (
                      <p className="text-xs text-neutral-600 font-medium mt-0.5">
                        {event.location_address}
                      </p>
                    )}
                  </div>
                </div>

                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white hover:bg-black transition-all text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-black uppercase text-neutral-950 mb-3">
                About The Event
              </h2>
              <div className="text-sm text-neutral-700 font-medium leading-relaxed whitespace-pre-line bg-white p-6 rounded-3xl border border-neutral-200">
                {event.description}
              </div>
            </div>

            {/* Capacity Progress Status */}
            <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-neutral-500">Live Capacity</span>
                <span className="text-neutral-900">
                  {bookedCount} / {event.capacity} Booked
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (bookedCount / event.capacity) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 font-medium">
                {isSoldOut
                  ? 'All passes are claimed. Registration is now closed.'
                  : `${remainingSeats} spot(s) remaining for this session.`}
              </p>
            </div>
          </div>

          {/* Sticky Booking Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white rounded-3xl border-2 border-black p-6 sm:p-8 shadow-xl">
              {confirmedBooking ? (
                <div className="text-center py-4 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-neutral-950">
                      Booking Confirmed!
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1">
                      Your ticket pass is ready. Show your QR code at the venue.
                    </p>
                  </div>

                  <TicketBadge booking={confirmedBooking} />

                  <button
                    onClick={() => {
                      setConfirmedBooking(null);
                    }}
                    className="w-full py-3 px-4 rounded-2xl border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:border-black transition-all"
                  >
                    Book Another Ticket
                  </button>
                </div>
              ) : isInactive ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-neutral-950 mb-2">
                    Bookings Paused
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mb-6">
                    Ticket registrations for this event are currently paused or closed by @{handle}.
                  </p>
                  <Link
                    href={`/${handle}`}
                    className="block w-full py-3.5 px-6 rounded-2xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all text-center"
                  >
                    Check Other Events by @{handle}
                  </Link>
                </div>
              ) : isSoldOut ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-neutral-950 mb-2">
                    Already Booked
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mb-6">
                    This event has reached maximum capacity ({event.capacity} attendees). All tickets are claimed.
                  </p>
                  <Link
                    href={`/${handle}`}
                    className="block w-full py-3.5 px-6 rounded-2xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all text-center"
                  >
                    Check Other Events by @{handle}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Pricing Header */}
                  <div>
                    <span className="text-[10px] uppercase font-black text-neutral-400 tracking-widest block">
                      Ticket Price
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black text-neutral-950">
                        ₹{event.offer_price}
                      </span>
                      {event.mrp > event.offer_price && (
                        <span className="text-sm font-bold text-neutral-400 line-through">
                          ₹{event.mrp}
                        </span>
                      )}
                      <span className="text-xs font-bold text-neutral-500">
                        / ticket
                      </span>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-800 mb-2">
                      Quantity of Passes
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((num) => {
                        if (num > remainingSeats) return null;
                        const isSelected = ticketCount === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setTicketCount(num)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all border ${
                              isSelected
                                ? 'bg-black text-white border-black shadow-xs'
                                : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-black'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attendee Details Form / Login Guard */}
                  {!user ? (
                    <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-800">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-neutral-900">
                          Sign In to Book Passes
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Sign in with Google to secure your passes and view your digital tickets anytime in My Bookings.
                        </p>
                      </div>
                      <GoogleSignInButton label="Sign In with Google to Continue" />
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-2">
                      <div className="p-3 bg-neutral-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-neutral-800">Signed in as:</span>
                        </div>
                        <span className="font-mono text-neutral-600 truncate max-w-[200px]">
                          {user.email}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={attendeeName}
                          onChange={(e) => setAttendeeName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={attendeeEmail}
                          onChange={(e) => setAttendeeEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={attendeePhone}
                          onChange={(e) => setAttendeePhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                          City / Location (Optional)
                        </label>
                        <input
                          type="text"
                          value={attendeeAddress}
                          onChange={(e) => setAttendeeAddress(e.target.value)}
                          placeholder="Bengaluru"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary Breakdown */}
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>{ticketCount} x Pass (₹{event.offer_price})</span>
                      <span className="font-bold text-neutral-900">₹{totalPrice}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount Savings</span>
                        <span>-₹{totalSavings}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-200 flex justify-between font-black text-sm text-neutral-950">
                      <span>Total Amount</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Checkout Button */}
                  {user ? (
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Processing Ticket Pass...</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />
                          <span>Pay ₹{totalPrice} & Confirm Passes</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-4 px-6 rounded-2xl bg-neutral-200 text-neutral-500 font-black text-sm uppercase tracking-wider text-center cursor-not-allowed">
                      Sign In to Proceed
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Instant Pass Confirmation • Secure Razorpay</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Event QR Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={event.title}
        subtitle={`Hosted by @${handle}`}
        url={eventUrl}
      />
    </div>
  );
}
