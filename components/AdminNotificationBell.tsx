'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  XCircle,
  ShieldCheck,
  Clock,
  X,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OrderItem {
  flowerId: string;
  flowerName: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  customerName: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  paymentStatus?: string;
  cancelStatus?: 'Pending' | 'Approved' | 'Rejected' | null;
  cancelReason?: string | null;
}

type NotificationType =
  | 'cancel-request'
  | 'payment-verification'
  | 'pending-order';

interface AppNotification {
  id: string;
  type: NotificationType;
  orderId: string;
  title: string;
  description: string;
  timestamp: string;
  href: string;
}

const STORAGE_KEY = 'admin-notifications-read';

export function AdminNotificationBell() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, []);

  // Real-time listener for orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as OrderData[]
      );
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Build notifications from orders
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    orders.forEach((o) => {
      // 🔴 Cancellation request pending → open that order's detail modal
      if (o.cancelStatus === 'Pending') {
        list.push({
          id: `cancel-request:${o.id}`,
          type: 'cancel-request',
          orderId: o.id,
          title: 'Cancellation request',
          description: `${o.customerName} wants to cancel order #${o.id
            .slice(0, 8)
            .toUpperCase()}${o.cancelReason ? ` • ${o.cancelReason}` : ''}`,
          timestamp: o.createdAt,
          href: `/admin/orders?order=${o.id}`,
        });
      }

      // 🔵 Payment awaiting verification → open that order's detail modal
      if (o.paymentStatus === 'Awaiting Verification') {
        list.push({
          id: `payment-verification:${o.id}`,
          type: 'payment-verification',
          orderId: o.id,
          title: 'Payment awaiting verification',
          description: `${o.customerName} uploaded a receipt for order #${o.id
            .slice(0, 8)
            .toUpperCase()} (₱${o.total.toLocaleString()})`,
          timestamp: o.createdAt,
          href: `/admin/orders?order=${o.id}`,
        });
      }

      // 🟡 Pending order → open that order's detail modal
      if (
        o.status === 'Pending' &&
        o.cancelStatus !== 'Pending' &&
        o.paymentStatus !== 'Awaiting Verification'
      ) {
        list.push({
          id: `pending-order:${o.id}`,
          type: 'pending-order',
          orderId: o.id,
          title: 'New pending order',
          description: `${o.customerName} placed order #${o.id
            .slice(0, 8)
            .toUpperCase()} (₱${o.total.toLocaleString()})`,
          timestamp: o.createdAt,
          href: `/admin/orders?order=${o.id}`,
        });
      }
    });

    // Sort newest first
    return list.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [orders]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...allIds]));
    } catch {
      // ignore
    }
  };

  const markOneRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markOneRead(n.id);
    setOpen(false);
    router.push(n.href);
  };

  const config: Record<
    NotificationType,
    { icon: typeof Clock; bg: string; color: string }
  > = {
    'cancel-request': {
      icon: XCircle,
      bg: 'bg-rose-100',
      color: 'text-rose-600',
    },
    'payment-verification': {
      icon: ShieldCheck,
      bg: 'bg-blue-100',
      color: 'text-blue-600',
    },
    'pending-order': {
      icon: Clock,
      bg: 'bg-amber-100',
      color: 'text-amber-600',
    },
  };

  const formatRelative = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMin = (now.getTime() - date.getTime()) / (1000 * 60);
      const diffH = diffMin / 60;
      const diffD = diffH / 24;

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
      if (diffH < 24) return `${Math.floor(diffH)}h ago`;
      if (diffD < 7) return `${Math.floor(diffD)}d ago`;
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-pink-600 transition-colors hover:bg-pink-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Inbox className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  You&apos;re all caught up
                </p>
                <p className="text-xs text-gray-500">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const c = config[n.type];
                const Icon = c.icon;
                const isUnread = !readIds.has(n.id);

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                      isUnread ? 'bg-pink-50/30' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.color}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                        {n.description}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {formatRelative(n.timestamp)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/admin/orders');
                }}
                className="flex w-full items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-pink-600 transition-colors hover:text-pink-700"
              >
                View all orders
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
