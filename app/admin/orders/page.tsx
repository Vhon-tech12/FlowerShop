'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Eye,
  X,
  Loader2,
  RefreshCw,
  Package,
  Printer,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Filter,
  Sparkles,
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
  Hash,
  Ban,
  MessageSquareWarning,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';

type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
type PaymentStatus =
  | 'N/A'
  | 'Awaiting Verification'
  | 'Verified'
  | 'Rejected';
type CancelStatus = 'Pending' | 'Approved' | 'Rejected';
type FilterKey = 'All' | OrderStatus | 'Cancel Requests';

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
  cancelRequestedBy?: string | null;
  cancelReviewedBy?: string | null;
}

const statusConfig: Record<
  OrderStatus,
  {
    color: string;
    bg: string;
    border: string;
    icon: typeof Clock;
    label: string;
  }
> = {
  Pending: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    icon: Clock,
    label: 'Pending',
  },
  Processing: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    icon: AlertCircle,
    label: 'Processing',
  },
  Completed: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    icon: CheckCircle2,
    label: 'Completed',
  },
  Cancelled: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
    icon: XCircle,
    label: 'Cancelled',
  },
};

const paymentStatusConfig: Record<
  PaymentStatus,
  { color: string; bg: string; border: string; label: string; icon: typeof Clock }
> = {
  'N/A': {
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    label: 'No verification needed',
    icon: CreditCard,
  },
  'Awaiting Verification': {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    label: 'Awaiting Verification',
    icon: Clock,
  },
  Verified: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    label: 'Payment Verified',
    icon: ShieldCheck,
  },
  Rejected: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
    label: 'Payment Rejected',
    icon: ShieldX,
  },
};

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrderData | null>(null);
  const [printingOrder, setPrintingOrder] = useState<OrderData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [reviewingCancel, setReviewingCancel] = useState<string | null>(null);
  const autoOpenedRef = useRef(false);

  const fetchOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderData[];
      setOrders(data);
      if (selected) {
        const updated = data.find((o) => o.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔔 Auto-open order detail modal if ?order=<id> is in URL
  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId || autoOpenedRef.current || orders.length === 0) return;

    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      setSelected(targetOrder);
      autoOpenedRef.current = true;
    }
  }, [searchParams, orders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      if (selected?.id === id) {
        setSelected({ ...selected, status });
      }
      showToast({
        message: `✅ Status updated to ${status}`,
        description: 'Customer will see the change instantly.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast({
        message: 'Failed to update status.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const updatePaymentStatus = async (
    id: string,
    paymentStatus: PaymentStatus,
    autoConfirm = false
  ) => {
    try {
      const payload: any = { paymentStatus };
      if (paymentStatus === 'Verified' && autoConfirm) {
        payload.status = 'Processing';
      }
      if (paymentStatus === 'Rejected' && autoConfirm) {
        payload.status = 'Cancelled';
      }
      await updateDoc(doc(db, 'orders', id), payload);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, paymentStatus, ...(payload.status ? { status: payload.status } : {}) }
            : o
        )
      );
      if (selected?.id === id) {
        setSelected({
          ...selected,
          paymentStatus,
          ...(payload.status ? { status: payload.status } : {}),
        });
      }

      showToast({
        message:
          paymentStatus === 'Verified'
            ? '✅ Payment verified'
            : '❌ Payment rejected',
        description:
          paymentStatus === 'Verified'
            ? 'Order moved to Processing.'
            : 'Order marked as Cancelled.',
        type: paymentStatus === 'Verified' ? 'success' : 'error',
      });
    } catch (err: any) {
      console.error('Failed to update payment status:', err);
      showToast({
        message: 'Failed to update payment status.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleCancelReview = async (
    id: string,
    decision: 'Approved' | 'Rejected'
  ) => {
    setReviewingCancel(id);
    try {
      const payload: any = {
        cancelStatus: decision,
        cancelReviewedAt: new Date().toISOString(),
        cancelReviewedBy: 'admin',
      };

      if (decision === 'Approved') {
        payload.status = 'Cancelled';
      }

      await updateDoc(doc(db, 'orders', id), payload);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                cancelStatus: decision,
                cancelReviewedAt: payload.cancelReviewedAt,
                ...(payload.status ? { status: payload.status } : {}),
              }
            : o
        )
      );
      if (selected?.id === id) {
        setSelected({
          ...selected,
          cancelStatus: decision,
          cancelReviewedAt: payload.cancelReviewedAt,
          ...(payload.status ? { status: payload.status } : {}),
        });
      }

      showToast({
        message:
          decision === 'Approved'
            ? '✅ Cancellation approved'
            : '❌ Cancellation rejected',
        description:
          decision === 'Approved'
            ? 'Order has been cancelled and customer will be notified.'
            : 'Order stays active. Customer can still receive it.',
        type: decision === 'Approved' ? 'success' : 'error',
      });
    } catch (err: any) {
      console.error('Cancel review failed:', err);
      showToast({
        message: 'Failed to review cancellation.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setReviewingCancel(null);
    }
  };

  const handlePrintReceipt = (order: OrderData) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCloseModal = () => {
    setSelected(null);
    if (searchParams.get('order')) {
      autoOpenedRef.current = false;
      router.replace('/admin/orders');
    }
  };

  const filtered = useMemo(() => {
    let result = orders;

    if (filter === 'Cancel Requests') {
      result = result.filter((o) => o.cancelStatus === 'Pending');
    } else if (filter !== 'All') {
      result = result.filter((o) => o.status === filter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(s) ||
          o.contactNumber.includes(s) ||
          o.id.toLowerCase().includes(s)
      );
    }

    return result;
  }, [orders, filter, search]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const processing = orders.filter((o) => o.status === 'Processing').length;
    const completed = orders.filter((o) => o.status === 'Completed').length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    const awaitingPayment = orders.filter(
      (o) => o.paymentStatus === 'Awaiting Verification'
    ).length;
    const cancelRequests = orders.filter(
      (o) => o.cancelStatus === 'Pending'
    ).length;
    const revenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      revenue,
      awaitingPayment,
      cancelRequests,
    };
  }, [orders]);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.total.toString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Pending',
      value: stats.pending.toString(),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
    },
    {
      label: 'Completed',
      value: stats.completed.toString(),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      label: 'Total Revenue',
      value: `₱${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
    },
  ];

  const filterTabs: Array<{ key: FilterKey; count: number }> = [
    { key: 'All', count: stats.total },
    { key: 'Pending', count: stats.pending },
    { key: 'Processing', count: stats.processing },
    { key: 'Completed', count: stats.completed },
    { key: 'Cancelled', count: stats.cancelled },
    { key: 'Cancel Requests', count: stats.cancelRequests },
  ];

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

  const formatReceiptDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isOnlinePayment = (order: OrderData) =>
    order.paymentMethod === 'online';

  const hasPendingCancel = (order: OrderData) =>
    order.cancelStatus === 'Pending';

  return (
    <>
      {/* SCREEN VIEW */}
      <div className="print:hidden">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
              <Sparkles className="h-3 w-3" />
              Orders
            </div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Customer Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all customer orders in one place.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${stat.bgGradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative p-5">
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${stat.gradient} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.key;
              const isCancelTab = tab.key === 'Cancel Requests';
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? isCancelTab
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-pink-600 text-white shadow-sm'
                      : isCancelTab && tab.count > 0
                        ? 'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.key}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isCancelTab && tab.count > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing{' '}
            <strong className="text-gray-900">{filtered.length}</strong> of{' '}
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
          {(search || filter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setFilter('All');
              }}
              className="font-medium text-pink-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
              <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mb-1 font-medium text-gray-700">
                {search || filter !== 'All'
                  ? 'No orders found'
                  : 'No orders yet'}
              </p>
              <p className="text-sm text-gray-500">
                {search || filter !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'Orders will appear here once customers start buying.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3 text-center">Items</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((order) => {
                    const config =
                      statusConfig[order.status] || statusConfig.Pending;
                    const payStatus: PaymentStatus =
                      order.paymentStatus || 'N/A';
                    const payConfig =
                      paymentStatusConfig[payStatus] ||
                      paymentStatusConfig['N/A'];
                    const PayIcon = payConfig.icon;
                    const needsVerification =
                      payStatus === 'Awaiting Verification';
                    const cancelPending = hasPendingCancel(order);

                    return (
                      <tr
                        key={order.id}
                        className={`group transition-colors hover:bg-pink-50/30 ${
                          needsVerification ? 'bg-blue-50/40' : ''
                        } ${cancelPending ? 'bg-rose-50/40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-medium text-gray-700">
                            #{order.id.slice(0, 6).toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-100 to-rose-100 text-xs font-bold text-pink-600">
                              {order.customerName
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {order.customerName}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {order.contactNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {order.items?.length || 0}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-900">
                            ₱{order.total?.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-600">
                              {order.paymentMethod === 'cod'
                                ? 'Cash on Delivery'
                                : order.paymentMethod === 'online'
                                  ? 'Online Payment'
                                  : 'N/A'}
                            </span>
                            {isOnlinePayment(order) && (
                              <span
                                className={`inline-flex w-fit items-center gap-1 rounded-full ${payConfig.bg} ${payConfig.color} px-2 py-0.5 text-[10px] font-medium`}
                              >
                                <PayIcon className="h-3 w-3" />
                                {payConfig.label}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateStatus(
                                  order.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-medium outline-none transition-all ${config.bg} ${config.color}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            {cancelPending && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                <MessageSquareWarning className="h-3 w-3" />
                                CANCEL REQUESTED
                              </span>
                            )}

                            {order.cancelStatus === 'Rejected' && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                Cancel rejected
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-500">
                          <span title={formatDate(order.createdAt)}>
                            {formatRelative(order.createdAt)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            {cancelPending && (
                              <button
                                onClick={() => setSelected(order)}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-rose-700"
                                title="Review Cancellation"
                              >
                                Review
                              </button>
                            )}
                            {needsVerification && !cancelPending && (
                              <button
                                onClick={() => setSelected(order)}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                title="Verify Payment"
                              >
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintReceipt(order)}
                              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              title="Print Receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelected(order)}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:hidden">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-700">
                  <FileText className="h-3 w-3" />
                  Order Details
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  #{selected.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-500">
                  Placed {formatDate(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* CANCELLATION REQUEST SECTION */}
              {selected.cancelStatus === 'Pending' && (
                <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                      <MessageSquareWarning className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Cancellation Request
                      </p>
                      <p className="text-sm font-bold text-rose-700">
                        Customer wants to cancel this order
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 rounded-lg border border-rose-200 bg-white p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reason
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selected.cancelReason || 'No reason provided'}
                    </p>
                    {selected.cancelNote && (
                      <>
                        <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Additional Note
                        </p>
                        <p className="text-sm text-gray-700">
                          {selected.cancelNote}
                        </p>
                      </>
                    )}
                    {selected.cancelRequestedAt && (
                      <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        Requested {formatRelative(selected.cancelRequestedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() =>
                        handleCancelReview(selected.id, 'Approved')
                      }
                      disabled={reviewingCancel === selected.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewingCancel === selected.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve Cancellation
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleCancelReview(selected.id, 'Rejected')
                      }
                      disabled={reviewingCancel === selected.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Ban className="h-4 w-4" />
                      Reject — Keep Order
                    </button>
                  </div>
                </div>
              )}

              {/* Approved cancel result */}
              {selected.cancelStatus === 'Approved' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Cancellation Approved
                      </p>
                      <p className="text-sm font-bold text-rose-700">
                        Order has been cancelled
                      </p>
                      {selected.cancelReason && (
                        <p className="mt-1 text-xs text-gray-600">
                          Reason: {selected.cancelReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected cancel result */}
              {selected.cancelStatus === 'Rejected' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                      <Ban className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Cancellation Rejected
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        Order continues as normal
                      </p>
                      {selected.cancelReason && (
                        <p className="mt-1 text-xs text-gray-500">
                          Customer&apos;s reason: {selected.cancelReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Verification Banner */}
              {isOnlinePayment(selected) && (
                <div
                  className={`rounded-xl border-2 ${paymentStatusConfig[selected.paymentStatus || 'N/A'].border} ${paymentStatusConfig[selected.paymentStatus || 'N/A'].bg} p-4`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    {(() => {
                      const ps: PaymentStatus =
                        selected.paymentStatus || 'N/A';
                      const Icon = paymentStatusConfig[ps].icon;
                      return (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ${paymentStatusConfig[ps].color} shadow-sm`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Payment Status
                      </p>
                      <p
                        className={`text-sm font-bold ${paymentStatusConfig[selected.paymentStatus || 'N/A'].color}`}
                      >
                        {paymentStatusConfig[selected.paymentStatus || 'N/A']
                          .label}
                      </p>
                    </div>
                  </div>

                  {selected.paymentReference && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                      <Hash className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        Reference:
                      </span>
                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {selected.paymentReference}
                      </span>
                    </div>
                  )}

                  {selected.paymentReceiptUrl ? (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setViewingReceipt(selected.paymentReceiptUrl!)
                        }
                        className="group relative block w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
                      >
                        <img
                          src={selected.paymentReceiptUrl}
                          alt="Payment receipt"
                          className="max-h-64 w-full object-contain transition-opacity group-hover:opacity-90"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                          <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            <ExternalLink className="h-3 w-3" />
                            View full size
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white/60 p-3 text-xs text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                      No receipt uploaded
                    </div>
                  )}

                  {selected.paymentStatus === 'Awaiting Verification' && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() =>
                          updatePaymentStatus(selected.id, 'Verified', true)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Verify Payment
                      </button>
                      <button
                        onClick={() =>
                          updatePaymentStatus(selected.id, 'Rejected', true)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                      >
                        <ShieldX className="h-4 w-4" />
                        Reject Payment
                      </button>
                    </div>
                  )}

                  {selected.paymentStatus === 'Verified' && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Payment confirmed. Order ready for processing.
                    </div>
                  )}

                  {selected.paymentStatus === 'Rejected' && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      <XCircle className="h-4 w-4" />
                      Payment rejected. Order cancelled.
                    </div>
                  )}
                </div>
              )}

              {/* Status Quick Update */}
              <div
                className={`flex items-center gap-3 rounded-xl border ${statusConfig[selected.status].border} ${statusConfig[selected.status].bg} p-4`}
              >
                {(() => {
                  const Icon = statusConfig[selected.status].icon;
                  return (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ${statusConfig[selected.status].color} shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Order Status
                  </p>
                  <p
                    className={`text-sm font-bold ${statusConfig[selected.status].color}`}
                  >
                    {selected.status}
                  </p>
                </div>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    updateStatus(selected.id, e.target.value as OrderStatus)
                  }
                  className={`cursor-pointer rounded-lg border-0 px-3 py-1.5 text-xs font-medium outline-none ${statusConfig[selected.status].bg} ${statusConfig[selected.status].color}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer Information
                </h3>
                <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">
                        {selected.customerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium text-gray-900">
                        {selected.contactNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Delivery Address</p>
                      <p className="font-medium text-gray-900">
                        {selected.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order Items ({selected.items.length})
                </h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-shadow hover:shadow-sm"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.flowerName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {item.flowerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₱{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              {selected.notes && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Special Instructions
                  </h3>
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-gray-700">{selected.notes}</p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment Method
                </h3>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selected.paymentMethod === 'cod'
                        ? 'Cash on Delivery'
                        : selected.paymentMethod === 'online'
                          ? 'Online Payment'
                          : selected.paymentMethod || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount to collect: ₱{selected.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order Summary
                </h3>
                <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₱{selected.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Fee</span>
                    <span className="font-medium text-gray-900">
                      ₱{selected.shipping?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-pink-600">
                      ₱{selected.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-gray-100 pt-5">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintReceipt(selected)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT LIGHTBOX */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 print:hidden"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={viewingReceipt}
              alt="Payment receipt full view"
              className="max-h-[95vh] rounded-lg bg-white object-contain shadow-2xl"
            />
            <a
              href={viewingReceipt}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-100"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT */}
      {printingOrder && (
        <div className="hidden print:block">
          <div className="mx-auto max-w-2xl p-8 text-black">
            <div className="mb-6 border-b-2 border-black pb-4 text-center">
              <h1 className="text-2xl font-bold">🌸 ONLINE FLOWER SHOP</h1>
              <p className="text-sm">Fresh Flowers for Every Occasion</p>
              <p className="text-xs">123 Rizal St, Manila, Philippines</p>
              <p className="text-xs">
                Tel: +63 917 123 4567 | hello@flowershop.com
              </p>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">DELIVERY RECEIPT</h2>
              <p className="mt-1 font-mono text-sm">
                Order #{printingOrder.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold">Order Date:</p>
                <p>{formatReceiptDate(printingOrder.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Status:</p>
                <p>{printingOrder.status}</p>
              </div>
            </div>

            <div className="mb-4 border border-black p-4">
              <p className="mb-2 font-bold">DELIVER TO:</p>
              <p className="font-medium">{printingOrder.customerName}</p>
              <p>{printingOrder.contactNumber}</p>
              <p>{printingOrder.address}</p>
            </div>

            <div className="mb-4">
              <p className="mb-2 font-bold">ORDER ITEMS:</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {printingOrder.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="py-2">{item.flowerName}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">
                        ₱{item.price.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1 text-sm">
                  <span>Subtotal:</span>
                  <span>₱{printingOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span>Shipping Fee:</span>
                  <span>₱{printingOrder.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t-2 border-black py-2 text-base font-bold">
                  <span>TOTAL:</span>
                  <span>₱{printingOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-4 border border-black p-3 text-sm">
              <p>
                <strong>Payment Method:</strong>{' '}
                {printingOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery'
                  : printingOrder.paymentMethod === 'online'
                    ? 'Online Payment'
                    : printingOrder.paymentMethod || 'N/A'}
              </p>
              {printingOrder.paymentReference && (
                <p>
                  <strong>Reference No:</strong>{' '}
                  {printingOrder.paymentReference}
                </p>
              )}
              <p>
                <strong>Amount to Collect:</strong> ₱
                {printingOrder.total.toLocaleString()}
              </p>
            </div>

            {printingOrder.notes && (
              <div className="mb-4 border border-black p-3 text-sm">
                <p className="font-bold">SPECIAL INSTRUCTIONS:</p>
                <p>{printingOrder.notes}</p>
              </div>
            )}

            <div className="mb-6 mt-12 grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="mb-1 border-b border-black"></div>
                <p className="text-center text-xs">Rider&apos;s Signature</p>
              </div>
              <div>
                <div className="mb-1 border-b border-black"></div>
                <p className="text-center text-xs">
                  Recipient&apos;s Signature
                </p>
              </div>
            </div>

            <div className="border-t border-black pt-4 text-center text-xs">
              <p className="font-bold">
                Thank you for shopping with Online Flower Shop!
              </p>
              <p className="mt-1">
                For inquiries: +63 917 123 4567 | hello@flowershop.com
              </p>
              <p className="mt-2 text-[10px]">
                This serves as your official delivery receipt. Please keep for
                your records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          aside,
          header {
            display: none !important;
          }

          main,
          .lg\\:pl-64 {
            padding: 0 !important;
            padding-left: 0 !important;
          }

          body {
            background: white !important;
            color: black !important;
          }

          .hidden.print\\:block {
            display: block !important;
          }

          @page {
            margin: 1cm;
            size: A4;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
