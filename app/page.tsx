'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  Star,
  Quote,
  Sparkles,
  Heart,
  Truck,
  Flower2,
  Mail,
  Phone,
  MapPin,
  Search,
  User,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { FlowerCard } from '@/components/FlowerCard';
import { db } from '@/lib/firebase';
import { Flower } from '@/lib/types';

interface TestimonialData {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
  approved: boolean;
  createdAt: string;
}

const avatarColors = [
  'bg-pink-100 text-pink-600',
  'bg-rose-100 text-rose-600',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-indigo-100 text-indigo-600',
  'bg-cyan-100 text-cyan-600',
];

export default function HomePage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  // Fetch flowers
  useEffect(() => {
    async function fetchFlowers() {
      try {
        const snapshot = await getDocs(collection(db, 'flowers'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Flower[];
        setFlowers(data.slice(0, 3)); // Limit to 3 for the tilted hero design
      } catch (err) {
        console.error('Error fetching flowers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlowers();
  }, []);

  // Fetch testimonials (approved only)
  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const q = query(
          collection(db, 'testimonials'),
          where('approved', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TestimonialData[];

        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const limited = data.slice(0, 6);
        setTestimonials(limited);

        if (data.length > 0) {
          const avg = data.reduce((sum, t) => sum + t.rating, 0) / data.length;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err);
      } finally {
        setTestimonialsLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

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

  const getAvatarColor = (index: number) =>
    avatarColors[index % avatarColors.length];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* HERO & POPULAR PRODUCTS SECTION */}
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-20">
          {/* Grid Background overlay */}
          <div className="absolute inset-0 z-0 [background-image:linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] [background-size:32px_32px]"></div>
          
          <div className="container relative z-10 mx-auto px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              
              {/* LEFT COLUMN: Text & Stacked Cards */}
              <div className="flex flex-col justify-center">
                <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
                  The Purest <br />
                  Flowers for the <br />
                  <span className="relative inline-block bg-pink-100/60 px-2">
                    People You Love.
                  </span>
                </h1>
                
                <p className="mb-8 max-w-md text-lg text-gray-600">
                  From birthdays to weddings, we deliver the freshest blooms right to your doorstep. Order online today!
                </p>

                <div className="mb-16 flex flex-wrap gap-4">
                  <Link
                    href="/flowers"
                    className="group inline-flex items-center gap-2 rounded-sm bg-gray-900 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Order Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/flowers"
                    className="inline-flex items-center rounded-sm border border-gray-300 bg-transparent px-8 py-3.5 text-sm font-medium transition-colors hover:bg-gray-100"
                  >
                    More Products
                  </Link>
                </div>

                {/* Popular Products (Stacked Cards) */}
                <div className="relative">
                  <div className="mb-6 flex items-center gap-2">
                    <h2 className="text-2xl font-bold italic">Popular <span className="font-normal">Products</span></h2>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  {loading ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                    </div>
                  ) : flowers.length === 0 ? (
                    <p className="text-sm text-gray-500">No flowers available.</p>
                  ) : (
                    <div className="flex items-end -space-x-8 px-4">
                      {flowers.map((flower, i) => (
                        <div 
                          key={flower.id} 
                          className={`relative w-40 transition-transform duration-300 hover:z-50 hover:-translate-y-4 hover:scale-105 md:w-48
                            ${i === 0 ? 'z-10 rotate-[-6deg] translate-y-4' : ''}
                            ${i === 1 ? 'z-20 rotate-[0deg]' : ''}
                            ${i === 2 ? 'z-30 rotate-[6deg] translate-y-2' : ''}
                          `}
                        >
                          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                            <FlowerCard flower={flower} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Hero Image & Floating Elements */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-pink-50">
                  {/* Decorative Badge */}
                  <div className="absolute left-[-20px] top-12 z-20 flex h-28 w-28 animate-[spin_10s_linear_infinite] items-center justify-center rounded-full bg-pink-600 p-2 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-xl">
                    <div className="flex h-full w-full items-center justify-center rounded-full border border-pink-400 border-dashed">
                      Flowery • Flowery • Flowery •
                    </div>
                  </div>

                  <img
                    src="https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800&q=80"
                    alt="Gerbera Daisy"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Floating Stat Cards */}
                <div className="absolute bottom-16 left-[-30px] z-20 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-2xl">
                  <div>
                    <p className="text-2xl font-bold">3.2K+</p>
                    <p className="text-xs text-gray-500">Customers</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">4.8 <span className="text-yellow-400">★</span></p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* IMPROVED: WHY CHOOSE US */}
        <section className="border-y border-gray-100 bg-white py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-20 text-center">
              <h2 className="mb-4 font-serif text-3xl tracking-wide text-gray-900 md:text-4xl">
                Why Choose Us
              </h2>
              <p className="mx-auto max-w-2xl font-sans text-xs tracking-widest text-gray-500 uppercase">
                We take pride in providing the best flower delivery experience in the Philippines.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
              
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200">
                  <Heart className="h-6 w-6 text-gray-900" strokeWidth={1} />
                </div>
                <h3 className="mb-3 font-serif text-xl text-gray-900">Fresh Blooms</h3>
                <p className="max-w-xs font-sans text-sm leading-relaxed text-gray-500">
                  We source only the freshest flowers daily from local growers to ensure longevity and beauty.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200">
                  <Truck className="h-6 w-6 text-gray-900" strokeWidth={1} />
                </div>
                <h3 className="mb-3 font-serif text-xl text-gray-900">Fast Delivery</h3>
                <p className="max-w-xs font-sans text-sm leading-relaxed text-gray-500">
                  Same-day delivery available for orders placed before 2 PM. We deliver with care.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200">
                  <Sparkles className="h-6 w-6 text-gray-900" strokeWidth={1} />
                </div>
                <h3 className="mb-3 font-serif text-xl text-gray-900">Custom Arrangements</h3>
                <p className="max-w-xs font-sans text-sm leading-relaxed text-gray-500">
                  Tell us your occasion and we&apos;ll craft the perfect bouquet tailored just for you.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* IMPROVED: TESTIMONIALS (Customer's Reviews) */}
        <section className="bg-[#FDFBF7] py-24">
          <div className="container mx-auto px-4">
            
            {/* Cleaner Stats Header */}
            <div className="mb-20 flex flex-col items-center justify-center gap-10 md:flex-row md:gap-24">
              <div className="text-center">
                <p className="font-serif text-5xl text-gray-900">15k+</p>
                <p className="mt-2 font-sans text-xs tracking-widest text-gray-500 uppercase">
                  Happy Customers
                </p>
              </div>
              
              <div className="hidden h-16 w-px bg-gray-200 md:block"></div>

              <div className="text-center">
                <p className="font-serif text-5xl text-gray-900">3M+</p>
                <p className="mt-2 font-sans text-xs tracking-widest text-gray-500 uppercase">
                  Bouquets Delivered
                </p>
              </div>
            </div>

            {/* Testimonials Grid */}
            {testimonialsLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                <Quote className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t, i) => (
                  <div key={t.id} className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <Quote className="absolute right-6 top-6 h-8 w-8 text-pink-100" />
                    <div className="mb-4 flex gap-1">
                      {renderStars(t.rating)}
                    </div>
                    <p className="mb-8 text-sm leading-relaxed text-gray-700">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAvatarColor(i)}`}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="bg-gray-900 py-24 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Ready to Brighten <br className="hidden md:block" /> Someone&apos;s Day?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-gray-300">
              Order fresh flowers today and make their special moment unforgettable.
            </p>
            <Link
              href="/flowers"
              className="group inline-flex items-center gap-3 rounded-sm bg-pink-600 px-10 py-4 text-base font-medium text-white transition-colors hover:bg-pink-700"
            >
              Shop Now
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Flower2 className="h-6 w-6 text-pink-600" />
              <span className="text-lg font-bold tracking-tight">Flowery</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Fresh flowers, hand-arranged and delivered with love. Bringing joy to every occasion.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-pink-600" />
                hello@flowery.com
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-pink-600" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-pink-600" />
                123 Blossom Lane, Floral City
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">Follow Us</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              Stay in bloom — follow along for seasonal specials and inspiration.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-xs text-gray-400">
              © 2026 Flowery. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}