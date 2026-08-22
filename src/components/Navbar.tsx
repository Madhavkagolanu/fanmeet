'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Sparkles, User as UserIcon, ExternalLink, Eye, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NavigationDrawer from './NavigationDrawer';
import Avatar from './Avatar';

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, creator } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-black tracking-tight text-black flex items-center gap-2 group"
          >
            <span>FANMEET</span>
            <span className="w-2 h-2 rounded-full bg-black group-hover:scale-125 transition-transform" />
          </Link>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* If Creator exists, show Preview and Admin buttons */}
            {creator ? (
              <div className="hidden sm:flex items-center gap-3">
                <a
                  href={`/${creator.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-300 hover:border-black text-xs font-extrabold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 transition-all"
                  title="Open live creator page in a new tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>

                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-extrabold tracking-wider uppercase transition-all shadow-xs"
                >
                  <span>⚡</span>
                  <span>ADMIN PAGE</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/launch"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-300 bg-white hover:border-black hover:bg-neutral-50 text-xs font-extrabold tracking-wider uppercase transition-all shadow-xs"
              >
                <span>💖</span>
                <span>LAUNCH YOUR PAGE</span>
              </Link>
            )}

            <Link
              href="/bookings"
              className="hidden md:inline-block text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider transition-colors px-2 py-1"
            >
              Bookings
            </Link>

            {/* Menu Trigger Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all text-neutral-900"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
              {user ? (
                <Avatar
                  src={creator?.avatar_url || user.avatar_url}
                  name={creator?.display_name || user.name}
                  size="xs"
                />
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
