'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  User as UserIcon,
  LogOut,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  CreditCard,
  PlusCircle,
  Eye,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const { user, creator, signInWithGoogle, signOut } = useAuth();

  // Close on Escape key press and handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden font-sans transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel with spring-like smooth cubic bezier */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`w-screen max-w-sm sm:max-w-md bg-white text-neutral-900 h-full flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform pointer-events-auto ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Top Header */}
          <div className="overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-neutral-100">
              <Link
                href="/"
                onClick={onClose}
                className="text-2xl font-black tracking-tight text-black hover:opacity-80 transition-opacity"
              >
                FANMEET
              </Link>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-all"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 stroke-[2.2]" />
              </button>
            </div>

            {/* User Profile / Login Pill */}
            <div className="px-6 py-6 border-b border-neutral-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={creator?.avatar_url || user.avatar_url}
                      name={creator?.display_name || user.name}
                      size="lg"
                      className="border border-neutral-300"
                    />
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 leading-tight">
                        {creator?.display_name || user.name}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate max-w-[160px]">
                        {creator ? `@${creator.handle}` : user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                    }}
                    title="Sign out"
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    await signInWithGoogle();
                  }}
                  className="w-full flex items-center gap-4 text-left group hover:bg-neutral-50 p-2 rounded-2xl transition-all"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-neutral-300 p-1 flex items-center justify-center bg-neutral-50 group-hover:border-black transition-colors shrink-0">
                    <UserIcon className="w-7 h-7 text-neutral-600 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-black">
                      Login / Sign Up
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Sign in with Google to get started
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="px-6 py-6 space-y-5">
              <div>
                <Link
                  href="/"
                  onClick={onClose}
                  className="block text-sm font-extrabold tracking-wider text-neutral-800 hover:text-black uppercase transition-colors"
                >
                  HOME
                </Link>
              </div>

              <div>
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="block text-sm font-extrabold tracking-wider text-neutral-800 hover:text-black uppercase transition-colors"
                >
                  CONTACT US
                </Link>
              </div>

              <div>
                <Link
                  href="/bookings"
                  onClick={onClose}
                  className="block text-sm font-extrabold tracking-wider text-neutral-800 hover:text-black uppercase transition-colors"
                >
                  BOOKINGS
                </Link>
              </div>

              {/* Creator Specific Tabs */}
              {creator && (
                <>
                  <div className="pt-2 border-t border-neutral-100 space-y-4">
                    {/* PREVIEW PAGE Tab (Opens in new tab) */}
                    <div>
                      <a
                        href={`/${creator.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="flex items-center justify-between text-sm font-extrabold tracking-wider text-neutral-900 hover:text-black uppercase transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-neutral-500 group-hover:text-black" />
                          <span>PREVIEW PAGE</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      </a>
                    </div>

                    {/* ADMIN PAGE Tab */}
                    <div>
                      <Link
                        href="/admin"
                        onClick={onClose}
                        className="flex items-center justify-between text-sm font-extrabold tracking-wider text-neutral-900 hover:text-black uppercase transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-neutral-500 group-hover:text-black" />
                          <span>ADMIN PAGE</span>
                        </div>
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">
                          ADD EVENT
                        </span>
                      </Link>
                    </div>

                    {/* ORDERS Tab */}
                    <div>
                      <Link
                        href="/admin/orders"
                        onClick={onClose}
                        className="flex items-center justify-between text-sm font-extrabold tracking-wider text-neutral-900 hover:text-black uppercase transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-neutral-500 group-hover:text-black" />
                          <span>ORDERS & PAYMENTS</span>
                        </div>
                      </Link>
                    </div>

                    {/* DASHBOARD Tab */}
                    <div>
                      <Link
                        href="/dashboard"
                        onClick={onClose}
                        className="flex items-center justify-between text-sm font-extrabold tracking-wider text-neutral-900 hover:text-black uppercase transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-neutral-500 group-hover:text-black" />
                          <span>ANALYTICS DASHBOARD</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* Bottom Drawer Footer */}
          <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
            {creator ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    Active Creator
                  </span>
                  <p className="text-xs font-mono font-bold text-neutral-900">
                    @{creator.handle}
                  </p>
                </div>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Manage Events
                </Link>
              </div>
            ) : (
              <Link
                href="/launch"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-neutral-800 transition-colors shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Claim Creator Handle</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
