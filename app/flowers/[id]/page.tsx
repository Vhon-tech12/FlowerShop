'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Minus,
  Plus,
  Loader2,
  Check,
  Truck,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { Flower } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useCartDrawer } from '@/lib/cart-drawer-context';
import { useToast } from '@/lib/toast-context';

export default function FlowerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { addToCart } = useCart();
  const { openDrawer } = useCartDrawer();
  const { showToast } = useToast();

  const [flower, setFlower] = useState<Flower | null>(null);
  const [related, setRelated] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchFlower() {
      if (!id) return;
      try {
        const docRef = doc(db, 'flowers', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const flowerData = { id: docSnap.id, ...docSnap.data() } as Flower;
          setFlower(flowerData);

          // Fetch related (same category)
          const allSnap = await getDocs(collection(db, 'flowers'));
          const all = allSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Flower[];
          const relatedData = all
            .filter(
              (f) => f.category === flowerData.category && f.id !== flowerData.id
            )
            .slice(0, 4);
          setRelated(relatedData);
        }
      } catch (err) {
        console.error('Error fetching flower:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlower();
  }, [id]);

  const handleAddToCart = () => {
    if (!flower) return;

    // ✅ FIXED: Pass the whole Flower object
    addToCart(flower, quantity);

    // 🎉 Toast
    showToast({
      message: 'Added to cart',
      description: `${quantity}x ${flower.name} • ₱${(
        flower.price * quantity
      ).toLocaleString()}`,
      type: 'success',
    });

    // 🛒 Auto-open the slide-in cart drawer
    openDrawer();

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </main>
      </div>
    );
  }

  // ============ NOT FOUND ============
  if (!flower) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <p className="mb-3 font-serif text-3xl text-gray-900">
              Flower not found
            </p>
            <p className="mb-8 text-sm text-gray-500">
              The flower you&apos;re looking for doesn&apos;t exist anymore.
            </p>
            <Link
              href="/flowers"
              className="inline-flex items-center gap-2 bg-gray-900 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Flowers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const total = flower.price * quantity;
  const isOutOfStock = flower.stock === 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
          
          {/* BACK LINK */}
          <Link
            href="/flowers"
            className="mb-12 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Flowers
          </Link>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
            
            {/* IMAGE */}
            <div className="relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
                <img
                  src={flower.imageUrl}
                  alt={flower.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute left-4 top-4 bg-white/90 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-700 backdrop-blur">
                {flower.category}
              </span>
            </div>

            {/* DETAILS */}
            <div className="flex flex-col lg:py-6">
              
              {/* Name */}
              <h1 className="mb-4 font-serif text-4xl text-gray-900 md:text-5xl">
                {flower.name}
              </h1>

              {/* Price */}
              <p className="mb-8 font-serif text-2xl text-gray-900 md:text-3xl">
                ₱{flower.price.toLocaleString()}
              </p>

              {/* Description */}
              <p className="mb-10 text-sm leading-relaxed text-gray-600 md:text-base">
                {flower.description}
              </p>

              {/* Stock Status */}
              <div className="mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                <span
                  className={`flex h-1.5 w-1.5 rounded-full ${
                    isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-gray-500">
                  {isOutOfStock
                    ? 'Out of Stock'
                    : `In Stock — ${flower.stock} available`}
                </span>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="mb-3 block text-xs font-medium uppercase tracking-widest text-gray-500">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock}
                    className="flex h-11 w-11 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-serif text-xl text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(flower.stock, q + 1))
                    }
                    disabled={isOutOfStock || quantity >= flower.stock}
                    className="flex h-11 w-11 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="mb-8 flex items-baseline justify-between border-t border-b border-gray-100 py-5">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-500">
                  Total
                </span>
                <span className="font-serif text-3xl text-gray-900">
                  ₱{total.toLocaleString()}
                </span>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`group mb-10 flex w-full items-center justify-center gap-2 px-6 py-5 text-xs font-medium uppercase tracking-widest text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 ${
                  added ? 'bg-emerald-600' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added to Cart
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>

              {/* Features */}
              <div className="grid grid-cols-3 gap-6 border-t border-gray-100 pt-8">
                <div className="flex flex-col items-center text-center">
                  <Truck className="mb-3 h-5 w-5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                    Same-day Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck
                    className="mb-3 h-5 w-5 text-gray-400"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                    Fresh Guarantee
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Package
                    className="mb-3 h-5 w-5 text-gray-400"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                    Care Instructions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RELATED PRODUCTS */}
          {related.length > 0 && (
            <section className="mt-28">
              <div className="mb-12 text-center">
                <h2 className="mb-3 font-serif text-3xl text-gray-900">
                  You May Also Like
                </h2>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                  Curated picks from the same collection
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
                {related.map((f) => (
                  <Link
                    key={f.id}
                    href={`/flowers/${f.id}`}
                    className="group flex flex-col"
                  >
                    <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden bg-gray-50">
                      <img
                        src={f.imageUrl}
                        alt={f.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif text-base text-gray-900 transition-colors group-hover:text-pink-600">
                        {f.name}
                      </h3>
                      <span className="text-sm text-gray-600">
                        ₱{f.price.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-24 border-t border-gray-100 bg-[#F4F4F4]">
        <div className="container mx-auto px-4 py-8 text-center md:px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            © 2026 Flowery. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}