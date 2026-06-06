/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Info, CheckCircle, AlertTriangle, Tag, Sparkles } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  subscriptionActive: boolean;
  onToggleSubscription: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  subscriptionActive,
  onToggleSubscription,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white transition-all hover:bg-slate-850 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 && subscriptionActive ? 'animate-swing' : ''}`} />
        {unreadCount > 0 && subscriptionActive && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse border border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notification panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="absolute right-0 mt-3.5 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-4"
          >
            {/* Header section with Subscription Trigger */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Notice Hub</h3>
              </div>
              <button
                onClick={onToggleSubscription}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                  subscriptionActive
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-950 text-slate-500 border-slate-850'
                }`}
              >
                {subscriptionActive ? (
                  <>
                    <Bell className="w-3 h-3 inline" /> Push Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="w-3 h-3 inline" /> Push Muted
                  </>
                )}
              </button>
            </div>

            {/* Notification List Scroll viewport */}
            <div className="max-h-80 overflow-y-auto py-2 divide-y divide-slate-850 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  <BellOff className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  Your dashboard log is empty. Check back for upcoming ticket sales!
                </div>
              ) : (
                notifications.map((notif) => {
                  const isInfo = notif.type === 'info';
                  const isSuccess = notif.type === 'success';
                  const isAlert = notif.type === 'alert';
                  const isTicket = notif.type === 'ticket';

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 transition-colors flex gap-3 ${
                        notif.read ? 'opacity-65' : 'bg-slate-950/20'
                      }`}
                    >
                      {/* Left icon wrapper */}
                      <div className="shrink-0 mt-0.5">
                        {isInfo && (
                          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isSuccess && (
                          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isAlert && (
                          <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isTicket && (
                          <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20 animate-pulse">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Right metadata block */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-white leading-tight tracking-tight">
                            {notif.title}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{notif.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions panel */}
            {notifications.length > 0 && (
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-850 text-[10px] font-semibold font-mono uppercase tracking-wider">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
                <span className="text-slate-700">|</span>
                <button
                  onClick={onClearNotifications}
                  className="text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear history
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
