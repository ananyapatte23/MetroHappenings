/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, Ticket, Printer, X, Eye, EyeOff } from 'lucide-react';
import { Event, TicketPurchase } from '../types';

interface TicketModalProps {
  event: Event;
  onClose: () => void;
  onPurchaseComplete: (ticket: TicketPurchase) => void;
}

export default function TicketModal({ event, onClose, onPurchaseComplete }: TicketModalProps) {
  const [ticketQty, setTicketQty] = useState<number>(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'seats' | 'payment' | 'receipt'>('seats');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [purchasedTicket, setPurchasedTicket] = useState<TicketPurchase | null>(null);

  // Form errors
  const [paymentError, setPaymentError] = useState<string>('');

  // 6x6 grid seat simulation
  const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
  const SEAT_COLS = [1, 2, 3, 4, 5, 6];

  // Mock occupied seats
  const OCCUPIED_SEATS = ['A2', 'A3', 'C4', 'D1', 'E5', 'E6', 'B2'];

  const toggleSeat = (seatCode: string) => {
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatCode));
    } else {
      // Limit quantity of seats to 6
      if (selectedSeats.length >= 6) {
        alert('You can purchase a maximum of 6 tickets per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const currentQty = event.hasSeats ? selectedSeats.length : ticketQty;
  const computedTotal = currentQty * event.price;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!cardHolder.trim() || cardNumber.length < 16) {
      setPaymentError('Please enter a valid credit card credentials.');
      return;
    }

    // Process a highly convincing pseudo transaction complete
    const finalReceipt: TicketPurchase = {
      id: `tkt-${Math.floor(100000 + Math.random() * 900000)}`,
      eventId: event.id,
      seats: event.hasSeats ? selectedSeats : Array.from({ length: ticketQty }, (_, i) => `GA-${101 + i}`),
      quantity: currentQty,
      totalPrice: computedTotal,
      purchaseDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      status: 'active',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MetroEvent-${event.id}-${Math.random()}`,
    };

    setPurchasedTicket(finalReceipt);
    setStep('receipt');
    onPurchaseComplete(finalReceipt);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Seat Selection / Details Selector */}
        {step === 'seats' && (
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <span className="text-[10px] uppercase font-mono tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md text-indigo-400">
                Ticket Desk
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-2">{event.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{event.locationName} • {event.date} at {event.time}</p>
            </div>

            {event.hasSeats ? (
              /* Visual Seating arrangement map */
              <div className="mb-6">
                <div className="text-center text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-4">
                  ----- STAGE FRONTAL STAGE -----
                </div>

                <div className="flex flex-col items-center gap-2">
                  {SEAT_ROWS.map((row) => (
                    <div key={row} className="flex gap-2 items-center">
                      <span className="w-4 text-center text-xs font-mono font-bold text-slate-500">{row}</span>
                      <div className="flex gap-1.5">
                        {SEAT_COLS.map((col) => {
                          const seatCode = `${row}${col}`;
                          const isOccupied = OCCUPIED_SEATS.includes(seatCode);
                          const isSelected = selectedSeats.includes(seatCode);

                          let seatColor = 'bg-slate-955 hover:bg-slate-800 border-slate-800 text-slate-400';
                          if (isOccupied) seatColor = 'bg-slate-950 border-slate-900 text-slate-700/60 opacity-60 cursor-not-allowed';
                          if (isSelected) seatColor = 'bg-emerald-500 border-white text-slate-950 font-bold shadow-lg shadow-emerald-500/20';

                          return (
                            <button
                              key={col}
                              id={`seat-${seatCode}`}
                              disabled={isOccupied}
                              onClick={() => toggleSeat(seatCode)}
                              className={`w-8 h-8 rounded-lg border text-[10px] flex items-center justify-center transition-all cursor-pointer ${seatColor}`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seating Map Guideline legend */}
                <div className="flex items-center justify-center gap-5 mt-5 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-slate-955 border border-slate-850 inline-block" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                    <span className="w-3 h-3 rounded-md bg-slate-950 opacity-60 inline-block" />
                    <span>Occupied</span>
                  </div>
                </div>
              </div>
            ) : (
              /* General Admission count incrementer */
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 mb-6 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">General Admission</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Flexible seating/standing space</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setTicketQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 border border-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold bg-slate-900"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white w-4 text-center">{ticketQty}</span>
                  <button
                    onClick={() => setTicketQty((q) => Math.min(10, q + 1))}
                    className="w-9 h-9 border border-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold bg-slate-900"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Price evaluation dashboard */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
              <div>
                <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Order Subtotal</div>
                <div className="text-xl font-bold text-white mt-0.5 font-mono">
                  ₹{computedTotal.toLocaleString('en-IN')}
                </div>
                {event.hasSeats && selectedSeats.length > 0 && (
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    Seats: {selectedSeats.join(', ')}
                  </div>
                )}
              </div>
              <button
                disabled={event.hasSeats ? selectedSeats.length === 0 : false}
                onClick={() => setStep('payment')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 select-none shadow-lg shadow-indigo-600/10"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Custom Card Payment panel */}
        {step === 'payment' && (
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-4">Complete Payment Method</h2>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Amount to Pay</span>
                  <h3 className="text-xl font-mono font-bold text-white mt-1">₹{computedTotal.toLocaleString('en-IN')}</h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 bg-indigo-500/15 border border-indigo-500/25 px-3 py-1.5 rounded-lg font-semibold">
                  <CreditCard className="w-4 h-4 text-indigo-400" /> Secure Gate
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1">
                  Cardholder Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1">
                  Credit Card Number
                </label>
                <input
                  type="text"
                  maxLength={16}
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1">
                    Expiry MM/YY
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    required
                    placeholder="06/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1">
                    CVC Code
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    required
                    placeholder="***"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest"
                  />
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-rose-950/25 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                  {paymentError}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-800/85">
                <button
                  type="button"
                  onClick={() => setStep('seats')}
                  className="flex-1 py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-450 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                >
                  Adjust Seats
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Confirm & Purchase
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Complete Ticket Printable Card Overlay */}
        {step === 'receipt' && purchasedTicket && (
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">Receipt Confirmed!</h2>
              <p className="text-xs text-slate-400">See your active entrance pass below</p>
            </div>

            {/* The actual Pass Card visual representation */}
            <div className="my-6 p-6 bg-gradient-to-br from-indigo-950/90 to-purple-950/80 border border-indigo-500/25 rounded-2xl relative shadow-2xl backdrop-blur-md overflow-hidden">
              {/* Card notches for ticket look */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-800 z-10" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-800 z-10" />

              {/* Grid content split by dashed separator */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* 1. Left metadata block */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/35">
                      {event.category} Entrance
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2 leading-tight">{event.title}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <div className="text-slate-450 uppercase uppercase font-mono text-[9px] tracking-wider mb-0.5">Date & Slot</div>
                      <div className="text-white font-semibold text-xs leading-none">{event.date}</div>
                      <div className="text-[10px] text-slate-350 mt-1">{event.time}</div>
                    </div>
                    <div>
                      <div className="text-slate-450 uppercase uppercase font-mono text-[9px] tracking-wider mb-0.5">Seats Row/No</div>
                      <div className="text-emerald-300 font-bold font-mono text-xs leading-none">
                        {purchasedTicket.seats.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-indigo-500/10">
                    <div>
                      <div className="text-slate-450 uppercase uppercase font-mono text-[9px] tracking-wider mb-0.5">Pass ID</div>
                      <div className="text-slate-200 text-[11px] leading-none">{purchasedTicket.id}</div>
                    </div>
                    <div>
                      <div className="text-slate-450 uppercase uppercase font-mono text-[9px] tracking-wider mb-0.5">Price Total</div>
                      <div className="text-slate-200 text-[11px] leading-none font-bold">₹{purchasedTicket.totalPrice.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* 2. QR Block */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-xl hover:scale-105 transition-transform duration-300">
                  <img
                    src={purchasedTicket.qrCode}
                    alt="Entrance BarcodeQR"
                    className="w-28 h-28 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[8px] font-mono font-bold tracking-widest text-slate-900 mt-2">
                    {purchasedTicket.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t border-slate-800/85 pt-5">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Pass
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all cursor-pointer text-center"
              >
                Awesome, Thank you!
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
