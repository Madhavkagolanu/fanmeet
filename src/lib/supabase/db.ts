import { supabase } from './client';
import { Creator, EventItem, Booking, Profile } from '@/types';

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  } catch (err) {
    console.error('getProfileById exception:', err);
    return null;
  }
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Profile sync notice:', error.message || error);
      return null;
    }
    return profile as Profile;
  } catch (err: any) {
    console.warn('upsertProfile exception:', err?.message || err);
    return null;
  }
}

// ============================================================================
// CREATORS
// ============================================================================

export async function getAllCreators(): Promise<Creator[]> {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creators:', error);
      return [];
    }
    return (data || []) as Creator[];
  } catch (err) {
    console.error('getAllCreators exception:', err);
    return [];
  }
}

export async function getCreatorByHandle(handle: string): Promise<Creator | null> {
  try {
    const cleanHandle = handle.trim().toLowerCase();
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .ilike('handle', cleanHandle)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching creator for handle ${handle}:`, error);
      return null;
    }
    return data as Creator | null;
  } catch (err) {
    console.error('getCreatorByHandle exception:', err);
    return null;
  }
}

export async function getCreatorByUserId(userId: string): Promise<Creator | null> {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching creator for user ${userId}:`, error);
      return null;
    }
    return data as Creator | null;
  } catch (err) {
    console.error('getCreatorByUserId exception:', err);
    return null;
  }
}

export async function upsertCreatorProfile(creatorData: Partial<Creator> & { user_id: string; handle: string; display_name: string }): Promise<Creator> {
  const cleanHandle = creatorData.handle.toLowerCase().trim();
  const payload = {
    ...creatorData,
    handle: cleanHandle,
    updated_at: new Date().toISOString(),
  };

  try {
    // 0. Ensure profile exists in public.profiles table (satisfies foreign key constraint)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', creatorData.user_id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase
        .from('profiles')
        .upsert({
          id: creatorData.user_id,
          name: creatorData.display_name,
          avatar_url: creatorData.avatar_url || '',
          updated_at: new Date().toISOString(),
        });
    }

    // 1. Check if creator record already exists for this user_id
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', creatorData.user_id)
      .maybeSingle();

    if (existingCreator) {
      // Update existing creator record
      const { data, error } = await supabase
        .from('creators')
        .update(payload)
        .eq('id', existingCreator.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating creator profile:', error);
        throw error;
      }
      return data as Creator;
    }

    // 2. Insert new creator record
    const { data, error } = await supabase
      .from('creators')
      .insert([payload])
      .select()
      .single();

    if (error) {
      // Fallback: If conflict occurred on handle or user_id, attempt update
      if (error.code === '23505') {
        const { data: retryData, error: retryError } = await supabase
          .from('creators')
          .update(payload)
          .eq('user_id', creatorData.user_id)
          .select()
          .single();

        if (!retryError && retryData) {
          return retryData as Creator;
        }
      }
      console.error('Error inserting creator:', error);
      throw error;
    }

    return data as Creator;
  } catch (err) {
    console.error('upsertCreatorProfile exception:', err);
    throw err;
  }
}

export async function uploadImageFile(file: File, path: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${path}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Try uploading to 'avatars' or 'public' storage bucket in Supabase
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      if (publicUrl) return publicUrl;
    }

    // If bucket doesn't exist or storage failed, fallback to base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.warn('Storage upload notice, using Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

// ============================================================================
// EVENTS
// ============================================================================

export async function getAllEvents(): Promise<EventItem[]> {
  try {
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*, creator:creators(*)')
      .eq('is_active', true)
      .order('from_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return [];
    }

    // Fetch booking counts for each event
    const eventIds = (eventsData || []).map((e: any) => e.id);
    let bookingCountMap: Record<string, number> = {};

    if (eventIds.length > 0) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('event_id, ticket_count')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'pending']);

      if (bookingsData) {
        bookingsData.forEach((b: any) => {
          bookingCountMap[b.event_id] = (bookingCountMap[b.event_id] || 0) + (Number(b.ticket_count) || 1);
        });
      }
    }

    return (eventsData || []).map((evt: any) => ({
      ...evt,
      booked_count: bookingCountMap[evt.id] || 0,
      creator: evt.creator || undefined,
    })) as EventItem[];
  } catch (err) {
    console.error('getAllEvents exception:', err);
    return [];
  }
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  try {
    const { data: evt, error } = await supabase
      .from('events')
      .select('*, creator:creators(*)')
      .eq('id', eventId)
      .maybeSingle();

    if (error || !evt) {
      console.error('Error fetching event by id:', error);
      return null;
    }

    // Fetch booked count including tier_title breakdown
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('ticket_count, tier_title')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'pending']);

    const bookedCount = (bookingsData || []).reduce(
      (sum: number, b: any) => sum + (Number(b.ticket_count) || 1),
      0
    );

    const tierBookedMap: Record<string, number> = {};
    (bookingsData || []).forEach((b: any) => {
      const key = (b.tier_title || '').trim().toLowerCase();
      tierBookedMap[key] = (tierBookedMap[key] || 0) + (Number(b.ticket_count) || 1);
    });

    let updatedTiers = evt.ticket_tiers;
    if (Array.isArray(updatedTiers) && updatedTiers.length > 0) {
      updatedTiers = updatedTiers.map((tier: any) => {
        const key = (tier.title || '').trim().toLowerCase();
        return {
          ...tier,
          booked_count: tierBookedMap[key] || 0,
        };
      });
    }

    return {
      ...evt,
      ticket_tiers: updatedTiers,
      booked_count: bookedCount,
      creator: evt.creator || undefined,
    } as EventItem;
  } catch (err) {
    console.error('getEventById exception:', err);
    return null;
  }
}

export async function getEventsByCreatorId(creatorId: string, userId?: string): Promise<EventItem[]> {
  try {
    let query = supabase.from('events').select('*, creator:creators(*)').order('created_at', { ascending: false });

    // If userId is provided, filter by user_id or valid creator_id
    if (userId && creatorId && !creatorId.startsWith('creator-')) {
      query = query.or(`creator_id.eq.${creatorId},user_id.eq.${userId}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (creatorId && !creatorId.startsWith('creator-')) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: eventsData, error } = await query;
    if (error) {
      console.error('Error fetching creator events:', error.message || error);
      return [];
    }

    const eventIds = (eventsData || []).map((e: any) => e.id);
    let bookingCountMap: Record<string, number> = {};

    if (eventIds.length > 0) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('event_id, ticket_count')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'pending']);

      if (bookingsData) {
        bookingsData.forEach((b: any) => {
          bookingCountMap[b.event_id] = (bookingCountMap[b.event_id] || 0) + (Number(b.ticket_count) || 1);
        });
      }
    }

    return (eventsData || []).map((evt: any) => ({
      ...evt,
      booked_count: bookingCountMap[evt.id] || 0,
      creator: evt.creator || undefined,
    })) as EventItem[];
  } catch (err) {
    console.error('getEventsByCreatorId exception:', err);
    return [];
  }
}

export async function createEvent(eventInput: Omit<EventItem, 'id' | 'created_at' | 'booked_count' | 'creator'>): Promise<EventItem> {
  const insertPayload: any = {
    creator_id: eventInput.creator_id,
    user_id: eventInput.user_id,
    title: eventInput.title,
    description: eventInput.description,
    location: eventInput.location,
    image_url: eventInput.image_url,
    from_time: eventInput.from_time,
    to_time: eventInput.to_time,
    is_active: eventInput.is_active ?? true,
    mrp: eventInput.mrp,
    offer_price: eventInput.offer_price,
    capacity: eventInput.capacity,
  };

  if (eventInput.ticket_tiers) {
    insertPayload.ticket_tiers = eventInput.ticket_tiers;
  }

  if (eventInput.location_address) {
    insertPayload.location_address = eventInput.location_address;
  }
  if (eventInput.location_url) {
    insertPayload.location_url = eventInput.location_url;
  }

  const { data, error } = await supabase
    .from('events')
    .insert([insertPayload])
    .select('*, creator:creators(*)')
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return {
    ...data,
    booked_count: 0,
  } as EventItem;
}

export async function updateEventCapacity(eventId: string, newCapacity: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({ capacity: newCapacity, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update capacity' };
  }
}

export async function updateEvent(eventId: string, eventUpdates: Partial<EventItem>): Promise<{ success: boolean; data?: EventItem; error?: string }> {
  try {
    const payload: any = {
      ...eventUpdates,
      updated_at: new Date().toISOString(),
    };
    // remove joined creator object if present
    delete payload.creator;
    delete payload.booked_count;

    const { error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('updateEvent exception:', err);
    return { success: false, error: err?.message || 'Failed to update event' };
  }
}

// ============================================================================
// BOOKINGS
// ============================================================================

export async function getBookingsByCreator(creatorId: string, userId?: string): Promise<Booking[]> {
  try {
    // 1. Get creator's event IDs
    let query = supabase.from('events').select('id, title, location, location_address, location_url, from_time, to_time, offer_price, mrp, image_url');
    if (userId) {
      query = query.or(`creator_id.eq.${creatorId},user_id.eq.${userId}`);
    } else {
      query = query.eq('creator_id', creatorId);
    }

    const { data: creatorEvents, error: eventsError } = await query;
    if (eventsError || !creatorEvents || creatorEvents.length === 0) {
      return [];
    }

    const eventIds = creatorEvents.map((e: any) => e.id);
    const eventMap = new Map<string, any>(creatorEvents.map((e: any) => [e.id, e]));

    // 2. Fetch bookings for these events
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching creator bookings:', bookingsError);
      return [];
    }

    return (bookingsData || []).map((b: any) => ({
      ...b,
      event: eventMap.get(b.event_id),
    })) as Booking[];
  } catch (err) {
    console.error('getBookingsByCreator exception:', err);
    return [];
  }
}

export async function getBookingsBySearch(searchQuery: string, userId?: string): Promise<Booking[]> {
  try {
    if (!userId && !searchQuery) {
      return [];
    }

    let query = supabase
      .from('bookings')
      .select('*, event:events(*)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (searchQuery) {
      const clean = searchQuery.trim().toLowerCase();
      query = query.or(
        `attendee_email.ilike.%${clean}%,qr_ticket_code.ilike.%${clean}%,attendee_phone.ilike.%${clean}%,attendee_name.ilike.%${clean}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error querying bookings:', error);
      return [];
    }

    return (data || []) as Booking[];
  } catch (err) {
    console.error('getBookingsBySearch exception:', err);
    return [];
  }
}
