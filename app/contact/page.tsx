'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  ArrowLeft,
  Flower2,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';

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

export default function ContactPage() {
  const { showToast } = useToast();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: userData?.name || '',
    email: user?.email || '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast({
        message: 'Please fill in all fields.',
        type: 'error',
      });
      return;
    }

    if (form.message.trim().length < 10) {
      showToast({
        message: 'Message must be at least 10 characters.',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'messages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        userId: user?.uid || null,
        status: 'unread',
        createdAt: new Date().toISOString(),
      });

      showToast({
        message: 'Message sent',
        description: "We'll get back to you as soon as possible.",
        type: 'success',
      });

      setForm({
        name: userData?.name || '',
        email: user?.email || '',
        message: '',
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      showToast({
        message: 'Failed to send message.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
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
            Contact Us
          </h1>
          <p className="text-sm tracking-widest text-gray-500 uppercase">
            Have a question? We&apos;d love to hear from you
          </p>
        </section>

        {/* CONTENT */}
        <section className="container mx-auto px-4 pb-24 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-5 lg:gap-20">
              
              {/* LEFT — Contact Info */}
              <div className="lg:col-span-2">
                <h2 className="mb-8 font-serif text-2xl text-gray-900">
                  Reach out to us
                </h2>

                <div className="space-y-8">
                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-white">
                      <Phone
                        className="h-4 w-4 text-gray-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900">
                        +63 917 123 4567
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-white">
                      <Mail
                        className="h-4 w-4 text-gray-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                        Email
                      </p>
                      <p className="text-sm text-gray-900">
                        hello@flowery.com
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-white">
                      <MapPin
                        className="h-4 w-4 text-gray-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                        Address
                      </p>
                      <p className="text-sm leading-relaxed text-gray-900">
                        123 Blossom Lane
                        <br />
                        Floral City, Philippines
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                    Response Time
                  </p>
                  <p className="text-sm leading-relaxed text-gray-600">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
              </div>

              {/* RIGHT — Form */}
              <div className="lg:col-span-3">
                <div className="border border-gray-200 bg-white p-8 md:p-10">
                  <div className="mb-8 border-b border-gray-100 pb-6">
                    <h2 className="font-serif text-2xl text-gray-900">
                      Send us a message
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Fill out the form below and we&apos;ll get back to you.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                        placeholder="Juan Dela Cruz"
                        disabled={loading}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                        placeholder="juan@email.com"
                        disabled={loading}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full resize-none border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-300"
                        placeholder="Tell us how we can help you..."
                        disabled={loading}
                        maxLength={500}
                      />
                      <p className="mt-2 text-right text-[10px] font-medium uppercase tracking-widest text-gray-400">
                        {form.message.length}/500
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 bg-gray-900 px-8 py-4 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" strokeWidth={1.5} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F4F4F4] pt-16 pb-8">
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
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Company
              </h3>
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