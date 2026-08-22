import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Exchange code for session with Supabase
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error('Auth code exchange error:', e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
