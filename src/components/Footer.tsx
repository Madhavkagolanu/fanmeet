import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight text-black">
            FANMEET
          </Link>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            The minimalist event ticketing & community fanmeet platform for creators, jams, dance workshops, and meetups.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-neutral-600 uppercase tracking-wider">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <Link href="/bookings" className="hover:text-black transition-colors">
            My Bookings
          </Link>
          <Link href="/launch" className="hover:text-black transition-colors">
            Launch Your Page
          </Link>
          <Link href="/contact" className="hover:text-black transition-colors">
            Contact
          </Link>
        </div>

        <div className="text-xs text-neutral-400 font-medium">
          © 2026 FANMEET. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
