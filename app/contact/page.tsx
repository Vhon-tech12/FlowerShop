'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, User, MessageSquare } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';

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
        message: '✅ Message sent!',
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
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-pink-50 to-purple-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Contact Us</h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Have a question? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-gray-600">+63 917 123 4567</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-600">
                    hello@flowershop.com
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-600">
                    123 Rizal St, Manila, Philippines
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-pink-100 bg-pink-50 p-4">
                <p className="text-sm font-medium text-pink-900">
                  ⏰ Response Time
                </p>
                <p className="text-xs text-pink-700">
                  We typically respond within 24 hours during business days.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-1 text-lg font-semibold">
                  Send us a Message
                </h2>
                <p className="mb-6 text-sm text-gray-500">
                  Fill out the form below and we&apos;ll get back to you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="Juan Dela Cruz"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="juan@email.com"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Message *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="Tell us how we can help you..."
                        disabled={loading}
                        maxLength={500}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-400">
                      {form.message.length}/500
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-6 py-3 font-medium text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}