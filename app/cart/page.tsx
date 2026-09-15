'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Minus,
  Plus,
  Loader2,
  Tag,
  Check,
  X,
  Flower2,
  ArrowRight,
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { db } from '@/lib/firebase';

const footerLinks = {
  customerService: [
    { label: 'Help & Contact Us', href: '/contact' },
    { label: 'Return Refunds', href: '/refunds' },
    { label: 'Online Store', href: '/flowers' },
    { label: 'Terms & Condition', href: '/terms' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Order Tracking', href: '/tracking' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Login', href: '/login' },
  ],
  socialMedia: [
    { label: 'Twitter', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'Pinterest', href: '#' },
  ],
};

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    appliedPromo,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Discount computation
  const discountAmount = appliedPromo?.discountAmount || 0;
  const shipping = subtotal > 0 ? 150 : 0;
  const total = Math.max(subtotal - discountAmount + shipping, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  // ============================================
  // APPLY PROMO CODE
  // ============================================
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      showToast({ message: 'Please enter a promo code.', type: 'error' });
      return;
    }

    setApplyingPromo(true);

    try {
      const q = query(
        collection(db, 'promoCodes'),
        where('code', '==', code)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showToast({
          message: '❌ Invalid promo code',
          description: 'This code does not exist.',
          type: 'error',
        });
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promo = {
        id: promoDoc.id,
        ...promoDoc.data(),
      } as any;

      // Validation checks
      if (!promo.active) {
        showToast({
          message: '❌ Promo code inactive',
          description: 'This code is no longer available.',
          type: 'error',
        });
        return;
      }

      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        showToast({
          message: '❌ Promo code expired',
          description: 'This code has already expired.',
          type: 'error',
        });
        return;
      }

      if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
        showToast({
          message: '❌ Promo code maxed out',
          description: 'This code has reached its usage limit.',
          type: 'error',
        });
        return;
      }

      if (promo.minPurchase > 0 && subtotal < promo.minPurchase) {
        showToast({
          message: '❌ Minimum purchase not met',
          description: `Requires minimum purchase of ₱${promo.minPurchase.toLocaleString()}.`,
          type: 'error',
        });
        return;
      }

      // Compute discount
      let discountAmount = 0;
      if (promo.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * promo.discountValue) / 100);
      } else {
        discountAmount = promo.discountValue;
      }

      // Cap discount at subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      applyPromo({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount,
      });

      setPromoInput('');

      showToast({
        message: '🎉 Promo applied!',
        description:
          promo.discountType === 'percentage'
            ? `${promo.discountValue}% discount (₱${discountAmount.toLocaleString()} off)`
            : `₱${discountAmount.toLocaleString()} discount applied`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to apply promo:', err);
      showToast({
        message: 'Failed to apply promo code.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    removePromo();
    showToast({
      message: 'Promo code removed.',
      type: 'info',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
      <Navbar />

      <main className="flex-1">
        {/* PAGE HEADER */}
        <section className="relative flex flex-col items-center justify-center py-16 md:py-24">
          <div className="mb-4 text-pink-300">
            <Flower2 className="h-8 w-8" strokeWidth={1} />
          </div>
          <h1 className="mb-3 font-serif text-4xl font-normal tracking-wide text-gray-900 md:text-5xl">
            Cart
          </h1>
          <p className="text-sm tracking-widest text-gray-500 uppercase">
            Where flowers are our inspiration
          </p>
        </section>

        {/* CART CONTENT */}
        <section className="container mx-auto px-4 pb-24 md:px-8">
          {cart.length === 0 ? (
            /* EMPTY STATE */
            <div className="mx-auto max-w-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
              <p className="mb-6 font-serif text-2xl text-gray-900">
                Your cart is currently empty.
              </p>
              <Link
                href="/flowers"
                className="inline-flex items-center gap-2 bg-gray-900 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl">
              {/* TABLE HEADER */}
              <div className="mb-4 hidden grid-cols-12 gap-4 border-b border-gray-200 pb-4 text-xs font-medium tracking-widest text-gray-400 uppercase md:grid">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">SubTotal</div>
              </div>

              {/* CART ITEMS */}
              <div className="mb-12">
                {cart.map((item) => (
                  <div
                    key={item.flowerId}
                    className="grid grid-cols-1 items-center gap-4 border-b border-gray-100 py-6 md:grid-cols-12"
                  >
                    {/* Product Info */}
                    <div className="col-span-1 flex items-center gap-6 md:col-span-6">
                      <div className="h-24 w-24 shrink-0 overflow-hidden bg-gray-50">
                        <img
                          src={item.imageUrl}
                          alt={item.flowerName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <Link href={`/flowers/${item.flowerId}`}>
                          <h3 className="mb-1 font-serif text-lg text-gray-900 transition-colors hover:text-pink-600">
                            {item.flowerName}
                          </h3>
                        </Link>
                        {item.stock <= 5 && item.stock > 0 && (
                          <p className="text-xs text-amber-600">
                            Only {item.stock} left in stock
                          </p>
                        )}
                        <button
                          onClick={() => removeFromCart(item.flowerId)}
                          className="mt-2 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 text-left md:col-span-2 md:text-center">
                      <span className="text-sm text-gray-500 md:hidden">Price: </span>
                      <span className="text-sm text-gray-600">
                        ₱{item.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 flex items-center md:col-span-2 md:justify-center">
                      <div className="flex h-10 items-center border border-gray-200 bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.flowerId, item.quantity - 1)
                          }
                          className="flex h-full w-10 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex w-10 items-center justify-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.flowerId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="flex h-full w-10 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-1 text-left md:col-span-2 md:text-right">
                      <span className="text-sm text-gray-500 md:hidden">Subtotal: </span>
                      <span className="font-serif text-lg text-gray-900">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CART TOTALS & ACTIONS */}
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                
                {/* Left Side: Promo Code */}
                <div className="flex flex-col justify-end">
                  <div className="mb-6">
                    <h3 className="mb-4 font-serif text-xl text-gray-900">
                      Have a promo code?
                    </h3>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="font-mono text-sm font-bold text-emerald-800">
                              {appliedPromo.code}
                            </p>
                            <p className="text-xs text-emerald-600">
                              {appliedPromo.discountType === 'percentage'
                                ? `${appliedPromo.discountValue}% OFF`
                                : `₱${appliedPromo.discountValue.toLocaleString()} OFF`}{' '}
                              (−₱{discountAmount.toLocaleString()})
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-emerald-600 transition-colors hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ENTER CODE"
                          value={promoInput}
                          onChange={(e) =>
                            setPromoInput(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyPromo();
                          }}
                          disabled={applyingPromo}
                          className="flex-1 border border-gray-200 bg-white px-4 py-3 font-mono text-sm uppercase outline-none transition-colors focus:border-gray-900 disabled:opacity-50"
                          maxLength={20}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={applyingPromo || !promoInput.trim()}
                          className="flex items-center justify-center bg-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {applyingPromo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Totals */}
                <div>
                  <div className="mb-6 space-y-4 border-b border-gray-200 pb-6">
                    <div className="flex justify-between text-sm">
                      <span className="tracking-widest text-gray-500 uppercase">
                        SubTotal
                      </span>
                      <span className="font-medium text-gray-900">
                        ₱{subtotal.toLocaleString()}
                      </span>
                    </div>
                    
                    {appliedPromo && (
                      <div className="flex justify-between text-sm">
                        <span className="tracking-widest text-emerald-600 uppercase">
                          Discount
                        </span>
                        <span className="font-medium text-emerald-600">
                          −₱{discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="tracking-widest text-gray-500 uppercase">
                        Shipping
                      </span>
                      <span className="text-gray-500 italic">
                        {shipping === 0 
                          ? 'Free Shipping' 
                          : 'Enter your address to view shipping options.'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-8 flex items-baseline justify-between">
                    <span className="font-serif text-2xl text-gray-900">
                      Total
                    </span>
                    <span className="font-serif text-3xl text-pink-600">
                      ₱{total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center gap-2 bg-gray-900 px-8 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
                  >
                    {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  
                  <div className="mt-4 text-center">
                    <Link
                      href="/flowers"
                      className="text-xs tracking-widest text-gray-500 uppercase transition-colors hover:text-gray-900"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER - Matching the Mockup exactly */}
      <footer className="bg-[#F4F4F4] pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            
            {/* Column 1: Customer Service */}
            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Customer Service
              </h3>
              <ul className="space-y-3">
                {footerLinks.customerService.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Social Media */}
            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Social Media
              </h3>
              <ul className="space-y-3">
                {footerLinks.socialMedia.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-16 border-t border-gray-200 pt-8 text-center">
            <p className="text-xs text-gray-400">
              Copyright © 2026. All rights reserved. Powered by Flowery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}