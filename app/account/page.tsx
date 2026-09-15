'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import {
  User,
  Package,
  Loader2,
  MessageSquare,
  Star,
  Send,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle,
  Pencil,
  X,
  Save,
  Mail,
  Phone,
  MapPin,
  Ticket,
  Copy,
  Check,
  Percent,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { Order } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

interface Reply {
  id: string;
  message: string;
  from: 'admin' | 'customer';
  fromName: string;
  createdAt: string;
}

interface MessageData {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  status: 'read' | 'unread';
  createdAt: string;
  replies?: Reply[];
}

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

export default function AccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, userData, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [hasReview, setHasReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [activeTab, setActiveTab] = useState<'promos' | 'orders' | 'messages'>(
    'promos'
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (userData?.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });
    }
  }, [userData]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user || userData?.role === 'admin') return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, [user, userData]);

  useEffect(() => {
    if (!user || userData?.role === 'admin') return;

    const q = query(
      collection(db, 'messages'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageData[];

      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setMessages(data);
      setMessagesLoading(false);
    });

    return () => unsub();
  }, [user, userData]);

  useEffect(() => {
    async function fetchPromos() {
      if (!user || userData?.role === 'admin') return;
      try {
        const q = query(
          collection(db, 'promoCodes'),
          where('active', '==', true)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PromoCode[];

        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPromos(data);
      } catch (err) {
        console.error('Error fetching promos:', err);
      } finally {
        setPromosLoading(false);
      }
    }
    fetchPromos();
  }, [user, userData]);

  useEffect(() => {
    async function checkReview() {
      if (!user || userData?.role === 'admin') return;
      try {
        const q = query(
          collection(db, 'testimonials'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        setHasReview(!snap.empty);
      } catch (err) {
        console.error('Error checking review:', err);
      }
    }
    checkReview();
  }, [user, userData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!profileForm.name.trim()) {
      showToast({ message: 'Name is required.', type: 'error' });
      return;
    }

    setSavingProfile(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          address: profileForm.address.trim(),
          email: user.email || '',
          role: userData?.role || 'customer',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      showToast({
        message: 'Profile updated',
        description: 'Your information has been saved.',
        type: 'success',
      });

      setShowEditModal(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      showToast({
        message: 'Failed to update profile.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReply = async (msgId: string) => {
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');

      const newReply: Reply = {
        id: Date.now().toString(),
        message: replyText.trim(),
        from: 'customer',
        fromName: userData?.name || 'Customer',
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'messages', msgId), {
        replies: arrayUnion(newReply),
        status: 'unread',
      });

      showToast({
        message: 'Reply sent',
        description: 'Support will get back to you soon.',
        type: 'success',
      });

      setReplyText('');
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      showToast({
        message: 'Failed to send reply.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (reviewText.trim().length < 20) {
      showToast({
        message: 'Review must be at least 20 characters.',
        type: 'error',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const initials = (userData?.name || 'Customer')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      await addDoc(collection(db, 'testimonials'), {
        userId: user.uid,
        name: userData?.name || 'Customer',
        location:
          userData?.address?.split(',').slice(-2).join(',').trim() ||
          'Philippines',
        rating: reviewRating,
        text: reviewText.trim(),
        avatar: initials,
        approved: false,
        createdAt: new Date().toISOString(),
      });

      setHasReview(true);
      setReviewText('');
      setReviewRating(5);
      setShowReviewForm(false);

      showToast({
        message: 'Thank you for your review',
        description: 'It will appear on our homepage once approved.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      showToast({
        message: 'Failed to submit review.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user || userData?.role === 'admin') return null;

  const statusStyles: Record<string, { dot: string; text: string }> = {
    Pending: { dot: 'bg-amber-500', text: 'text-amber-700' },
    Processing: { dot: 'bg-blue-500', text: 'text-blue-700' },
    Completed: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
    Cancelled: { dot: 'bg-red-500', text: 'text-red-700' },
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

  const formatShortDate = (dateStr: string) => {
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

  const isPromoExpired = (p: PromoCode) =>
    !!p.expiresAt && new Date(p.expiresAt) < new Date();

  const isPromoMaxed = (p: PromoCode) =>
    p.maxUses > 0 && p.usedCount >= p.maxUses;

  const availablePromos = promos.filter(
    (p) => !isPromoExpired(p) && !isPromoMaxed(p)
  );

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({
      message: 'Code copied',
      description: `${code} is ready to paste at checkout.`,
      type: 'success',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const hasCompletedOrder = orders.some((o) => o.status === 'Completed');
  const canReview = hasCompletedOrder && !hasReview;

  const initials = (userData?.name || 'C')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const firstName = userData?.name?.split(' ')[0] || 'there';

  const tabs = [
    {
      id: 'promos' as const,
      label: 'Promos',
      count: availablePromos.length,
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      count: orders.length,
    },
    {
      id: 'messages' as const,
      label: 'Messages',
      count: messages.length,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
          
          {/* ===== PAGE HEADER ===== */}
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
                Welcome Back
              </p>
              <h1 className="mb-3 font-serif text-4xl text-gray-900 md:text-5xl">
                Hi, {firstName}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 border-t border-gray-200 pt-6 md:border-t-0 md:pt-0">
              <div>
                <p className="font-serif text-3xl text-gray-900">
                  {orders.length}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  {orders.length === 1 ? 'Order' : 'Orders'}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-200" />
              <div>
                <p className="font-serif text-3xl text-gray-900">
                  {availablePromos.length}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Promos
                </p>
              </div>
              <div className="h-12 w-px bg-gray-200" />
              <div>
                <p className="font-serif text-3xl text-gray-900">
                  {messages.length}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Messages
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            
            {/* ===== LEFT COLUMN: Profile & Review ===== */}
            <div className="space-y-12 lg:col-span-1">
              
              {/* Profile */}
              <div className="border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <h2 className="font-serif text-xl text-gray-900">
                    Profile
                  </h2>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Avatar header */}
                <div className="flex items-center gap-4 border-b border-gray-100 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-base font-medium text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg text-gray-900">
                      {userData?.name || 'Customer'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-emerald-600">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Verified Account
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                      Email
                    </p>
                    <p className="truncate text-sm text-gray-900">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm text-gray-900">
                      {userData?.phone || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                      Address
                    </p>
                    <p className="text-sm leading-relaxed text-gray-900">
                      {userData?.address || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review */}
              {(canReview || hasReview) && (
                <div className="border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
                    <Award className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                    <h3 className="font-serif text-xl text-gray-900">
                      Your Feedback
                    </h3>
                  </div>

                  <div className="p-6">
                    {hasReview ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle
                          className="h-4 w-4 text-emerald-600"
                          strokeWidth={1.5}
                        />
                        <span>Thank you for your review</span>
                      </div>
                    ) : showReviewForm ? (
                      <form onSubmit={handleSubmitReview} className="space-y-5">
                        <div>
                          <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                            Rating
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    star <= reviewRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-200'
                                  }`}
                                  strokeWidth={1.5}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            maxLength={300}
                            placeholder="Share your experience..."
                            className="w-full resize-none border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-gray-900"
                          />
                          <p className="mt-2 text-right text-[10px] font-medium uppercase tracking-widest text-gray-400">
                            {reviewText.length}/300
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="flex-1 border border-gray-300 bg-white px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="flex flex-1 items-center justify-center gap-1.5 bg-gray-900 px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                          >
                            {submittingReview ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Submit
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="mb-4 text-sm leading-relaxed text-gray-500">
                          Share your experience with other customers.
                        </p>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full bg-gray-900 px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
                        >
                          Write a Review
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ===== RIGHT COLUMN: Tabs ===== */}
            <div className="lg:col-span-2">
              
              {/* Tabs */}
              <div className="mb-10 flex flex-wrap items-center gap-8 border-b border-gray-200">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative pb-4 text-xs font-medium uppercase tracking-widest transition-colors ${
                        isActive
                          ? 'text-gray-900'
                          : 'text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 text-[10px]">({tab.count})</span>
                      )}
                      {isActive && (
                        <span className="absolute -bottom-px left-0 right-0 h-px bg-gray-900" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* === PROMOS === */}
              {activeTab === 'promos' && (
                <div>
                  {promosLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                    </div>
                  ) : availablePromos.length === 0 ? (
                    <div className="border border-dashed border-gray-200 bg-white py-20 text-center">
                      <Ticket
                        className="mx-auto mb-3 h-8 w-8 text-gray-200"
                        strokeWidth={1}
                      />
                      <p className="font-serif text-lg text-gray-900">
                        No promo codes available
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                        Check back soon for special offers
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {availablePromos.map((promo) => (
                        <div
                          key={promo.id}
                          className="group relative border border-gray-200 bg-white p-6 transition-colors hover:border-gray-900"
                        >
                          {/* Discount badge */}
                          <div className="mb-5 flex items-start justify-between">
                            <div>
                              <p className="font-serif text-3xl text-gray-900">
                                {promo.discountType === 'percentage'
                                  ? `${promo.discountValue}%`
                                  : `₱${promo.discountValue.toLocaleString()}`}
                              </p>
                              <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                                Off Your Order
                              </p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center border border-gray-200">
                              {promo.discountType === 'percentage' ? (
                                <Percent
                                  className="h-4 w-4 text-gray-400"
                                  strokeWidth={1.5}
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">
                                  ₱
                                </span>
                              )}
                            </div>
                          </div>

                          {promo.description && (
                            <p className="mb-5 line-clamp-2 text-sm text-gray-500">
                              {promo.description}
                            </p>
                          )}

                          {/* Code */}
                          <div className="mb-5 border-t border-dashed border-gray-200 pt-4">
                            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                              Code
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono text-base font-bold tracking-[0.15em] text-gray-900">
                                {promo.code}
                              </p>
                              <button
                                onClick={() => copyPromo(promo.code)}
                                className={`flex items-center gap-1 border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest transition-colors ${
                                  copiedCode === promo.code
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                                }`}
                              >
                                {copiedCode === promo.code ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                            {promo.minPurchase > 0 && (
                              <span>
                                Min ₱{promo.minPurchase.toLocaleString()}
                              </span>
                            )}
                            {promo.expiresAt ? (
                              <span>
                                Exp {formatShortDate(promo.expiresAt)}
                              </span>
                            ) : (
                              <span className="text-emerald-600">
                                No Expiry
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === ORDERS === */}
              {activeTab === 'orders' && (
                <div>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="border border-dashed border-gray-200 bg-white py-20 text-center">
                      <Package
                        className="mx-auto mb-3 h-8 w-8 text-gray-200"
                        strokeWidth={1}
                      />
                      <p className="font-serif text-lg text-gray-900">
                        No orders yet
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                        Start shopping to see your orders here
                      </p>
                      <Link
                        href="/flowers"
                        className="mt-6 inline-flex items-center gap-2 bg-gray-900 px-6 py-3 text-[10px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
                      >
                        Browse Flowers
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border-y border-gray-100">
                      {orders.map((order) => {
                        const sc =
                          statusStyles[order.status] || statusStyles.Pending;
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-gray-50/60"
                          >
                            <div className="flex items-center gap-5">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-gray-200 bg-white">
                                <Package
                                  className="h-5 w-5 text-gray-400"
                                  strokeWidth={1.5}
                                />
                              </div>
                              <div>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="mt-1 font-serif text-base text-gray-900">
                                  {order.items?.length || 0}{' '}
                                  {order.items?.length === 1 ? 'item' : 'items'}
                                </p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest ${sc.text}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}
                                />
                                {order.status}
                              </span>
                              <span className="font-serif text-lg text-gray-900">
                                ₱{order.total?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* === MESSAGES === */}
              {activeTab === 'messages' && (
                <div>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="border border-dashed border-gray-200 bg-white py-20 text-center">
                      <MessageSquare
                        className="mx-auto mb-3 h-8 w-8 text-gray-200"
                        strokeWidth={1}
                      />
                      <p className="font-serif text-lg text-gray-900">
                        No messages yet
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                        Need help? Reach out and we&apos;ll reply here
                      </p>
                      <Link
                        href="/contact"
                        className="mt-6 inline-flex items-center gap-2 border border-gray-300 bg-white px-6 py-3 text-[10px] font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Contact Support
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border-y border-gray-100">
                      {messages.map((msg) => {
                        const isExpanded = expandedMessage === msg.id;
                        const hasReplies = (msg.replies?.length || 0) > 0;
                        const hasAdminReply = msg.replies?.some(
                          (r) => r.from === 'admin'
                        );

                        return (
                          <div key={msg.id}>
                            <div
                              className="flex cursor-pointer items-start justify-between gap-3 py-5 transition-colors hover:bg-gray-50/60"
                              onClick={() =>
                                setExpandedMessage(isExpanded ? null : msg.id)
                              }
                            >
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-3">
                                  <p className="font-serif text-base text-gray-900">
                                    Your message
                                  </p>
                                  {hasAdminReply && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-emerald-600">
                                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                      Replied
                                    </span>
                                  )}
                                </div>
                                <p className="line-clamp-1 text-sm text-gray-500">
                                  {msg.message}
                                </p>
                                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                                  {formatDate(msg.createdAt)}
                                </p>
                              </div>
                              <button className="text-gray-400">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                                ) : (
                                  <ChevronDown
                                    className="h-4 w-4"
                                    strokeWidth={1.5}
                                  />
                                )}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="space-y-5 border-t border-gray-100 bg-gray-50/40 py-6">
                                {/* Original */}
                                <div className="flex gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-medium text-white">
                                    {initials}
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-1.5 flex items-center gap-2">
                                      <p className="text-xs font-medium text-gray-900">
                                        You
                                      </p>
                                      <span className="text-[10px] text-gray-400">
                                        {formatDate(msg.createdAt)}
                                      </span>
                                    </div>
                                    <div className="inline-block border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700">
                                      {msg.message}
                                    </div>
                                  </div>
                                </div>

                                {/* Replies */}
                                {hasReplies &&
                                  msg.replies!.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className={`flex gap-3 ${
                                        reply.from === 'admin'
                                          ? ''
                                          : 'flex-row-reverse'
                                      }`}
                                    >
                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white ${
                                          reply.from === 'admin'
                                            ? 'bg-gray-600'
                                            : 'bg-gray-900'
                                        }`}
                                      >
                                        {reply.from === 'admin'
                                          ? 'S'
                                          : initials}
                                      </div>
                                      <div
                                        className={`flex-1 ${
                                          reply.from === 'customer'
                                            ? 'text-right'
                                            : ''
                                        }`}
                                      >
                                        <div
                                          className={`mb-1.5 flex items-center gap-2 ${
                                            reply.from === 'customer'
                                              ? 'justify-end'
                                              : ''
                                          }`}
                                        >
                                          <p className="text-xs font-medium text-gray-900">
                                            {reply.fromName}
                                          </p>
                                          <span className="text-[10px] text-gray-400">
                                            {formatDate(reply.createdAt)}
                                          </span>
                                        </div>
                                        <div
                                          className={`inline-block max-w-full px-4 py-2.5 text-left text-sm ${
                                            reply.from === 'admin'
                                              ? 'bg-gray-900 text-white'
                                              : 'border border-gray-200 bg-white text-gray-700'
                                          }`}
                                        >
                                          {reply.message}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                {/* Reply input */}
                                {replyingTo === msg.id ? (
                                  <div className="border-t border-gray-200 pt-5">
                                    <div className="flex gap-2">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) =>
                                          setReplyText(e.target.value)
                                        }
                                        placeholder="Type your reply..."
                                        rows={2}
                                        disabled={sending}
                                        className="flex-1 resize-none border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-gray-900"
                                      />
                                      <button
                                        onClick={() => handleReply(msg.id)}
                                        disabled={sending || !replyText.trim()}
                                        className="flex w-11 items-center justify-center bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                                      >
                                        {sending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Send
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                          />
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText('');
                                      }}
                                      className="mt-3 text-[10px] font-medium uppercase tracking-widest text-gray-400 hover:text-gray-900"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setReplyingTo(msg.id)}
                                    className="text-[10px] font-medium uppercase tracking-widest text-gray-500 hover:text-gray-900"
                                  >
                                    Send Another Reply
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== Edit Profile Modal ===== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-gray-200 bg-white shadow-2xl">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl text-gray-900">
                  Edit Profile
                </h2>
                <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                  Update your personal information
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 transition-colors hover:text-gray-900"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full cursor-not-allowed border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
                />
                <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="Juan Dela Cruz"
                  disabled={savingProfile}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="09171234567"
                  disabled={savingProfile}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                  Delivery Address
                </label>
                <textarea
                  rows={3}
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="w-full resize-none border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="123 Rizal St, Manila, Philippines"
                  disabled={savingProfile}
                />
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={savingProfile}
                  className="flex-1 border border-gray-300 bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex flex-1 items-center justify-center gap-2 bg-gray-900 px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}