'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell, Check, Clock, ExternalLink, Sparkles, X, ArrowRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('[NotificationBell] Failed to fetch:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 minute poll
    return () => clearInterval(interval);
  }, [session]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-card shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 max-w-sm sm:max-w-none ml-auto rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in">
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-secondary/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-primary hover:underline font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Access to Pending Approval Desk */}
          <div className="px-3.5 py-2 bg-primary/5 border-b border-border/80 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Pending Approvals Desk</span>
            </span>
            <Link
              href={
                (session.user as any)?.role === 'STUDENT'
                  ? '/dashboard/student'
                  : '/admin/achievements?status=PENDING'
              }
              onClick={() => setIsOpen(false)}
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{(session.user as any)?.role === 'STUDENT' ? 'My Desk' : 'Review Queue'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1.5">
                <Bell className="w-7 h-7 text-muted-foreground/30 mx-auto" />
                <p className="font-semibold text-foreground/80">All Caught Up</p>
                <p className="text-[11px] text-muted-foreground">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || '/'}
                  onClick={() => handleItemClick(n.id, n.isRead)}
                  className={`block p-3.5 hover:bg-secondary/60 transition-colors text-xs ${
                    n.isRead ? 'opacity-70' : 'bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-1 line-clamp-2">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 mt-1.5 block">
                    {formatDateTime(n.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
