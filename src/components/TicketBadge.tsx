'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Ticket, User, Phone, Mail } from 'lucide-react';
import { Booking } from '@/types';

interface TicketBadgeProps {
  booking: Booking;
}

export default function TicketBadge({ booking }: TicketBadgeProps) {
  const event = booking.event;

  return (
    <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-xl max-w-md mx-auto relative font-sans">
      {/* Top Header Ticket Band */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          <span className="text-xs font-black tracking-widest uppercase">FANMEET PASS</span>
        </div>
        <span className="text-xs font-mono bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-300">
          {booking.qr_ticket_code}
        </span>
      </div>

      {/* Ticket Body */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-black text-neutral-900 leading-tight">
            {event?.title || 'Fanmeet Event'}
          </h3>
          {event?.creator && (
            <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-wider">
              Hosted by @{event.creator.handle}
            </p>
          )}
        </div>

        {/* Date & Location */}
        <div className="space-y-2 py-3 border-y border-dashed border-neutral-300 my-4 text-xs text-neutral-700">
          {event?.from_time && (
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {new Date(event.from_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>{' '}
                • {new Date(event.from_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {event?.location && (
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                <span className="font-medium text-neutral-800">{event.location}</span>
              </div>
              {event.location_url && (
                <a
                  href={event.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                >
                  Map Link ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Attendee Details */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Attendee</span>
            <span className="font-bold text-neutral-900 truncate block">{booking.attendee_name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tickets</span>
            <span className="font-bold text-neutral-900 block">{booking.ticket_count} Pass(es)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Amount Paid</span>
            <span className="font-bold text-neutral-900 block">₹{booking.amount_paid}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Status</span>
            <span className="inline-block font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
              CONFIRMED
            </span>
          </div>
        </div>

        {/* QR Code Validation Stamp */}
        <div className="text-center pt-2">
          <div className="p-3 bg-neutral-50 border-2 border-neutral-900 rounded-2xl inline-block shadow-inner mb-3">
            <QRCodeSVG
              value={`FANMEET_PASS:${booking.qr_ticket_code}|EVENT:${booking.event_id}|NAME:${booking.attendee_name}`}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
            Scan at gate for check-in
          </p>
        </div>
      </div>

      {/* Decorative Ticket Perforations */}
      <div className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-neutral-100 border border-neutral-300" />
      <div className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-neutral-100 border border-neutral-300" />
    </div>
  );
}
