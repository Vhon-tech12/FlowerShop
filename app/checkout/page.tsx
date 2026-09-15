'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Tag,
  ShoppingBag,
  FileText,
  Truck,
  Shield,
  Upload,
  X,
  Image as ImageIcon,
  Star,
  MessageSquareHeart,
} from 'lucide-react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
} from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';

// 🔥 Compress + return base64
async function compressToBase64(
  file: File,
  maxWidth = 800,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
  });
}

// 🔥 Simple sentiment detection base sa rating + keywords
function detectSentiment(rating: number, comment: string): string {
  const text = comment.toLowerCase();
  const positiveWords = [
    'maganda', 'ganda', 'salamat', 'thank', 'love', 'nice', 'beautiful',
    'excellent', 'perfect', 'great', 'amazing', 'fresh', 'masaya', 'happy',
    'sulit', 'worth', 'recommend', 'best',
  ];
  const negativeWords = [
    'pangit', 'lanta', 'withered', 'bad', 'terrible', 'awful', 'late',
    'delay', 'sira', 'damage', 'worst', 'disappointed', 'masama', 'refund',
  ];

  let score = 0;
  positiveWords.forEach((w) => {
    if (text.includes(w)) score += 1;
  });
  negativeWords.forEach((w) => {
    if (text.includes(w)) score -= 1;
  });

  if (rating >= 4) score += 1;
  if (rating <= 2) score -= 1;

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { cart, subtotal, clearCart, appliedPromo, removePromo } = useCart();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'cod',
  });

  // Base64 data URL for receipt
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');

  // ⭐ Review / Sentiment state
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userData) {
      setForm((prev) => ({
        ...prev,
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
      }));
    }
  }, [userData]);

  const discountAmount = appliedPromo?.discountAmount || 0;
  const shipping = subtotal > 0 ? 150 : 0;
  const total = Math.max(subtotal - discountAmount + shipping, 0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ message: 'Please upload an image file.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: 'Image must be under 5 MB.', type: 'error' });
      return;
    }

    try {
      const base64 = await compressToBase64(file);
      setReceiptDataUrl(base64);
      setReceiptName(file.name);
    } catch (err: any) {
      showToast({
        message: 'Failed to process image.',
        description: err.message,
        type: 'error',
      });
    }
  };

  const clearReceipt = () => {
    setReceiptDataUrl('');
    setReceiptName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      showToast({ message: 'Your cart is empty.', type: 'error' });
      return;
    }

    if (form.paymentMethod === 'online' && !receiptDataUrl) {
      showToast({
        message: 'Please upload your payment screenshot.',
        description: 'Attach a screenshot of your GCash / Maya / bank transfer.',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        userId: user.uid,
        customerName: form.name,
        contactNumber: form.phone,
        address: form.address,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        paymentReceiptUrl:
          form.paymentMethod === 'online' ? receiptDataUrl : null,
        paymentStatus:
          form.paymentMethod === 'online' ? 'Awaiting Verification' : 'N/A',
        items: cart.map((item) => ({
          flowerId: item.flowerId,
          flowerName: item.flowerName,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        })),
        subtotal,
        discount: discountAmount,
        promoCode: appliedPromo?.code || null,
        shipping,
        total,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      if (appliedPromo) {
        const promoCode = appliedPromo.code;
        (async () => {
          try {
            const promoQ = query(
              collection(db, 'promoCodes'),
              where('code', '==', promoCode)
            );
            const promoSnap = await getDocs(promoQ);
            if (!promoSnap.empty) {
              await updateDoc(doc(db, 'promoCodes', promoSnap.docs[0].id), {
                usedCount: increment(1),
              });
            }
          } catch (promoErr) {
            console.warn('Could not increment promo count:', promoErr);
          }
        })();
      }

      setOrderId(docRef.id);
      clearCart();
      removePromo();
      setSubmitted(true);

      showToast({
        message:
          form.paymentMethod === 'online'
            ? '🌸 Order submitted! Awaiting payment verification.'
            : '🌸 Order placed successfully!',
        description:
          form.paymentMethod === 'online'
            ? 'We will verify your screenshot and confirm shortly.'
            : 'We will contact you shortly to confirm.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Order failed:', err);
      showToast({
        message: 'Failed to place order.',
        description: err.message || 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Submit Review → save to `testimonials` collection (matches admin page)
  const handleSubmitReview = async () => {
    if (!user) return;

    if (reviewRating === 0) {
      showToast({
        message: 'Please select a star rating.',
        type: 'error',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const sentiment = detectSentiment(reviewRating, reviewComment);

      // Build avatar initials (e.g., "Juan Dela Cruz" → "JD")
      const displayName =
        form.name || userData?.name || user.email?.split('@')[0] || 'Customer';
      const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      // Extract location from address (2nd to the last part — usually city)
      const addressParts = (form.address || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const location =
        addressParts.length >= 2
          ? addressParts[addressParts.length - 2]
          : addressParts[0] || 'Philippines';

      await addDoc(collection(db, 'testimonials'), {
        userId: user.uid,
        name: displayName,
        location: location,
        rating: reviewRating,
        text: reviewComment.trim(),
        avatar: initials,
        approved: false, // admin must approve before showing on homepage
        // extra info (optional — admin page ignores unknown fields)
        orderId,
        email: user.email || null,
        sentiment,
        createdAt: new Date().toISOString(),
      });

      setReviewSubmitted(true);

      showToast({
        message: '💐 Thank you for your feedback!',
        description:
          sentiment === 'positive'
            ? "We're so happy you loved it!"
            : sentiment === 'negative'
            ? "Sorry about that — we'll do better next time."
            : 'We appreciate your review! It will appear once approved.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Review failed:', err);
      showToast({
        message: 'Failed to submit review.',
        description: err.message || 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    const sentimentPreview =
      reviewRating > 0
        ? detectSentiment(reviewRating, reviewComment)
        : null;

    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-24">
          <div className="w-full max-w-lg border border-gray-200 bg-white p-8 text-center shadow-sm md:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200">
              <CheckCircle className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
            </div>
            <h1 className="mb-3 font-serif text-3xl text-gray-900">
              Order Placed!
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-gray-500">
              {form.paymentMethod === 'online'
                ? 'Your screenshot has been submitted. We will verify the payment and confirm your order shortly.'
                : "Thank you! We'll contact you shortly to confirm your order."}
            </p>

            <div className="mb-8 border border-dashed border-gray-300 bg-[#FDFBF7] p-5">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                Order Reference
              </p>
              <p className="font-mono text-xl font-bold text-gray-900">
                #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* ⭐⭐ REVIEW / SENTIMENT SECTION ⭐⭐ */}
            {!reviewSubmitted ? (
              <div className="mb-8 border-t border-gray-100 pt-8 text-left">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-pink-50">
                    <MessageSquareHeart
                      className="h-5 w-5 text-pink-500"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h2 className="font-serif text-xl text-gray-900">
                    How was your experience?
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Your feedback helps us improve our blooms 💐
                  </p>
                </div>

                {/* Star Rating */}
                <div className="mb-5 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || reviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>

                {reviewRating > 0 && (
                  <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-gray-500">
                    {reviewRating === 5 && 'Excellent! 🌟'}
                    {reviewRating === 4 && 'Very Good 😊'}
                    {reviewRating === 3 && 'Good 🙂'}
                    {reviewRating === 2 && 'Fair 😕'}
                    {reviewRating === 1 && 'Poor 😞'}
                  </p>
                )}

                {/* Comment */}
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="mb-4 w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
                  placeholder="Tell us about your experience (optional)..."
                />

                {/* Live sentiment preview */}
                {sentimentPreview && (
                  <p className="mb-4 text-center text-xs text-gray-400">
                    Detected mood:{' '}
                    <span
                      className={
                        sentimentPreview === 'positive'
                          ? 'font-medium text-emerald-600'
                          : sentimentPreview === 'negative'
                          ? 'font-medium text-rose-500'
                          : 'font-medium text-gray-500'
                      }
                    >
                      {sentimentPreview}
                    </span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewRating === 0}
                  className="flex w-full items-center justify-center gap-2 bg-gray-900 px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Review
                      <Star className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReviewSubmitted(true)}
                  className="mt-3 w-full text-center text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600"
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <div className="mb-8 border-t border-gray-100 pt-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-pink-100 bg-pink-50">
                  <MessageSquareHeart
                    className="h-6 w-6 text-pink-500"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Thank you for your feedback!
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Your review means the world to us 🌸
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/account"
                className="flex items-center justify-center gap-2 bg-gray-900 px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
              >
                <ShoppingBag className="h-4 w-4" />
                View My Orders
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center border border-gray-300 px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-white">
              <ShoppingBag className="h-8 w-8 text-gray-400" strokeWidth={1} />
            </div>
            <h1 className="mb-2 font-serif text-2xl text-gray-900">
              Your cart is empty
            </h1>
            <p className="mb-8 text-sm text-gray-500">
              Add some flowers before checking out.
            </p>
            <Link
              href="/flowers"
              className="inline-flex items-center gap-2 bg-gray-900 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
            >
              Browse Flowers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:px-8 md:py-24">
          
          {/* PAGE HEADER */}
          <div className="mb-16">
            <Link
              href="/cart"
              className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="mb-3 font-serif text-4xl text-gray-900 md:text-5xl">
              Complete Your Order
            </h1>
            <p className="text-sm tracking-widest text-gray-500 uppercase">
              Fill in your delivery details to place your order
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-12 lg:grid-cols-3"
          >
            <div className="space-y-12 lg:col-span-2">
              
              {/* Delivery Information */}
              <div className="border border-gray-200 bg-white p-6 md:p-10">
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <h2 className="font-serif text-2xl text-gray-900">
                    Delivery Information
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Where should we deliver your flowers?
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
                        placeholder="09171234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                      Delivery Address *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
                      placeholder="123 Rizal St, Manila, Philippines"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                      Order Notes <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
                      placeholder="Special instructions, message on card, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border border-gray-200 bg-white p-6 md:p-10">
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <h2 className="font-serif text-2xl text-gray-900">
                    Payment Method
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    How would you like to pay?
                  </p>
                </div>

                <div className="space-y-4">
                  <label
                    className={`flex cursor-pointer items-center gap-4 border p-5 transition-all ${
                      form.paymentMethod === 'cod'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={form.paymentMethod === 'cod'}
                      onChange={(e) =>
                        setForm({ ...form, paymentMethod: e.target.value })
                      }
                      className="h-4 w-4 accent-gray-900"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Cash on Delivery
                      </p>
                      <p className="text-xs text-gray-500">
                        Pay when your order arrives
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-4 border p-5 transition-all ${
                      form.paymentMethod === 'online'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={form.paymentMethod === 'online'}
                      onChange={(e) => {
                        setForm({ ...form, paymentMethod: e.target.value });
                      }}
                      className="h-4 w-4 accent-gray-900"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Online Payment
                      </p>
                      <p className="text-xs text-gray-500">
                        GCash · Maya · Bank Transfer — upload screenshot
                      </p>
                    </div>
                  </label>

                  {form.paymentMethod === 'online' && (
                    <div className="mt-4 space-y-6 border border-dashed border-gray-300 bg-[#FDFBF7] p-6">
                      <div className="text-sm text-gray-600">
                        <p className="mb-2 font-medium text-gray-900">
                          Send payment to:
                        </p>
                        <p>
                          <span className="font-medium">GCash:</span>{' '}
                          0917-XXXX-XXX (Juan Dela Cruz)
                        </p>
                        <p>
                          <span className="font-medium">Maya:</span>{' '}
                          0917-XXXX-XXX (Juan Dela Cruz)
                        </p>
                        <p className="mt-3 text-xs text-gray-500">
                          After sending, upload a screenshot of your receipt
                          below. We&apos;ll verify it and confirm your order.
                        </p>
                      </div>

                      <div>
                        <label className="mb-3 block text-xs font-medium uppercase tracking-widest text-gray-500">
                          Payment Screenshot *
                        </label>

                        {receiptDataUrl ? (
                          <div className="relative overflow-hidden border border-gray-200 bg-white">
                            <img
                              src={receiptDataUrl}
                              alt="Receipt preview"
                              className="max-h-64 w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={clearReceipt}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/60 text-white transition-colors hover:bg-black/80"
                              aria-label="Remove receipt"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span className="truncate">{receiptName}</span>
                            </div>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-gray-300 bg-white px-4 py-10 text-center transition-colors hover:border-gray-900 hover:bg-gray-50">
                            <Upload className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                            <span className="text-sm font-medium text-gray-700">
                              Click to upload screenshot
                            </span>
                            <span className="text-xs text-gray-500">
                              PNG, JPG — max 5 MB
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 border border-gray-200 bg-white p-6 md:p-8">
                <h2 className="mb-8 border-b border-gray-100 pb-6 font-serif text-2xl text-gray-900">
                  Order Summary
                </h2>

                <div className="mb-6 max-h-64 space-y-4 overflow-y-auto border-b border-gray-100 pb-6">
                  {cart.map((item) => (
                    <div
                      key={item.flowerId}
                      className="flex items-center gap-4"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-gray-50">
                        <img
                          src={item.imageUrl}
                          alt={item.flowerName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base text-gray-900">
                          {item.flowerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × ₱{item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-b border-gray-100 pb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₱{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <Tag className="h-3.5 w-3.5" />
                        Discount ({appliedPromo.code})
                      </span>
                      <span className="font-medium text-emerald-700">
                        −₱{discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping Fee</span>
                    <span
                      className={`font-medium ${
                        shipping === 0 ? 'text-emerald-600' : 'text-gray-900'
                      }`}
                    >
                      {shipping === 0 ? 'FREE' : `₱${shipping.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="my-6 flex items-baseline justify-between">
                  <span className="font-serif text-xl text-gray-900">
                    Total
                  </span>
                  <span className="font-serif text-3xl text-pink-600">
                    ₱{total.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 bg-gray-900 px-4 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-widest">Secure Checkout</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
