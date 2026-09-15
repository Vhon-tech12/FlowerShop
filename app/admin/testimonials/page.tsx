'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  RefreshCw,
  Quote,
  Search,
  Sparkles,
  Clock,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';

interface TestimonialData {
  id: string;
  userId: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
  approved: boolean;
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTestimonials = async () => {
    try {
      const q = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TestimonialData[];
      setTestimonials(data);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTestimonials();
  };

  const toggleApproval = async (t: TestimonialData) => {
    try {
      await updateDoc(doc(db, 'testimonials', t.id), {
        approved: !t.approved,
      });
      setTestimonials((prev) =>
        prev.map((x) =>
          x.id === t.id ? { ...x, approved: !x.approved } : x
        )
      );

      showToast({
        message: t.approved ? '⏸️ Review unpublished' : '✅ Review approved!',
        description: t.approved
          ? 'Hidden from the homepage.'
          : 'Now visible on the homepage.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to update:', err);
      showToast({
        message: 'Failed to update review.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast({
        message: '🗑️ Review deleted.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to delete:', err);
      showToast({
        message: 'Failed to delete.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const filtered = useMemo(() => {
    let result = testimonials;

    if (filter === 'Pending') {
      result = result.filter((t) => !t.approved);
    } else if (filter === 'Approved') {
      result = result.filter((t) => t.approved);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.location.toLowerCase().includes(s) ||
          t.text.toLowerCase().includes(s)
      );
    }

    return result;
  }, [testimonials, filter, search]);

  const stats = useMemo(() => {
    const total = testimonials.length;
    const approved = testimonials.filter((t) => t.approved).length;
    const pending = testimonials.filter((t) => !t.approved).length;
    const avgRating =
      total > 0
        ? testimonials.reduce((sum, t) => sum + t.rating, 0) / total
        : 0;

    return { total, approved, pending, avgRating };
  }, [testimonials]);

  const statCards = [
    {
      label: 'Total Reviews',
      value: stats.total.toString(),
      icon: Quote,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Approved',
      value: stats.approved.toString(),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      label: 'Pending Approval',
      value: stats.pending.toString(),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
    },
    {
      label: 'Average Rating',
      value: stats.total > 0 ? `${stats.avgRating.toFixed(1)}★` : '—',
      icon: Star,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
    },
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
      const diffMs = now.getTime() - date.getTime();
      const diffMin = diffMs / (1000 * 60);
      const diffHours = diffMin / 60;
      const diffDays = diffHours / 24;

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
      if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
      if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkles className="h-3 w-3" />
            Feedback
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Customer Reviews
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {testimonials.length} review
            {testimonials.length !== 1 ? 's' : ''}
            {stats.pending > 0 && (
              <>
                {' • '}
                <span className="font-medium text-amber-600">
                  {stats.pending} pending approval
                </span>
              </>
            )}
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

      {/* STAT CARDS */}
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

      {/* PENDING ALERT */}
      {stats.pending > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">
              {stats.pending} review{stats.pending > 1 ? 's' : ''} waiting for
              approval
            </p>
            <p className="text-xs text-amber-600">
              Approve to display them on the homepage.
            </p>
          </div>
          <button
            onClick={() => setFilter('Pending')}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            Review Pending
          </button>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, location, or review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'All' as const, count: stats.total },
            { key: 'Pending' as const, count: stats.pending },
            { key: 'Approved' as const, count: stats.approved },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.key}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
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

      {/* RESULTS COUNT */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing <strong className="text-gray-900">{filtered.length}</strong>{' '}
          of {testimonials.length} review
          {testimonials.length !== 1 ? 's' : ''}
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

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3 text-sm text-gray-500">Loading reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Quote className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 font-medium text-gray-700">
              {search || filter !== 'All'
                ? 'No reviews found'
                : 'No reviews yet'}
            </p>
            <p className="text-sm text-gray-500">
              {search || filter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'Customer reviews will appear here once submitted.'}
            </p>
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                t.approved ? 'border-emerald-200' : 'border-amber-200'
              }`}
            >
              {/* Top color strip */}
              <div
                className={`h-1 w-full ${
                  t.approved
                    ? 'bg-linear-to-r from-emerald-400 to-teal-500'
                    : 'bg-linear-to-r from-amber-400 to-orange-500'
                }`}
              />

              <div className="flex flex-col gap-5 p-5 sm:flex-row">
                {/* Avatar */}
                <div className="flex shrink-0 items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                      t.approved
                        ? 'bg-linear-to-br from-emerald-400 to-teal-500 text-white'
                        : 'bg-linear-to-br from-amber-400 to-orange-500 text-white'
                    }`}
                  >
                    {t.avatar}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {t.location}
                    </span>

                    {t.approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                        <Clock className="h-3 w-3" />
                        PENDING
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex gap-0.5">{renderStars(t.rating)}</div>
                    <span className="text-xs font-medium text-gray-500">
                      {t.rating}.0
                    </span>
                  </div>

                  <div className="relative mb-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <Quote className="absolute -top-2 left-4 h-4 w-4 fill-pink-200 text-pink-200" />
                    <p className="text-sm leading-relaxed text-gray-700">
                      {t.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span title={formatDate(t.createdAt)}>
                      {formatRelative(t.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2 sm:flex-col sm:justify-start">
                  <button
                    onClick={() => toggleApproval(t)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all sm:flex-none ${
                      t.approved
                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md'
                    }`}
                  >
                    {t.approved ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}