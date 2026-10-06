// import React, { useEffect, useState, useRef } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { dbService } from "@/lib/db-service";
// import PageHeader from "../components/pos/PageHeader";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import {
//   Download,
//   TrendingUp,
//   Receipt,
//   Utensils,
//   CreditCard,
//   ShoppingBag,
//   CalendarIcon,
//   Percent,
// } from "lucide-react";
// import { format, subDays, startOfMonth } from "date-fns";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   LineChart,
//   Line,
// } from "recharts";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";

// export default function Reports() {
//   const [range, setRange] = useState("monthly");
//   const [date, setDate] = useState({
//     from: startOfMonth(new Date()),
//     to: new Date(),
//   });

//   const [dateFilters, setDateFilters] = useState({
//     start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
//     end: format(new Date(), "yyyy-MM-dd"),
//   });

//   // Handle Range or Calendar Date Changes cleanly
//   useEffect(() => {
//     const today = new Date();

//     if (range === "custom") {
//       if (date?.from && date?.to) {
//         setDateFilters({
//           start: format(date.from, "yyyy-MM-dd"),
//           end: format(date.to, "yyyy-MM-dd"),
//         });
//       }
//       return;
//     }

//     let start;
//     let end = format(today, "yyyy-MM-dd");

//     switch (range) {
//       case "daily":
//         start = end;
//         break;
//       case "yesterday": {
//         const yesterday = subDays(today, 1);
//         start = format(yesterday, "yyyy-MM-dd");
//         end = start;
//         break;
//       }
//       case "weekly":
//         start = format(subDays(today, 6), "yyyy-MM-dd");
//         break;
//       case "monthly":
//         start = format(startOfMonth(today), "yyyy-MM-dd");
//         break;
//       case "yearly":
//         start = format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd");
//         break;
//       default:
//         start = format(startOfMonth(today), "yyyy-MM-dd");
//     }

//     setDateFilters({ start, end });
//   }, [range, date]);

//   // Fetch Report Data from Electron IPC
//   const { data: response, isLoading } = useQuery({
//     queryKey: ["reports", range, dateFilters],
//     queryFn: () =>
//       dbService.getDetailedReports({
//         range,
//         startDate: dateFilters.start,
//         endDate: dateFilters.end,
//       }),
//   });

//   // Extract variables with full fallbacks
//   const salesData = response?.sales || [];
//   const summaryData = response?.summary || {};

//   console.log("response", response);

//   // Metrics Calculations (using summary from backend with frontend fallbacks)
//   const totalSales =
//     summaryData.gross_sales ??
//     salesData.reduce((sum, s) => sum + (s.revenue || 0), 0);

//   const totalKpraTax =
//     summaryData.total_kpra_tax ??
//     salesData.reduce((sum, s) => sum + (s.kpra_tax || s.tax || 0), 0);

//   const netSales = summaryData.net_sales ?? totalSales - totalKpraTax;

//   const totalOrders =
//     summaryData.total_orders ??
//     salesData.reduce((sum, s) => sum + (s.order_count || 0), 0);

//   const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

//   const totalDineIn = salesData.reduce((sum, s) => sum + (s.dine_in || 0), 0);
//   const totalTakeaway = salesData.reduce(
//     (sum, s) => sum + (s.takeaway || 0),
//     0,
//   );
//   const totalDelivery = salesData.reduce(
//     (sum, s) => sum + (s.delivery || 0),
//     0,
//   );

//   const reportRef = useRef(null);

//   const exportPDF = async () => {
//     const element = reportRef.current;
//     if (!element) return;

//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");

//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//     pdf.save(`Restaurant_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Restaurant Reports"
//         subtitle="Track sales, KPRA tax collected, and order metrics"
//       >
//         <div className="flex items-center gap-3">
//           <Select value={range} onValueChange={setRange}>
//             <SelectTrigger className="w-36">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="daily">Today</SelectItem>
//               <SelectItem value="yesterday">Yesterday</SelectItem>
//               <SelectItem value="weekly">This Week</SelectItem>
//               <SelectItem value="monthly">This Month</SelectItem>
//               <SelectItem value="yearly">This Year</SelectItem>
//               <SelectItem value="custom">Custom Range</SelectItem>
//             </SelectContent>
//           </Select>

//           {range === "custom" && (
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className="w-[260px] justify-start text-left font-normal"
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {date?.from ? (
//                     date.to ? (
//                       <>
//                         {format(date.from, "LLL dd, y")} -{" "}
//                         {format(date.to, "LLL dd, y")}
//                       </>
//                     ) : (
//                       format(date.from, "LLL dd, y")
//                     )
//                   ) : (
//                     <span>Pick a date range</span>
//                   )}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   initialFocus
//                   mode="range"
//                   defaultMonth={date?.from}
//                   selected={date}
//                   onSelect={setDate}
//                   numberOfMonths={2}
//                 />
//               </PopoverContent>
//             </Popover>
//           )}

//           <Button onClick={exportPDF} variant="outline">
//             <Download className="mr-2 h-4 w-4" /> Export PDF
//           </Button>
//         </div>
//       </PageHeader>

//       {/* Main Report Container */}
//       <div ref={reportRef} className="p-4 bg-white space-y-6 rounded-xl">
//         {/* KPI Cards Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Card className="border-emerald-100 bg-emerald-50/30">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-emerald-700">
//                 Gross Sales
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-emerald-950">
//                 Rs. {totalSales.toLocaleString()}
//               </div>
//               <p className="text-xs text-emerald-600 flex items-center mt-1">
//                 <TrendingUp className="w-3.5 h-3.5 mr-1" /> Total billed amount
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="border-amber-100 bg-amber-50/30">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-amber-700">
//                 KPRA Tax Collected
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-amber-950">
//                 Rs. {totalKpraTax.toLocaleString()}
//               </div>
//               <p className="text-xs text-amber-600 flex items-center mt-1">
//                 <Percent className="w-3.5 h-3.5 mr-1" /> Tax payable to KPRA
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="border-indigo-100 bg-indigo-50/30">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-indigo-700">
//                 Net Sales (Excl. Tax)
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-indigo-950">
//                 Rs. {netSales.toLocaleString()}
//               </div>
//               <p className="text-xs text-indigo-600 flex items-center mt-1">
//                 <Receipt className="w-3.5 h-3.5 mr-1" /> Actual revenue
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="border-blue-100 bg-blue-50/30">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-blue-700">
//                 Orders & Avg Order Value
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-blue-950">
//                 {totalOrders}{" "}
//                 <span className="text-xs font-normal text-slate-500">
//                   Orders
//                 </span>
//               </div>
//               <p className="text-xs text-blue-600 flex items-center mt-1">
//                 <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Avg: Rs.{" "}
//                 {avgOrderValue.toFixed(0)} / Order
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Charts Section */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base">
//                 Sales & KPRA Tax Trend
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={salesData}>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     vertical={false}
//                     stroke="#f1f5f9"
//                   />
//                   <XAxis
//                     dataKey="date"
//                     fontSize={11}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis fontSize={11} axisLine={false} tickLine={false} />
//                   <Tooltip
//                     contentStyle={{
//                       borderRadius: "12px",
//                       border: "none",
//                       boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
//                     }}
//                   />
//                   <Legend iconType="circle" />
//                   <Line
//                     type="monotone"
//                     dataKey="revenue"
//                     name="Gross Sales"
//                     stroke="#4f46e5"
//                     strokeWidth={3}
//                     dot={{ r: 3 }}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="kpra_tax"
//                     name="KPRA Tax"
//                     stroke="#f59e0b"
//                     strokeWidth={2}
//                     strokeDasharray="4 4"
//                     dot={{ r: 2 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="text-base">
//                 Payment Method Breakdown
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={salesData}>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     vertical={false}
//                     stroke="#f1f5f9"
//                   />
//                   <XAxis
//                     dataKey="date"
//                     fontSize={11}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis fontSize={11} axisLine={false} tickLine={false} />
//                   <Tooltip cursor={{ fill: "#f8fafc" }} />
//                   <Legend iconType="circle" />
//                   <Bar
//                     dataKey="cash"
//                     name="Cash"
//                     fill="#10b981"
//                     radius={[4, 4, 0, 0]}
//                   />
//                   <Bar
//                     dataKey="card"
//                     name="Card / Digital"
//                     fill="#3b82f6"
//                     radius={[4, 4, 0, 0]}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Order Types Section */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Order Type Distribution</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
//               <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
//                 <Utensils className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
//                 <p className="text-xs text-slate-500 uppercase font-semibold">
//                   Dine-In
//                 </p>
//                 <p className="text-xl font-bold text-slate-800">
//                   {totalDineIn} Orders
//                 </p>
//               </div>

//               <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
//                 <ShoppingBag className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
//                 <p className="text-xs text-slate-500 uppercase font-semibold">
//                   Takeaway
//                 </p>
//                 <p className="text-xl font-bold text-slate-800">
//                   {totalTakeaway} Orders
//                 </p>
//               </div>

//               <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
//                 <CreditCard className="w-5 h-5 mx-auto text-amber-600 mb-1" />
//                 <p className="text-xs text-slate-500 uppercase font-semibold">
//                   Delivery
//                 </p>
//                 <p className="text-xl font-bold text-slate-800">
//                   {totalDelivery} Orders
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import PageHeader from "../components/pos/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  Receipt,
  Utensils,
  CreditCard,
  ShoppingBag,
  CalendarIcon,
  Percent,
  Wallet,
  Clock,
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Reports() {
  const [range, setRange] = useState("monthly");
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [dateFilters, setDateFilters] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  // Handle Range or Calendar Date Changes cleanly
  useEffect(() => {
    const today = new Date();

    if (range === "custom") {
      if (date?.from && date?.to) {
        setDateFilters({
          start: format(date.from, "yyyy-MM-dd"),
          end: format(date.to, "yyyy-MM-dd"),
        });
      }
      return;
    }

    let start;
    let end = format(today, "yyyy-MM-dd");

    switch (range) {
      case "daily":
        start = end;
        break;
      case "yesterday": {
        const yesterday = subDays(today, 1);
        start = format(yesterday, "yyyy-MM-dd");
        end = start;
        break;
      }
      case "weekly":
        start = format(subDays(today, 6), "yyyy-MM-dd");
        break;
      case "monthly":
        start = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      case "yearly":
        start = format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd");
        break;
      default:
        start = format(startOfMonth(today), "yyyy-MM-dd");
    }

    setDateFilters({ start, end });
  }, [range, date]);

  // 1. Fetch Report Detailed Data
  const { data: response } = useQuery({
    queryKey: ["reports", range, dateFilters],
    queryFn: () =>
      dbService.getDetailedReports({
        range,
        startDate: dateFilters.start,
        endDate: dateFilters.end,
      }),
  });

  // 2. Fetch Invoices from local SQLite (Fully Paid Sales)
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", dateFilters],
    queryFn: () => {
      if (dbService.getInvoices) return dbService.getInvoices();
      return dbService.getSales();
    },
  });

  // 3. Fetch Orders from local SQLite
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", dateFilters],
    queryFn: () => dbService.getOrders(),
  });

  // 4. Fetch Expenses Data
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", dateFilters],
    queryFn: () => dbService.getExpenses(),
  });

  // Helper for invoice total amounts
  const getInvoiceAmount = (inv) =>
    Number(inv.total_amount ?? inv.total ?? inv.amount ?? 0);

  // Filter Invoices by date
  const filteredInvoices = invoices.filter((inv) => {
    const invDate = inv.created_date || inv.date || inv.created_at;
    if (!invDate) return true;
    const formatted = format(new Date(invDate), "yyyy-MM-dd");
    return formatted >= dateFilters.start && formatted <= dateFilters.end;
  });

  // Filter Pending Orders by date & status
  const pendingOrders = orders.filter((o) => {
    const isPending = o.status === "pending" || o.status === "active";
    const oDate = o.created_date || o.date || o.created_at;
    if (!oDate) return isPending;
    const formatted = format(new Date(oDate), "yyyy-MM-dd");
    return (
      isPending &&
      formatted >= dateFilters.start &&
      formatted <= dateFilters.end
    );
  });

  // Extract variables with full fallbacks
  const salesData = response?.sales || [];
  const summaryData = response?.summary || {};

  // Metrics Calculations
  // Total Gross Sales computed from fully paid invoices
  const totalSales =
    summaryData.gross_sales ??
    filteredInvoices.reduce((sum, inv) => sum + getInvoiceAmount(inv), 0);

  const totalKpraTax =
    summaryData.total_kpra_tax ??
    salesData.reduce((sum, s) => sum + (s.kpra_tax || s.tax || 0), 0);

  const netSales = summaryData.net_sales ?? totalSales - totalKpraTax;

  const paidInvoicesCount = filteredInvoices.length;
  const avgOrderValue =
    paidInvoicesCount > 0 ? totalSales / paidInvoicesCount : 0;

  // Filter expenses by date range
  const filteredExpenses = expenses.filter((e) => {
    const eDate = e.date || e.created_date || e.created_at;
    if (!eDate) return true;
    const formatted = format(new Date(eDate), "yyyy-MM-dd");
    return formatted >= dateFilters.start && formatted <= dateFilters.end;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0,
  );

  const totalDineIn = salesData.reduce((sum, s) => sum + (s.dine_in || 0), 0);
  const totalTakeaway = salesData.reduce(
    (sum, s) => sum + (s.takeaway || 0),
    0,
  );
  const totalDelivery = salesData.reduce(
    (sum, s) => sum + (s.delivery || 0),
    0,
  );

  const reportRef = useRef(null);

  const exportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Restaurant_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Reports"
        subtitle="Track sales, KPRA tax collected, expenses, and order metrics"
      >
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {range === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[260px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button onClick={exportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </PageHeader>

      {/* Main Report Container */}
      <div ref={reportRef} className="p-4 bg-white space-y-6 rounded-xl">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">
                Gross Sales (Paid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-950">
                Rs. {totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> {paidInvoicesCount}{" "}
                paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                KPRA Tax Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-950">
                Rs. {totalKpraTax.toLocaleString()}
              </div>
              <p className="text-xs text-amber-600 flex items-center mt-1">
                <Percent className="w-3.5 h-3.5 mr-1" /> Tax payable to KPRA
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">
                Net Sales (Excl. Tax)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-950">
                Rs. {netSales.toLocaleString()}
              </div>
              <p className="text-xs text-indigo-600 flex items-center mt-1">
                <Receipt className="w-3.5 h-3.5 mr-1" /> Revenue after tax
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-rose-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-700">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-950">
                Rs. {totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-rose-600 flex items-center mt-1">
                <Wallet className="w-3.5 h-3.5 mr-1" />{" "}
                {filteredExpenses.length} records logged
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-950">
                {pendingOrders.length}{" "}
                <span className="text-xs font-normal text-slate-500">
                  Pending
                </span>
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Clock className="w-3.5 h-3.5 mr-1" /> Avg Sales/Paid Inv: Rs.{" "}
                {avgOrderValue.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Sales & KPRA Tax Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Gross Sales"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kpra_tax"
                    name="KPRA Tax"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Payment Method Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Legend iconType="circle" />
                  <Bar
                    dataKey="cash"
                    name="Cash"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="card"
                    name="Card / Digital"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Order Types Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <Utensils className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  Dine-In
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalDineIn} Orders
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <ShoppingBag className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  Takeaway
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalTakeaway} Orders
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <CreditCard className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  Delivery
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalDelivery} Orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
