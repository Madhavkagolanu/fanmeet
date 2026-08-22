'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  QrCode,
  Share2,
  Globe,
  ArrowRight,
  Sparkles,
  PlusCircle,
  User as UserIcon,
} from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  XIcon,
  LinkedinIcon,
  YoutubeIcon,
} from '@/components/SocialIcons';
import { getCreatorByHandle, getEventsByCreatorId } from '@/lib/supabase/db';
import { Creator, EventItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getAppBaseUrl } from '@/lib/utils';
import QRCodeModal from '@/components/QRCodeModal';
import Avatar from '@/components/Avatar';

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = (params?.handle as string)?.toLowerCase();
  const { user } = useAuth();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (!handle) return;

    // Set dynamic URL
    setCurrentUrl(typeof window !== 'undefined' ? window.location.href : `${getAppBaseUrl()}/${handle}`);

    async function loadCreatorData() {
      try {
        setLoading(true);
        const foundCreator = await getCreatorByHandle(handle);
        if (foundCreator) {
          setCreator(foundCreator);
          const creatorEvents = await getEventsByCreatorId(foundCreator.id, foundCreator.user_id);
          setEvents(creatorEvents);
        } else {
          setCreator(null);
          setEvents([]);
        }
      } catch (err) {
        console.error('Error loading creator profile:', err);
        setCreator(null);
      } finally {
        setLoading(false);
      }
    }

    loadCreatorData();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black uppercase text-neutral-900 mb-2">
          Creator @{handle} Not Found
        </h1>
        <p className="text-xs text-neutral-500 mb-6 font-medium">
          This creator page has not been claimed or launched yet.
        </p>
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-bold uppercase rounded-2xl hover:bg-neutral-800 transition-all shadow-xs"
        >
          <span>Claim @{handle} & Launch</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === creator.user_id;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Creator Profile Header */}
      <section className="border-b border-neutral-200 bg-neutral-50/50 pt-12 pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Smart Initials Fallback */}
            <div className="p-1 rounded-full border-4 border-black bg-white shadow-xl shrink-0 overflow-hidden flex items-center justify-center">
              <Avatar
                src={creator.avatar_url}
                name={creator.display_name}
                size="2xl"
                priority
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 uppercase">
                    {creator.display_name}
                  </h1>
                  <p className="text-xs font-mono font-bold text-neutral-500 mt-0.5">
                    @{creator.handle}
                  </p>
                </div>

                {/* QR & Share Controls */}
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="p-2.5 bg-white border border-neutral-300 rounded-2xl hover:border-black hover:bg-neutral-50 transition-all text-neutral-900 flex items-center gap-1.5 text-xs font-bold shadow-xs"
                    title="Creator QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Pass</span>
                  </button>

                  {isOwner && (
                    <Link
                      href="/admin"
                      className="py-2.5 px-4 bg-black text-white text-xs font-bold uppercase rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Admin Page</span>
                    </Link>
                  )}
                </div>
              </div>

              {creator.bio && (
                <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-3 max-w-2xl leading-relaxed">
                  {creator.bio}
                </p>
              )}

              {/* Social Media Links */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-5 flex-wrap">
                {creator.social_links?.insta && (
                  <a
                    href={creator.social_links.insta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {creator.social_links?.x && (
                  <a
                    href={creator.social_links.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black transition-colors"
                    title="Twitter / X"
                  >
                    <XIcon className="w-4 h-4" />
                  </a>
                )}
                {creator.social_links?.fb && (
                  <a
                    href={creator.social_links.fb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black transition-colors"
                    title="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
                {creator.social_links?.linkedin && (
                  <a
                    href={creator.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black transition-colors"
                    title="LinkedIn"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                )}
                {creator.social_links?.youtube && (
                  <a
                    href={creator.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black transition-colors"
                    title="YouTube"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-950">
              Events ({events.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select an event to view ticket details and reserve your pass.
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center">
            <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-bold text-neutral-800 text-base uppercase">
              No Active Events
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              @{creator.handle} has not published any upcoming events yet.
            </p>
            {isOwner && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-bold uppercase rounded-2xl hover:bg-neutral-800 transition-all"
              >
                <span>Create An Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const booked = event.booked_count || 0;
              const remaining = Math.max(0, event.capacity - booked);
              const isSoldOut = remaining === 0 || !event.is_active;
              const eventLink = `/${creator.handle}/${event.id}`;

              return (
                <div
                  key={event.id}
                  onClick={() => router.push(eventLink)}
                  className="group bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden hover:border-black transition-all hover:shadow-xl flex flex-col sm:flex-row cursor-pointer"
                >
                  {/* Event Banner */}
                  <div className="sm:w-64 h-48 sm:h-auto relative bg-neutral-100 shrink-0">
                    <Image
                      src={event.image_url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      {!event.is_active ? (
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                          BOOKINGS CLOSED
                        </span>
                      ) : isSoldOut ? (
                        <span className="px-2.5 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-xs text-neutral-900 text-[10px] font-black uppercase tracking-wider rounded-full border border-neutral-300 shadow-sm">
                          {remaining} Left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-neutral-950 leading-snug group-hover:underline">
                        {event.title}
                      </h3>

                      <p className="text-xs text-neutral-600 line-clamp-2 mt-2 font-medium">
                        {event.description}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-neutral-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                          <span>
                            {new Date(event.from_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            • {new Date(event.from_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                          {event.location_url && (
                            <a
                              href={event.location_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              (View Map)
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-neutral-950">
                            ₹{event.offer_price}
                          </span>
                          {event.mrp > event.offer_price && (
                            <span className="text-xs text-neutral-400 line-through font-semibold">
                              ₹{event.mrp}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400">
                          {!event.is_active ? 'Bookings Paused' : isSoldOut ? 'Capacity Full' : `${remaining}/${event.capacity} Available`}
                        </span>
                      </div>

                      <div
                        className={`py-2.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          isSoldOut
                            ? 'bg-neutral-100 text-neutral-400'
                            : 'bg-black text-white group-hover:bg-neutral-800 shadow-xs'
                        }`}
                      >
                        <span>{!event.is_active ? 'Closed' : isSoldOut ? 'Sold Out' : 'Get Pass'}</span>
                        {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Creator QR Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`@${creator.handle}`}
        subtitle="Creator Profile & Events Hub"
        url={currentUrl}
      />
    </div>
  );
}
