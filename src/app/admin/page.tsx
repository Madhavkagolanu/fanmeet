'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Users,
  CreditCard,
  QrCode,
  Share2,
  PlusCircle,
  Lock,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Sparkles,
  MapPin,
  Link as LinkIcon,
  Upload,
  Camera,
  Edit,
  X,
  Power,
  PowerOff,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEventsByCreatorId, createEvent, updateEvent, uploadImageFile } from '@/lib/supabase/db';
import { EventItem, Booking, Creator, TicketTier } from '@/types';
import { getAppBaseUrl, getAppHost } from '@/lib/utils';
import QRCodeModal from '@/components/QRCodeModal';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Avatar from '@/components/Avatar';

export default function AdminPage() {
  const { user, creator, updateCreatorProfile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'create'>('events');
  const [selectedEventForQr, setSelectedEventForQr] = useState<{ title: string; url: string } | null>(null);
  const [appHost, setAppHost] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventLocationUrl, setEventLocationUrl] = useState('');
  const [eventImageUrl, setEventImageUrl] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [mrp, setMrp] = useState<number>(499);
  const [offerPrice, setOfferPrice] = useState<number>(299);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { title: 'Normal', mrp: 499, offer_price: 499, capacity: 50 },
  ]);
  const [eventDescription, setEventDescription] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const eventImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEventImage, setIsUploadingEventImage] = useState(false);

  // Full Edit Modal State
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationUrl, setEditLocationUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editFromTime, setEditFromTime] = useState('');
  const [editToTime, setEditToTime] = useState('');
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editOfferPrice, setEditOfferPrice] = useState<number>(0);
  const [editCapacity, setEditCapacity] = useState<number>(0);
  const [editTicketTiers, setEditTicketTiers] = useState<TicketTier[]>([]);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  const formatToLocalDateTime = (dateStrOrObj: string | Date): string => {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const nowMinIso = formatToLocalDateTime(new Date());

  const loadAdminData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const creatorId = creator?.id || `creator-${user.id}`;
      const userEvents = await getEventsByCreatorId(creatorId, user.id);
      setEvents(userEvents);
    } catch (err) {
      console.error('Error loading admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAppHost(getAppHost());
    if (!user) return;

    loadAdminData();

    // Default event dates: 1 week from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(17, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setHours(20, 0, 0, 0);

    setFromTime(formatToLocalDateTime(nextWeek));
    setToTime(formatToLocalDateTime(nextWeekEnd));
  }, [user, creator]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !creator || !user) return;

    try {
      setIsUpdatingAvatar(true);
      const newUrl = await uploadImageFile(file, user.id);
      await updateCreatorProfile({
        avatar_url: newUrl,
      });
    } catch (err) {
      console.error('Error changing avatar:', err);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setCreateError('Event cover image size should be under 5MB.');
      return;
    }

    try {
      setIsUploadingEventImage(true);
      setCreateError(null);
      const uploadedUrl = await uploadImageFile(file, `events-${user.id}`);
      setEventImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Error uploading event image:', err);
      setCreateError('Failed to upload cover image. Please try again.');
    } finally {
      setIsUploadingEventImage(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingEditImage(true);
      const uploadedUrl = await uploadImageFile(file, `events-${user.id}`);
      setEditImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Error uploading edit image:', err);
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const openEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setEditTitle(evt.title);
    setEditDescription(evt.description || '');
    setEditLocation(evt.location);
    setEditLocationUrl(evt.location_url || '');
    setEditImageUrl(evt.image_url || '');
    setEditFromTime(formatToLocalDateTime(evt.from_time));
    setEditToTime(formatToLocalDateTime(evt.to_time));
    setEditMrp(evt.mrp);
    setEditOfferPrice(evt.offer_price);
    setEditCapacity(evt.capacity);
    setEditTicketTiers(
      evt.ticket_tiers && evt.ticket_tiers.length > 0
        ? JSON.parse(JSON.stringify(evt.ticket_tiers))
        : [{ title: 'Normal', mrp: evt.mrp, offer_price: evt.offer_price }]
    );
    setEditIsActive(evt.is_active !== false);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setEditError(null);
    setEditSuccess(null);

    const booked = editingEvent.booked_count || 0;
    const sumTierCapacity = editTicketTiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
    const effectiveCapacity = sumTierCapacity > 0 ? sumTierCapacity : Number(editCapacity) || editingEvent.capacity;

    if (effectiveCapacity < booked) {
      setEditError(`Cannot reduce capacity to ${effectiveCapacity}: ${booked} tickets are already booked.`);
      return;
    }

    if (editTicketTiers.length === 0) {
      setEditError('At least one ticket pricing tier is required.');
      return;
    }

    for (const tier of editTicketTiers) {
      if (!tier.title.trim()) {
        setEditError('All ticket tiers must have a title (e.g. Normal, Couple, VIP).');
        return;
      }
      if (tier.offer_price < 0) {
        setEditError('Offer price cannot be negative.');
        return;
      }
      if (tier.mrp < tier.offer_price) {
        setEditError(`MRP (₹${tier.mrp}) cannot be less than Offer Price (₹${tier.offer_price}) for "${tier.title}".`);
        return;
      }
      if (!tier.capacity || Number(tier.capacity) <= 0) {
        setEditError(`Please specify a valid seat capacity for "${tier.title}".`);
        return;
      }
    }

    const startDate = new Date(editFromTime);
    const endDate = new Date(editToTime);

    if (endDate <= startDate) {
      setEditError('End Date & Time must be strictly after Start Date & Time (Start < End).');
      return;
    }

    setIsSavingEdit(true);

    try {
      const primaryTier = editTicketTiers[0];
      const res = await updateEvent(editingEvent.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
        location_address: editLocation.trim(),
        location_url: editLocationUrl.trim() || undefined,
        image_url: editImageUrl.trim(),
        from_time: new Date(editFromTime).toISOString(),
        to_time: new Date(editToTime).toISOString(),
        mrp: Number(primaryTier.mrp) || Number(editMrp) || 0,
        offer_price: Number(primaryTier.offer_price) || Number(editOfferPrice) || 0,
        capacity: effectiveCapacity,
        ticket_tiers: editTicketTiers,
        is_active: editIsActive,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update event');
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? {
                ...e,
                title: editTitle.trim(),
                description: editDescription.trim(),
                location: editLocation.trim(),
                location_address: editLocation.trim(),
                location_url: editLocationUrl.trim() || undefined,
                image_url: editImageUrl.trim(),
                from_time: new Date(editFromTime).toISOString(),
                to_time: new Date(editToTime).toISOString(),
                mrp: Number(primaryTier.mrp) || Number(editMrp) || 0,
                offer_price: Number(primaryTier.offer_price) || Number(editOfferPrice) || 0,
                capacity: Number(editCapacity) || e.capacity,
                ticket_tiers: editTicketTiers,
                is_active: editIsActive,
              }
            : e
        )
      );

      setEditSuccess('Event updated successfully!');
      setTimeout(() => {
        setEditingEvent(null);
        setEditSuccess(null);
      }, 1000);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleEventActive = async (evt: EventItem) => {
    const newStatus = !evt.is_active;
    const res = await updateEvent(evt.id, { is_active: newStatus });
    if (res.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === evt.id ? { ...e, is_active: newStatus } : e))
      );
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!creator || !user) {
      setCreateError('You must have an active creator profile to publish events.');
      return;
    }

    if (!eventTitle.trim() || !eventLocation.trim()) {
      setCreateError('Please provide an event title and venue physical address.');
      return;
    }

    if (!eventImageUrl.trim()) {
      setCreateError('Please upload an event cover photo.');
      return;
    }

    if (!fromTime || !toTime) {
      setCreateError('Please specify start and end dates/times.');
      return;
    }

    const startDate = new Date(fromTime);
    const endDate = new Date(toTime);
    const now = new Date();

    if (startDate < now) {
      setCreateError('Start date & time cannot be in the past.');
      return;
    }

    if (endDate <= startDate) {
      setCreateError('End date & time must be after the start date & time.');
      return;
    }

    if (ticketTiers.length === 0) {
      setCreateError('Please add at least one ticket pricing tier (e.g. Normal, VIP).');
      return;
    }

    for (const tier of ticketTiers) {
      if (!tier.title.trim()) {
        setCreateError('All ticket pricing tiers must have a title.');
        return;
      }
      if (tier.offer_price < 0) {
        setCreateError('Offer price cannot be negative.');
        return;
      }
      if (tier.mrp < tier.offer_price) {
        setCreateError(`MRP (₹${tier.mrp}) cannot be less than Offer Price (₹${tier.offer_price}) for "${tier.title}". If no discount, set both to the same price.`);
        return;
      }
      if (!tier.capacity || Number(tier.capacity) <= 0) {
        setCreateError(`Please specify a valid seat capacity for "${tier.title}".`);
        return;
      }
    }

    const totalCalculatedCapacity = ticketTiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);

    setIsCreatingEvent(true);

    try {
      const primaryTier = ticketTiers[0];
      const newEvent = await createEvent({
        creator_id: creator.id,
        user_id: user.id,
        title: eventTitle.trim(),
        description: eventDescription.trim() || 'Join us for this exciting event!',
        location: eventLocation.trim(),
        location_address: eventLocation.trim(),
        location_url: eventLocationUrl.trim() || undefined,
        image_url: eventImageUrl.trim(),
        from_time: startDate.toISOString(),
        to_time: endDate.toISOString(),
        is_active: true,
        mrp: Number(primaryTier.mrp) || 0,
        offer_price: Number(primaryTier.offer_price) || 0,
        capacity: totalCalculatedCapacity,
        ticket_tiers: ticketTiers,
      });

      // Update state
      setEvents([newEvent, ...events]);
      setCreateSuccess(`Event "${newEvent.title}" published successfully!`);
      setEventTitle('');
      setEventLocation('');
      setEventLocationUrl('');
      setEventDescription('');
      setEventImageUrl('');
      setTicketTiers([{ title: 'Normal', mrp: 499, offer_price: 499, capacity: 50 }]);
      if (eventImageInputRef.current) {
        eventImageInputRef.current.value = '';
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setIsCreatingEvent(false);
      setTimeout(() => {
        setCreateSuccess(null);
        setActiveTab('events');
      }, 1500);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create event');
      setIsCreatingEvent(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black uppercase text-neutral-950 mb-2">
          Creator Admin Page
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          Sign in with Google to manage your events, pricing, and ticket sales.
        </p>
        <GoogleSignInButton />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black uppercase text-neutral-950 mb-2">
          No Creator Page Launched Yet
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          You have not launched your creator handle yet. Claim your handle below:
        </p>
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-all shadow-md"
        >
          <span>💖 Claim Handle & Launch</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const livePageUrl = `${getAppBaseUrl()}/${creator.handle}`;

  return (
    <div className="min-h-screen bg-white py-12 pb-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 bg-black text-white rounded-full">
                ADMIN PANEL
              </span>
              <span className="text-xs font-mono font-bold text-neutral-500">
                @{creator.handle}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-950 mt-1">
              Creator Studio
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* PREVIEW PAGE IN NEW TAB */}
            <a
              href={`/${creator.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-neutral-50 text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>

            {/* ORDERS & PAYMENTS TRACKING */}
            <Link
              href="/admin/orders"
              className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Orders & Payments</span>
            </Link>
          </div>
        </div>

        {/* Creator Profile Summary Strip */}
        <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
              <Avatar
                src={creator.avatar_url}
                name={creator.display_name}
                size="lg"
                className="border-2 border-neutral-900 shadow-xs"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-neutral-950">{creator.display_name}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-md">
                  <Lock className="w-2.5 h-2.5" /> Handle: @{creator.handle}
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-500 truncate max-w-sm mt-0.5">
                {appHost}/{creator.handle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={isUpdatingAvatar}
              className="px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 hover:border-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUpdatingAvatar ? 'Uploading...' : 'Change Photo'}</span>
            </button>

            <button
              onClick={() => setSelectedEventForQr({ title: `@${creator.handle}`, url: livePageUrl })}
              className="px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 hover:border-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Creator QR</span>
            </button>
          </div>
        </div>

        {/* Clear Tab Navigation (Separating Published Events from Create New Event) */}
        <div className="flex items-center border-b border-neutral-200 gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'events'
                ? 'border-black text-neutral-950 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            My Published Events ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-black text-neutral-950 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Publish New Event</span>
          </button>
        </div>

        {/* TAB 1: MANAGE EXISTING EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase text-neutral-950">
                  Manage Events ({events.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update pricing, description, dates, venue, and toggle bookings on/off.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('create')}
                className="py-2.5 px-4 bg-black text-white text-xs font-black uppercase rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>

            {events.length === 0 ? (
              <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center space-y-3">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto" />
                <h3 className="font-bold text-neutral-800 text-base uppercase">
                  No Events Published Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Ready to host your next jam, meetup, or workshop? Publish your first event in seconds!
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="py-3 px-6 bg-black text-white text-xs font-black uppercase rounded-2xl hover:bg-neutral-800 transition-all shadow-sm"
                >
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => {
                  const booked = evt.booked_count || 0;
                  const remaining = Math.max(0, evt.capacity - booked);
                  const eventUrl = `${getAppBaseUrl()}/${creator.handle}/${evt.id}`;
                  const isActive = evt.is_active !== false;

                  return (
                    <div
                      key={evt.id}
                      className="bg-white rounded-3xl border-2 border-neutral-200 p-6 shadow-xs hover:border-black transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {isActive ? '● Live & Booking Active' : '○ Bookings Paused'}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              UUID: {evt.id.substring(0, 8)}...
                            </span>
                          </div>

                          <h3 className="text-xl font-black text-neutral-950 uppercase">
                            {evt.title}
                          </h3>

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-600 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                              <span>{evt.location}</span>
                            </span>
                            {evt.location_url && (
                              <a
                                href={evt.location_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                              >
                                <span>Map Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <span>• {new Date(evt.from_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({new Date(evt.from_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Full Edit Button */}
                          <button
                            onClick={() => openEditModal(evt)}
                            className="p-2.5 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition-all text-xs font-black uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Event</span>
                          </button>

                          {/* Pause / Resume Button */}
                          <button
                            onClick={() => handleToggleEventActive(evt)}
                            className={`p-2.5 rounded-xl border text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'border-neutral-300 text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Pause Bookings' : 'Activate Bookings'}
                          >
                            {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            <span>{isActive ? 'Pause' : 'Activate'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedEventForQr({ title: evt.title, url: eventUrl })}
                            className="p-2.5 border border-neutral-300 rounded-xl hover:border-black text-neutral-800 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Share Event QR"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>QR</span>
                          </button>

                          <a
                            href={`/${creator.handle}/${evt.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-neutral-100 hover:bg-black hover:text-white rounded-xl text-neutral-800 transition-colors text-xs font-bold flex items-center gap-1"
                          >
                            <span>Live Page</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Pricing and Capacity Status Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                            {evt.ticket_tiers && evt.ticket_tiers.length > 1
                              ? `Pricing (${evt.ticket_tiers.length} Tiers)`
                              : 'Ticket Price'}
                          </span>
                          <span className="font-black text-sm text-neutral-900">
                            {evt.ticket_tiers && evt.ticket_tiers.length > 1
                              ? `From ₹${Math.min(...evt.ticket_tiers.map(t => t.offer_price))}`
                              : `₹${evt.offer_price}`}
                          </span>
                          {evt.mrp > evt.offer_price && (!evt.ticket_tiers || evt.ticket_tiers.length <= 1) && (
                            <span className="text-[11px] text-neutral-400 line-through ml-1.5 font-semibold">MRP ₹{evt.mrp}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tickets Sold</span>
                          <span className="font-black text-sm text-neutral-900">{booked} Attendees</span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Available Seats</span>
                          <span className="font-black text-sm text-neutral-900">{remaining} / {evt.capacity}</span>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-80"
                          >
                            Edit Pricing & Times →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PUBLISH NEW EVENT FORM */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  CREATE & PUBLISH
                </span>
                <h2 className="text-xl font-black uppercase text-neutral-950">
                  Publish New Event
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                ⚡ Instant Live
              </span>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Acoustic Sunset Cypher & Community Jam"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Venue / Physical Address *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Studio 7A, 100ft Road, Indiranagar, Bengaluru"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Google Maps Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={eventLocationUrl}
                    onChange={(e) => setEventLocationUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                  Event Cover Image *
                </label>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  {eventImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-video max-h-56 bg-neutral-900 flex items-center justify-center">
                      <img
                        src={eventImageUrl}
                        alt="Event Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => eventImageInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-neutral-900 text-xs font-bold uppercase rounded-lg hover:bg-neutral-100 shadow-md"
                        >
                          Replace Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEventImageUrl('');
                            if (eventImageInputRef.current) eventImageInputRef.current.value = '';
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-red-700 shadow-md"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => eventImageInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 hover:border-black rounded-xl p-8 text-center cursor-pointer transition-all bg-white hover:bg-neutral-50 flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 uppercase">
                          {isUploadingEventImage ? 'Uploading Image...' : 'Click to Upload Event Cover Image'}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          High resolution PNG or JPG (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={eventImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEventImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                    Start Date & Time (FROM) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={nowMinIso}
                    value={fromTime}
                    onChange={(e) => {
                      setFromTime(e.target.value);
                      if (toTime && e.target.value > toTime) {
                        setToTime(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                    End Date & Time (TO) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={fromTime || nowMinIso}
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* Dynamic Pricing Tiers (Minimum 1 Required with Plus Button) */}
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                      <span>Ticket Pricing Tiers & Capacities</span>
                      <span className="text-[10px] text-neutral-400 font-bold">(Minimum 1 required)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Total event capacity is automatically calculated as the sum of all tier capacities.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wide">
                      Total Seats: {ticketTiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0)}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setTicketTiers([
                          ...ticketTiers,
                          { title: '', mrp: 499, offer_price: 499, capacity: 25 },
                        ]);
                      }}
                      className="py-1.5 px-3 bg-black text-white text-xs font-bold uppercase rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tier</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {ticketTiers.map((tier, idx) => {
                    const hasOffer = tier.mrp > tier.offer_price;
                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3"
                      >
                        {/* Top row: Tier title, Seats, and Delete */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                              Tier Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={tier.title}
                              onChange={(e) => {
                                const updated = [...ticketTiers];
                                updated[idx].title = e.target.value;
                                setTicketTiers(updated);
                              }}
                              placeholder="e.g. Normal, Couple, VIP"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                              Seats (Cap) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={tier.capacity || ''}
                              onChange={(e) => {
                                const updated = [...ticketTiers];
                                updated[idx].capacity = Math.max(1, Number(e.target.value));
                                setTicketTiers(updated);
                              }}
                              placeholder="e.g. 50"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          <div className="sm:self-end pt-1 sm:pt-0">
                            <button
                              type="button"
                              disabled={ticketTiers.length <= 1}
                              onClick={() => {
                                if (ticketTiers.length > 1) {
                                  setTicketTiers(ticketTiers.filter((_, i) => i !== idx));
                                }
                              }}
                              title={ticketTiers.length <= 1 ? 'Minimum 1 tier is required' : 'Delete Tier'}
                              className={`p-2.5 rounded-xl border transition-colors ${
                                ticketTiers.length <= 1
                                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                  : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom row: MRP first, then Offer Toggle & Offer Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                          {/* 1. MRP (Standard Price) */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Standard Ticket Price (MRP ₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={tier.mrp}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...ticketTiers];
                                updated[idx].mrp = val;
                                // If not having an offer discount, keep offer price equal to MRP
                                if (!hasOffer || updated[idx].offer_price > val) {
                                  updated[idx].offer_price = val;
                                }
                                setTicketTiers(updated);
                              }}
                              placeholder="e.g. 499"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          {/* 2. Offer Discount & Discounted Price */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-500">
                                Offer Price (₹)
                              </label>

                              {/* Minimal Clean Switch */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...ticketTiers];
                                  if (hasOffer) {
                                    updated[idx].offer_price = updated[idx].mrp;
                                  } else {
                                    const discounted = Math.max(1, Math.round(updated[idx].mrp * 0.8));
                                    updated[idx].offer_price = discounted;
                                  }
                                  setTicketTiers(updated);
                                }}
                                className="flex items-center gap-1.5 cursor-pointer group select-none"
                              >
                                <span className={`text-[10px] font-semibold transition-colors ${hasOffer ? 'text-black font-bold' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                                  {hasOffer ? 'Offer applied' : 'Apply offer'}
                                </span>
                                <div
                                  className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    hasOffer ? 'bg-black' : 'bg-neutral-200 group-hover:bg-neutral-300'
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                      hasOffer ? 'translate-x-3' : 'translate-x-0'
                                    }`}
                                  />
                                </div>
                              </button>
                            </div>

                            <input
                              type="number"
                              min="0"
                              max={tier.mrp}
                              disabled={!hasOffer}
                              value={tier.offer_price}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...ticketTiers];
                                updated[idx].offer_price = Math.min(val, updated[idx].mrp);
                                setTicketTiers(updated);
                              }}
                              placeholder={tier.mrp.toString()}
                              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:border-black focus:outline-none transition-all ${
                                !hasOffer
                                  ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                                  : 'bg-white border-neutral-300 text-neutral-900'
                              }`}
                            />
                            {hasOffer && (
                              <p className="text-[10px] text-neutral-500 font-medium mt-1">
                                Saves ₹{tier.mrp - tier.offer_price} ({Math.round(((tier.mrp - tier.offer_price) / tier.mrp) * 100)}% off)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                  Description / Details
                </label>
                <textarea
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Give details about activities, schedule, what attendees should bring..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingEvent}
                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-black text-xs uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreatingEvent ? (
                  <span>Publishing Event...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Event to {appHost ? `${appHost}/${creator.handle}` : `/${creator.handle}`}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* FULL EVENT EDIT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditingEvent(null)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl border-2 border-black p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  EVENT EDITOR
                </span>
                <h3 className="text-xl font-black uppercase text-neutral-950">
                  Edit Event Details & Pricing
                </h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-2 text-neutral-500 hover:text-black rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                />
              </div>

              {/* Active / Booking Status Toggle */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-neutral-900 block">
                    Event Booking Status
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    {editIsActive ? 'Passes can be booked by attendees' : 'Bookings are paused / closed'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    editIsActive
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {editIsActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  <span>{editIsActive ? 'Active (Open)' : 'Paused (Closed)'}</span>
                </button>
              </div>

              {/* Dynamic Pricing Tiers in Edit Modal */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <span>Pricing Tiers & Seat Limits</span>
                      <span className="text-[10px] text-neutral-400 font-bold">(Minimum 1 required)</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Edit names, capacities, and prices. Total capacity is auto-synced to sum of all tiers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-black uppercase">
                      Total: {editTicketTiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0)} Seats
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditTicketTiers([
                          ...editTicketTiers,
                          { title: '', mrp: 499, offer_price: 499, capacity: 25 },
                        ]);
                      }}
                      className="py-1 px-2.5 bg-black text-white text-[11px] font-bold uppercase rounded-lg hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Tier</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {editTicketTiers.map((tier, idx) => {
                    const hasOffer = tier.mrp > tier.offer_price;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-3"
                      >
                        {/* Top row: Tier Title & Seats Cap & Delete */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Tier Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={tier.title}
                              onChange={(e) => {
                                const updated = [...editTicketTiers];
                                updated[idx].title = e.target.value;
                                setEditTicketTiers(updated);
                              }}
                              placeholder="e.g. Normal, Couple, VIP"
                              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Seats (Cap) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={tier.capacity || ''}
                              onChange={(e) => {
                                const updated = [...editTicketTiers];
                                updated[idx].capacity = Math.max(1, Number(e.target.value));
                                setEditTicketTiers(updated);
                              }}
                              placeholder="e.g. 50"
                              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          <div className="self-end sm:self-center pt-1 sm:pt-4">
                            <button
                              type="button"
                              disabled={editTicketTiers.length <= 1}
                              onClick={() => {
                                if (editTicketTiers.length > 1) {
                                  setEditTicketTiers(editTicketTiers.filter((_, i) => i !== idx));
                                }
                              }}
                              title={editTicketTiers.length <= 1 ? 'Minimum 1 tier is required' : 'Delete Tier'}
                              className={`p-2 rounded-lg border transition-colors ${
                                editTicketTiers.length <= 1
                                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                  : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom row: MRP first, then Offer Toggle & Offer Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                          {/* 1. MRP (Standard Price) */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Standard Ticket Price (MRP ₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={tier.mrp}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...editTicketTiers];
                                updated[idx].mrp = val;
                                if (!hasOffer || updated[idx].offer_price > val) {
                                  updated[idx].offer_price = val;
                                }
                                setEditTicketTiers(updated);
                              }}
                              placeholder="e.g. 499"
                              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                            />
                          </div>

                          {/* 2. Offer Discount & Discounted Price */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-500">
                                Offer Price (₹)
                              </label>

                              {/* Minimal Clean Switch */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editTicketTiers];
                                  if (hasOffer) {
                                    updated[idx].offer_price = updated[idx].mrp;
                                  } else {
                                    const discounted = Math.max(1, Math.round(updated[idx].mrp * 0.8));
                                    updated[idx].offer_price = discounted;
                                  }
                                  setEditTicketTiers(updated);
                                }}
                                className="flex items-center gap-1.5 cursor-pointer group select-none"
                              >
                                <span className={`text-[10px] font-semibold transition-colors ${hasOffer ? 'text-black font-bold' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                                  {hasOffer ? 'Offer applied' : 'Apply offer'}
                                </span>
                                <div
                                  className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    hasOffer ? 'bg-black' : 'bg-neutral-200 group-hover:bg-neutral-300'
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                      hasOffer ? 'translate-x-3' : 'translate-x-0'
                                    }`}
                                  />
                                </div>
                              </button>
                            </div>

                            <input
                              type="number"
                              min="0"
                              max={tier.mrp}
                              disabled={!hasOffer}
                              value={tier.offer_price}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...editTicketTiers];
                                updated[idx].offer_price = Math.min(val, updated[idx].mrp);
                                setEditTicketTiers(updated);
                              }}
                              placeholder={tier.mrp.toString()}
                              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:border-black focus:outline-none transition-all ${
                                !hasOffer
                                  ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                                  : 'bg-white border-neutral-300 text-neutral-900'
                              }`}
                            />
                            {hasOffer && (
                              <p className="text-[10px] text-neutral-500 font-medium mt-1">
                                Saves ₹{tier.mrp - tier.offer_price} ({Math.round(((tier.mrp - tier.offer_price) / tier.mrp) * 100)}% off)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    Start Date & Time (FROM) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editFromTime}
                    onChange={(e) => {
                      setEditFromTime(e.target.value);
                      if (editToTime && e.target.value >= editToTime) {
                        // Auto push end time forward
                        const newStart = new Date(e.target.value);
                        newStart.setHours(newStart.getHours() + 2);
                        setEditToTime(formatToLocalDateTime(newStart));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    End Date & Time (TO) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={editFromTime}
                    value={editToTime}
                    onChange={(e) => setEditToTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                  />
                </div>
              </div>

              {/* Location & Map */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    Venue Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={editLocationUrl}
                    onChange={(e) => setEditLocationUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                  Cover Image
                </label>
                <div className="flex items-center gap-3">
                  {editImageUrl && (
                    <img
                      src={editImageUrl}
                      alt="Cover"
                      className="w-16 h-12 rounded-lg object-cover border border-neutral-200"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => editImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingEditImage ? 'Uploading...' : 'Change Cover Photo'}</span>
                  </button>
                  <input
                    ref={editImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                  Description / Event Details
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:border-black focus:outline-none bg-neutral-50"
                />
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  {editSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-xl hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-md cursor-pointer"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {selectedEventForQr && (
        <QRCodeModal
          isOpen={Boolean(selectedEventForQr)}
          onClose={() => setSelectedEventForQr(null)}
          title={selectedEventForQr.title}
          subtitle="Direct Event Link"
          url={selectedEventForQr.url}
        />
      )}
    </div>
  );
}
