/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Twitter, Facebook, ExternalLink, Sparkles, X, Check } from 'lucide-react';
import { Event } from '../types';

interface ShareModalProps {
  event: Event;
  onClose: () => void;
}

export default function ShareModal({ event, onClose }: ShareModalProps) {
  const [tagline, setTagline] = useState<string>('Who is coming with me to this? ⚡');
  const [cardTheme, setCardTheme] = useState<'neon' | 'sunset' | 'forest' | 'minimal'>('neon');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedPlatform, setSimulatedPlatform] = useState<string | null>(null);

  const THEMES = {
    neon: 'from-fuchsia-950/90 via-violet-950/80 to-slate-950 border-fuchsia-500/30 text-fuchsia-300',
    sunset: 'from-orange-950/90 via-rose-950/80 to-slate-950 border-rose-500/30 text-rose-300',
    forest: 'from-emerald-950/90 via-slate-950 to-slate-950 border-emerald-500/30 text-emerald-300',
    minimal: 'from-slate-900 via-slate-950 to-slate-950 border-slate-700/40 text-slate-300',
  };

  const handleCopy = () => {
    const mockShareLink = `${window.location.origin}/event/${event.id}?ref=share_${cardTheme}`;
    navigator.clipboard.writeText(mockShareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerMockShare = (platform: string) => {
    setSimulatedPlatform(platform);
    setTimeout(() => {
      setSimulatedPlatform(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative p-6 md:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] uppercase font-mono tracking-wider bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md text-purple-400">
            Postcard Generator
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-2.5">Generate Event Invitation</h2>
          <p className="text-xs text-slate-400 mt-1">Design a customized invitation board to invite companions!</p>
        </div>

        {/* 1. Theme Picker */}
        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-slate-550 font-mono tracking-widest uppercase mb-2">
            Select invitation backdrop theme
          </label>
          <div className="flex gap-2">
            {(['neon', 'sunset', 'forest', 'minimal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCardTheme(t)}
                className={`flex-1 py-1 px-2.5 rounded-lg border text-[11px] font-medium transition-all capitalize cursor-pointer ${
                  cardTheme === t
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/15'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Custom tag input */}
        <div className="mb-5">
          <label className="block text-[10px] font-semibold text-slate-550 font-mono tracking-widest uppercase mb-1.5">
            Add a personal tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Invite messages..."
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* 3. Live Card Preview Render */}
        <div className={`p-6 border rounded-2xl bg-gradient-to-tr ${THEMES[cardTheme]} relative shadow-xl overflow-hidden mb-6`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] uppercase font-mono bg-white/10 px-2 py-0.5 rounded tracking-widest leading-none">
                  Event Invitation
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 leading-tight tracking-tight select-none">
                  {event.title}
                </h3>
              </div>
              <Share2 className="w-4 h-4 shrink-0 text-white/50" />
            </div>

            <p className="text-xs text-white/90 italic tracking-wide font-medium bg-white/5 p-2.5 rounded-lg border border-white/5 select-none">
              "{tagline}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/70 select-none">
              <div>
                <span className="text-[8px] text-white/40 block">WHERE</span>
                <span>{event.locationName}</span>
              </div>
              <div>
                <span className="text-[8px] text-white/40 block">WHEN</span>
                <span>{event.date} • {event.time.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Social Sharing Actions Buttons */}
        <div className="space-y-3.5 border-t border-slate-800/80 pt-5">
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-350 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[98%]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied Invitation Link!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Invitation Link
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => triggerMockShare('Twitter')}
              className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-sky-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Twitter className="w-4 h-4" /> Share on X
            </button>
            <button
              onClick={() => triggerMockShare('Facebook')}
              className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-blue-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Facebook className="w-4 h-4" /> Share on Facebook
            </button>
          </div>
        </div>

        {/* Share completed status toast */}
        <AnimatePresence>
          {simulatedPlatform && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 animate-bounce text-amber-300 shrink-0" />
              <span>Simulating successful share payload directly to {simulatedPlatform}...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
