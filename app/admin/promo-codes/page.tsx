'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Percent,
  DollarSign,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

interface PromoForm {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUses: number;
  expiresAt: string;
  active: boolean;
}

const emptyForm: PromoForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minPurchase: 0,
  maxUses: 100,
  expiresAt: '',
  active: true,
};

// Generate random code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FLOWER';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date for input
const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export default function AdminPromoCodesPage() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive' | 'Expired'>('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      const q = query(
        collection(db, 'promoCodes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromoCode[];
      setPromos(data);
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPromos();
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      code: generateCode(),
    });
    setShowModal(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase,
      maxUses: promo.maxUses,
      expiresAt: formatDateForInput(promo.expiresAt),
      active: promo.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      showToast({ message: 'Promo code is required.', type: 'error' });
      return;
    }

    if (form.discountValue <= 0) {
      showToast({ message: 'Discount value must be greater than 0.', type: 'error' });
      return;
    }

    // Check for duplicate code (excluding current editing)
    const duplicate = promos.find(
      (p) =>
        p.code.toUpperCase() === form.code.toUpperCase() &&
        p.id !== editing?.id
    );
    if (duplicate) {
      showToast({
        message: 'Promo code already exists.',
        description: 'Please use a different code.',
        type: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      const promoData = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        minPurchase: form.minPurchase,
        maxUses: form.maxUses,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : '',
        active: form.active,
      };

      if (editing) {
        await updateDoc(doc(db, 'promoCodes', editing.id), {
          ...promoData,
          updatedAt: new Date().toISOString(),
        });
        showToast({
          message: '✅ Promo code updated!',
          description: `${form.code} has been updated.`,
          type: 'success',
        });
      } else {
        await addDoc(collection(db, 'promoCodes'), {
          ...promoData,
          usedCount: 0,
          createdAt: new Date().toISOString(),
        });
        showToast({
          message: '🎟️ Promo code created!',
          description: `${form.code} is now available.`,
          type: 'success',
        });
      }

      await fetchPromos();
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      showToast({
        message: 'Failed to save promo code.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      await updateDoc(doc(db, 'promoCodes', promo.id), {
        active: !promo.active,
      });
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, active: !p.active } : p
        )
      );
      showToast({
        message: promo.active ? '⏸️ Promo deactivated' : '✅ Promo activated!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed:', err);
      showToast({ message: 'Failed to update.', type: 'error' });
    }
  };

  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(`Delete promo code "${promo.code}"?`)) return;
    try {
      await deleteDoc(doc(db, 'promoCodes', promo.id));
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      showToast({
        message: '🗑️ Promo code deleted.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed:', err);
      showToast({ message: 'Failed to delete.', type: 'error' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (promo: PromoCode) => {
    if (!promo.expiresAt) return false;
    return new Date(promo.expiresAt) < new Date();
  };

  const isMaxed = (promo: PromoCode) => {
    return promo.maxUses > 0 && promo.usedCount >= promo.maxUses;
  };

  const filtered = useMemo(() => {
    let result = promos;

    if (filter === 'Active') {
      result = result.filter(
        (p) => p.active && !isExpired(p) && !isMaxed(p)
      );
    } else if (filter === 'Inactive') {
      result = result.filter((p) => !p.active);
    } else if (filter === 'Expired') {
      result = result.filter((p) => isExpired(p) || isMaxed(p));
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s)
      );
    }

    return result;
  }, [promos, filter, search]);

  const stats = useMemo(() => {
    const total = promos.length;
    const active = promos.filter(
      (p) => p.active && !isExpired(p) && !isMaxed(p)
    ).length;
    const totalUses = promos.reduce((sum, p) => sum + p.usedCount, 0);
    return { total, active, totalUses };
  }, [promos]);

  const statCards = [
    {
      label: 'Total Codes',
      value: stats.total.toString(),
      icon: Ticket,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Active Codes',
      value: stats.active.toString(),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      label: 'Total Uses',
      value: stats.totalUses.toString(),
      icon: TrendingUp,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
    },
    {
      label: 'Expired / Maxed',
      value: (
        promos.filter((p) => isExpired(p) || isMaxed(p)).length
      ).toString(),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
    },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No expiry';
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.active) {
      return {
        label: 'Inactive',
        icon: XCircle,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
      };
    }
    if (isExpired(promo)) {
      return {
        label: 'Expired',
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
      };
    }
    if (isMaxed(promo)) {
      return {
        label: 'Maxed Out',
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
      };
    }
    return {
      label: 'Active',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    };
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkles className="h-3 w-3" />
            Promotions
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Promo Codes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount codes for your customers.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Generate Code
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

      {/* SEARCH & FILTER */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['All', 'Active', 'Inactive', 'Expired'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                filter === tab
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PROMO LIST */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
          <p className="mt-3 text-sm text-gray-500">Loading promo codes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Ticket className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mb-1 font-medium text-gray-700">
            {search || filter !== 'All' ? 'No promos found' : 'No promo codes yet'}
          </p>
          <p className="text-sm text-gray-500">
            {search || filter !== 'All'
              ? 'Try adjusting your search or filters.'
              : 'Generate your first promo code to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((promo) => {
            const status = getStatusBadge(promo);
            const StatusIcon = status.icon;
            const usesPercent =
              promo.maxUses > 0
                ? (promo.usedCount / promo.maxUses) * 100
                : 0;

            return (
              <div
                key={promo.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Dashed top strip */}
                <div className="relative h-1.5 w-full bg-linear-to-r from-pink-500 via-rose-500 to-purple-500" />

                <div className="p-5">
                  {/* Code + Status */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <button
                          onClick={() => copyCode(promo.code)}
                          className="group/code inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-pink-300 bg-pink-50 px-3 py-1.5 transition-colors hover:border-pink-500 hover:bg-pink-100"
                          title="Click to copy"
                        >
                          <Ticket className="h-4 w-4 text-pink-600" />
                          <span className="font-mono text-base font-bold tracking-wider text-pink-700">
                            {promo.code}
                          </span>
                          {copiedCode === promo.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-pink-500 opacity-60" />
                          )}
                        </button>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${status.bg} ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      {promo.description && (
                        <p className="text-sm text-gray-600">
                          {promo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-linear-to-br from-pink-50 to-rose-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                      {promo.discountType === 'percentage' ? (
                        <Percent className="h-5 w-5" />
                      ) : (
                        <DollarSign className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        {promo.discountType === 'percentage'
                          ? 'Percentage Discount'
                          : 'Fixed Discount'}
                      </p>
                      <p className="text-lg font-bold text-pink-600">
                        {promo.discountType === 'percentage'
                          ? `${promo.discountValue}% OFF`
                          : `₱${promo.discountValue.toLocaleString()} OFF`}
                      </p>
                    </div>
                    {promo.minPurchase > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Min. Purchase</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₱{promo.minPurchase.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Usage */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Usage</span>
                      <span className="font-medium text-gray-900">
                        {promo.usedCount} / {promo.maxUses || '∞'} used
                      </span>
                    </div>
                    {promo.maxUses > 0 && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usesPercent >= 100
                              ? 'bg-linear-to-r from-red-500 to-rose-600'
                              : 'bg-linear-to-r from-pink-500 to-rose-600'
                          }`}
                          style={{ width: `${Math.min(usesPercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Expiry */}
                  <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {promo.expiresAt
                        ? `Expires ${formatDate(promo.expiresAt)}`
                        : 'No expiry date'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        promo.active
                          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {promo.active ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(promo)}
                      className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo)}
                      className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition-colors hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit Promo Code' : 'Generate Promo Code'}
                </h2>
                <p className="text-xs text-gray-500">
                  {editing
                    ? 'Update promo code details'
                    : 'Create a new discount code'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {/* Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Promo Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase().replace(/\s/g, ''),
                      })
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm uppercase tracking-wider outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                    placeholder="FLOWER10"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, code: generateCode() })
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    title="Generate random code"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  placeholder="e.g. 10% off on all orders"
                  maxLength={100}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, discountType: 'percentage' })
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      form.discountType === 'percentage'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, discountType: 'fixed' })
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      form.discountType === 'fixed'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Discount Value *{' '}
                  {form.discountType === 'percentage' ? '(%)' : '(₱)'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    {form.discountType === 'percentage' ? '%' : '₱'}
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={form.discountType === 'percentage' ? 100 : 100000}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountValue: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Min Purchase + Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Min. Purchase (₱)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minPurchase}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minPurchase: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxUses}
                    onChange={(e) =>
                      setForm({ ...form, maxUses: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no expiry date
                </p>
              </div>

              {/* Active Toggle */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-pink-600 focus:ring-pink-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Activate immediately
                  </p>
                  <p className="text-xs text-gray-500">
                    Customers can use this code right away
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md disabled:bg-gray-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editing ? (
                    <>
                      <Check className="h-4 w-4" />
                      Update Code
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}