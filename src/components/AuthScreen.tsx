/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Mail, Lock, User, Calendar, MapPin, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (userData: {
    name: string;
    email: string;
    preferredCity: 'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad';
    preferredDate: string; // YYYY-MM-DD or readable string
  }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Signup State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [preferredCity, setPreferredCity] = useState<'Bengaluru' | 'Mumbai' | 'Delhi NCR' | 'Hyderabad'>('Bengaluru');
  const [preferredDate, setPreferredDate] = useState<string>('June 13, 2026'); // Standard mock date default
  
  // Login values (prefilled with a default account for simple testing)
  const [loginEmail, setLoginEmail] = useState<string>('guest@happening.in');
  const [loginPassword, setLoginPassword] = useState<string>('secPass123!');
  
  // Error checks
  const [errorText, setErrorText] = useState<string>('');

  const handleAuthentication = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (isLogin) {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setErrorText('Please supply your email and password parameters.');
        return;
      }
      
      // Let's retrieve from localStorage if the user signed up
      const storedUsers = localStorage.getItem('metro_registered_users');
      let matchingUser = null;
      if (storedUsers) {
        const usersArray = JSON.parse(storedUsers);
        matchingUser = usersArray.find((u: any) => u.email.toLowerCase() === loginEmail.toLowerCase());
      }
      
      // Support a default account
      if (loginEmail === 'guest@happening.in' && loginPassword === 'secPass123!') {
        onLoginSuccess({
          name: 'Raj Patil',
          email: 'guest@happening.in',
          preferredCity: 'Mumbai',
          preferredDate: 'June 13, 2026'
        });
        return;
      }

      if (matchingUser) {
        onLoginSuccess({
          name: matchingUser.name,
          email: matchingUser.email,
          preferredCity: matchingUser.preferredCity,
          preferredDate: matchingUser.preferredDate
        });
      } else {
        setErrorText('Invalid credentials. Sign up or use the prefilled guest details!');
      }
    } else {
      // Signup Flow
      if (!name.trim() || !email.trim() || !password.trim()) {
        setErrorText('All fields are absolute requirements.');
        return;
      }
      if (password.length < 6) {
        setErrorText('Password must be a minimum of 6 characters.');
        return;
      }

      const newUser = {
        name,
        email,
        preferredCity,
        preferredDate
      };

      // Save user to simulated mock database
      const storedUsers = localStorage.getItem('metro_registered_users');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      // Replace or insert
      const filtered = usersList.filter((u: any) => u.email.toLowerCase() !== email.toLowerCase());
      filtered.push({ ...newUser, password });
      localStorage.setItem('metro_registered_users', JSON.stringify(filtered));

      // Auto-unlock
      onLoginSuccess(newUser);
    }
  };

  const selectDateOptions = [
    { label: 'Friday, June 12', value: 'June 12, 2026' },
    { label: 'Saturday, June 13', value: 'June 13, 2026' },
    { label: 'Sunday, June 14', value: 'June 14, 2026' },
    { label: 'Friday, June 19', value: 'June 19, 2026' },
    { label: 'Saturday, June 20', value: 'June 20, 2026' },
    { label: 'Sunday, June 21', value: 'June 21, 2026' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-center items-center font-sans relative px-4 overflow-hidden select-none">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[20%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45rem] h-[45rem] bg-emerald-950/25 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Logo Card Header */}
      <div className="text-center mb-8 relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-650 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4 animate-bounce-slow">
          <Compass className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
          MetroHappenings India
        </h1>
        <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mt-2">[ Spatial Discovery & Ticket Booking Portal ]</p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bento-blur border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Glowing top line accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 pb-4 mb-6">
          <button
            onClick={() => { setIsLogin(true); setErrorText(''); }}
            className={`flex-1 pb-2 text-sm font-bold tracking-wide uppercase transition-colors cursor-pointer ${isLogin ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorText(''); }}
            className={`flex-1 pb-2 text-sm font-bold tracking-wide uppercase transition-colors cursor-pointer ${!isLogin ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuthentication} className="space-y-5">
          {/* Form Error Banner */}
          <AnimatePresence>
            {errorText && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-indigo-505 transition-all text-left"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder={isLogin ? "guest@happening.in" : "you@destination.in"}
                value={isLogin ? loginEmail : email}
                onChange={(e) => isLogin ? setLoginEmail(e.target.value) : setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-indigo-505 transition-all text-left"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Secret Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={isLogin ? "secPass123!" : "🔒 Enter strong pass"}
                value={isLogin ? loginPassword : password}
                onChange={(e) => isLogin ? setLoginPassword(e.target.value) : setPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white outline-none focus:border-indigo-505 transition-all text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Onboarding Preferences removed as requested */}

          {isLogin && (
            <div className="text-[11px] text-slate-500 italic text-center p-2 bg-slate-950/20 rounded-xl border border-white/5 font-mono select-none">
              💡 Guest Credentials prefilled! Click <span className="font-bold text-indigo-300">Sign In</span> to enter instantly.
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-600/15 cursor-pointer hover:scale-[101%] active:scale-[99%] select-none transition-all mt-4"
          >
            {isLogin ? 'Sign In & Load Portal' : 'Create Account & Auto Sign-In'}
          </button>
        </form>

        <div className="mt-6 flex justify-center text-[11px] text-slate-500 select-none">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button onClick={() => { setIsLogin(false); setErrorText(''); }} className="text-indigo-400 hover:underline font-bold cursor-pointer">
                Create one now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button onClick={() => { setIsLogin(true); setErrorText(''); }} className="text-indigo-400 hover:underline font-bold cursor-pointer">
                Sign in here
              </button>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
