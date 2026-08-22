'use client';

import React from 'react';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '@/components/SocialIcons';

export default function ContactPage() {
  const phoneNumber = '+919494242253';

  return (
    <div className="min-h-[85vh] bg-white py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block text-xs font-black tracking-widest uppercase px-3 py-1 bg-black text-white rounded-full mb-3 shadow-xs">
            SUPPORT & INQUIRIES
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase">
            Contact Fanmeet
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-medium">
            Need help with your creator page, bookings, or custom venue integration? Reach out to us directly.
          </p>
        </div>

        {/* Official Channels Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/oroxofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white transition-all text-center group shadow-xs hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <InstagramIcon className="w-6 h-6" />
            </div>
            <span className="text-sm font-black uppercase text-neutral-900">Instagram</span>
            <span className="text-xs text-neutral-500 font-mono mt-1 flex items-center gap-1">
              @oroxofficial <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:oroxlabs@gmail.com"
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white transition-all text-center group shadow-xs hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-sm font-black uppercase text-neutral-900">Email Us</span>
            <span className="text-xs text-neutral-500 font-mono mt-1 truncate max-w-full">
              oroxlabs@gmail.com
            </span>
          </a>

          {/* Direct Click to Call - Opens phone app directly without displaying phone number */}
          <a
            href={`tel:${phoneNumber}`}
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white transition-all text-center group shadow-xs hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-sm font-black uppercase text-neutral-900">Direct Call</span>
            <span className="mt-2 inline-flex items-center px-3 py-1 bg-black text-white text-[11px] font-bold uppercase rounded-lg group-hover:bg-neutral-800 transition-colors">
              Click to Call
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
