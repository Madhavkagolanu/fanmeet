'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Ticket, ArrowRight, Search, Sparkles, ShieldCheck, Zap, Users, QrCode } from 'lucide-react';
import { getAllEvents, getAllCreators } from '@/lib/supabase/db';
import { EventItem, Creator } from '@/types';
import { getAppBaseUrl, getAppHost } from '@/lib/utils';
import QRCodeModal from '@/components/QRCodeModal';

export default function HomePage() {
  const router = useRouter();
  const [searchHandle, setSearchHandle] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrUrl, setSelectedQrUrl] = useState<{ title: string; url: string } | null>(null);
  const [appHost, setAppHost] = useState('');

  useEffect(() => {
    setAppHost(getAppHost());

    async function loadData() {
      try {
        const [loadedEvents, loadedCreators] = await Promise.all([
          getAllEvents(),
          getAllCreators(),
        ]);
        setEvents(loadedEvents);
        setCreators(loadedCreators);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = searchHandle.trim().replace('@', '').toLowerCase();
    if (cleanHandle) {
      router.push(`/${cleanHandle}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-neutral-200 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-300 bg-neutral-50 mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-800">
              MINIMALIST CREATOR FANMEET PLATFORM
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-neutral-950 uppercase leading-none max-w-4xl mx-auto">
            Host Jams, Meets & Workshops In Seconds.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Direct creator event pages with Google Sign-in, instant Razorpay ticket booking, live remaining seat tracking, and scannable QR passes. No approvals required.
          </p>

          {/* Quick Search & Launch Action */}
          <div className="mt-10 max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs font-mono font-bold text-neutral-400">
                  {appHost ? `${appHost}/` : '/'}
                </span>
                <input
                  type="text"
                  value={searchHandle}
                  onChange={(e) => setSearchHandle(e.target.value)}
                  placeholder="yourname"
                  style={{ paddingLeft: `${Math.max(100, (appHost.length + 2) * 8)}px` }}
                  className="w-full pr-10 py-3.5 rounded-2xl border-2 border-neutral-300 focus:border-black focus:outline-none text-sm font-bold text-neutral-900 bg-white shadow-xs transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors"
                  title="Find Creator"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            <Link
              href="/launch"
              className="w-full sm:w-auto shrink-0 py-3.5 px-6 rounded-2xl bg-black hover:bg-neutral-800 text-white text-sm font-extrabold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>💖 Launch Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Creator Tags */}
          <div className="mt-6 flex items-center justify-center flex-wrap gap-2 text-xs font-semibold text-neutral-500 min-h-[32px]">
            <span>Explore creators:</span>
            {loading ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className="inline-block w-20 h-6 bg-neutral-200/70 rounded-full animate-pulse"
                  />
                ))}
              </div>
            ) : creators.length === 0 ? (
              <span className="text-neutral-400 italic">No creators yet</span>
            ) : (
              creators.map((c) => (
                <Link
                  key={c.id}
                  href={`/${c.handle}`}
                  className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white transition-all font-mono"
                >
                  @{c.handle}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Events Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 uppercase">
              Upcoming Events
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Grab your tickets with instant Razorpay checkout and digital pass generation.
            </p>
          </div>

          <Link
            href="/launch"
            className="text-xs font-extrabold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 flex items-center gap-1 group"
          >
            <span>Host Your Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border-2 border-neutral-100 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 w-full bg-neutral-200/70 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="w-20 h-4 bg-neutral-200/70 rounded animate-pulse" />
                    <div className="w-4/5 h-6 bg-neutral-200/70 rounded animate-pulse" />
                    <div className="w-full h-3 bg-neutral-200/70 rounded animate-pulse" />
                    <div className="w-2/3 h-3 bg-neutral-200/70 rounded animate-pulse" />
                    <div className="pt-2 space-y-2">
                      <div className="w-1/2 h-3 bg-neutral-200/70 rounded animate-pulse" />
                      <div className="w-1/3 h-3 bg-neutral-200/70 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-neutral-100 flex items-center justify-between gap-4 mt-4">
                  <div className="w-16 h-6 bg-neutral-200/70 rounded animate-pulse" />
                  <div className="w-24 h-9 bg-neutral-200/70 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center">
            <Ticket className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-bold text-neutral-800 text-base uppercase">
              No Events Found
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              Be the first to host an event and start selling tickets in seconds!
            </p>
            <Link
              href="/launch"
              className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-bold uppercase rounded-2xl hover:bg-neutral-800 transition-all shadow-xs"
            >
              <span>Launch Your Event</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const booked = event.booked_count || 0;
              const remaining = Math.max(0, event.capacity - booked);
              const eventEndTime = new Date(event.to_time || event.from_time).getTime();
              const isPast = !isNaN(eventEndTime) && eventEndTime < Date.now();
              const isSoldOut = remaining <= 0;
              const isInactive = !event.is_active;
              const creatorHandle = event.creator?.handle || 'creator';
              const eventLink = `/${creatorHandle}/${event.id}`;
              const fullEventUrl = `${getAppBaseUrl()}${eventLink}`;

              let badgeText = `${remaining} Seats Left`;
              let badgeClass = 'bg-white/95 backdrop-blur-xs text-neutral-900 border border-neutral-300';
              let buttonText = 'Book Pass';
              const isActionDisabled = isPast || isInactive || isSoldOut;

              if (isPast) {
                badgeText = 'EVENT ENDED';
                badgeClass = 'bg-neutral-800 text-white';
                buttonText = 'Ended';
              } else if (isInactive) {
                badgeText = 'BOOKINGS CLOSED';
                badgeClass = 'bg-red-600 text-white';
                buttonText = 'Closed';
              } else if (isSoldOut) {
                badgeText = 'SOLD OUT';
                badgeClass = 'bg-black text-white';
                buttonText = 'Sold Out';
              }

              return (
                <div
                  key={event.id}
                  onClick={() => router.push(eventLink)}
                  className="group bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden hover:border-black transition-all hover:shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  {/* Event Image Banner */}
                  <div>
                    <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
                      <Image
                        src={event.image_url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full shadow-md ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQrUrl({
                            title: event.title,
                            url: fullEventUrl,
                          });
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-xs text-neutral-900 rounded-full border border-neutral-300 hover:bg-black hover:text-white transition-colors shadow-sm"
                        title="Share QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Event Content */}
                    <div className="p-6">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${creatorHandle}`);
                        }}
                        className="text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider inline-block mb-2 hover:underline"
                      >
                        @{creatorHandle}
                      </span>

                      <h3 className="text-lg font-black text-neutral-950 leading-snug group-hover:underline">
                        {event.title}
                      </h3>

                      <p className="text-xs text-neutral-600 line-clamp-2 mt-2 font-medium">
                        {event.description}
                      </p>

                      <div className="mt-4 space-y-2 text-xs text-neutral-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                          <span>
                            {new Date(event.from_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            • {new Date(event.from_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar & Book Button */}
                  <div className="p-6 pt-0 border-t border-neutral-100 flex items-center justify-between gap-4 mt-4">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-neutral-950">
                          {event.ticket_tiers && event.ticket_tiers.length > 1
                            ? `From ₹${Math.min(...event.ticket_tiers.map((t) => t.offer_price))}`
                            : `₹${event.offer_price}`}
                        </span>
                        {event.mrp > event.offer_price && (!event.ticket_tiers || event.ticket_tiers.length <= 1) && (
                          <span className="text-xs text-neutral-400 line-through font-semibold">
                            ₹{event.mrp}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">
                        {event.ticket_tiers && event.ticket_tiers.length > 1
                          ? `${event.ticket_tiers.length} Tiers Available`
                          : 'Per Pass'}
                      </span>
                    </div>

                    <div
                      className={`py-2.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isActionDisabled
                          ? 'bg-neutral-100 text-neutral-400'
                          : 'bg-black text-white group-hover:bg-neutral-800 shadow-xs'
                      }`}
                    >
                      <span>{buttonText}</span>
                      {!isActionDisabled && <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Creator Fee & Direct Payout Notice Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-neutral-950 text-white rounded-3xl p-8 sm:p-10 border border-neutral-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRANSPARENT CREATOR PRICING</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Direct Payouts. Flat 6% Platform Fee.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
              Host your events freely. We charge a simple <strong>flat 6% total fee</strong> on ticket sales. To discuss custom payout schedules, UPI settlements, or direct creator payouts, reach out anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="py-3.5 px-6 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-md flex items-center gap-2"
            >
              <span>Contact Us About Payments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/launch"
              className="py-3.5 px-6 rounded-2xl border-2 border-white/20 hover:border-white text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              <span>Host Your Events</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-neutral-50 border-t border-neutral-200 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black tracking-tight text-neutral-950 uppercase">
              Built Specifically For Creator Events & Workshops
            </h2>
            <p className="text-sm text-neutral-500 mt-2">
              Everything you need to gather your fans, sell passes, and verify entry without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-neutral-900 mb-2 uppercase">
                Instant Google Launch
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sign in with Google and publish your fanmeet page right away. No approval queues, no gatekeepers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-neutral-900 mb-2 uppercase">
                Zero Overselling Lock
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Atomic database row locking checks real-time capacity before confirming, preventing double booking even during flash ticket sales.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-neutral-900 mb-2 uppercase">
                Digital QR Ticket Passes
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Attendees receive encrypted QR ticket passes immediately upon payment for speedy entry check-ins at your venue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QR Modal when clicked */}
      {selectedQrUrl && (
        <QRCodeModal
          isOpen={Boolean(selectedQrUrl)}
          onClose={() => setSelectedQrUrl(null)}
          title={selectedQrUrl.title}
          subtitle="Scan to view and book directly"
          url={selectedQrUrl.url}
        />
      )}
    </div>
  );
}
