/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, MapPin, Calendar, Clock, Compass, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { Event, TicketPurchase } from '../types';

interface MyTicketsPanelProps {
  tickets: TicketPurchase[];
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onCancelBooking?: (ticketId: string) => void;
}

export default function MyTicketsPanel({
  tickets,
  events,
  onSelectEvent,
  onCancelBooking,
}: MyTicketsPanelProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 border border-white/5 rounded-3xl min-h-[400px] select-none">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500 animate-pulse">
          <Ticket className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-bold text-slate-300">No Booking Confirmations Yet</h4>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Book seating or general entry passes for any local happening below to instantly compile your dynamic QR Ticket and unlock map routing features.
        </p>
      </div>
    );
  }

  // Ensure active index is bound correctly if lists change
  const safeIndex = Math.min(activeIndex, tickets.length - 1);
  const activeTicket = tickets[safeIndex >= 0 ? safeIndex : 0];
  if (!activeTicket) return null;

  const associatedEvent = events.find((e) => e.id === activeTicket.eventId);
  if (!associatedEvent) return null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Dynamic Ticket Switcher Chips */}
      {tickets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin select-none">
          {tickets.map((tkt, idx) => {
            const evt = events.find((e) => e.id === tkt.eventId);
            const isSelected = idx === safeIndex;
            return (
              <button
                key={tkt.id}
                onClick={() => setActiveIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono tracking-wider uppercase shrink-0 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-605/20 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                }`}
              >
                🎟️ PASS #{tkt.id.replace('tkt-', '')}
              </button>
            );
          })}
        </div>
      )}

      {/* Futuristic Boarding Ticket Case */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTicket.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="relative bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-purple-950/30 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden gap-6 min-h-[500px]"
        >
          {/* Edge Tear-off Notches */}
          <div className="absolute -left-3 top-[65%] -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-white/5 z-25" />
          <div className="absolute -right-3 top-[65%] -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-white/5 z-25" />

          {/* Top Banner Status */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse [box-shadow:0_0_8px_rgba(52,211,153,0.6)]"></span>
              <span className="text-[10px] font-mono text-emerald-405 font-bold tracking-widest uppercase">
                FINAL RESERVATION CONFIRMED
              </span>
            </div>
            {onCancelBooking && (
              <button
                onClick={() => onCancelBooking(activeTicket.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-900/50 rounded-lg transition-all cursor-pointer"
                title="Cancel Booking"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Event Brief Case */}
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded-md text-[8.5px] uppercase font-mono tracking-wider font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {associatedEvent.category} CATEGORY
              </span>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight select-text">
                {associatedEvent.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1.5 select-text">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {associatedEvent.locationName}, {associatedEvent.city}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 border border-white/5 rounded-2xl text-[11px] font-mono select-none">
              <div className="space-y-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">DATE OCCURRENCE</span>
                <span className="text-slate-200 font-semibold">{associatedEvent.date}</span>
                <span className="text-slate-400 block text-[10px]">{associatedEvent.time}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">SEAT CODE/ROW</span>
                <span className="text-emerald-400 font-bold block truncate">
                  {activeTicket.seats.join(', ')}
                </span>
                <span className="text-slate-450 block text-[10px]">Qty: {activeTicket.quantity} Pax</span>
              </div>
            </div>
          </div>

          {/* Semicircle Dotted Tear Divider */}
          <div className="border-t border-dashed border-white/10 my-1 relative" />

          {/* QR Barcode Access Block */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="space-y-3 font-mono text-[11px] max-sm:text-center w-full sm:w-auto">
              <div>
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">BOOKING PASS ID</span>
                <span className="text-white font-bold select-all">{activeTicket.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">TOTAL PRICE PAID (INR)</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ₹{activeTicket.totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">PURCHASE STAMP</span>
                <span className="text-slate-350">{activeTicket.purchaseDate}</span>
              </div>
            </div>

            {/* QR block frame */}
            <div className="flex flex-col items-center shrink-0 bg-white p-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
              <img
                src={activeTicket.qrCode}
                alt="Transit digital pass barcode QR"
                className="w-24 h-24 select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <span className="text-[8px] font-mono font-bold text-slate-800 tracking-widest mt-1.5 select-all">
                {activeTicket.id}
              </span>
            </div>
          </div>

          {/* Action trigger toolset */}
          <div className="pt-2">
            <button
              onClick={() => {
                onSelectEvent(associatedEvent);
                document.getElementById('spatial-map')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transition-transform hover:scale-[101.5%] select-none cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-200" /> Focus active map & route directions
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
