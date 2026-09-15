'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCartDrawer } from '@/lib/cart-drawer-context';

export function CartDrawer() {
  const router = useRouter();
  const { isOpen, closeDrawer } = useCartDrawer();
  const { cart, updateQuantity, removeFromCart, subtotal, appliedPromo } =
    useCart();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = appliedPromo?.discountAmount || 0;
  const shipping = subtotal > 0 ? 150 : 0;
  const total = Math.max(subtotal - discountAmount + shipping, 0);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeDrawer]);

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    router.push('/cart');
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* DRAWER */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-gray-900">Your Cart</h2>
            {totalItems > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-medium text-white">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* CONTENT */}
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200">
              <ShoppingBag className="h-8 w-8 text-gray-300" strokeWidth={1} />
            </div>
            <p className="mb-2 font-serif text-xl text-gray-900">
              Your cart is empty
            </p>
            <p className="mb-8 text-sm text-gray-500">
              Add some beautiful blooms to get started.
            </p>
            <button
              onClick={closeDrawer}
              className="bg-gray-900 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* ITEMS LIST */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="space-y-6">
                {cart.map((item, index) => (
                  // ✅ COMPOSITE KEY: fallback to index if flowerId is missing/duplicate
                  <li
                    key={`${item.flowerId ?? 'item'}-${index}`}
                    className="flex gap-4"
                  >
                    <Link
                      href={`/flowers/${item.flowerId}`}
                      onClick={closeDrawer}
                      className="relative h-24 w-20 shrink-0 overflow-hidden bg-gray-50"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.flowerName}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/flowers/${item.flowerId}`}
                            onClick={closeDrawer}
                            className="block truncate font-serif text-base text-gray-900 hover:text-pink-600"
                          >
                            {item.flowerName}
                          </Link>
                          <p className="mt-1 text-xs text-gray-500">
                            ₱{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.flowerId)}
                          className="shrink-0 text-gray-300 transition-colors hover:text-red-500"
                          aria-label={`Remove ${item.flowerName}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-9 items-center border border-gray-200">
                          <button
                            onClick={() =>
                              updateQuantity(item.flowerId, item.quantity - 1)
                            }
                            className="flex h-full w-9 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex w-9 items-center justify-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.flowerId, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className="flex h-full w-9 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="font-serif text-base text-gray-900">
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-100 bg-white px-6 py-6">
              <div className="mb-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ₱{subtotal.toLocaleString()}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <Tag className="h-3.5 w-3.5" />
                      Discount ({appliedPromo.code})
                    </span>
                    <span className="font-medium text-emerald-700">
                      −₱{discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-xs italic text-gray-400">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="mb-5 flex items-baseline justify-between border-t border-gray-100 pt-5">
                <span className="font-serif text-lg text-gray-900">Total</span>
                <span className="font-serif text-2xl text-gray-900">
                  ₱{total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="group flex w-full items-center justify-center gap-2 bg-gray-900 px-6 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleViewCart}
                className="mt-3 w-full border border-gray-300 bg-transparent px-6 py-3.5 text-xs font-medium uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-50"
              >
                View Full Cart
              </button>

              <button
                onClick={closeDrawer}
                className="mt-3 w-full text-center text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}