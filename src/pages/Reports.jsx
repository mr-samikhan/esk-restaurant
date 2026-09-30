import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
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
  Wallet,
  Users,
  ArrowUpRight,
  Badge,
  CalendarIcon,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
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
import { useRef } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";

export default function Reports() {
  const [range, setRange] = useState("monthly");
  // date is for the Calendar UI
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // dateFilters is what the useQuery uses
  const [dateFilters, setDateFilters] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports", range, dateFilters],
    queryFn: () =>
      dbService.getDetailedReports({
        range,
        startDate: dateFilters.start,
        endDate: dateFilters.end,
      }),
  });

  // Update dateFilters whenever the calendar date range changes
  useEffect(() => {
    if (range === "custom" && date?.from && date?.to) {
      setDateFilters({
        start: format(date.from, "yyyy-MM-dd"),
        end: format(date.to, "yyyy-MM-dd"),
      });
    }
  }, [date, range]);

  useEffect(() => {
    const today = new Date();
    let start;
    let end = format(today, "yyyy-MM-dd");

    switch (range) {
      case "daily":
        start = end;
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        start = format(yesterday, "yyyy-MM-dd");
        end = start; // End date is also yesterday to lock the range to one day
        break;
      case "weekly":
        start = format(subDays(today, 6), "yyyy-MM-dd"); // Last 7 days including today
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
  }, [range]);

  // Calculate Summary Totals
  const totalSales =
    reportData?.sales?.reduce((sum, s) => sum + s.revenue, 0) || 0;
  const totalCash = reportData?.sales?.reduce((sum, s) => sum + s.cash, 0) || 0;
  const totalDebt =
    reportData?.sales?.reduce((sum, s) => sum + s.credit, 0) || 0;

  const totalProfit =
    reportData?.sales?.reduce((sum, s) => sum + s.profit, 0) || 0;

  const reportRef = useRef(null); // Reference to the area you want to export

  const exportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    // Use html2canvas to capture the charts/cards as an image
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Business_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Reports"
        subtitle="Analyze financial growth and stock value"
      >
        {/* <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div> */}

        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Show the Calendar only if "Custom" is selected */}
          {range === "custom" && (
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[280px] justify-start text-left font-normal"
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
                      <span>Pick a date</span>
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
            </div>
          )}

          <Button onClick={exportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div ref={reportRef} className="p-4 bg-white space-y-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                Rs. {totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" /> Target tracking active
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                Cash Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                Rs. {totalCash.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Wallet className="w-3 h-3 mr-1" /> Direct liquidity
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-100 bg-red-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Outstanding Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                Rs. {totalDebt.toLocaleString()}
              </div>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <Users className="w-3 h-3 mr-1" /> Accounts receivable
              </p>
            </CardContent>
          </Card>
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-600">
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {"Rs."} {totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                Actual earnings after costs
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">
                Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                Rs. {(reportData?.inventory?.total_cost || 0).toLocaleString()}
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-amber-600 uppercase font-semibold">
                  Warehouse Cost
                </p>
                <p className="text-[10px] text-amber-700">
                  Retail: Rs.{" "}
                  {(reportData?.inventory?.retail_value || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Line
            type="monotone"
            dataKey="profit"
            name="Net Profit"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.sales}>
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
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Cash vs Debt Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cash Collection vs. Credit
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.sales}>
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
                    name="Cash Received"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="credit"
                    name="Pending Debt"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Value (Quick Report) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Current Stock Asset Value
              </CardTitle>
              <Badge variant="outline">Live Valuation</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase">Cost Value</p>
                  <p className="text-xl font-bold">
                    Rs. {reportData?.inventory?.total_cost?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase">
                    Retail Value
                  </p>
                  <p className="text-xl font-bold text-indigo-600">
                    Rs. {reportData?.inventory?.retail_value?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase">
                    Potential Profit
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    Rs.{" "}
                    {(
                      reportData?.inventory?.retail_value -
                      reportData?.inventory?.total_cost
                    )?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase">
                    Stock Health
                  </p>
                  <p className="text-lg font-medium text-amber-600">
                    Average Margin:{" "}
                    {(
                      ((reportData?.inventory?.retail_value -
                        reportData?.inventory?.total_cost) /
                        reportData?.inventory?.retail_value) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
