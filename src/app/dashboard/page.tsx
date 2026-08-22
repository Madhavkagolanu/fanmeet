'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Users,
  DollarSign,
  QrCode,
  Share2,
  Edit,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEventsByCreatorId, getBookingsByCreator, updateEventCapacity } from '@/lib/supabase/db';
import { EventItem, Booking, Creator } from '@/types';
import QRCodeModal from '@/components/QRCodeModal';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function DashboardPage() {
  const { user, creator } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventForQr, setSelectedEventForQr] = useState<{ title: string; url: string } | null>(null);

  // Capacity Edit State
  const [editingCapacityEventId, setEditingCapacityEventId] = useState<string | null>(null);
  const [tempCapacity, setTempCapacity] = useState<number>(0);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [capacitySuccess, setCapacitySuccess] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const creatorId = creator?.id || `creator-${user.id}`;
      const [userEvents, creatorBookings] = await Promise.all([
        getEventsByCreatorId(creatorId, user.id),
        getBookingsByCreator(creatorId, user.id),
      ]);

      setEvents(userEvents);
      setBookings(creatorBookings);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, creator]);

  const handleUpdateCapacity = async (eventId: string, currentBooked: number) => {
    setCapacityError(null);
    setCapacitySuccess(null);

    if (tempCapacity < currentBooked) {
      setCapacityError(`Cannot reduce capacity to ${tempCapacity}: ${currentBooked} tickets are already confirmed.`);
      return;
    }

    if (tempCapacity < 1) {
      setCapacityError('Capacity must be at least 1.');
      return;
    }

    const res = await updateEventCapacity(eventId, tempCapacity);
    if (!res.success) {
      setCapacityError(res.error || 'Failed to update capacity');
      return;
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, capacity: tempCapacity } : e))
    );
    setCapacitySuccess(`Capacity updated to ${tempCapacity}!`);
    setTimeout(() => {
      setEditingCapacityEventId(null);
      setCapacitySuccess(null);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black uppercase text-neutral-950 mb-2">
          Creator Dashboard
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          Please sign in with Google to access your creator events and attendee records.
        </p>
        <GoogleSignInButton />
      </div>
    );
  }

  const totalAttendees = events.reduce((sum, e) => sum + (e.booked_count || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.booked_count || 0) * e.offer_price, 0);

  return (
    <div className="min-h-screen bg-white py-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
          <div>
            <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
              @{creator?.handle || 'creator'} • Dashboard
            </span>
            <h1 className="text-3xl font-black uppercase text-neutral-950 mt-0.5">
              Event Management & Sales
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {creator && (
              <Link
                href={`/${creator.handle}`}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-black text-xs font-bold uppercase transition-all flex items-center gap-1.5"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              href="/launch"
              className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Active Events
            </span>
            <span className="text-3xl font-black text-neutral-950 mt-1 block">
              {events.length}
            </span>
          </div>

          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Attendees Booked
            </span>
            <span className="text-3xl font-black text-neutral-950 mt-1 block">
              {totalAttendees}
            </span>
          </div>

          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Ticket Revenue
            </span>
            <span className="text-3xl font-black text-neutral-950 mt-1 block">
              ₹{totalRevenue}
            </span>
          </div>
        </div>

        {/* Events List & Capacity Controls */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase text-neutral-950">
            Your Hosted Fanmeets & Jams
          </h2>

          {events.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="font-bold text-neutral-800 uppercase text-sm">No Events Created Yet</h3>
              <p className="text-xs text-neutral-500 mb-4 mt-1">Create your first fanmeet or dance jam session now.</p>
              <Link
                href="/launch"
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-black text-white text-xs font-bold uppercase"
              >
                <span>Launch New Event</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((evt) => {
                const booked = evt.booked_count || 0;
                const remaining = Math.max(0, evt.capacity - booked);
                const isEditing = editingCapacityEventId === evt.id;
                const eventUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/${creator?.handle || 'creator'}/${evt.id}`
                  : `/${creator?.handle || 'creator'}/${evt.id}`;

                return (
                  <div
                    key={evt.id}
                    className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm hover:border-black transition-all space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                          UUID: {evt.id}
                        </span>
                        <h3 className="text-xl font-black text-neutral-950 uppercase mt-0.5">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-neutral-500 font-medium mt-1">
                          {evt.location} • {new Date(evt.from_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEventForQr({ title: evt.title, url: eventUrl })}
                          className="p-2 border border-neutral-300 rounded-xl hover:border-black text-neutral-800 transition-colors text-xs font-bold flex items-center gap-1.5"
                          title="Share Event QR"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>QR Pass</span>
                        </button>

                        <Link
                          href={`/${creator?.handle || 'creator'}/${evt.id}`}
                          className="p-2 bg-neutral-100 hover:bg-black hover:text-white rounded-xl text-neutral-800 transition-colors text-xs font-bold flex items-center gap-1"
                        >
                          <span>Live Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Capacity & Price Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">Price</span>
                        <span className="font-bold text-neutral-900 text-sm">₹{evt.offer_price} (MRP ₹{evt.mrp})</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tickets Booked</span>
                        <span className="font-bold text-neutral-900 text-sm">{booked} Attendees</span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Capacity & Seats</span>
                          {!isEditing && (
                            <button
                              onClick={() => {
                                setEditingCapacityEventId(evt.id);
                                setTempCapacity(evt.capacity);
                                setCapacityError(null);
                              }}
                              className="text-[10px] font-bold text-neutral-900 underline hover:opacity-75"
                            >
                              Update Capacity
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={tempCapacity}
                                onChange={(e) => setTempCapacity(Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-neutral-300 rounded-lg text-xs font-bold focus:border-black focus:outline-none bg-white"
                              />
                              <button
                                onClick={() => handleUpdateCapacity(evt.id, booked)}
                                className="px-3 py-1 bg-black text-white rounded-lg font-bold text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCapacityEventId(null)}
                                className="px-2 py-1 text-neutral-500 text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                            {capacityError && (
                              <p className="text-[10px] text-red-600 font-bold">{capacityError}</p>
                            )}
                            {capacitySuccess && (
                              <p className="text-[10px] text-emerald-600 font-bold">{capacitySuccess}</p>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold text-neutral-900 text-sm block mt-0.5">
                            {evt.capacity} Total ({remaining} Left)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendees for this event */}
                    <div>
                      <h4 className="text-xs font-black uppercase text-neutral-800 mb-3">
                        Attendee Bookings ({bookings.filter((b) => b.event_id === evt.id).length})
                      </h4>
                      {bookings.filter((b) => b.event_id === evt.id).length === 0 ? (
                        <p className="text-xs text-neutral-400 font-medium">No bookings yet for this event.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[10px]">
                                <th className="pb-2">Attendee</th>
                                <th className="pb-2">Contact</th>
                                <th className="pb-2">Passes</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">QR Code</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {bookings
                                .filter((b) => b.event_id === evt.id)
                                .map((b) => (
                                  <tr key={b.id} className="text-neutral-800">
                                    <td className="py-2.5 font-bold">{b.attendee_name}</td>
                                    <td className="py-2.5 text-neutral-600">
                                      {b.attendee_email}
                                      <br />
                                      <span className="text-[10px] font-mono">{b.attendee_phone}</span>
                                    </td>
                                    <td className="py-2.5 font-bold">{b.ticket_count} Pass(es)</td>
                                    <td className="py-2.5 font-bold">₹{b.amount_paid}</td>
                                    <td className="py-2.5 font-mono text-[10px] bg-neutral-50 px-2 rounded">
                                      {b.qr_ticket_code}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {selectedEventForQr && (
        <QRCodeModal
          isOpen={Boolean(selectedEventForQr)}
          onClose={() => setSelectedEventForQr(null)}
          title={selectedEventForQr.title}
          subtitle="Event Direct Booking Link"
          url={selectedEventForQr.url}
        />
      )}
    </div>
  );
}
