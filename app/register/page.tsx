'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flower2,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  // Philippine mobile number: exactly 11 digits, must start with 09
  const isValidPhone = (phone: string) => /^09\d{9}$/.test(phone);

  const handlePhoneChange = (value: string) => {
    // Remove non-digits and limit to 11 characters
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setForm({ ...form, phone: digits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isValidPhone(form.phone)) {
      setPhoneTouched(true);
      setError(
        'Phone number must be 11 digits and start with 09 (e.g. 09171234567).'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Create the auth user (fast operation)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2. Save to Firestore in the BACKGROUND (do not wait for it)
      setDoc(doc(db, 'users', userCredential.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        role: 'customer',
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error('Firestore save failed (background):', err);
      });

      // 3. Redirect immediately — no need to wait for Firestore
      router.push('/');
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else if (code === 'auth/network-request-failed') {
        setError('No internet connection. Please try again.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 2)
      return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4)
      return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-gray-900' };
  })();

  const phoneIsValid = isValidPhone(form.phone);
  const phoneError =
    phoneTouched && form.phone.length > 0 && !phoneIsValid;

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans text-gray-800">
      
      {/* LEFT — Image Panel */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1600&auto=format&fit=crop"
          alt="Beautiful flowers"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

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
              Join thousands of happy customers
            </p>
            <h2 className="font-serif text-4xl leading-tight xl:text-5xl">
              Fresh flowers,
              <br />
              delivered with love.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/80 xl:text-base">
              Sign up today and get exclusive access to seasonal bouquets, member-only discounts, and same-day delivery across the Philippines.
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
              Create Account
            </h1>
            <p className="text-sm tracking-widest text-gray-500 uppercase">
              Sign up in seconds and start ordering
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                placeholder="Juan Dela Cruz"
              />
            </div>

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

            {/* Phone */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  className={`w-full border bg-white px-4 py-3.5 pr-16 text-sm outline-none transition-colors placeholder:text-gray-300 ${
                    phoneError
                      ? 'border-red-300 focus:border-red-500'
                      : phoneIsValid
                      ? 'border-emerald-300 focus:border-emerald-500'
                      : 'border-gray-200 focus:border-gray-900'
                  }`}
                  placeholder="09171234567"
                />

                {/* Digit counter — only shows while typing */}
                {form.phone.length > 0 && (
                  <span
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums ${
                      form.phone.length === 11
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {form.phone.length}/11
                  </span>
                )}
              </div>

              {/* Helper / validation message */}
              {phoneError ? (
                <p className="mt-2 text-xs text-red-500">
                  Must be 11 digits, starting with 09 (e.g. 09171234567)
                </p>
              ) : phoneIsValid ? (
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid phone number
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-400">
                  Must be 11 digits, starting with 09
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Delivery Address
              </label>
              <textarea
                required
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full resize-none border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                placeholder="123 Rizal St, Manila"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="At least 6 characters"
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

              {form.password && (
                <div className="mt-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 transition-colors ${
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Password strength:{' '}
                    <span className="font-medium">
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className="w-full border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>

              {form.confirmPassword && form.password && (
                <div className="mt-2 text-xs">
                  {form.password === form.confirmPassword ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <span className="text-red-500">
                      Passwords do not match yet
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-gray-900 px-4 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
              Already a member?
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Sign in CTA */}
          <Link
            href="/login"
            className="flex w-full items-center justify-center border border-gray-300 bg-transparent px-4 py-3.5 text-xs font-medium uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
          >
            Sign In
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