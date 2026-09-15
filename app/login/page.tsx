'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flower2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push(redirect);
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans text-gray-800">
      
      {/* LEFT — Image Panel */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=1600&auto=format&fit=crop"
          alt="Beautiful flowers"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Subtle dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white xl:p-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Flower2 className="h-6 w-6 text-white" strokeWidth={1.5} />
            <span className="font-serif text-xl tracking-[0.15em]">
              FLOWERY
            </span>
          </Link>

          {/* Hero Text */}
          <div className="max-w-md">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-white/70">
              Welcome Back
            </p>
            <h2 className="font-serif text-4xl leading-tight xl:text-5xl">
              Your flowers
              <br />
              are waiting.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/80 xl:text-base">
              Sign in to track your orders, save your favorite bouquets, and unlock member-exclusive seasonal offers.
            </p>
          </div>

          {/* Bottom caption */}
          <div className="text-xs uppercase tracking-[0.25em] text-white/60">
            Est. 2026 — Hand-arranged with love
          </div>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          
          {/* Mobile logo */}
          <Link href="/" className="mb-12 flex items-center justify-center gap-2 lg:hidden">
            <Flower2 className="h-6 w-6 text-gray-900" strokeWidth={1.5} />
            <span className="font-serif text-lg tracking-[0.15em] text-gray-900">
              FLOWERY
            </span>
          </Link>

          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-3 font-serif text-3xl text-gray-900 md:text-4xl">
              Sign In
            </h1>
            <p className="text-sm tracking-widest text-gray-500 uppercase">
              Welcome back to Flowery
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                placeholder="juan@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-medium uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-400 transition-colors hover:text-gray-900"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-gray-900 px-4 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
              New Here
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Sign up CTA */}
          <Link
            href="/register"
            className="flex w-full items-center justify-center border border-gray-300 bg-transparent px-4 py-3.5 text-xs font-medium uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
          >
            Create an Account
          </Link>

          {/* Back to store */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}