/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Compass,
  ArrowRight,
  TrendingUp,
  Tag,
  Share2,
  Ticket,
  ChevronRight,
  AlertCircle,
  X,
  Map as MapIcon,
  Search,
  Grid
} from 'lucide-react';
import { Event, UserPreferences, TicketPurchase, AppNotification } from './types';
import { INITIAL_EVENTS } from './dummyData';
import MapComponent from './components/MapComponent';
import SuggestionsPanel from './components/SuggestionsPanel';
import TicketModal from './components/TicketModal';
import ShareModal from './components/ShareModal';
import NotificationCenter from './components/NotificationCenter';
import AuthScreen from './components/AuthScreen';
import MyTicketsPanel from './components/MyTicketsPanel';
import SupabaseSyncCard from './components/SupabaseSyncCard';

export default function App() {
  // Authentication & Location Dynamic state
  const [user, setUser] = useState<{
    name: string;
    email: string;
    preferredCity: 'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad';
    preferredDate: string;
  } | null>(() => {
    const saved = localStorage.getItem('metro_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedCity, setSelectedCity] = useState<'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad'>(() => {
    const saved = localStorage.getItem('metro_active_user');
    return saved ? JSON.parse(saved).preferredCity : 'Bengaluru';
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const saved = localStorage.getItem('metro_active_user');
    return saved ? JSON.parse(saved).preferredDate : 'June 13, 2026';
  });

  // Track booked events to drive the active route mapping
  const [purchasedTickets, setPurchasedTickets] = useState<TicketPurchase[]>(() => {
    const saved = localStorage.getItem('metro_booked_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookedTickets, setBookedTickets] = useState<string[]>(() => {
    const saved = localStorage.getItem('metro_booked_tickets');
    if (saved) {
      const parsed = JSON.parse(saved) as TicketPurchase[];
      return parsed.map((t) => t.eventId);
    }
    return [];
  });

  const [lastBookedEvent, setLastBookedEvent] = useState<Event | null>(null);

  // Global States
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(INITIAL_EVENTS[0]); // Default highlighted event
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Coordinates (Percentage matching map coordinates system 0-100)
  const [userCoords, setUserCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Relocate map coordinate based on city selection
  useEffect(() => {
    if (selectedCity === 'Bengaluru') {
      setUserCoords({ x: 50, y: 50 });
    } else if (selectedCity === 'Mumbai') {
      setUserCoords({ x: 40, y: 45 });
    } else if (selectedCity === 'Delhi NCR') {
      setUserCoords({ x: 60, y: 35 });
    } else if (selectedCity === 'Hyderabad') {
      setUserCoords({ x: 30, y: 60 });
    }
  }, [selectedCity]);

  // Sync tickets loader from Supabase when user is logged in
  useEffect(() => {
    if (!user || !user.email) return;

    async function loadSupabaseData() {
      try {
        const { isSupabaseConfigured, fetchUserTickets, syncUserProfile } = await import('./lib/supabase.ts');
        if (isSupabaseConfigured) {
          // Sync profile
          await syncUserProfile(user);

          // Retrieve live ticket purchases from Supabase, syncing with current view
          const supTickets = await fetchUserTickets(user.email);
          if (supTickets) {
            setPurchasedTickets(supTickets);
            setBookedTickets(supTickets.map((t) => t.eventId));
            
            const syncNotif: AppNotification = {
              id: `notif-sync-${Date.now()}`,
              title: '⛅ Supabase Live Synchronized',
              message: `Successfully loaded ${supTickets.length} entrance tickets from your Cloud Postgres database!`,
              type: 'success',
              timestamp: 'Just now',
              read: false,
            };
            setNotifications((prev) => [syncNotif, ...prev]);
          }
        }
      } catch (err) {
        console.error('Failed to resolve dynamic data sync from Supabase:', err);
      }
    }
    loadSupabaseData();
  }, [user]);

  // Auth helper callbacks
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('metro_active_user', JSON.stringify(userData));
    setUser(userData);
    setSelectedCity(userData.preferredCity);
    setSelectedDate(userData.preferredDate);
  };

  const handleLogout = () => {
    localStorage.removeItem('metro_active_user');
    setUser(null);
  };

  // User Onboarding Interest Questionnaire filters
  const [activeFilters, setActiveFilters] = useState<UserPreferences>({
    categories: [],
    vibes: [],
    maxPrice: 3000, // Elevated for INR pricing range
    distance: 12,
  });

  // Modal Open states
  const [ticketModalEvent, setTicketModalEvent] = useState<Event | null>(null);
  const [shareModalEvent, setShareModalEvent] = useState<Event | null>(null);

  // Notifications
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Welcome to Indian MetroHappenings!',
      message: 'Enable push notifications to monitor flash sales, local curated directions, and custom agendas.',
      type: 'info',
      timestamp: '11:23 AM',
      read: false,
    },
  ]);

  // Toast Notification Overlay
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Automatic Background Notifications Simulator
  useEffect(() => {
    // 1st simulated background push: Flash Sale Alert (after 10s)
    const flashSaleTimer = setTimeout(() => {
      if (!subscriptionActive) return;
      const targetEvent = events[0]; // Summer Festival
      const newNotif: AppNotification = {
        id: `notif-flash-${Date.now()}`,
        title: '⚡ FLASH SALE REMINDER',
        message: `Tickets for "${targetEvent.title}" are 15% off for the next 15 minutes! Coupon code: NEON15`,
        type: 'alert',
        timestamp: '11:25 AM',
        read: false,
        eventId: targetEvent.id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setActiveToast(newNotif);
    }, 12000);

    // 2nd simulated background push: Trending Alert (after 30s)
    const trendingTimer = setTimeout(() => {
      if (!subscriptionActive) return;
      const targetEvent = events[3]; // AI DevCon
      const newNotif: AppNotification = {
        id: `notif-trend-${Date.now()}`,
        title: '🔥 SEATS FILLING RAPIDLY',
        message: `"${targetEvent.title}" seats are at 91% capacity limits. Secure yours now!`,
        type: 'ticket',
        timestamp: '11:28 AM',
        read: false,
        eventId: targetEvent.id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setActiveToast(newNotif);
    }, 32000);

    return () => {
      clearTimeout(flashSaleTimer);
      clearTimeout(trendingTimer);
    };
  }, [events, subscriptionActive]);

  // Dismiss Toast
  const dismissToast = () => setActiveToast(null);

  // Append customized AI/Simulated results
  const handleAddCustomEvents = (newEvents: Event[]) => {
    // Prevent duplicate entries
    const filteredNew = newEvents.filter((item) => !events.some((e) => e.title === item.title));
    if (filteredNew.length === 0) return;

    setEvents((prev) => [...filteredNew, ...prev]);
    setSelectedEvent(filteredNew[0]); // Automatically select the first AI results!

    // Push notification for AI Agendas Loaded
    const agendaNotif: AppNotification = {
      id: `notif-ai-${Date.now()}`,
      title: '✨ Curated Agendas Loaded',
      message: `${filteredNew.length} hyper-personalized dynamic events situated directly on your map!`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [agendaNotif, ...prev]);
    setActiveToast(agendaNotif);
  };

  // Filter change callback
  const handleFilterChange = (filters: UserPreferences) => {
    setActiveFilters(filters);
  };

  // Complete ticket purchase logic
  const handlePurchaseComplete = async (ticket: TicketPurchase) => {
    // Append notification log
    const targetEvt = events.find((e) => e.id === ticket.eventId);
    if (!targetEvt) return;

    setBookedTickets((prev) => [...prev, ticket.eventId]);
    setPurchasedTickets((prev) => {
      const updated = [ticket, ...prev];
      localStorage.setItem('metro_booked_tickets', JSON.stringify(updated));
      return updated;
    });
    setLastBookedEvent(targetEvt);
    setSelectedEvent(targetEvt); // Focus on map too!

    // Asynchronously push registration record to Supabase if is active
    try {
      const { isSupabaseConfigured, syncUserProfile, syncTicketBooking } = await import('./lib/supabase.ts');
      if (isSupabaseConfigured && user) {
        // Double check & ensure the parent profile is synced first to prevent Foreign Key constraints violation
        await syncUserProfile(user);
        
        // Pass user.email as the second argument to link correctly
        await syncTicketBooking(ticket, user.email);
      }
    } catch (err) {
      console.warn('Silent fallback: Supabase sync skipped:', err);
    }

    const purchaseNotif: AppNotification = {
      id: `notif-purchase-${ticket.id}`,
      title: '🎟️ Entrance Ticket Secure!',
      message: `Successfully booked ${ticket.quantity} seats for "${targetEvt.title}". Digital pass has been compiled.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      eventId: targetEvt.id,
    };

    setNotifications((prev) => [purchaseNotif, ...prev]);
    setActiveToast(purchaseNotif);

    // Smoothly scroll down to show the highlighted route on the map
    setTimeout(() => {
      document.getElementById('spatial-map')?.scrollIntoView({ behavior: 'smooth' });
    }, 850);
  };

  const handleCancelBooking = async (ticketId: string) => {
    const ticketToCancel = purchasedTickets.find((tkt) => tkt.id === ticketId);
    if (!ticketToCancel) return;

    const remaining = purchasedTickets.filter((tkt) => tkt.id !== ticketId);
    setPurchasedTickets(remaining);
    localStorage.setItem('metro_booked_tickets', JSON.stringify(remaining));

    // Remove from booked event IDs mapping to clean route rendering
    setBookedTickets((prev) => prev.filter((id) => id !== ticketToCancel.eventId));

    if (lastBookedEvent?.id === ticketToCancel.eventId) {
      setLastBookedEvent(null);
    }

    // Asynchronously update cancellation in Supabase
    try {
      const { isSupabaseConfigured, deleteTicketBooking } = await import('./lib/supabase.ts');
      if (isSupabaseConfigured) {
        await deleteTicketBooking(ticketId);
      }
    } catch (err) {
      console.warn('Silent status fallback: Supabase cancellation sync skipped:', err);
    }
  };

  // General Notification control handlers
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleToggleSubscription = () => {
    setSubscriptionActive(!subscriptionActive);
  };

  // Filter events query evaluated list
  const filteredEvents = events.filter((e) => {
    // 1. Location/City match
    const matchesCity = e.city === selectedCity;

    // 2. Date match (all events made dynamically available across all dates!)
    const matchesDate = true;

    // 3. Search match
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // 4. Active Category fit
    const matchesCategory = activeCategory === 'All' || e.category === activeCategory;

    // 5. Budget slider evaluation
    const matchesPrice = e.price <= activeFilters.maxPrice;

    // 6. Preference Category fitting (if checklist specified)
    const matchesPrefCategory =
      activeFilters.categories.length === 0 || activeFilters.categories.includes(e.category);

    return matchesCity && matchesDate && matchesSearch && matchesCategory && matchesPrice && matchesPrefCategory;
  });

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] gradient-glow pointer-events-none opacity-60" />
      <div className="absolute bottom-[20%] right-[3%] w-[35rem] h-[35rem] gradient-glow pointer-events-none opacity-40" />

      {/* 1. Navigation / HUD Header */}
      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Compass className="w-5.5 h-5.5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
                MetroHappenings
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase mt-1">Spatial Discovery Labs</p>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 max-md:hidden select-none">
              <span className="w-2 h-2 rounded-full bg-indigo-400 [box-shadow:0_0_8px_rgba(129,140,248,0.6)] animate-pulse"></span>
              <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider">{selectedCity}, India • Grid Active</span>
            </div>

            {/* User credentials chip */}
            {user && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-600 font-bold text-[10px] text-white flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-200 font-medium max-sm:hidden">
                  Namaste, {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-[10px] bg-slate-900 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-450 px-2 py-1 rounded-lg font-mono tracking-widest uppercase transition-all cursor-pointer"
                  title="Sign out of your session"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Notification Core panel bell */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearNotifications={handleClearNotifications}
              subscriptionActive={subscriptionActive}
              onToggleSubscription={handleToggleSubscription}
            />
          </div>
        </div>
      </header>

      {/* 2. Banner Highlights / Quick onboarding section */}
      <section className="px-4 md:px-8 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bento-blur border-t-2 border-t-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent p-6 md:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            {/* Ambient overlay light */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-600/15 to-transparent blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
              <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold font-mono tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ⚡ CURATED EXPERIENCES
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Instantly Navigate the Best Local Agendas & Events
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect with food trucks, interactive hackathons, laser synth parties, and standup shows with live path-routing navigation maps!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto relative z-10">
              {/* Quick Jump map filter trigger */}
              <a
                href="#spatial-map"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer select-none transition-transform hover:scale-105 active:scale-[98%]"
              >
                Launch Spatial Map
              </a>
              <a
                href="#personalized-agendas"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-center bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
              >
                Personalize Agenda
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Map and List Grid Hub */}
      <main className="flex-1 px-4 md:px-8 py-4 space-y-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Spatial Hub Selection Controls (Bento layout) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bento-blur border border-white/10 rounded-3xl p-6 md:p-8 bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
            
            {/* Left side: Location Switcher */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-400 uppercase">STEP 1: SELECT CITADEL CENTRALITY NODE</span>
                <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 animate-bounce" /> Choose Location
                </h3>
                <p className="text-xs text-slate-400 mt-1">Relocates maps instantly across virtual Indian boundaries.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {(['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'] as const).map((city) => {
                  const isCitySelected = selectedCity === city;
                  const cityLabel = {
                    Bengaluru: 'Silicon Hub',
                    Mumbai: 'Coastal Commute',
                    'Delhi NCR': 'Heritage Area',
                    Hyderabad: 'Cyber Tech Dome'
                  }[city];

                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`p-3.5 rounded-2xl flex flex-col items-start gap-1 text-left transition-all duration-300 cursor-pointer border ${
                        isCitySelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-600/10 text-white'
                          : 'bg-slate-950/45 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">{city}</span>
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider">{cityLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Day Calendar timeline selector */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-400 uppercase">STEP 2: SELECT CALENDAR OCCURRENCE</span>
                <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Select Attending Day
                </h3>
                <p className="text-xs text-slate-400 mt-1">Filters Indian happenings occurring on that specific date.</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { value: 'All Dates', label: 'All Dates', sub: 'Entire Month' },
                  { value: 'June 12, 2026', label: 'June 12', sub: 'Friday' },
                  { value: 'June 13, 2026', label: 'June 13', sub: 'Saturday' },
                  { value: 'June 14, 2026', label: 'June 14', sub: 'Sunday' },
                  { value: 'June 19, 2026', label: 'June 19', sub: 'Friday' },
                  { value: 'June 20, 2026', label: 'June 20', sub: 'Saturday' },
                  { value: 'June 21, 2026', label: 'June 21', sub: 'Sunday' },
                ].map((dt) => {
                  const isDateSelected = selectedDate === dt.value;
                  return (
                    <button
                      key={dt.value}
                      onClick={() => setSelectedDate(dt.value)}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer text-center border ${
                        isDateSelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-600/10 text-white'
                          : 'bg-slate-950/45 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono leading-none">{dt.label}</span>
                      <span className="text-[8px] text-slate-500 font-mono tracking-wider mt-1">{dt.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Spatial Map Routing Section */}
          <div id="spatial-map" className="space-y-4 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-indigo-400 animate-pulse" /> Spatial Routing Grid
                </h3>
                <p className="text-xs text-slate-400">Click coordinates pins to track, navigate, and estimate travel directions</p>
              </div>

              {/* Dynamic Coordinate details HUD */}
              <div className="flex gap-4 text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <div>
                  <span className="text-slate-500 font-semibold">LOC_X:</span>{' '}
                  <span className="text-emerald-400">{userCoords.x.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">LOC_Y:</span>{' '}
                  <span className="text-emerald-400">{userCoords.y.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Real-time Confirmed Route HUD */}
            {lastBookedEvent && (
              <motion.div
                key={`booked-hud-${lastBookedEvent.id}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/45 border-2 border-emerald-500/35 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl text-xs font-mono mb-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse shrink-0 flex items-center justify-center text-[10px] text-emerald-950 font-bold">✓</span>
                  <div>
                    <h4 className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">🎟️ ACTIVE BOOKING ROUTE RESOLVED</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Your route to <span className="font-semibold text-white">{lastBookedEvent.title}</span> in <span className="font-medium text-emerald-300">{lastBookedEvent.city}</span> ({lastBookedEvent.locationName}) is now glowing on the digital spatial grid below.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedEvent(lastBookedEvent);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl uppercase font-semibold text-[10px] tracking-wider transition-colors cursor-pointer"
                  >
                    Focus Map Pin
                  </button>
                  <button
                    onClick={() => setLastBookedEvent(null)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    Clear HUD
                  </button>
                </div>
              </motion.div>
            )}

            {/* The actual Map Integration with interactive online passes alongside */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8 flex flex-col justify-between">
                <MapComponent
                  events={filteredEvents}
                  selectedEvent={selectedEvent}
                  onSelectEvent={setSelectedEvent}
                  userCoords={userCoords}
                  setUserCoords={setUserCoords}
                />
              </div>
              <div className="lg:col-span-4 flex flex-col">
                <MyTicketsPanel
                  tickets={purchasedTickets}
                  events={events}
                  onSelectEvent={(evt) => {
                    setSelectedEvent(evt);
                    setSelectedCity(evt.city);
                    setUserCoords(evt.coordinates);
                  }}
                  onCancelBooking={handleCancelBooking}
                />
              </div>
            </div>
          </div>

          {/* Quick Agenda discovery & searching feed */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* LEFT BLOCK: Categorized list of occurrences/events */}
            <div className="xl:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Grid className="w-5 h-5 text-indigo-400" /> Local Happening Agendas
                  </h3>
                  <p className="text-xs text-slate-400">Select an event below to locate on map or book seating passes</p>
                </div>

                {/* Categories quick filter pills */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-wrap gap-1 items-center">
                  {['All', 'Music', 'Food', 'Art', 'Tech', 'Comedy', 'Sports'].map((cat) => (
                    <button
                      key={cat}
                      id={`pill-filter-${cat}`}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeCategory === cat
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Cards Stack Feed */}
              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center bento-blur rounded-3xl">
                  <p className="text-sm text-slate-400 font-medium">No local happenings match the active query.</p>
                  <p className="text-xs text-slate-500 mt-1">Adjust budget settings or reset search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedEvent?.id === evt.id;
                    const isAI = evt.id.startsWith('ai-');

                    return (
                      <motion.div
                        key={evt.id}
                        layoutId={`card-layout-${evt.id}`}
                        onClick={() => setSelectedEvent(evt)}
                        className={`rounded-3xl overflow-hidden bento-blur transition-all duration-350 transform cursor-pointer border hover:border-white/20 hover:scale-[101.5%] flex flex-col justify-between relative ${
                          isSelected 
                            ? 'border-indigo-500/80 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' 
                            : 'border-white/5 bg-white/[0.015]'
                        }`}
                      >
                        {/* Img frame with Referrer Safe wrapper */}
                        <div className="h-44 relative bg-slate-950 overflow-hidden">
                          <img
                            src={evt.image}
                            alt={evt.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover select-none transform hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-slate-950/80 backdrop-blur-md text-[9px] py-1 px-2.5 rounded-lg font-mono font-bold tracking-wider text-slate-200 border border-white/5">
                              {evt.category}
                            </span>
                            {isAI && (
                              <span className="bg-indigo-600/90 backdrop-blur-md text-[9px] py-1 px-2.5 rounded-lg font-bold tracking-widest text-white flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-350" /> AI DRAFT
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold py-1 px-2 rounded-lg text-emerald-400 border border-white/5">
                            {evt.price === 0 ? 'FREE' : `₹${evt.price.toLocaleString('en-IN')}`}
                          </div>
                        </div>

                        {/* Event Content card metrics */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                                {evt.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                {evt.locationName}
                              </p>
                            </div>

                            <p className="text-xs text-slate-350 leading-relaxed line-clamp-2">{evt.description}</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{selectedDate === 'All Dates' ? evt.date : selectedDate}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{evt.time.split(' - ')[0]}</span>
                              </div>
                            </div>

                            {/* Quick Interactive Toolset */}
                            <div className="flex justify-between items-center gap-2 pt-1">
                              <div className="flex gap-1.5">
                                {/* Share */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareModalEvent(evt);
                                  }}
                                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                                  title="Share Invitation Postcard"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                {/* Locate */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(evt);
                                    // Smooth scroll map to view
                                    document.getElementById('spatial-map')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-450 hover:text-emerald-400 transition-all cursor-pointer"
                                  title="Pin on Map"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Book Ticket Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTicketModalEvent(evt);
                                }}
                                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-505 font-bold text-[10px] uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 transition-all hover:scale-[102%] select-none cursor-pointer"
                              >
                                <Ticket className="w-3.5 h-3.5 text-indigo-200" /> Book Seats
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: Map Detail / Quick Search Drawer */}
            <div className="xl:col-span-4 space-y-6">
              {/* Search Box Card */}
              <div className="rounded-3xl bento-blur border-white/5 p-6 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-450 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Search & Discover
                </h4>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search: EDM, tacos, AI, sports..."
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Supabase synchronizer control card panel */}
              <SupabaseSyncCard user={user} />

              {/* Sidebar Active Panel detail display */}
              <AnimatePresence mode="wait">
                {selectedEvent ? (
                  <motion.div
                    key={selectedEvent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-3xl border border-white/10 bento-blur p-6 space-y-5 relative overflow-hidden shadow-2xl"
                  >
                    {/* Glowing Accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />

                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">
                        {selectedEvent.category} • Hotspot {selectedEvent.popularity}/10
                      </span>
                      <h3 className="text-base font-extrabold text-white tracking-tight mt-2.5 leading-snug">
                        {selectedEvent.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium italic">
                        By {selectedEvent.organizer}
                      </p>
                    </div>

                    <img
                      src={selectedEvent.image}
                      alt={selectedEvent.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover rounded-xl border border-slate-800"
                    />

                    <p className="text-xs text-slate-400 leading-relaxed leading-normal select-text">
                      {selectedEvent.description}
                    </p>

                    <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">WHERE:</span>
                        <span className="text-slate-200">{selectedEvent.locationName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">WHEN:</span>
                        <span className="text-slate-200">{selectedEvent.date}</span>
                      </div>
                      <div className="flex justify-between flex-nowrap">
                        <span className="text-slate-500">TIME:</span>
                        <span className="text-slate-200">{selectedEvent.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CAPACITY:</span>
                        <span className="text-slate-200">{selectedEvent.capacity || 'Open Space'}</span>
                      </div>
                    </div>

                    {/* Quick directional stats */}
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => setTicketModalEvent(selectedEvent)}
                        className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer select-none transition-transform hover:scale-[101%]"
                      >
                        Launch Reservation
                      </button>
                      <button
                        onClick={() => {
                          // Center map and show directions
                          document.getElementById('spatial-map')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-3 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-450 hover:text-white transition-colors cursor-pointer"
                        title="Display Route Profile"
                      >
                        <Compass className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 text-center text-xs text-slate-500 italic">
                    Select an event coordinate pin on the spatial grid to read live details.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI CURATOR QUESTIONNAIRE SECTION */}
          <div id="personalized-agendas" className="space-y-4 pt-12 border-t border-slate-900">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> Agenda Personalization Questionnaire
              </h3>
              <p className="text-xs text-slate-400">Complete interests below. Gemini will evaluate vibes and compile customized events located on the spatial board</p>
            </div>

            <SuggestionsPanel
              onAddCustomEvents={handleAddCustomEvents}
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
            />
          </div>
        </div>
      </main>

      {/* 4. Footer credits design block */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 md:px-8 py-8 mt-12 shrink-0 select-none text-slate-550 font-mono text-[10px]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 MetroHappenings Labs. Full-Stack Gemini Spatial Services enabled.</p>
          <div className="flex gap-4">
            <a href="#spatial-map" className="hover:text-white transition-colors uppercase">
              Spatial Grid
            </a>
            <span>|</span>
            <a href="#personalized-agendas" className="hover:text-white transition-colors uppercase">
              Concierge
            </a>
          </div>
        </div>
      </footer>

      {/* Floating sliding Toast push notifications */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-indigo-950/95 border border-indigo-500/35 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex justify-between items-start gap-4"
          >
            <div className="space-y-1 flex-1">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                {activeToast.title}
              </h5>
              <p className="text-[11px] text-indigo-200 leading-normal">{activeToast.message}</p>
            </div>
            <button
              onClick={dismissToast}
              className="p-1 rounded-md text-indigo-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS RENDER OVERLAYS */}
      <AnimatePresence>
        {ticketModalEvent && (
          <TicketModal
            event={{
              ...ticketModalEvent,
              date: selectedDate === 'All Dates' ? ticketModalEvent.date : selectedDate,
            }}
            onClose={() => setTicketModalEvent(null)}
            onPurchaseComplete={(ticket) => {
              setTicketModalEvent(null);
              handlePurchaseComplete(ticket);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareModalEvent && (
          <ShareModal event={shareModalEvent} onClose={() => setShareModalEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
