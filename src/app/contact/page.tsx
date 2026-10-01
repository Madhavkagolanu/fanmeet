'use client';

import React from 'react';
import { Mail, ExternalLink, MessageCircle, Clock, Sparkles } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';

export default function ContactPage() {
  const whatsappNumber = '919494242253';
  const whatsappMessage = encodeURIComponent('Hi Fanmeet team, I would like to get help with...');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-[85vh] bg-white py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Support & Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase">
            Get In Touch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-3 font-medium leading-relaxed">
            Have questions about hosting an event, ticket bookings, or custom venue setups? Our team is active and ready to assist you.
          </p>
        </div>

        {/* Primary Contact Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* WhatsApp Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-6 rounded-3xl border-2 border-neutral-200 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all text-left shadow-xs hover:shadow-xl hover:-translate-y-1 duration-200 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Fastest Reply</span>
              </div>
              <h3 className="text-base font-black uppercase text-neutral-900">Chat on WhatsApp</h3>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Connect instantly with our team for quick questions or ticketing help.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-emerald-100 flex items-center justify-between text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span>Open Chat</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>

          {/* Email hello@orox.in */}
          <a
            href="mailto:hello@orox.in"
            className="group flex flex-col justify-between p-6 rounded-3xl border-2 border-neutral-200 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50/60 transition-all text-left shadow-xs hover:shadow-xl hover:-translate-y-1 duration-200 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Official Email</span>
              </div>
              <h3 className="text-base font-black uppercase text-neutral-900">Email Us</h3>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                For partnerships, enterprise venue inquiries, or general support.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-blue-100 flex items-center justify-between text-blue-700 font-mono text-xs font-bold truncate">
              <span className="truncate">hello@orox.in</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/oroxofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-6 rounded-3xl border-2 border-neutral-200 hover:border-pink-600 bg-pink-50/30 hover:bg-pink-50/60 transition-all text-left shadow-xs hover:shadow-xl hover:-translate-y-1 duration-200 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <InstagramIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase text-pink-700 tracking-wider">Community</span>
              </div>
              <h3 className="text-base font-black uppercase text-neutral-900">Instagram</h3>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Stay updated on creator drops, featured meetups, and platform features.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-pink-100 flex items-center justify-between text-pink-700 font-mono text-xs font-bold">
              <span>@oroxofficial</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        </div>

        {/* Reassurance Footer Card */}
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold">Average response time: Under 30 minutes during business hours</span>
          </div>
          <span className="text-neutral-400 font-medium">Mon - Sat · 9:00 AM - 9:00 PM IST</span>
        </div>
      </div>
    </div>
  );
}
