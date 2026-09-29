'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, ArrowRight, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getBookingsBySearch } from '@/lib/supabase/db';
import { Booking } from '@/types';
import TicketBadge from '@/components/TicketBadge';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function BookingsPage() {
  const { user, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function loadUserBookings() {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getBookingsBySearch('', user.id);
        setBookings(data);
      } catch (err) {
        console.error('Error fetching user bookings:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isLoading) {
      loadUserBookings();
    }
  }, [user, isLoading]);

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-[80vh] bg-white py-20 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-black border-t-transparent rounded-full mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Loading your passes...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in: Show protected login prompt
  if (!user) {
    return (
      <div className="min-h-[85vh] bg-neutral-50 py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto text-neutral-800">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-black text-white rounded-full mb-3 shadow-xs">
              MEMBER ACCESS ONLY
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-950">
              Sign In to View Passes
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-2 leading-relaxed">
              Your booked passes and scannable QR tickets are securely attached to your Google account. Sign in to view your tickets.
            </p>
          </div>

          <div className="pt-2">
            <GoogleSignInButton label="Sign In with Google" />
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <Link
              href="/"
              className="text-xs font-bold uppercase text-neutral-600 hover:text-black transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <span className="inline-block text-xs font-black tracking-widest uppercase px-3 py-1 bg-black text-white rounded-full mb-3 shadow-xs">
            MY DIGITAL PASSES
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase">
            My Booked Passes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-medium max-w-md mx-auto">
            All passes booked under <span className="font-bold text-black">{user.email}</span>. Show your QR code at the venue.
          </p>
        </div>

        {/* Bookings Display */}
        {bookings.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
            <Ticket className="w-12 h-12 text-neutral-300 mx-auto" />
            <div>
              <h3 className="font-black text-neutral-900 uppercase text-base">No Passes Yet</h3>
              <p className="text-xs text-neutral-500 mt-1">
                You haven't booked any fanmeet passes under this account yet.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-black uppercase rounded-2xl hover:bg-neutral-800 transition-all shadow-md"
            >
              <span>Explore Upcoming Fanmeets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="cursor-pointer group bg-white rounded-3xl border-2 border-neutral-200 hover:border-black p-6 transition-all hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full">
                      {booking.qr_ticket_code}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      CONFIRMED
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-neutral-950 leading-snug group-hover:underline">
                    {booking.event?.title || 'Fanmeet Event'}
                  </h3>

                  <div className="mt-4 space-y-1.5 text-xs text-neutral-600">
                    {booking.event?.from_time && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                        <span>
                          {new Date(booking.event.from_time).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {booking.event?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                        <span className="truncate">{booking.event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Attendee</span>
                    <span className="font-bold text-neutral-900">{booking.attendee_name}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      {booking.tier_title ? `Tier: ${booking.tier_title}` : 'Passes'}
                    </span>
                    <span className="font-bold text-neutral-900">{booking.ticket_count} Pass (₹{booking.amount_paid})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pass Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedBooking(null)}
            />
            <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
              <TicketBadge booking={selectedBooking} />
              <button
                onClick={() => setSelectedBooking(null)}
                className="mt-4 w-full py-3 bg-white border border-neutral-300 rounded-2xl text-xs font-bold uppercase tracking-wider text-neutral-900 hover:border-black transition-all shadow-md"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
