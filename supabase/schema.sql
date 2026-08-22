-- ==============================================================================
-- FANMEET SUPABASE SCHEMA & CONCURRENCY-SAFE TICKETING RULES
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone_number TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATORS TABLE
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL, -- e.g. 'madhav' for fanmeet.orox.in/madhav
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    social_links JSONB DEFAULT '{
        "insta": "",
        "fb": "",
        "x": "",
        "linkedin": "",
        "youtube": ""
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration helper for existing databases:
-- ALTER TABLE public.creators ADD CONSTRAINT creators_user_id_key UNIQUE (user_id);
-- ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_url TEXT;
-- ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_address TEXT;

CREATE INDEX IF NOT EXISTS idx_creators_handle ON public.creators(lower(handle));
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL, -- Physical venue address
    location_address TEXT,  -- Detailed venue address
    location_url TEXT,      -- Maps or virtual meeting link
    image_url TEXT,
    from_time TIMESTAMPTZ NOT NULL,
    to_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    mrp NUMERIC(10, 2) NOT NULL DEFAULT 0,
    offer_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 100 CHECK (capacity >= 1),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    ticket_count INTEGER NOT NULL DEFAULT 1 CHECK (ticket_count >= 1),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    attendee_phone TEXT NOT NULL,
    attendee_address TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'refunded')),
    qr_ticket_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_attendee_email ON public.bookings(lower(attendee_email));
CREATE INDEX IF NOT EXISTS idx_bookings_qr_ticket_code ON public.bookings(qr_ticket_code);

-- ==============================================================================
-- 6. CAPACITY UPDATE PROTECTION TRIGGER
-- Prevents a Creator from lowering capacity below the tickets already booked
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_event_capacity_reduction()
RETURNS TRIGGER AS $$
DECLARE
    current_booked_count INTEGER;
BEGIN
    -- Check total tickets booked for this event
    SELECT COALESCE(SUM(ticket_count), 0)
    INTO current_booked_count
    FROM public.bookings
    WHERE event_id = NEW.id
      AND status IN ('confirmed', 'pending');

    IF NEW.capacity < current_booked_count THEN
        RAISE EXCEPTION 'Cannot reduce event capacity to %: % tickets have already been booked.', 
            NEW.capacity, current_booked_count;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_event_capacity_reduction ON public.events;
CREATE TRIGGER trg_check_event_capacity_reduction
BEFORE UPDATE OF capacity ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.check_event_capacity_reduction();

-- ==============================================================================
-- 7. ATOMIC BOOKING FUNCTION (RPC) WITH ROW LOCKING
-- Guarantees race-condition-free booking and blocks overselling
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.book_event_tickets(
    p_event_id UUID,
    p_user_id UUID,
    p_ticket_count INTEGER,
    p_amount_paid NUMERIC,
    p_attendee_name TEXT,
    p_attendee_email TEXT,
    p_attendee_phone TEXT,
    p_attendee_address TEXT,
    p_payment_id TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_event public.events%ROWTYPE;
    v_total_booked INTEGER;
    v_remaining_seats INTEGER;
    v_qr_code TEXT;
    v_new_booking public.bookings%ROWTYPE;
BEGIN
    -- 1. Lock the event row for update to prevent concurrent race conditions
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    IF NOT v_event.is_active THEN
        RAISE EXCEPTION 'Event is currently not active or closed for bookings';
    END IF;

    -- 2. Compute current booked count
    SELECT COALESCE(SUM(ticket_count), 0)
    INTO v_total_booked
    FROM public.bookings
    WHERE event_id = p_event_id
      AND status IN ('confirmed', 'pending');

    v_remaining_seats := v_event.capacity - v_total_booked;

    -- 3. Check capacity availability
    IF v_remaining_seats < p_ticket_count THEN
        RAISE EXCEPTION 'Insufficient tickets remaining. Only % tickets left.', v_remaining_seats;
    END IF;

    -- 4. Generate unique QR Ticket Code
    v_qr_code := 'FMT-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 12));

    -- 5. Insert Booking
    INSERT INTO public.bookings (
        event_id,
        user_id,
        payment_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        ticket_count,
        amount_paid,
        attendee_name,
        attendee_email,
        attendee_phone,
        attendee_address,
        status,
        qr_ticket_code
    ) VALUES (
        p_event_id,
        p_user_id,
        p_payment_id,
        p_razorpay_order_id,
        p_razorpay_payment_id,
        p_razorpay_signature,
        p_ticket_count,
        p_amount_paid,
        p_attendee_name,
        p_attendee_email,
        p_attendee_phone,
        p_attendee_address,
        'confirmed',
        v_qr_code
    )
    RETURNING * INTO v_new_booking;

    -- Return JSON payload
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_new_booking.id,
        'qr_ticket_code', v_new_booking.qr_ticket_code,
        'ticket_count', v_new_booking.ticket_count,
        'amount_paid', v_new_booking.amount_paid,
        'remaining_capacity', v_remaining_seats - p_ticket_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. AUTOMATIC PROFILE CREATION ON USER SIGNUP (Supabase Auth Hook)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Fanmeet Member'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.phone
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profile info; Users can insert/update their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Creators: Anyone can view active creators; Users can create/manage their own creator handle immediately
CREATE POLICY "Active creators are viewable by everyone" ON public.creators FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create creator page on login" ON public.creators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can update own page" ON public.creators FOR UPDATE USING (auth.uid() = user_id);

-- Events: Anyone can view active events, creators can view all their own events (active or inactive)
CREATE POLICY "Active events are viewable by everyone" ON public.events FOR SELECT 
USING (is_active = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

CREATE POLICY "Creators can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can update their events" ON public.events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can delete their events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- Bookings: Anyone can view bookings by email/QR code or creator of event can view attendees
CREATE POLICY "Attendees can view their bookings" ON public.bookings FOR SELECT 
USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (auth.uid() IS NOT NULL AND auth.uid() IN (
        SELECT e.user_id FROM public.events e WHERE e.id = event_id
    ))
);

-- ==============================================================================
-- 10. GRANTS & ROLES PERMISSIONS
-- Ensure anon and authenticated roles have access to public schema tables & RPCs
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

