import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "../components/pos/StatCard";
import PageHeader from "../components/pos/PageHeader";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import {
  ShoppingCart,
  Package,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
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

  // 1. Fetch Sales from local SQLite
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => dbService.getSales(), // Use local service
  });

  // 2. Fetch Products from local SQLite
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(), // Use local service
  });

  // 3. Fetch Customers from local SQLite
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => dbService.getCustomers(), // Use local service
  });

  // 4. Fetch Expenses from local SQLite
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => dbService.getExpenses(), // Use local service
  });

  // 5. Fetch Orders from local SQLite
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => dbService.getOrders(), // Use local service
  });

  const isLoading = salesLoading || productsLoading || ordersLoading;

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= (p.low_stock_threshold || 5),
  );

  // Orders statistics
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === "active").length;
  const completedOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "closed",
  ).length;

  // Sales by day for chart
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
  sales.forEach((s) => {
    const d = format(new Date(s.created_date), "yyyy-MM-dd");
    if (salesByDay[d] !== undefined) salesByDay[d] += s.total || 0;
  });
  const chartData = last7Days.map((d) => ({
    name: d.label,
    revenue: salesByDay[d.key],
  }));

  const recentSales = sales.slice(0, 5);

  const handleResetClick = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this software?",
    );

    if (confirmed) {
      const result = await dbService.resetLicense();
      if (result.success) {
        alert("License cleared successfully.");
        // The Electron Main process will automatically redirect
        // the window to the /#license page now.
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={t.dir}>
      <PageHeader
        title={t.dashboard} // Translated
        actionLabel={t.dashboard} // Translated
        subtitle="Overview of your business performance"
      />
      {/* <LicenseStatus /> */}
      <button onClick={handleResetClick}>Reset</button>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${symbol} ${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${sales.length} sales`}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="blue"
          subtitle={`${activeOrders} active | ${completedOrders} completed`}
        />
        <StatCard
          title="Total Expenses"
          value={`${symbol} ${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          color="rose"
          subtitle={`${expenses.length} records`}
        />
        <StatCard
          title="Products"
          value={products.length}
          icon={Package}
          color="indigo"
          subtitle={`${lowStockProducts.length} low stock`}
        />
        <StatCard
          title="Customers"
          value={customers.length}
          icon={Users}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6">
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

        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Low Stock Alerts
            </h3>
            <Link
              to={createPageUrl("Stock")}
              className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              All products are well stocked
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.category?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {p.stock_quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Recent Sales
          </h3>
          <Link
            to={createPageUrl("Sales")}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No sales yet
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
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="text-sm">
                    <td className="py-3 font-medium text-slate-900">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 text-slate-600">
                      {sale.customer_name || "Walk-in"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {format(new Date(sale.created_date), "MMM d, yyyy")}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {sale.payment_method}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      {`${symbol} ${sale.total?.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
