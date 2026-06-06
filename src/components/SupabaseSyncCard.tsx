import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Copy, Check, Wifi, WifiOff, Terminal, ArrowUpRight, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface SupabaseSyncCardProps {
  user: {
    name: string;
    email: string;
    preferredCity: string;
    preferredDate: string;
  } | null;
}

export default function SupabaseSyncCard({ user }: SupabaseSyncCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showSqlSetup, setShowSqlSetup] = useState<boolean>(false);
  
  // Interactive Manual Sync States
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sqlSchema = `-- 1. CREATE USER PROFILES TABLE
create table if not exists public.profiles (
  email text primary key,
  name text not null,
  preferred_city text,
  preferred_date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CREATE TICKET BOOKINGS TABLE
create table if not exists public.bookings (
  id text primary key,
  event_id text not null,
  user_email text not null references public.profiles(email) on delete cascade,
  seats text[] not null default '{}',
  quantity integer not null default 1,
  total_price integer not null default 0,
  status text not null default 'active',
  qr_code text,
  booked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE ROW LEVEL SECURITY (Optional)
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- 4. BYPASS POLICY FOR CLIENT ACCESS
create policy "Allow public access to profiles" on public.profiles for all using (true);
create policy "Allow public access to bookings" on public.bookings for all using (true);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2050);
  };

  const checkCounts = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setIsVerifying(true);
      const { count: profs, error: profErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: books, error: bookErr } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      if (!profErr) setProfileCount(profs ?? 0);
      if (!bookErr) setBookingCount(books ?? 0);
    } catch (err) {
      console.warn('Unable to query Supabase tables counts:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const [bookingError, setBookingError] = useState<string>('');

  useEffect(() => {
    checkCounts();
    // Poll counts every 15 seconds to keep it active
    const interval = setInterval(checkCounts, 15000);

    const handleBookingError = (e: Event) => {
      const msg = (e as CustomEvent).detail || 'Database constraint violation';
      setBookingError(msg);
      // Auto clear after 20 seconds
      setTimeout(() => setBookingError(''), 20000);
    };

    window.addEventListener('supabase-booking-error', handleBookingError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('supabase-booking-error', handleBookingError);
    };
  }, [user?.email]);

  const handleManualSync = async () => {
    if (!user || !supabase) return;
    setSyncStatus('syncing');
    setErrorMessage('');
    
    try {
      // Direct upsert to capture any potential error messages
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            email: user.email.toLowerCase(),
            name: user.name,
            preferred_city: user.preferredCity,
            preferred_date: user.preferredDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

      if (error) {
        setSyncStatus('error');
        setErrorMessage(error.message);
      } else {
        setSyncStatus('success');
        await checkCounts();
        setTimeout(() => setSyncStatus('idle'), 4000);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err?.message || 'Connection failed.');
    }
  };

  return (
    <div className="rounded-3xl bento-blur border border-white/5 p-6 space-y-4 relative overflow-hidden bg-slate-950/25">
      {/* Visual Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-2xl pointer-events-none rounded-full ${isSupabaseConfigured ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`} />

      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-indigo-400" /> Database Integration
        </h4>
        
        {/* Live Status indicator pills */}
        {isSupabaseConfigured ? (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-widest">Supabase Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full" title="Connect keys in App Settings -> Secrets">
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-mono font-bold text-amber-300 uppercase tracking-widest">Offline (Local)</span>
          </div>
        )}
      </div>

      {isSupabaseConfigured ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-350 leading-relaxed">
            Connected to real Supabase postgres parameters. Profile registration and bookings automatically sync to database tables.
          </p>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 text-center">
              <span className="block text-slate-500 font-mono text-[8.5px] uppercase tracking-wider">Cloud Users</span>
              <span className="block text-xl font-bold text-slate-100 font-sans mt-0.5">
                {profileCount === null ? (
                  <span className="inline-block w-3 h-3 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
                ) : (
                  profileCount
                )}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 text-center">
              <span className="block text-slate-500 font-mono text-[8.5px] uppercase tracking-wider">Cloud Bookings</span>
              <span className="block text-xl font-bold text-emerald-400 font-sans mt-0.5">
                {bookingCount === null ? (
                  <span className="inline-block w-3 h-3 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
                ) : (
                  bookingCount
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Active user: <b className="text-teal-350">{user?.email}</b></span>
              </div>
              <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing' || !user}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 active:scale-[98%] text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all font-mono text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Error / Success Feedback Notifications */}
            <AnimatePresence mode="wait">
              {syncStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1 pb-1 text-[9.5px] text-emerald-400 font-mono flex items-center gap-1.5 animate-pulse"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Successfully upserted profile database record!
                </motion.div>
              )}

              {syncStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1 p-2 bg-rose-950/20 border border-rose-500/20 rounded-lg text-[9px] text-[#f43f5e] font-mono flex flex-col gap-0.5"
                >
                  <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-[#f43f5e]" /> Write Failed</span>
                  <span className="text-rose-400/80 leading-normal">{errorMessage}</span>
                </motion.div>
              )}

              {bookingError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 p-2.5 bg-amber-950/30 border border-amber-500/25 rounded-xl text-[9px] text-amber-400 font-mono flex flex-col gap-1"
                >
                  <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Booking Sync Warning</span>
                  <p className="text-amber-300/85 leading-normal">{bookingError}</p>
                  <span className="text-[8px] text-slate-400 mt-1 block leading-normal">💡 Suggestion: Ensure you have executed current SQL steps 3 & 4 (RLS policy permissions) in your Supabase SQL Editor.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-450 leading-relaxed">
            We support complete synchronization with your Supabase backend. Place keys in the app's environment to test live SQL triggers.
          </p>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl text-[11px] text-indigo-300">
            <span className="font-bold flex items-center gap-1.5">
              💡 Setup in 1 minute:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 mt-2 font-mono text-[9.5px]">
              <li>Configure <b>VITE_SUPABASE_URL</b> & <b>VITE_SUPABASE_ANON_KEY</b> in the AI Studio Settings secrets panel.</li>
              <li>Press <b>Restart Dev Server</b> to reload the application container.</li>
              <li>Execute the SQL schema inside your Supabase project's SQL Editor.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Accordion Setup SQL Panel */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/30">
        <button
          onClick={() => setShowSqlSetup(!showSqlSetup)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-all outline-none cursor-pointer text-left"
        >
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-350 uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" /> Supabase SQL Schema
          </span>
          <span className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
            {showSqlSetup ? 'Hide SQL Code' : 'Show SQL Code'} <ArrowUpRight className="w-3 h-3" />
          </span>
        </button>

        <AnimatePresence>
          {showSqlSetup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5 bg-slate-950/90 relative"
            >
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-900 border border-white/10 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[9px] font-mono cursor-pointer uppercase font-bold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 overflow-x-auto text-[9px] text-[#34d399] font-mono leading-relaxed max-h-56 select-text">
                <code>{sqlSchema}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
