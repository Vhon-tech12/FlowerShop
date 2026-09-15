'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flower2,
  Mail,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Heart,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/network-request-failed') {
        setError('Walang internet connection. Subukan ulit.');
      } else if (code === 'auth/too-many-requests') {
        setError('Masyadong maraming request. Subukan ulit mamaya.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* LEFT — Image / Branding panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=1600&auto=format&fit=crop"
          alt="Beautiful flowers"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-linear-to-br from-pink-600/80 via-rose-600/70 to-purple-700/80" />

        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-purple-300/20 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Flower2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FlowerShop</span>
          </div>

          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Password recovery
            </div>

            <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
              Nakalimutan mo
              <br />
              ang password?
            </h2>

            <p className="mt-4 text-sm text-white/80 xl:text-base">
              Huwag mag-alala — mangyayari ito sa lahat. Ipadala namin sa email
              mo ang secure link para makagawa ka ng bagong password.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <KeyRound className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">
                  Secure reset link mula sa Firebase
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">
                  Hindi kami nag-store ng password mo
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Heart className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">
                  Bumalik agad sa mga paborito mong bulaklak
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/80">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-white/40 bg-pink-300" />
              <div className="h-8 w-8 rounded-full border-2 border-white/40 bg-rose-300" />
              <div className="h-8 w-8 rounded-full border-2 border-white/40 bg-purple-300" />
            </div>
            <span>Loved by 2,000+ customers</span>
          </div>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-8 lg:w-1/2 lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <Flower2 className="h-8 w-8 text-pink-600" />
            <span className="text-lg font-bold text-gray-900">FlowerShop</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
            {sent ? (
              /* ====== SUCCESS STATE ====== */
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Check your email
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Nagpadala kami ng password reset link sa
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
                    {email}
                  </p>
                </div>

                <div className="mb-6 rounded-xl border border-pink-100 bg-pink-50/60 p-4 text-xs text-pink-800">
                  <p className="font-semibold">Hindi makita ang email?</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-pink-700/90">
                    <li>Check mo ang Spam / Junk folder</li>
                    <li>Siguraduhing tama ang na-type na email</li>
                    <li>Hintayin ng 1–2 minuto bago ulitin</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-100 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'I-resend ang email'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                    className="w-full rounded-xl px-4 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-pink-600"
                  >
                    Iba ang email? Subukan ulit
                  </button>
                </div>
              </>
            ) : (
              /* ====== FORM STATE ====== */
              <>
                <div className="mb-6">
                  <Link
                    href="/login"
                    className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-pink-600"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Bumalik sa login
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Forgot password?
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    I-type ang email mo at padadalhan ka namin ng reset link.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      !
                    </span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20"
                        placeholder="juan@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-pink-600 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  Naalala mo na?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-pink-600 hover:underline"
                  >
                    Mag-login
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Protected by Firebase Authentication.
          </p>
        </div>
      </div>
    </div>
  );
}