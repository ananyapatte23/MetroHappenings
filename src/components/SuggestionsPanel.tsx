/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Music, Cake, Brush, Cpu, Smile, Dumbbell, Flame, Compass, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Event, UserPreferences } from '../types';

interface SuggestionsPanelProps {
  onAddCustomEvents: (newEvents: Event[]) => void;
  onFilterChange: (filters: UserPreferences) => void;
  activeFilters: UserPreferences;
}

export default function SuggestionsPanel({
  onAddCustomEvents,
  onFilterChange,
  activeFilters,
}: SuggestionsPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(activeFilters.categories);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(activeFilters.vibes);
  const [maxPrice, setMaxPrice] = useState<number>(activeFilters.maxPrice);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [aiResponseStatus, setAiResponseStatus] = useState<string>('');

  // Chat Concierge States
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Welcome! I am your Metro Heights Concierge. Select your preferences to the left, or tell me what you feel like doing!' },
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const AVAILABLE_CATEGORIES = [
    { name: 'Music', icon: Music, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { name: 'Food', icon: Cake, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { name: 'Art', icon: Brush, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { name: 'Tech', icon: Cpu, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { name: 'Comedy', icon: Smile, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30' },
    { name: 'Sports', icon: Dumbbell, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  ];

  const AVAILABLE_VIBES = [
    { name: 'Vibrant', label: '⚡ High Energy' },
    { name: 'Cozy', label: '☕ Cozy & Chilled' },
    { name: 'Creative', label: '🎨 Artistic & Creative' },
    { name: 'Networking', label: '🤝 Tech & Business' },
    { name: 'Outdoor', label: '🌲 Fresh Air / Outdoors' },
    { name: 'Late-Night', label: '🌙 Late Night Party' },
  ];

  const toggleCategory = (cat: string) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
    onFilterChange({ ...activeFilters, categories: updated });
  };

  const toggleVibe = (vibe: string) => {
    const updated = selectedVibes.includes(vibe)
      ? selectedVibes.filter((v) => v !== vibe)
      : [...selectedVibes, vibe];
    setSelectedVibes(updated);
    onFilterChange({ ...activeFilters, vibes: updated });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseInt(e.target.value);
    setMaxPrice(price);
    onFilterChange({ ...activeFilters, maxPrice: price });
  };

  // Triggers Gemini suggestions API call
  const generateSuggestions = async () => {
    setIsLoading(true);
    setAiResponseStatus('Consulting the spatial algorithms...');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories.length > 0 ? selectedCategories : ['Music', 'Food', 'Art'],
          vibes: selectedVibes.length > 0 ? selectedVibes : ['Cozy'],
          maxPrice,
        }),
      });

      const data = await response.json();
      if (data.suggestions) {
        onAddCustomEvents(data.suggestions);
        setIsSuccess(true);
        setAiResponseStatus(
          data.generatedByAI
            ? 'Success! 3 unique AI-generated event agendas loaded into your maps!'
            : 'Simulated Discovery Engines loaded 2 responsive events!'
        );
      }
    } catch (err) {
      console.error(err);
      setAiResponseStatus('Connection drop. Sourcing pre-cached events instead.');
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers AI Concierge chat API
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatHistory.slice(-5), // last 5 messages for context
          interests: { categories: selectedCategories, vibes: selectedVibes },
        }),
      });

      const data = await resp.json();
      setChatHistory((prev) => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: "I'm having trouble syncing with Metro satellite telemetry. Catch the Rooftop acoustic showcase at 6:30!" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Questionnaire Selection Box */}
      <div className="lg:col-span-7 bento-blur border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between shadow-xl bg-gradient-to-br from-white/[0.01] to-transparent">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">Personalized Concierge</h2>
              <p className="text-xs text-slate-400">Calibrate interests below for specialized Gemini recommendations</p>
            </div>
          </div>

          {/* 1. Category Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-slate-405 mb-3">
              1. What kind of happenings do you like?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    id={`cat-btn-${cat.name}`}
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-550 text-white shadow-lg shadow-indigo-600/25 translate-y-[-1px]'
                        : 'bg-slate-950/45 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <cat.icon className="w-4 h-4 shrink-0" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Vibes Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-slate-405 mb-3">
              2. Select Your Mood/Vibe
            </label>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_VIBES.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe.name);
                return (
                  <button
                    key={vibe.name}
                    id={`vibe-btn-${vibe.name}`}
                    onClick={() => toggleVibe(vibe.name)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-555 text-white shadow-lg shadow-emerald-600/25'
                        : 'bg-slate-950/45 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {vibe.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Budget Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">
                3. Maximum Ticket Price
              </label>
              <span className="text-sm font-bold text-indigo-400 font-mono">{maxPrice === 3000 ? 'Free - High End' : `₹${maxPrice.toLocaleString('en-IN')}`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3000"
              step="100"
              value={maxPrice}
              onChange={handlePriceChange}
              className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer border-none outline-none"
            />
            <div className="flex justify-between text-[10px] text-slate-650 font-mono mt-1">
              <span>₹0 (Free)</span>
              <span>₹1,500</span>
              <span>₹3,000+</span>
            </div>
          </div>
        </div>

        {/* Generate Button Panel */}
        <div className="pt-2">
          <button
            onClick={generateSuggestions}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl relative flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 transform cursor-pointer active:scale-[98%] ${
              isLoading
                ? 'bg-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white hover:opacity-95 shadow-indigo-500/25'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Sourcing spatial recommendations...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                Initialize AI Spatial Discovery
              </>
            )}
          </button>

          {/* Feedback Label */}
          <AnimatePresence>
            {aiResponseStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  isSuccess
                    ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-indigo-950/20 border border-indigo-500/30 text-indigo-400'
                }`}
              >
                {isSuccess ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Compass className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
                <p className="leading-normal">{aiResponseStatus}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Chat Concierge Messenger Box */}
      <div className="lg:col-span-5 bento-blur border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col h-[520px] shadow-xl bg-gradient-to-b from-white/[0.01] to-transparent">
        {/* Messenger Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4 shrink-0">
          <div className="relative">
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-slate-950 rounded-full [box-shadow:0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Concierge Help</h3>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">VIRTUAL DISCOVERY ASSISTANT</p>
          </div>
        </div>

        {/* Message Feeds */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
          {chatHistory.map((msg, idx) => {
            const isAI = msg.sender === 'ai';
            return (
              <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs select-text leading-relaxed ${
                    isAI
                      ? 'bg-slate-950/45 text-slate-300 border border-white/5 rounded-tl-none'
                      : 'bg-indigo-650 text-white rounded-tr-none shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950/45 text-slate-500 border border-white/5 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                <span>Typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Messenger Inputs */}
        <form onSubmit={handleSendChat} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask: 'Any free events with coffee?'"
            className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!chatMessage.trim() || chatLoading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white cursor-pointer select-none transition-all duration-200 hover:scale-105 active:scale-95 disabled:bg-slate-800 disabled:text-slate-650"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
