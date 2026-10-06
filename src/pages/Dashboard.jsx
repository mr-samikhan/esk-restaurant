import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "../components/pos/StatCard";
import PageHeader from "../components/pos/PageHeader";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import {
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Grid,
  FileText,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "../hooks/useCurrency";
import LicenseStatus from "../components/pos/LicenseStatus";

export default function Dashboard() {
  const [lang, setLang] = useState("en");
  const { symbol } = useCurrency();

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  // 1. Fetch Invoices from local SQLite
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => {
      if (dbService.getInvoices) return dbService.getInvoices();
      return dbService.getSales(); // Fallback if getInvoices is not explicitly defined
    },
  });

  // 2. Fetch Expenses from local SQLite
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => dbService.getExpenses(),
  });

  // 3. Fetch Pending Orders from local SQLite
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => dbService.getOrders(),
  });

  // 4. Fetch Categories from local SQLite
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => (dbService.getCategories ? dbService.getCategories() : []),
  });

  // 5. Fetch Item counts per category using dbService.getItemsByCategory(id)
  const { data: categoryItemCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ["categoryItemCounts", categories],
    queryFn: async () => {
      if (!categories.length || !dbService.getItemsByCategory) return {};

      const countMap = {};
      await Promise.all(
        categories.map(async (cat) => {
          try {
            const items = await dbService.getItemsByCategory(cat.id);
            countMap[cat.id] = Array.isArray(items) ? items.length : 0;
          } catch {
            countMap[cat.id] = 0;
          }
        }),
      );
      return countMap;
    },
    enabled: categories.length > 0,
  });

  const isLoading =
    invoicesLoading || ordersLoading || categoriesLoading || countsLoading;

  // Using `total_amount` with fallback to `total` or `amount`
  const getInvoiceAmount = (inv) =>
    inv.total_amount ?? inv.total ?? inv.amount ?? 0;

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + getInvoiceAmount(inv),
    0,
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Pending orders count from orders table
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "active",
  );

  // Sales/Revenue by day for chart using invoices data
  const salesByDay = {};
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    salesByDay[key] = 0;
    last7Days.push({ key, label });
  }
  invoices.forEach((inv) => {
    const d = format(
      new Date(inv.created_date || inv.date || inv.created_at),
      "yyyy-MM-dd",
    );
    if (salesByDay[d] !== undefined) {
      salesByDay[d] += getInvoiceAmount(inv);
    }
  });
  const chartData = last7Days.map((d) => ({
    name: d.label,
    revenue: salesByDay[d.key],
  }));

  const recentInvoices = invoices.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={t.dir}>
      <PageHeader
        title={t.dashboard}
        actionLabel={t.dashboard}
        subtitle="Overview of your business performance"
      />
      <LicenseStatus />

      {/* Restaurant Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${symbol} ${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${invoices.length} invoices`}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={Clock}
          color="amber"
          subtitle="Awaiting fulfillment"
        />
        <StatCard
          title="Invoices"
          value={invoices.length}
          icon={FileText}
          color="blue"
          subtitle="Completed sales"
        />
        <StatCard
          title="Total Expenses"
          value={`${symbol} ${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          color="rose"
          subtitle={`${expenses.length} records`}
        />
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Revenue (Last 7 Days)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => [
                  `${symbol} ${value.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Recent Invoices
            </h3>
            <Link
              to={createPageUrl("Sales")}
              className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No completed invoices yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="text-left pb-3">Invoice</th>
                    <th className="text-left pb-3">Customer</th>
                    <th className="text-left pb-3">Date</th>
                    <th className="text-left pb-3">Payment</th>
                    <th className="text-right pb-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="text-sm">
                      <td className="py-3 font-medium text-slate-900">
                        {inv.invoice_number || inv.id}
                      </td>
                      <td className="py-3 text-slate-600">
                        {inv.customer_name || "Walk-in"}
                      </td>
                      <td className="py-3 text-slate-500">
                        {format(
                          new Date(
                            inv.created_date || inv.date || inv.created_at,
                          ),
                          "MMM d, yyyy",
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {inv.payment_method || "cash"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {`${symbol} ${getInvoiceAmount(inv).toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Categories
              </h3>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
              {categories.length} Total
            </Badge>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No categories found
            </p>
          ) : (
            <div className="overflow-y-auto max-h-64">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2">Category</th>
                    <th className="text-right pb-2">Items Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id || cat.name} className="text-sm">
                      <td className="py-2.5 font-medium text-slate-700">
                        {cat.name}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        {categoryItemCounts[cat.id] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
