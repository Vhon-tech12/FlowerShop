'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ShoppingCart,
  Menu,
  Search,
  User,
  LogOut,
  Flower2,
  X,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setMobileOpen(false);
    router.push('/');
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <Flower2 className="h-6 w-6 text-pink-600" />
          <span className="font-serif text-2xl tracking-[0.15em] text-gray-900">
            FLOWER SHOP
          </span>
        </Link>

        {/* DESKTOP NAV LINKS */}
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

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-6">
          <button className="hidden text-gray-500 hover:text-gray-900 transition-colors sm:block">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <Link href="/cart" className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            <span className="hidden text-xs font-medium uppercase tracking-widest sm:inline">
              Cart ({totalItems})
            </span>
          </Link>

          <div className="hidden h-6 w-px bg-gray-200 lg:block"></div>

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
              <Link href="/login" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" className="text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
                Sign Up
              </Link>
            </div>
          )}

          <Link
            href="/admin/login"
            className="hidden text-xs font-medium uppercase tracking-widest text-gray-300 transition-colors hover:text-gray-900 lg:block"
          >
            Admin
          </Link>

          {/* Mobile Menu Button — may onClick na */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-900 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <div className="container mx-auto flex flex-col px-4 py-4 md:px-8">
            <Link
              href="/"
              onClick={closeMenu}
              className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
            >
              Home
            </Link>
            <Link
              href="/flowers"
              onClick={closeMenu}
              className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
            >
              Flowers
            </Link>
            <Link
              href="/about"
              onClick={closeMenu}
              className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={closeMenu}
              className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
            >
              Contact
            </Link>

            {!loading && user ? (
              <>
                <Link
                  href={userData?.role === 'admin' ? '/admin/dashboard' : '/account'}
                  onClick={closeMenu}
                  className="flex items-center gap-2 border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  {userData?.name?.split(' ')[0] || 'Account'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-b border-gray-50 py-3 text-left text-xs font-medium uppercase tracking-widest text-red-500 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Logout
                </button>
              </>
            ) : (
              !loading && (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="border-b border-gray-50 py-3 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-pink-600"
                  >
                    Sign Up
                  </Link>
                </>
              )
            )}

            <Link
              href="/admin/login"
              onClick={closeMenu}
              className="py-3 text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-gray-900"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
