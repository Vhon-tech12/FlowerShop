'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShoppingBag,
  Ban,
  MessageSquareWarning,
  Eye,
  X,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Calendar,
  ShieldCheck,
  ShieldX,
  Image as ImageIcon,
  ExternalLink,
  Package,
  Pencil,
  MessageCircle,
  Tag,
  Copy,
  Check,
  Mail,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { CancelOrderModal } from '@/components/CancelOrderModal';

type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
type PaymentStatus = 'N/A' | 'Awaiting Verification' | 'Verified' | 'Rejected';
type CancelStatus = 'Pending' | 'Approved' | 'Rejected';
type FilterKey = 'All' | OrderStatus | 'Cancel Pending';
type TabKey = 'orders' | 'promos' | 'messages';

interface OrderItem {
  flowerId: string;
  flowerName: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  contactNumber: string;
  address: string;
  notes?: string;
  paymentMethod?: string;
  paymentReference?: string | null;
  paymentReceiptUrl?: string | null;
  paymentStatus?: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  cancelStatus?: CancelStatus | null;
  cancelReason?: string | null;
  cancelNote?: string | null;
  cancelRequestedAt?: string | null;
  cancelReviewedAt?: string | null;
}

const statusConfig: Record<
  OrderStatus,
  {
    color: string;
    icon: typeof Clock;
    label: string;
    dot: string;
  }
> = {
  Pending: {
    color: 'text-amber-700',
    icon: Clock,
    label: 'Pending',
    dot: 'bg-amber-500',
  },
  Processing: {
    color: 'text-blue-700',
    icon: AlertCircle,
    label: 'Processing',
    dot: 'bg-blue-500',
  },
  Completed: {
    color: 'text-emerald-700',
    icon: CheckCircle2,
    label: 'Completed',
    dot: 'bg-emerald-500',
  },
  Cancelled: {
    color: 'text-red-700',
    icon: XCircle,
    label: 'Cancelled',
    dot: 'bg-red-500',
  },
};

export default function AccountPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderData | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, authLoading, router]);

  // Fetch orders
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          ) as OrderData[];
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        showToast({ message: 'Failed to load orders.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, showToast]);

  const canCancel = (order: OrderData) => {
    return (
      order.status === 'Pending' &&
      (!order.cancelStatus || order.cancelStatus === 'Rejected')
    );
  };

  const hasPendingCancel = (order: OrderData) =>
    order.cancelStatus === 'Pending';

  const handleCancelRequest = async (reason: string, note: string) => {
    if (!cancelOrderId) return;
    try {
      await updateDoc(doc(db, 'orders', cancelOrderId), {
        cancelStatus: 'Pending',
        cancelReason: reason,
        cancelNote: note || null,
        cancelRequestedAt: new Date().toISOString(),
        cancelRequestedBy: 'customer',
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelOrderId
            ? {
                ...o,
                cancelStatus: 'Pending',
                cancelReason: reason,
                cancelNote: note || null,
                cancelRequestedAt: new Date().toISOString(),
              }
            : o
        )
      );

      showToast({
        message: '📩 Cancellation request sent',
        description: 'We will review your request and get back to you shortly.',
        type: 'success',
      });

      setCancelOrderId(null);
    } catch (err: any) {
      console.error('Cancel request failed:', err);
      showToast({
        message: 'Failed to send cancellation request.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatRelative = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const processing = orders.filter((o) => o.status === 'Processing').length;
    const completed = orders.filter((o) => o.status === 'Completed').length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    const cancelPending = orders.filter(
      (o) => o.cancelStatus === 'Pending'
    ).length;
    const totalSpent = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      cancelPending,
      totalSpent,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;

    if (filter === 'Cancel Pending') {
      result = result.filter((o) => o.cancelStatus === 'Pending');
    } else if (filter !== 'All') {
      result = result.filter((o) => o.status === filter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(s) ||
          o.items.some((it) => it.flowerName.toLowerCase().includes(s))
      );
    }

    return result;
  }, [orders, filter, search]);

  const filterTabs: Array<{ key: FilterKey; count: number }> = [
    { key: 'All', count: stats.total },
    { key: 'Pending', count: stats.pending },
    { key: 'Processing', count: stats.processing },
    { key: 'Completed', count: stats.completed },
    { key: 'Cancelled', count: stats.cancelled },
    { key: 'Cancel Pending', count: stats.cancelPending },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showToast({ message: '📋 Code copied!', type: 'success' });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF7F2]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const initial = (
    userData?.name?.[0] ||
    user.email?.[0] ||
    'U'
  ).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] font-sans text-stone-800">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
          {/* ===== HEADER ===== */}
          <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-serif text-5xl leading-none text-stone-900 md:text-6xl">
                Hi, {userData?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="mt-3 text-sm text-stone-500">
                {user.email}
              </p>
            </div>

            {/* Inline stats */}
            <div className="flex items-center gap-8 self-end md:self-auto">
              <div className="text-center">
                <p className="font-serif text-4xl leading-none text-stone-900">
                  {stats.total}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
                  Orders
                </p>
              </div>
              <div className="h-12 w-px bg-stone-300" />
              <div className="text-center">
                <p className="font-serif text-4xl leading-none text-stone-900">
                  1
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
                  Promos
                </p>
              </div>
              <div className="h-12 w-px bg-stone-300" />
              <div className="text-center">
                <p className="font-serif text-4xl leading-none text-stone-900">
                  {stats.cancelPending}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
                  Messages
                </p>
              </div>
            </div>
          </div>

          {/* ===== MAIN GRID ===== */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            {/* LEFT SIDEBAR */}
            <aside className="space-y-6">
              {/* Profile card */}
              {userData && (
                <div className="border border-stone-200 bg-white">
                  <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                    <h2 className="font-serif text-xl text-stone-900">
                      Profile
                    </h2>
                    <button
                      className="text-stone-400 transition-colors hover:text-stone-700"
                      title="Edit profile"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 border-b border-stone-200 px-6 py-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-stone-900 font-serif text-xl text-white">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg text-stone-900">
                        {userData.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-600">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Verified Account
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm text-stone-800">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-stone-800">
                        {userData.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                        Address
                      </p>
                      <p className="mt-1 text-sm text-stone-800">
                        {userData.address || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback card */}
              <div className="border border-stone-200 bg-white">
                <div className="flex items-center gap-2 border-b border-stone-200 px-6 py-4">
                  <MessageCircle
                    className="h-4 w-4 text-stone-600"
                    strokeWidth={1.5}
                  />
                  <h2 className="font-serif text-xl text-stone-900">
                    Your Feedback
                  </h2>
                </div>
                <div className="px-6 py-6">
                  <p className="mb-4 text-sm text-stone-500">
                    Share your experience with other customers.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center border border-stone-900 bg-transparent px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
                  >
                    Write a Review
                  </Link>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT */}
            <div className="min-w-0">
              {/* Tabs */}
              <div className="mb-8 flex items-center gap-8 border-b border-stone-200">
                {(
                  [
                    { key: 'promos' as TabKey, label: 'Promos', count: 1 },
                    {
                      key: 'orders' as TabKey,
                      label: 'Orders',
                      count: stats.total,
                    },
                    {
                      key: 'messages' as TabKey,
                      label: 'Messages',
                      count: stats.cancelPending,
                    },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative -mb-px flex items-center gap-2 pb-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${
                        isActive
                          ? 'text-stone-900'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {tab.label}
                      <span
                        className={
                          isActive ? 'text-stone-500' : 'text-stone-400'
                        }
                      >
                        ({tab.count})
                      </span>
                      {isActive && (
                        <span className="absolute inset-x-0 -bottom-px h-px bg-stone-900" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT */}

              {/* PROMOS TAB */}
              {activeTab === 'promos' && (
                <div>
                  <div className="border border-stone-200 bg-white p-8">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <p className="font-serif text-4xl text-stone-900">
                          10%
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
                          Off Your Order
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center border border-stone-200 text-stone-400">
                        <Tag className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    </div>

                    <div className="my-6 border-t border-dashed border-stone-200" />

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                        Code
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="font-mono text-lg font-bold tracking-wider text-stone-900">
                          FLOWER11RH
                        </p>
                        <button
                          onClick={() => handleCopyCode('FLOWER11RH')}
                          className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                        >
                          {copiedCode === 'FLOWER11RH' ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">
                      <span>Min ₱2</span>
                      <span className="h-3 w-px bg-stone-300" />
                      <span>Exp Sep 26, 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div>
                  {/* Filter tabs */}
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {filterTabs.map((tab) => {
                      const isActive = filter === tab.key;
                      const isCancelTab = tab.key === 'Cancel Pending';
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                            isActive
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : isCancelTab && tab.count > 0
                                ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                          }`}
                        >
                          {tab.key}
                          <span
                            className={
                              isActive
                                ? 'text-white/70'
                                : 'text-stone-400'
                            }
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {loading ? (
                    <div className="border border-stone-200 bg-white p-20 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-stone-400" />
                      <p className="mt-3 text-sm text-stone-500">
                        Loading orders...
                      </p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="border border-stone-200 bg-white p-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200">
                        <ShoppingBag
                          className="h-7 w-7 text-stone-400"
                          strokeWidth={1.2}
                        />
                      </div>
                      <p className="font-serif text-2xl text-stone-900">
                        No orders yet
                      </p>
                      <p className="mt-1 mb-6 text-sm text-stone-500">
                        Your orders will appear here once you place one.
                      </p>
                      <Link
                        href="/flowers"
                        className="inline-flex items-center gap-2 border border-stone-900 bg-stone-900 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-800"
                      >
                        Browse Flowers
                      </Link>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="border border-dashed border-stone-300 bg-white p-16 text-center">
                      <Package
                        className="mx-auto mb-4 h-7 w-7 text-stone-400"
                        strokeWidth={1.2}
                      />
                      <p className="font-serif text-xl text-stone-900">
                        No orders found
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map((order) => {
                        const config =
                          statusConfig[order.status] || statusConfig.Pending;
                        const cancelPending = hasPendingCancel(order);
                        const cancelRejected =
                          order.cancelStatus === 'Rejected' &&
                          order.status === 'Pending';

                        return (
                          <div
                            key={order.id}
                            className={`border bg-white ${
                              cancelPending
                                ? 'border-rose-200'
                                : order.status === 'Cancelled'
                                  ? 'border-red-200'
                                  : 'border-stone-200'
                            }`}
                          >
                            <div className="p-6">
                              {/* Header */}
                              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-mono text-xs font-medium tracking-wider text-stone-500">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-700">
                                    <span
                                      className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`}
                                    />
                                    {config.label}
                                  </span>
                                  {cancelPending && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-rose-600">
                                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                                      Cancel Pending
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">
                                  {formatRelative(order.createdAt)}
                                </span>
                              </div>

                              {/* Cancel banners */}
                              {cancelPending && (
                                <div className="mb-5 border-l-2 border-rose-400 bg-rose-50/60 px-4 py-3">
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-rose-700">
                                    Cancellation pending approval
                                  </p>
                                  <p className="mt-1 text-xs text-rose-600">
                                    Our team is reviewing your request.
                                  </p>
                                  {order.cancelReason && (
                                    <p className="mt-2 text-xs text-stone-600">
                                      <span className="font-medium">
                                        Reason:
                                      </span>{' '}
                                      {order.cancelReason}
                                    </p>
                                  )}
                                </div>
                              )}

                              {cancelRejected && (
                                <div className="mb-5 border-l-2 border-stone-400 bg-stone-50 px-4 py-3">
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
                                    Cancellation declined
                                  </p>
                                  <p className="mt-1 text-xs text-stone-500">
                                    Your order continues as normal.
                                  </p>
                                </div>
                              )}

                              {order.status === 'Cancelled' &&
                                order.cancelStatus === 'Approved' && (
                                  <div className="mb-5 border-l-2 border-red-400 bg-red-50/60 px-4 py-3">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-red-700">
                                      Order Cancelled
                                    </p>
                                    <p className="mt-1 text-xs text-red-600">
                                      Your cancellation request was approved.
                                    </p>
                                    {order.cancelReason && (
                                      <p className="mt-2 text-xs text-stone-600">
                                        <span className="font-medium">
                                          Reason:
                                        </span>{' '}
                                        {order.cancelReason}
                                      </p>
                                    )}
                                  </div>
                                )}

                              {/* Items */}
                              <div className="mb-5 space-y-3">
                                {order.items.slice(0, 3).map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-4"
                                  >
                                    <div className="h-14 w-14 shrink-0 overflow-hidden border border-stone-200 bg-stone-50">
                                      <img
                                        src={item.imageUrl}
                                        alt={item.flowerName}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-serif text-base text-stone-900">
                                        {item.flowerName}
                                      </p>
                                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-stone-500">
                                        {item.quantity} × ₱
                                        {item.price.toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="text-sm font-medium text-stone-900">
                                      ₱
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <p className="pl-18 text-[11px] uppercase tracking-wider text-stone-400">
                                    +{order.items.length - 3} more
                                  </p>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Total
                                  </p>
                                  <p className="mt-1 font-serif text-2xl text-stone-900">
                                    ₱{order.total.toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setSelected(order)}
                                    className="inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View
                                  </button>

                                  {canCancel(order) && (
                                    <button
                                      onClick={() =>
                                        setCancelOrderId(order.id)
                                      }
                                      className="inline-flex items-center gap-2 border border-red-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-red-600 transition-colors hover:bg-red-50"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                      Cancel
                                    </button>
                                  )}

                                  {order.status === 'Processing' && (
                                    <span className="inline-flex items-center gap-2 border border-stone-200 bg-stone-50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
                                      <Ban className="h-3.5 w-3.5" />
                                      Can&apos;t Cancel
                                    </span>
                                  )}
                                </div>
                              </div>

                              {order.status === 'Processing' && (
                                <p className="mt-3 text-[11px] text-stone-400">
                                  This order is now being processed and can no
                                  longer be cancelled.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MESSAGES TAB */}
              {activeTab === 'messages' && (
                <div>
                  {stats.cancelPending === 0 ? (
                    <div className="border border-stone-200 bg-white p-16 text-center">
                      <Mail
                        className="mx-auto mb-4 h-7 w-7 text-stone-400"
                        strokeWidth={1.2}
                      />
                      <p className="font-serif text-xl text-stone-900">
                        No messages yet
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Order updates and notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders
                        .filter((o) => o.cancelStatus === 'Pending')
                        .map((order) => (
                          <div
                            key={order.id}
                            className="border border-rose-200 bg-white p-5"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-rose-700">
                                Cancellation Pending
                              </p>
                            </div>
                            <p className="font-serif text-lg text-stone-900">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="mt-1 text-sm text-stone-500">
                              Our team is reviewing your cancellation request.
                            </p>
                            {order.cancelReason && (
                              <p className="mt-2 text-xs text-stone-500">
                                <span className="font-medium text-stone-700">
                                  Reason:
                                </span>{' '}
                                {order.cancelReason}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CANCEL MODAL */}
      <CancelOrderModal
        isOpen={!!cancelOrderId}
        orderId={cancelOrderId || ''}
        onClose={() => setCancelOrderId(null)}
        onConfirm={handleCancelRequest}
      />

      {/* ORDER DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white p-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Order Details
                </p>
                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  #{selected.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Placed {formatDate(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 text-stone-400 transition-colors hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Status */}
              <div className="flex items-center gap-3 border border-stone-200 p-4">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${statusConfig[selected.status].dot}`}
                />
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                    Status
                  </p>
                  <p className="mt-0.5 font-serif text-lg text-stone-900">
                    {statusConfig[selected.status].label}
                  </p>
                </div>
              </div>

              {/* Cancel info */}
              {selected.cancelStatus === 'Pending' && (
                <div className="border-l-2 border-rose-400 bg-rose-50/60 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-rose-700">
                    Cancellation Pending
                  </p>
                  <p className="mt-1 text-xs text-rose-600">
                    Waiting for admin approval.
                  </p>
                  {selected.cancelReason && (
                    <p className="mt-2 text-xs text-stone-600">
                      <span className="font-medium">Reason:</span>{' '}
                      {selected.cancelReason}
                    </p>
                  )}
                </div>
              )}

              {selected.cancelStatus === 'Rejected' &&
                selected.status === 'Pending' && (
                  <div className="border-l-2 border-stone-400 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
                      Cancellation Declined
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Your order continues as normal.
                    </p>
                  </div>
                )}

              {/* Items */}
              <div>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Items ({selected.items.length})
                </p>
                <div className="space-y-3">
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 border border-stone-200 p-3"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden border border-stone-200 bg-stone-50">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.flowerName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base text-stone-900">
                          {item.flowerName}
                        </p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-stone-500">
                          ₱{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-stone-900">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Delivery
                </p>
                <div className="space-y-3 border border-stone-200 p-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                      Name
                    </p>
                    <p className="mt-0.5 text-sm text-stone-900">
                      {selected.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                      Contact
                    </p>
                    <p className="mt-0.5 text-sm text-stone-900">
                      {selected.contactNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                      Address
                    </p>
                    <p className="mt-0.5 text-sm text-stone-900">
                      {selected.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                    Special Instructions
                  </p>
                  <div className="border-l-2 border-amber-400 bg-amber-50/60 px-4 py-3">
                    <p className="text-sm text-stone-700">{selected.notes}</p>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Payment
                </p>
                <div className="border border-stone-200 p-4">
                  <p className="font-serif text-base text-stone-900">
                    {selected.paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : selected.paymentMethod === 'online'
                        ? 'Online Payment'
                        : selected.paymentMethod || 'N/A'}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Amount: ₱{selected.total.toLocaleString()}
                  </p>

                  {selected.paymentMethod === 'online' &&
                    selected.paymentStatus && (
                      <div className="mt-3 border-t border-stone-100 pt-3">
                        {selected.paymentStatus === 'Verified' && (
                          <p className="flex items-center gap-2 text-xs text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Payment verified
                          </p>
                        )}
                        {selected.paymentStatus === 'Awaiting Verification' && (
                          <p className="flex items-center gap-2 text-xs text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Awaiting verification
                          </p>
                        )}
                        {selected.paymentStatus === 'Rejected' && (
                          <p className="flex items-center gap-2 text-xs text-red-700">
                            <ShieldX className="h-3.5 w-3.5" />
                            Payment rejected
                          </p>
                        )}

                        {selected.paymentReceiptUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingReceipt(selected.paymentReceiptUrl!)
                            }
                            className="mt-3 flex w-full items-center gap-3 border border-stone-200 p-2 transition-colors hover:bg-stone-50"
                          >
                            <img
                              src={selected.paymentReceiptUrl}
                              alt="Receipt"
                              className="h-12 w-12 shrink-0 object-cover"
                            />
                            <span className="flex-1 text-left text-[11px] font-medium uppercase tracking-wider text-stone-500">
                              View Receipt
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Summary
                </p>
                <div className="space-y-2 border border-stone-200 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="text-stone-900">
                      ₱{selected.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Shipping</span>
                    <span className="text-stone-900">
                      ₱{selected.shipping?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
                    <span className="font-serif text-base text-stone-900">
                      Total
                    </span>
                    <span className="font-serif text-2xl text-stone-900">
                      ₱{selected.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-stone-200 pt-5">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 border border-stone-300 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Close
                </button>
                {canCancel(selected) && (
                  <button
                    onClick={() => {
                      setSelected(null);
                      setCancelOrderId(selected.id);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 border border-red-200 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT LIGHTBOX */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg transition-colors hover:bg-stone-100"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={viewingReceipt}
              alt="Receipt full view"
              className="max-h-[95vh] bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
