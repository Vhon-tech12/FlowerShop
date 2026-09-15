'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Flower2, ShoppingBag } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { Flower } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useCartDrawer } from '@/lib/cart-drawer-context';

// Footer data
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

export default function FlowersPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const { addToCart } = useCart();
  const { openDrawer } = useCartDrawer();

  useEffect(() => {
    async function fetchFlowers() {
      try {
        const snapshot = await getDocs(collection(db, 'flowers'));
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
    }
    fetchFlowers();
  }, []);

  const categories = [
    'All',
    ...Array.from(new Set(flowers.map((f) => f.category))),
  ];

  const filtered = flowers.filter((flower) => {
    const matchSearch = flower.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory = category === 'All' || flower.category === category;
    return matchSearch && matchCategory;
  });

  // 🔥 NEW: Handle Add to Cart + Open Drawer
  const handleAddToCart = (flower: Flower, e: React.MouseEvent) => {
    e.preventDefault(); // wag mag-navigate sa product page
    e.stopPropagation();
    addToCart(flower);
    openDrawer();
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
            Our Flowers
          </h1>
          <p className="text-sm tracking-widest text-gray-500 uppercase">
            Browse our fresh selection of beautiful blooms
          </p>
        </section>

        {/* FILTERS & SEARCH */}
        <section className="container mx-auto px-4 md:px-8">
          <div className="mb-12 flex flex-col items-center justify-between gap-6 border-b border-gray-200 pb-6 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 md:justify-start">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-medium uppercase tracking-widest transition-colors ${
                    category === cat
                      ? 'text-gray-900'
                      : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flowers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-b border-transparent bg-transparent py-1 pl-6 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900"
              />
            </div>
          </div>

          {/* RESULTS */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 lg:gap-x-8">
                  {filtered.map((flower) => (
                    <Link
                      key={flower.id}
                      href={`/flowers/${flower.id}`}
                      className="group flex flex-col"
                    >
                      {/* IMAGE with Hover Add-to-Cart */}
                      <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden bg-gray-50">
                        <img
                          src={flower.imageUrl}
                          alt={flower.name}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* ADD TO CART — slides up on hover */}
                        <div className="absolute inset-x-0 bottom-0 translate-y-full opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => handleAddToCart(flower, e)}
                            disabled={flower.stock === 0}
                            className="flex w-full items-center justify-center gap-2 bg-gray-900/95 px-4 py-3.5 text-[10px] font-medium uppercase tracking-widest text-white backdrop-blur-sm transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
                            {flower.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>

                      {/* TEXT INFO */}
                      <div className="flex items-start justify-between">
                        <h3 className="font-serif text-base text-gray-900 transition-colors group-hover:text-pink-600 sm:text-lg">
                          {flower.name}
                        </h3>
                        <span className="text-sm text-gray-600">
                          ₱{flower.price.toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="font-serif text-2xl text-gray-900">
                    No flowers found
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    We couldn&apos;t find anything matching your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setCategory('All');
                    }}
                    className="mt-6 border-b border-gray-900 pb-0.5 text-xs font-medium uppercase tracking-widest text-gray-900 transition-colors hover:border-gray-500 hover:text-gray-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-24 bg-[#F4F4F4] pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
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

            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">Company</h3>
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