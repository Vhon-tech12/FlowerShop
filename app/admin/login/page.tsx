'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower2, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        setError('Mali ang email o password.');
      } else if (errorCode === 'auth/user-not-found') {
        setError('Walang account na naka-register sa email na ito.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Hindi valid ang email format.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Masyadong maraming attempts. Subukan ulit mamaya.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans text-gray-800">
      
      {/* LEFT SIDE: IMAGE */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src="https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=1200&q=80"
          alt="Elegant flowers"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Subtle overlay to ensure logo readability */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Logo on top of image */}
        <div className="absolute left-10 top-10 z-10 flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-white" strokeWidth={1.5} />
          <span className="font-serif text-xl tracking-[0.15em] text-white">
            FLOWERY
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          
          {/* Header */}
          <div className="mb-12 text-center lg:text-left">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white lg:hidden">
              <Flower2 className="h-6 w-6 text-gray-900" strokeWidth={1.5} />
            </div>
            <h1 className="mb-3 font-serif text-4xl text-gray-900">
              Admin Login
            </h1>
            <p className="text-sm tracking-widest text-gray-500 uppercase">
              Sign in to manage your flower shop
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="admin@flowershop.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-gray-900 px-4 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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

          {/* Footer Link */}
          <div className="mt-12 text-center lg:text-left">
            <Link 
              href="/" 
              className="text-xs font-medium tracking-widest text-gray-400 uppercase transition-colors hover:text-gray-900"
            >
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}