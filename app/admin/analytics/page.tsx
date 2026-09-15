'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUp,
  ArrowDown,
  Loader2,
  Filter,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OrderItem {
  flowerId: string;
  flowerName: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  paymentMethod?: string;
}

interface FlowerData {
  id: string;
  category: string;
  name: string;
}

const COLORS = [
  '#ec4899',
  '#f59e0b',
  '#eab308',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#ef4444',
];

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [flowers, setFlowers] = useState<FlowerData[]>([]);

  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startDefault = `${sixMonthsAgo.getFullYear()}-${String(
      sixMonthsAgo.getMonth() + 1
    ).padStart(2, '0')}`;
    setStartMonth(startDefault);
    setEndMonth(currentMonth);
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as OrderData[]
      );
      setLoading(false);
    });

    const unsubFlowers = onSnapshot(collection(db, 'flowers'), (snap) => {
      setFlowers(
        snap.docs.map((doc) => ({
          id: doc.id,
          category: (doc.data() as any).category,
          name: (doc.data() as any).name,
        })) as FlowerData[]
      );
    });

    return () => {
      unsubOrders();
      unsubFlowers();
    };
  }, []);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!startMonth || !endMonth) return orders;
    const startDate = new Date(`${startMonth}-01`);
    const endDate = new Date(`${endMonth}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);

    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [orders, startMonth, endMonth]);

  const stats = useMemo(() => {
    const nonCancelled = filteredOrders.filter(
      (o) => o.status !== 'Cancelled'
    );
    const revenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = nonCancelled.length;
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;
    const customers = new Set(filteredOrders.map((o) => o.userId)).size;
    return { revenue, totalOrders, avgOrder, customers };
  }, [filteredOrders]);

  const previousStats = useMemo(() => {
    if (!startMonth || !endMonth) return null;
    const startDate = new Date(`${startMonth}-01`);
    const endDate = new Date(`${endMonth}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const diffMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - diffMs - 86400000);
    const prevEnd = new Date(startDate.getTime() - 86400000);

    const prevOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= prevStart && d <= prevEnd && o.status !== 'Cancelled';
    });

    const revenue = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = prevOrders.length;
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;
    const customers = new Set(prevOrders.map((o) => o.userId)).size;
    return { revenue, totalOrders, avgOrder, customers };
  }, [orders, startMonth, endMonth]);

  // Monthly breakdown (for tables)
  const monthlyBreakdown = useMemo(() => {
    if (!startMonth || !endMonth) return [];
    const months: {
      key: string;
      label: string;
      orders: number;
      revenue: number;
      customers: number;
      cancelled: number;
    }[] = [];

    const start = new Date(`${startMonth}-01`);
    const end = new Date(`${endMonth}-01`);
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, '0')}`;
      const label = cursor.toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
      });

      const monthOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getFullYear() === cursor.getFullYear() &&
          d.getMonth() === cursor.getMonth()
        );
      });

      const nonCancelled = monthOrders.filter(
        (o) => o.status !== 'Cancelled'
      );
      const revenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
      const customers = new Set(monthOrders.map((o) => o.userId)).size;
      const cancelled = monthOrders.filter(
        (o) => o.status === 'Cancelled'
      ).length;

      months.push({
        key,
        label,
        orders: nonCancelled.length,
        revenue,
        customers,
        cancelled,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }, [orders, startMonth, endMonth]);

  // Chart data — sales by month
  const salesData = useMemo(
    () =>
      monthlyBreakdown.map((m) => ({
        month: m.label.split(' ')[0].slice(0, 3),
        sales: m.revenue,
      })),
    [monthlyBreakdown]
  );

  const topFlowers = useMemo(() => {
    const flowerSales: Record<
      string,
      { sold: number; revenue: number; category: string }
    > = {};
    filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((order) => {
        order.items?.forEach((item) => {
          if (!flowerSales[item.flowerName]) {
            const flower = flowers.find((f) => f.id === item.flowerId);
            flowerSales[item.flowerName] = {
              sold: 0,
              revenue: 0,
              category: flower?.category || 'Others',
            };
          }
          flowerSales[item.flowerName].sold += item.quantity;
          flowerSales[item.flowerName].revenue +=
            item.price * item.quantity;
        });
      });
    return Object.entries(flowerSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, flowers]);

  const categorySales = useMemo(() => {
    const categoryMap: Record<string, { revenue: number; items: number }> = {};
    filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((order) => {
        order.items?.forEach((item) => {
          const flower = flowers.find((f) => f.id === item.flowerId);
          const category = flower?.category || 'Others';
          if (!categoryMap[category]) {
            categoryMap[category] = { revenue: 0, items: 0 };
          }
          categoryMap[category].revenue += item.price * item.quantity;
          categoryMap[category].items += item.quantity;
        });
      });
    const total = Object.values(categoryMap).reduce(
      (sum, c) => sum + c.revenue,
      0
    );
    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: total > 0 ? (data.revenue / total) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, flowers]);

  const statusBreakdown = useMemo(() => {
    const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    return statuses.map((status) => {
      const count = filteredOrders.filter((o) => o.status === status).length;
      const revenue = filteredOrders
        .filter((o) => o.status === status)
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { status, count, revenue };
    });
  }, [filteredOrders]);

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach((o: any) => {
      const method = o.paymentMethod || 'cod';
      if (!methods[method]) methods[method] = { count: 0, revenue: 0 };
      methods[method].count += 1;
      methods[method].revenue += o.total || 0;
    });
    return Object.entries(methods).map(([method, data]) => ({
      method:
        method === 'cod'
          ? 'Cash on Delivery'
          : method.charAt(0).toUpperCase() + method.slice(1),
      ...data,
    }));
  }, [filteredOrders]);

  const topCustomers = useMemo(() => {
    const customerMap: Record<
      string,
      { name: string; orders: number; spent: number }
    > = {};
    filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((o) => {
        if (!customerMap[o.userId]) {
          customerMap[o.userId] = {
            name: o.customerName || 'Unknown',
            orders: 0,
            spent: 0,
          };
        }
        customerMap[o.userId].orders += 1;
        customerMap[o.userId].spent += o.total || 0;
      });
    return Object.values(customerMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
  }, [filteredOrders]);

  const formatChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₱${stats.revenue.toLocaleString()}`,
      change: previousStats
        ? formatChange(stats.revenue, previousStats.revenue)
        : null,
      up: previousStats ? stats.revenue >= previousStats.revenue : true,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      change: previousStats
        ? formatChange(stats.totalOrders, previousStats.totalOrders)
        : null,
      up: previousStats
        ? stats.totalOrders >= previousStats.totalOrders
        : true,
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Avg. Order Value',
      value: `₱${Math.round(stats.avgOrder).toLocaleString()}`,
      change: previousStats
        ? formatChange(stats.avgOrder, previousStats.avgOrder)
        : null,
      up: previousStats ? stats.avgOrder >= previousStats.avgOrder : true,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Customers',
      value: stats.customers.toString(),
      change: previousStats
        ? formatChange(stats.customers, previousStats.customers)
        : null,
      up: previousStats
        ? stats.customers >= previousStats.customers
        : true,
      icon: Users,
      color: 'text-pink-600 bg-pink-50',
    },
  ];

  const dateRangeLabel =
    startMonth && endMonth
      ? `${new Date(`${startMonth}-01`).toLocaleDateString('en-PH', {
          month: 'long',
          year: 'numeric',
        })} — ${new Date(`${endMonth}-01`).toLocaleDateString('en-PH', {
          month: 'long',
          year: 'numeric',
        })}`
      : '';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Overview</h1>
          <p className="text-sm text-gray-500">
            Business insights and sales performance
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 print:hidden"
        >
          <Download className="h-4 w-4" />
          Save as PDF
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 print:border-0 print:p-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center print:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Date Range:
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">From</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">To</label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-pink-500"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {filteredOrders.length} orders
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SCREEN VIEW — CHARTS */}
      {/* ============================================ */}
      <div className="print:hidden">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mb-1 text-2xl font-bold">{stat.value}</p>
                {stat.change && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.up ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.up ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {stat.change} vs last month
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sales Line Chart */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Sales Overview</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `₱${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `₱${Number(value).toLocaleString()}`,
                    'Sales',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Sales (₱)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two-Column Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Top Selling Flowers</h2>
            {topFlowers.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500">
                No sales data yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topFlowers.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        Number(value).toLocaleString(),
                        'Units Sold',
                      ]}
                    />
                    <Bar
                      dataKey="sold"
                      fill="#ec4899"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Sales by Category</h2>
            {categorySales.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500">
                No category data yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales.map((c, i) => ({
                        name: c.name,
                        value: c.revenue,
                        color: COLORS[i % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      dataKey="value"
                    >
                      {categorySales.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        `₱${Number(value).toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Best Performers Table (on screen) */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Best Performers</h2>
          </div>
          {topFlowers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No sales data yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Flower</th>
                    <th className="px-5 py-3 text-right">Units Sold</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topFlowers.slice(0, 5).map((item, i) => (
                    <tr key={item.name} className="border-b last:border-b-0">
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : i === 1
                              ? 'bg-gray-200 text-gray-700'
                              : i === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3 text-right">{item.sold}</td>
                      <td className="px-5 py-3 text-right font-medium text-pink-600">
                        ₱{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* PRINT VIEW — TABLES ONLY */}
      {/* ============================================ */}
      <div className="hidden print:block">
        {/* Print Header */}
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">Online Flower Shop</h1>
          <h2 className="text-lg font-semibold">Analytics Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            Date Range: <strong>{dateRangeLabel}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Generated:{' '}
            {new Date().toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Summary</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Total Revenue</td>
                <td className="py-2 text-right">
                  ₱{stats.revenue.toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Total Orders</td>
                <td className="py-2 text-right">{stats.totalOrders}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Avg. Order Value</td>
                <td className="py-2 text-right">
                  ₱{Math.round(stats.avgOrder).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Total Customers</td>
                <td className="py-2 text-right">{stats.customers}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Breakdown */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Monthly Breakdown</h2>
          <p className="mb-3 text-xs text-gray-600">
            Sales performance per month within the selected date range.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Month</th>
                <th className="px-2 py-2 text-right">Orders</th>
                <th className="px-2 py-2 text-right">Revenue</th>
                <th className="px-2 py-2 text-right">Avg. Order</th>
                <th className="px-2 py-2 text-right">Customers</th>
                <th className="px-2 py-2 text-right">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map((m) => (
                <tr key={m.key} className="border-b">
                  <td className="px-2 py-2">{m.label}</td>
                  <td className="px-2 py-2 text-right">{m.orders}</td>
                  <td className="px-2 py-2 text-right">
                    ₱{m.revenue.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right">
                    ₱
                    {m.orders > 0
                      ? Math.round(m.revenue / m.orders).toLocaleString()
                      : '0'}
                  </td>
                  <td className="px-2 py-2 text-right">{m.customers}</td>
                  <td className="px-2 py-2 text-right">{m.cancelled}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-gray-100 font-bold">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2 text-right">
                  {monthlyBreakdown.reduce((s, m) => s + m.orders, 0)}
                </td>
                <td className="px-2 py-2 text-right">
                  ₱
                  {monthlyBreakdown
                    .reduce((s, m) => s + m.revenue, 0)
                    .toLocaleString()}
                </td>
                <td className="px-2 py-2 text-right">—</td>
                <td className="px-2 py-2 text-right">—</td>
                <td className="px-2 py-2 text-right">
                  {monthlyBreakdown.reduce((s, m) => s + m.cancelled, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Top Selling Flowers */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Top Selling Flowers</h2>
          <p className="mb-3 text-xs text-gray-600">
            Flowers ranked by total revenue generated within the selected
            period.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Rank</th>
                <th className="px-2 py-2 text-left">Flower</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-right">Units Sold</th>
                <th className="px-2 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topFlowers.map((item, i) => (
                <tr key={item.name} className="border-b">
                  <td className="px-2 py-2">{i + 1}</td>
                  <td className="px-2 py-2">{item.name}</td>
                  <td className="px-2 py-2">{item.category}</td>
                  <td className="px-2 py-2 text-right">{item.sold}</td>
                  <td className="px-2 py-2 text-right">
                    ₱{item.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sales by Category */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Sales by Category</h2>
          <p className="mb-3 text-xs text-gray-600">
            Revenue breakdown by flower category.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-right">Units Sold</th>
                <th className="px-2 py-2 text-right">Revenue</th>
                <th className="px-2 py-2 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {categorySales.map((cat) => (
                <tr key={cat.name} className="border-b">
                  <td className="px-2 py-2">{cat.name}</td>
                  <td className="px-2 py-2 text-right">{cat.items}</td>
                  <td className="px-2 py-2 text-right">
                    ₱{cat.revenue.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {cat.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Status Breakdown */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Order Status Breakdown</h2>
          <p className="mb-3 text-xs text-gray-600">
            Number of orders per status within the selected period.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-right">Order Count</th>
                <th className="px-2 py-2 text-right">Revenue</th>
                <th className="px-2 py-2 text-right">% of Orders</th>
              </tr>
            </thead>
            <tbody>
              {statusBreakdown.map((s) => {
                const totalOrders = filteredOrders.length;
                const pct =
                  totalOrders > 0 ? (s.count / totalOrders) * 100 : 0;
                return (
                  <tr key={s.status} className="border-b">
                    <td className="px-2 py-2">{s.status}</td>
                    <td className="px-2 py-2 text-right">{s.count}</td>
                    <td className="px-2 py-2 text-right">
                      ₱{s.revenue.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Payment Methods</h2>
          <p className="mb-3 text-xs text-gray-600">
            Breakdown of orders by payment method.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Payment Method</th>
                <th className="px-2 py-2 text-right">Orders</th>
                <th className="px-2 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {paymentBreakdown.map((p) => (
                <tr key={p.method} className="border-b">
                  <td className="px-2 py-2">{p.method}</td>
                  <td className="px-2 py-2 text-right">{p.count}</td>
                  <td className="px-2 py-2 text-right">
                    ₱{p.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Customers */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">Top Customers</h2>
          <p className="mb-3 text-xs text-gray-600">
            Customers who spent the most within the selected period.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-2 text-left">Rank</th>
                <th className="px-2 py-2 text-left">Customer</th>
                <th className="px-2 py-2 text-right">Orders</th>
                <th className="px-2 py-2 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-2">{i + 1}</td>
                  <td className="px-2 py-2">{c.name}</td>
                  <td className="px-2 py-2 text-right">{c.orders}</td>
                  <td className="px-2 py-2 text-right">
                    ₱{c.spent.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
          <p>Online Flower Shop — Analytics Report</p>
          <p>{dateRangeLabel}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          .print\\:hidden {
            display: none !important;
          }

          main,
          .lg\\:pl-64 {
            padding-left: 0 !important;
          }

          body {
            background: white !important;
            font-size: 11px;
          }

          @page {
            margin: 1.5cm;
            size: A4;
          }

          .hidden.print\\:block {
            display: block !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </>
  );
}