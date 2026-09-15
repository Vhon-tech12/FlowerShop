'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import {
  MessageSquare,
  Trash2,
  Mail,
  MailOpen,
  Loader2,
  RefreshCw,
  Eye,
  X,
  Send,
  User,
  Search,
  Inbox,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

interface Reply {
  id: string;
  message: string;
  from: 'admin' | 'customer';
  fromName: string;
  createdAt: string;
}

interface MessageData {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  status: 'read' | 'unread';
  createdAt: string;
  replies?: Reply[];
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MessageData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageData[];
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const openMessage = async (msg: MessageData) => {
    setSelected(msg);
    setReplyText('');

    if (msg.status === 'unread') {
      try {
        await updateDoc(doc(db, 'messages', msg.id), { status: 'read' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m))
        );
        setSelected({ ...msg, status: 'read' });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;

    setSending(true);
    try {
      const newReply: Reply = {
        id: Date.now().toString(),
        message: replyText.trim(),
        from: 'admin',
        fromName: 'Flower Shop Support',
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'messages', selected.id), {
        replies: arrayUnion(newReply),
      });

      const updatedReplies = [...(selected.replies || []), newReply];
      const updatedMsg = { ...selected, replies: updatedReplies };

      setSelected(updatedMsg);
      setMessages((prev) =>
        prev.map((m) => (m.id === selected.id ? updatedMsg : m))
      );
      setReplyText('');

      showToast({
        message: '✅ Reply sent!',
        description: 'Customer will see it in their account.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      showToast({
        message: 'Failed to send reply.',
        description: err.message,
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const toggleRead = async (msg: MessageData) => {
    const newStatus = msg.status === 'read' ? 'unread' : 'read';
    try {
      await updateDoc(doc(db, 'messages', msg.id), { status: newStatus });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message thread?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast({
        message: '🗑️ Message deleted.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to delete:', err);
      showToast({
        message: 'Failed to delete.',
        description: err.message,
        type: 'error',
      });
    }
  };

  // Filtered + searched messages
  const filtered = useMemo(() => {
    let result = messages;

    if (filter === 'Unread') {
      result = result.filter((m) => m.status === 'unread');
    } else if (filter === 'Read') {
      result = result.filter((m) => m.status === 'read');
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          m.message.toLowerCase().includes(s)
      );
    }

    return result;
  }, [messages, filter, search]);

  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const repliedCount = messages.filter(
    (m) => (m.replies?.length || 0) > 0
  ).length;
  const readCount = messages.filter((m) => m.status === 'read').length;

  const stats = [
    {
      label: 'Total Messages',
      value: messages.length.toString(),
      icon: Inbox,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Unread',
      value: unreadCount.toString(),
      icon: Mail,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
    },
    {
      label: 'Read',
      value: readCount.toString(),
      icon: MailOpen,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      label: 'Replied',
      value: repliedCount.toString(),
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
    },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatRelative = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = diffMs / (1000 * 60);
      const diffHours = diffMin / 60;
      const diffDays = diffHours / 24;

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
      if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
      if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkles className="h-3 w-3" />
            Inbox
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Customer Messages
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {messages.length} total conversation
            {messages.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <>
                {' • '}
                <span className="font-medium text-pink-600">
                  {unreadCount} unread
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* ============================================ */}
      {/* STAT CARDS */}
      {/* ============================================ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative p-5">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* UNREAD ALERT */}
      {/* ============================================ */}
      {unreadCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-pink-200 bg-pink-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-pink-700">
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-pink-600">
              Customers are waiting for your response.
            </p>
          </div>
          <button
            onClick={() => setFilter('Unread')}
            className="rounded-lg bg-pink-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-pink-700"
          >
            View Unread
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* SEARCH & FILTER */}
      {/* ============================================ */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'All' as const, count: messages.length },
            { key: 'Unread' as const, count: unreadCount },
            { key: 'Read' as const, count: readCount },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.key}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================ */}
      {/* RESULTS COUNT */}
      {/* ============================================ */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing{' '}
          <strong className="text-gray-900">{filtered.length}</strong> of{' '}
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
        {(search || filter !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setFilter('All');
            }}
            className="font-medium text-pink-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ============================================ */}
      {/* MESSAGES LIST */}
      {/* ============================================ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3 text-sm text-gray-500">
              Loading messages...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 font-medium text-gray-700">
              {search || filter !== 'All'
                ? 'No messages found'
                : 'No messages yet'}
            </p>
            <p className="text-sm text-gray-500">
              {search || filter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'Messages from customers will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((msg) => {
              const hasReply = (msg.replies?.length || 0) > 0;
              const isUnread = msg.status === 'unread';
              const replyCount = msg.replies?.length || 0;

              return (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-4 p-5 transition-colors hover:bg-pink-50/30 ${
                    isUnread ? 'bg-pink-50/20' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isUnread
                        ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                    }`}
                  >
                    {getInitials(msg.name)}
                    {isUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-pink-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p
                        className={`truncate ${
                          isUnread
                            ? 'font-bold text-gray-900'
                            : 'font-medium text-gray-700'
                        }`}
                      >
                        {msg.name}
                      </p>
                      {isUnread && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                          NEW
                        </span>
                      )}
                      {hasReply && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          REPLIED
                          {replyCount > 0 && (
                            <span className="ml-0.5">({replyCount})</span>
                          )}
                        </span>
                      )}
                    </div>

                    <p className="mb-1 truncate text-xs text-gray-500">
                      {msg.email}
                    </p>

                    <p
                      className={`line-clamp-2 text-sm ${
                        isUnread
                          ? 'font-medium text-gray-800'
                          : 'text-gray-600'
                      }`}
                    >
                      {msg.message}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p
                        className="text-xs text-gray-400"
                        title={formatDate(msg.createdAt)}
                      >
                        {formatRelative(msg.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      onClick={() => openMessage(msg)}
                      className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      title="View & Reply"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleRead(msg)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {isUnread ? (
                        <MailOpen className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MESSAGE DETAIL MODAL */}
      {/* ============================================ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-sm font-bold text-white shadow-sm">
                  {getInitials(selected.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selected.name}
                  </h2>
                  <p className="text-xs text-gray-500">{selected.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50 p-5">
              {/* Original Message */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-bold text-gray-600">
                  {getInitials(selected.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {selected.name}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDate(selected.createdAt)}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
                    {selected.message}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {selected.replies && selected.replies.length > 0 && (
                <div className="space-y-4 border-t border-gray-200 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Conversation ({selected.replies.length})
                  </p>
                  {selected.replies.map((reply) => {
                    const isAdmin = reply.from === 'admin';
                    return (
                      <div
                        key={reply.id}
                        className={`flex gap-3 ${
                          isAdmin ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                            isAdmin
                              ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                          }`}
                        >
                          {isAdmin ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`flex-1 min-w-0 ${
                            isAdmin ? 'text-right' : ''
                          }`}
                        >
                          <div
                            className={`mb-1 flex items-center gap-2 ${
                              isAdmin ? 'justify-end' : ''
                            }`}
                          >
                            <p className="text-sm font-semibold text-gray-900">
                              {reply.fromName}
                            </p>
                            <span className="text-xs text-gray-400">
                              {formatRelative(reply.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`inline-block max-w-full rounded-2xl p-4 text-left text-sm leading-relaxed shadow-sm ${
                              isAdmin
                                ? 'rounded-tr-md bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                                : 'rounded-tl-md bg-white text-gray-700'
                            }`}
                          >
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="border-t border-gray-100 bg-white p-4">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  disabled={sending}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500 disabled:bg-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSendReply();
                    }
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center justify-center rounded-xl bg-pink-600 px-5 text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-400"
                  title="Send reply (Ctrl+Enter)"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                <span>
                  💡 Tip: Press{' '}
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-[9px]">
                    Ctrl
                  </kbd>{' '}
                  +{' '}
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-[9px]">
                    Enter
                  </kbd>{' '}
                  to send
                </span>
                <span>Reply appears in customer&apos;s account</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}