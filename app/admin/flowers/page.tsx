'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Check,
  Filter,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { Flower } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

interface FlowerForm {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

const emptyForm: FlowerForm = {
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  stock: 0,
  category: '',
};

const categoryColors: Record<string, string> = {
  Roses: 'bg-pink-100 text-pink-700',
  Sunflowers: 'bg-yellow-100 text-yellow-700',
  Tulips: 'bg-orange-100 text-orange-700',
  Lilies: 'bg-purple-100 text-purple-700',
  Peonies: 'bg-rose-100 text-rose-700',
  Orchids: 'bg-indigo-100 text-indigo-700',
};

const getCategoryColor = (category: string) => {
  return (
    categoryColors[category] ||
    'bg-gray-100 text-gray-700'
  );
};

export default function AdminFlowersPage() {
  const { showToast } = useToast();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [form, setForm] = useState<FlowerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadStats, setUploadStats] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchFlowers = async () => {
    try {
      const q = query(collection(db, 'flowers'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Flower[];
      setFlowers(data);
    } catch (err) {
      console.error('Error fetching flowers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowers();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const total = flowers.length;
    const lowStock = flowers.filter((f) => f.stock > 0 && f.stock <= 5).length;
    const outOfStock = flowers.filter((f) => f.stock === 0).length;
    const categories = new Set(flowers.map((f) => f.category)).size;
    const totalValue = flowers.reduce(
      (sum, f) => sum + f.price * f.stock,
      0
    );
    return { total, lowStock, outOfStock, categories, totalValue };
  }, [flowers]);

  // Filtered flowers
  const filteredFlowers = useMemo(() => {
    return flowers.filter((flower) => {
      const matchSearch = flower.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === 'All' || flower.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [flowers, search, categoryFilter]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(flowers.map((f) => f.category)))],
    [flowers]
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview('');
    setUploadStats('');
    setShowModal(true);
  };

  const openEdit = (flower: Flower) => {
    setEditing(flower);
    setForm({
      name: flower.name,
      description: flower.description,
      price: flower.price,
      imageUrl: flower.imageUrl,
      stock: flower.stock,
      category: flower.category,
    });
    setImagePreview(flower.imageUrl);
    setUploadStats('');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        message: 'Invalid file type.',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        type: 'error',
      });
      return;
    }

    if (file.size > 500 * 1024) {
      showToast({
        message: 'Image is too large.',
        description: 'Please upload an image smaller than 500KB.',
        type: 'error',
      });
      return;
    }

    setUploading(true);
    setUploadStats('');

    try {
      const fileKB = (file.size / 1024).toFixed(0);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      setForm((prev) => ({ ...prev, imageUrl: base64 }));
      setImagePreview(base64);
      setUploadStats(`Ready! ${fileKB} KB`);
    } catch (err: any) {
      console.error('Failed:', err);
      showToast({
        message: 'Upload failed.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.imageUrl) {
      showToast({
        message: 'Image required.',
        description: 'Please upload a flower image.',
        type: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateDoc(doc(db, 'flowers', editing.id), {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        showToast({
          message: '✅ Flower updated!',
          description: `${form.name} has been updated.`,
          type: 'success',
        });
      } else {
        await addDoc(collection(db, 'flowers'), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        showToast({
          message: '🌸 Flower added!',
          description: `${form.name} is now available.`,
          type: 'success',
        });
      }

      await fetchFlowers();
      setShowModal(false);
      setForm(emptyForm);
      setImagePreview('');
      setUploadStats('');
      setEditing(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      showToast({
        message: 'Save failed.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (flower: Flower) => {
    if (!confirm(`Delete "${flower.name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'flowers', flower.id));
      setFlowers((prev) => prev.filter((f) => f.id !== flower.id));
      showToast({
        message: '🗑️ Flower deleted.',
        description: `${flower.name} has been removed.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Delete failed:', err);
      showToast({
        message: 'Delete failed.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const statCards = [
    {
      label: 'Total Flowers',
      value: stats.total.toString(),
      icon: Package,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
    },
    {
      label: 'Categories',
      value: stats.categories.toString(),
      icon: Sparkles,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
    },
    {
      label: 'Low Stock',
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
    },
    {
      label: 'Inventory Value',
      value: `₱${stats.totalValue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
  ];

  return (
    <>
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkles className="h-3 w-3" />
            Inventory
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Flower Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your flower inventory — changes reflect on the customer
            side instantly.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Flower
        </button>
      </div>

      {/* ============================================ */}
      {/* STAT CARDS */}
      {/* ============================================ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative p-5">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}
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

      {/* ============================================ */}
      {/* ALERTS */}
      {/* ============================================ */}
      {stats.outOfStock > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {stats.outOfStock} product{stats.outOfStock > 1 ? 's' : ''} out of
              stock
            </p>
            <p className="text-xs text-red-600">
              Customers can&apos;t order these items right now.
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SEARCH & FILTER */}
      {/* ============================================ */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search flowers by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================ */}
      {/* RESULTS COUNT */}
      {/* ============================================ */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing{' '}
          <strong className="text-gray-900">{filteredFlowers.length}</strong> of{' '}
          {flowers.length} product{flowers.length !== 1 ? 's' : ''}
        </span>
        {(search || categoryFilter !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
            }}
            className="font-medium text-pink-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ============================================ */}
      {/* TABLE */}
      {/* ============================================ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3 text-sm text-gray-500">
              Loading flowers...
            </p>
          </div>
        ) : flowers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 font-medium text-gray-700">
              No flowers yet
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Add your first flower product to get started.
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Your First Flower
            </button>
          </div>
        ) : filteredFlowers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 font-medium text-gray-700">
              No flowers found
            </p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-center">Stock</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFlowers.map((flower) => {
                  const isLowStock = flower.stock > 0 && flower.stock <= 5;
                  const isOutOfStock = flower.stock === 0;

                  return (
                    <tr
                      key={flower.id}
                      className="group transition-colors hover:bg-pink-50/30"
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                            {flower.imageUrl && (
                              <img
                                src={flower.imageUrl}
                                alt={flower.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {flower.name}
                            </p>
                            <p className="line-clamp-1 text-xs text-gray-500">
                              {flower.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(
                            flower.category
                          )}`}
                        >
                          {flower.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          ₱{flower.price.toLocaleString()}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            {flower.stock} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {flower.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(flower)}
                            className="rounded-lg p-2 text-blue-600 opacity-0 transition-all hover:bg-blue-50 group-hover:opacity-100"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(flower)}
                            className="rounded-lg p-2 text-red-600 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ============================================ */}
      {/* MODAL */}
      {/* ============================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit Flower' : 'Add New Flower'}
                </h2>
                <p className="text-xs text-gray-500">
                  {editing
                    ? 'Update the flower details'
                    : 'Fill in the details to add a new product'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Flower Image *
                </label>
                {imagePreview ? (
                  <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setForm((prev) => ({ ...prev, imageUrl: '' }));
                          setUploadStats('');
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Image
                      </button>
                    </div>
                    {uploadStats && (
                      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                        <Check className="h-3 w-3" />
                        {uploadStats}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-all hover:border-pink-500 hover:bg-pink-50/50 hover:text-pink-600 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs">Processing...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Click to upload image
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Max 500KB • JPG, PNG
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  placeholder="Red Roses Bouquet"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  placeholder="A classic bouquet of 12 fresh red roses..."
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Price (₱) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
                  placeholder="Roses, Tulips, Sunflowers, etc."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-gray-100 pt-5">
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
                  disabled={saving || uploading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editing ? (
                    <>
                      <Check className="h-4 w-4" />
                      Update Flower
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Flower
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