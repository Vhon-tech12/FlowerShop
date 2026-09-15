'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, Search, User, LogOut, Flower2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { totalItems } = useCart();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        
        {/* LOGO - Styled to match the elegant serif look */}
        <Link href="/" className="flex items-center gap-3">
          <Flower2 className="h-6 w-6 text-pink-600" />
          <span className="font-serif text-2xl tracking-[0.15em] text-gray-900">
            FLOWER SHOP
          </span>
        </Link>

        {/* DESKTOP NAV LINKS - Uppercase, tracked out, minimalist */}
        <div className="hidden items-center gap-10 lg:flex">
          <Link href="/" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
            Home
          </Link>
          <Link href="/flowers" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
            Flowers
          </Link>
          <Link href="/about" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
            About
          </Link>
          <Link href="/contact" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
            Contact
          </Link>
        </div>

        {/* RIGHT SIDE - Icons & Auth */}
        <div className="flex items-center gap-6">
          
          {/* Search Icon (Mocked for UI parity) */}
          <button className="hidden text-gray-500 hover:text-gray-900 transition-colors sm:block">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Cart */}
          <Link href="/cart" className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            <span className="hidden text-xs font-medium uppercase tracking-widest sm:inline">
              Cart ({totalItems})
            </span>
          </Link>

          <div className="hidden h-6 w-px bg-gray-200 lg:block"></div>

          {/* Auth Section - Simplified to text links */}
          {loading ? (
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link
                href={userData?.role === 'admin' ? '/admin/dashboard' : '/account'}
                className="hidden items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 lg:flex"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                {userData?.name?.split(' ')[0] || 'Account'}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-red-500 lg:block"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-6 lg:flex">
              <Link
                href="/login"
                className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Admin Link - Kept subtle */}
          <Link
            href="/admin/login"
            className="hidden text-xs font-medium uppercase tracking-widest text-gray-300 transition-colors hover:text-gray-900 lg:block"
          >
            Admin
          </Link>

          {/* Mobile Menu Button */}
          <button className="text-gray-500 hover:text-gray-900 lg:hidden">
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </nav>
  );
}