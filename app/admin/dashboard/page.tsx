'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Flower2,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Star,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: typeof Clock; label: string }
> = {
  Pending: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    icon: Clock,
    label: 'Pending',
  },
  Processing: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: AlertCircle,
    label: 'Processing',
  },
  Completed: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: CheckCircle2,
    label: 'Completed',
  },
  Cancelled: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    icon: AlertCircle,
    label: 'Cancelled',
  },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    flowers: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    messages: 0,
    reviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [previousRevenue, setPreviousRevenue] = useState(0);

  useEffect(() => {
    const unsubFlowers = onSnapshot(collection(db, 'flowers'), (snap) => {
      setStats((prev) => ({ ...prev, flowers: snap.size }));
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const orders = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OrderData[];

      const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
      const revenue = nonCancelled.reduce(
        (sum, o) => sum + (o.total || 0),
        0
      );
      const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;
      const pendingOrders = orders.filter(
        (o) => o.status === 'Pending'
      ).length;
      const completedOrders = orders.filter(
        (o) => o.status === 'Completed'
      ).length;

      // Previous revenue (last month comparison)
      const now = new Date();
      const lastMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevRevenue = nonCancelled
        .filter((o) => {
          const d = new Date(o.createdAt);
          return d >= lastMonthStart && d <= lastMonthEnd;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      setPreviousRevenue(prevRevenue);
      setStats((prev) => ({
        ...prev,
        orders: orders.length,
        revenue,
        customers: uniqueCustomers,
        pendingOrders,
        completedOrders,
      }));

      const sorted = [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentOrders(sorted.slice(0, 6));
      setLoading(false);
    });

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
      const unread = snap.docs.filter(
        (d) => (d.data() as any).status === 'unread'
      ).length;
      setStats((prev) => ({ ...prev, messages: unread }));
    });

    const unsubReviews = onSnapshot(collection(db, 'testimonials'), (snap) => {
      const pending = snap.docs.filter(
        (d) => !(d.data() as any).approved
      ).length;
      setStats((prev) => ({ ...prev, reviews: pending }));
    });

    return () => {
      unsubFlowers();
      unsubOrders();
      unsubMessages();
      unsubReviews();
    };
  }, []);

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = calcChange(stats.revenue, previousRevenue);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateStr: string) => {
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

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₱${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-600',
      change: revenueChange,
      href: '/admin/analytics',
    },
    {
      label: 'Total Orders',
      value: stats.orders.toString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      textColor: 'text-blue-600',
      badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : null,
      href: '/admin/orders',
    },
    {
      label: 'Active Customers',
      value: stats.customers.toString(),
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-600',
      href: '/admin/dashboard',
    },
    {
      label: 'Flower Products',
      value: stats.flowers.toString(),
      icon: Flower2,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      textColor: 'text-pink-600',
      href: '/admin/flowers',
    },
  ];

  // Quick alerts
  const alerts = [
    stats.pendingOrders > 0 && {
      icon: Clock,
      label: `${stats.pendingOrders} pending order${stats.pendingOrders > 1 ? 's' : ''}`,
      sublabel: 'Waiting for confirmation',
      href: '/admin/orders',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    stats.messages > 0 && {
      icon: MessageSquare,
      label: `${stats.messages} unread message${stats.messages > 1 ? 's' : ''}`,
      sublabel: 'From customers',
      href: '/admin/messages',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    stats.reviews > 0 && {
      icon: Star,
      label: `${stats.reviews} pending review${stats.reviews > 1 ? 's' : ''}`,
      sublabel: 'Waiting for approval',
      href: '/admin/testimonials',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
    },
  ].filter(Boolean) as Array<{
    icon: any;
    label: string;
    sublabel: string;
    href: string;
    color: string;
    bg: string;
    border: string;
  }>;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
          <p className="mt-3 text-sm text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ============================================ */}
      {/* WELCOME HEADER */}
      {/* ============================================ */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkles className="h-3 w-3" />
            Dashboard
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {getGreeting()}, Admin! 🌸
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your flower shop today.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md"
        >
          <TrendingUp className="h-4 w-4" />
          View Analytics
        </Link>
      </div>

      {/* ============================================ */}
      {/* ALERTS */}
      {/* ============================================ */}
      {alerts.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <Link
                key={i}
                href={alert.href}
                className={`group flex items-center gap-3 rounded-xl border ${alert.border} ${alert.bg} p-4 transition-all hover:shadow-md`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white ${alert.color} shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${alert.color}`}>
                    {alert.label}
                  </p>
                  <p className="text-xs text-gray-600">{alert.sublabel}</p>
                </div>
                <ArrowRight
                  className={`h-4 w-4 flex-shrink-0 ${alert.color} transition-transform group-hover:translate-x-1`}
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* ============================================ */}
      {/* STAT CARDS */}
      {/* ============================================ */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              {/* Content */}
              <div className="relative p-5">
                {/* Icon + Label */}
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowUpRight
                    className={`h-4 w-4 ${stat.textColor} opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100`}
                  />
                </div>

                {/* Value */}
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>

                {/* Change / Badge */}
                {stat.change !== undefined && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                      stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(stat.change).toFixed(1)}% vs last month
                  </div>
                )}
                {stat.badge && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    {stat.badge}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* RECENT ORDERS */}
      {/* ============================================ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
              <p className="text-xs text-gray-500">
                Latest {recentOrders.length} order
                {recentOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-pink-600 transition-colors hover:text-pink-700"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Content */}
        {recentOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 font-medium text-gray-700">No orders yet</p>
            <p className="text-sm text-gray-500">
              Orders will appear here once customers start buying.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.Pending;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-pink-50/30"
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-medium text-gray-700">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-rose-100 text-xs font-bold text-pink-600">
                            {order.customerName
                              ?.split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">
                            {order.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          ₱{order.total?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} px-2.5 py-1 text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}