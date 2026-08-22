'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  ArrowLeft,
  Ticket,
  Calendar,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEventsByCreatorId, getBookingsByCreator } from '@/lib/supabase/db';
import { Booking, EventItem } from '@/types';
import TicketBadge from '@/components/TicketBadge';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function AdminOrdersPage() {
  const { user, creator } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadOrdersData() {
      try {
        setLoading(true);
        const creatorId = creator?.id || `creator-${user?.id}`;
        const [creatorEvents, creatorBookings] = await Promise.all([
          getEventsByCreatorId(creatorId, user?.id),
          getBookingsByCreator(creatorId, user?.id),
        ]);
        setEvents(creatorEvents);
        setBookings(creatorBookings);
      } catch (err) {
        console.error('Error loading creator orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrdersData();
  }, [user, creator]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black uppercase text-neutral-950 mb-2">
          Orders & Payments
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          Sign in with Google to view your attendee orders and transaction records.
        </p>
        <GoogleSignInButton />
      </div>
    );
  }

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesEvent = selectedEventId === 'all' || b.event_id === selectedEventId;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      b.attendee_name.toLowerCase().includes(term) ||
      b.attendee_email.toLowerCase().includes(term) ||
      b.attendee_phone.toLowerCase().includes(term) ||
      b.qr_ticket_code.toLowerCase().includes(term) ||
      (b.payment_id && b.payment_id.toLowerCase().includes(term));

    return matchesEvent && matchesSearch;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount_paid, 0);
  const totalTickets = bookings.reduce((sum, b) => sum + b.ticket_count, 0);
  const avgOrderValue = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;

  return (
    <div className="min-h-screen bg-white py-12 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Page</span>
            </Link>
            <h1 className="text-3xl font-black uppercase text-neutral-950">
              Orders & Payments Tracking
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Live transaction records and attendee booking receipts from Razorpay.
            </p>
          </div>

          {creator && (
            <a
              href={`/${creator.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live Page</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          )}
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Revenue
            </span>
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1 block">
              ₹{totalRevenue}
            </span>
          </div>

          <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Tickets Sold
            </span>
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1 block">
              {totalTickets} Passes
            </span>
          </div>

          <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Orders
            </span>
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1 block">
              {bookings.length}
            </span>
          </div>

          <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Avg Order Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1 block">
              ₹{avgOrderValue}
            </span>
          </div>
        </div>

        {/* Search & Event Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by attendee name, email, phone, or ticket code..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 focus:border-black focus:outline-none text-xs font-semibold text-neutral-900 bg-white shadow-xs"
            />
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-neutral-300 focus:border-black focus:outline-none text-xs font-bold text-neutral-900 bg-white shadow-xs"
          >
            <option value="all">All Events ({events.length})</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="font-bold text-neutral-800 uppercase text-sm">No Orders Found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                {searchTerm || selectedEventId !== 'all'
                  ? 'No results match your search filter.'
                  : 'Orders will appear here once attendees buy tickets.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6">Ticket Code / Pass</th>
                    <th className="py-3.5 px-6">Event</th>
                    <th className="py-3.5 px-6">Attendee</th>
                    <th className="py-3.5 px-6">Quantity</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Payment Ref</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold bg-neutral-100 text-neutral-900 px-2.5 py-1 rounded-md text-[11px] block w-fit">
                          {b.qr_ticket_code}
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-[200px]">
                        <p className="font-bold text-neutral-900 truncate">
                          {b.event?.title || 'Fanmeet'}
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ID: {b.event_id.substring(0, 8)}...
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-bold text-neutral-900">{b.attendee_name}</p>
                        <p className="text-[11px] text-neutral-500">{b.attendee_email}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{b.attendee_phone}</p>
                      </td>

                      <td className="py-4 px-6 font-bold text-neutral-900">
                        {b.ticket_count} Pass(es)
                      </td>

                      <td className="py-4 px-6 font-black text-neutral-950 text-sm">
                        ₹{b.amount_paid}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="inline-block font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                            PAID
                          </span>
                          <p className="text-[10px] font-mono text-neutral-400 truncate max-w-[120px]">
                            {b.payment_id || b.razorpay_payment_id || 'rzp_mock'}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[11px] text-neutral-500">
                        {new Date(b.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedBookingForPass(b)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-black hover:text-white rounded-lg text-neutral-800 text-[11px] font-bold uppercase transition-colors inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Pass Modal */}
      {selectedBookingForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedBookingForPass(null)}
          />
          <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
            <TicketBadge booking={selectedBookingForPass} />
            <button
              onClick={() => setSelectedBookingForPass(null)}
              className="mt-4 w-full py-3 bg-white border border-neutral-300 rounded-2xl text-xs font-bold uppercase tracking-wider text-neutral-900 hover:border-black transition-all shadow-md"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
