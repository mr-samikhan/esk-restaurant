import { useState, useMemo } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import InvoiceModal from "../components/pos/InvoiceModal";
import ReceiptPreviewModal from "../components/pos/ReceiptPreviewModal";
import { generateReceipt } from "../lib/receipt-generator";
import { API } from "../constants/apiEndPoints";
import { useSettings } from "../hooks/useSettings";

function Invoices() {
  const { invoices, loading, deleteInvoice, refetch } = useInvoices();
  const { settings } = useSettings();

  // State for Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // States for Receipt Preview Modal
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter States
  const [filterPreset, setFilterPreset] = useState("today"); // 'today', 'yesterday', 'this_week', 'this_month', 'custom', 'all'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Timezone-Safe SQLite Date Parser
  const parseSqliteDate = (dateStr) => {
    if (!dateStr) return null;

    if (
      dateStr.includes("T") &&
      (dateStr.endsWith("Z") || dateStr.includes("+"))
    ) {
      return new Date(dateStr);
    }

    const utcStr = dateStr.includes("T")
      ? dateStr
      : dateStr.replace(" ", "T") + "Z";

    return new Date(utcStr);
  };

  // Assign sequential numbers while preserving Newest-First order
  const formattedInvoices = useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) return [];

    // Sort descending so last added comes first (dateB - dateA)
    const sorted = [...invoices].sort((a, b) => {
      const dateA = parseSqliteDate(a.created_at) || 0;
      const dateB = parseSqliteDate(b.created_at) || 0;

      if (dateB === dateA) {
        return (b.id || 0) - (a.id || 0);
      }

      return dateB - dateA;
    });

    return sorted.map((inv) => ({
      ...inv,
      invoiceNumber:
        inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`,
    }));
  }, [invoices]);

  // Get completed invoices
  const completedInvoices = useMemo(() => {
    return formattedInvoices.filter((inv) => {
      const status = String(inv.status || "").toLowerCase();
      const paymentStatus = String(inv.payment_status || "").toLowerCase();

      return (
        status === "completed" ||
        status === "paid" ||
        paymentStatus === "paid" ||
        paymentStatus === "completed" ||
        (!inv.status && !inv.payment_status)
      );
    });
  }, [formattedInvoices]);

  // Filter logic for Presets and Custom Ranges
  const filteredInvoices = useMemo(() => {
    const now = new Date();

    return completedInvoices.filter((invoice) => {
      const invDate = parseSqliteDate(invoice.created_at);
      if (!invDate || isNaN(invDate.getTime())) return false;

      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfToday);
      endOfYesterday.setMilliseconds(-1);

      if (filterPreset === "today") {
        return invDate >= startOfToday && invDate <= endOfToday;
      }

      if (filterPreset === "yesterday") {
        return invDate >= startOfYesterday && invDate <= endOfYesterday;
      }

      if (filterPreset === "this_week") {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        return invDate >= startOfWeek;
      }

      if (filterPreset === "this_month") {
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        return invDate >= startOfMonth;
      }

      if (filterPreset === "custom") {
        if (startDate) {
          const start = new Date(startDate);
          if (invDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          if (invDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [completedInvoices, filterPreset, startDate, endDate]);

  // Overall Financial Summaries for filtered set
  const filteredTotals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        const subtotal = Number(inv.subtotal) || Number(inv.total_amount) || 0;
        const discount = Number(inv.discount) || 0;
        const kpraTax = Number(inv.kpra_tax) || Number(inv.tax) || 0;
        const serviceCharges = Number(inv.service_charges) || 0;
        const total = Number(inv.total_amount) || 0;

        acc.subtotal += subtotal;
        acc.discount += discount;
        acc.kpraTax += kpraTax;
        acc.serviceCharges += serviceCharges;
        acc.total += total;

        return acc;
      },
      { subtotal: 0, discount: 0, kpraTax: 0, serviceCharges: 0, total: 0 },
    );
  }, [filteredInvoices]);

  // Helper to build receipt payload object
  const createReceiptPayload = (invoice) => ({
    ...invoice,
    items: invoice.items || [],
    subtotal: Number(invoice.subtotal) || Number(invoice.total_amount) || 0,
    total: Number(invoice.total_amount) || 0,
    discount: Number(invoice.discount) || 0,
    kpra_tax: Number(invoice.kpra_tax) || Number(invoice.tax) || 0,
    service_charges: Number(invoice.service_charges) || 0,
    paid_amount:
      Number(invoice.paid_amount) || Number(invoice.total_amount) || 0,
    settings: settings || {},
  });

  const handlePreviewReceipt = (invoice) => {
    const payload = createReceiptPayload(invoice);
    const html = generateReceipt(payload, settings);
    setPreviewHtml(html);
    setIsPreviewOpen(true);
  };

  const handlePrint = async (invoice) => {
    try {
      const payload = createReceiptPayload(invoice);
      const html = generateReceipt(payload, settings);
      const res = await API.print.printReceipt(html);

      if (res?.noPrinter || !res?.success) {
        setPreviewHtml(html);
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error("Print failed:", err);
      handlePreviewReceipt(invoice);
    }
  };

  // Download Individual Invoice PDF
  const handleDownloadPDF = (invoice) => {
    const payload = createReceiptPayload(invoice);
    const htmlContent = generateReceipt(payload, settings);

    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";

    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    printIframe.contentWindow.focus();
    setTimeout(() => {
      printIframe.contentWindow.print();
      document.body.removeChild(printIframe);
    }, 500);
  };

  // Download Filtered Summary Report PDF
  const handleDownloadSummaryPDF = () => {
    if (filteredInvoices.length === 0) return;

    const summaryHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoices Summary Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { margin-bottom: 5px; }
            p.sub { font-size: 12px; color: #666; margin-top: 0; }
            .totals { display: flex; gap: 15px; margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .tot-box { flex: 1; }
            .tot-box span { display: block; font-size: 10px; color: #666; text-transform: uppercase; }
            .tot-box strong { font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .num { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Invoice Sales Summary</h1>
          <p class="sub">Generated on ${new Date().toLocaleString()} • Total Invoices: ${filteredInvoices.length}</p>
          
          <div class="totals">
            <div class="tot-box"><span>Subtotal</span><strong>Rs ${filteredTotals.subtotal.toFixed(2)}</strong></div>
            <div class="tot-box"><span>Discount</span><strong>Rs ${filteredTotals.discount.toFixed(2)}</strong></div>
            <div class="tot-box"><span>KPRA Tax</span><strong>Rs ${filteredTotals.kpraTax.toFixed(2)}</strong></div>
            <div class="tot-box"><span>Service Charges</span><strong>Rs ${filteredTotals.serviceCharges.toFixed(2)}</strong></div>
            <div class="tot-box"><span>Net Sales</span><strong>Rs ${filteredTotals.total.toFixed(2)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Date</th>
                <th class="num">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices
                .reverse()
                .map(
                  (inv) => `
                <tr>
                  <td>${inv.invoiceNumber}</td>
                  <td>${inv.table_name || "Takeaway"}</td>
                  <td>${inv.customer_name || "Walk-in"}</td>
                  <td>${inv.payment_method || "cash"}</td>
                  <td>${
                    inv.created_at
                      ? parseSqliteDate(inv.created_at)?.toLocaleString() ||
                        "N/A"
                      : "N/A"
                  }</td>
                  <td class="num">${(Number(inv.total_amount) || 0).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";

    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(summaryHtml);
    doc.close();

    printIframe.contentWindow.focus();
    setTimeout(() => {
      printIframe.contentWindow.print();
      document.body.removeChild(printIframe);
    }, 500);
  };

  // Delete Invoice Handler
  const handleDeleteInvoice = async (invoice) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete invoice ${invoice.invoiceNumber} (ID #${invoice.id})? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      if (deleteInvoice) {
        await deleteInvoice(invoice.id);
      } else if (API?.invoices?.delete) {
        await API.invoices.delete(invoice.id);
      } else {
        console.warn("Delete function not found in hook or API module.");
      }

      if (refetch) refetch();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      alert("Failed to delete invoice. Please try again.");
    }
  };

  // Export filtered invoices to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;

    const headers = [
      "Invoice No",
      "Database ID",
      "Table",
      "Customer",
      "Payment Method",
      "Status",
      "Date Time",
      "Subtotal (Rs)",
      "Discount (Rs)",
      "KPRA Tax (Rs)",
      "Service Charges (Rs)",
      "Total Amount (Rs)",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.id,
      `"${inv.table_name || "Takeaway"}"`,
      `"${inv.customer_name || "Walk-in"}"`,
      inv.payment_method || "cash",
      inv.status || "Paid",
      `"${
        inv.created_at
          ? parseSqliteDate(inv.created_at)?.toLocaleString() || "N/A"
          : "N/A"
      }"`,
      (Number(inv.subtotal) || Number(inv.total_amount) || 0).toFixed(2),
      (Number(inv.discount) || 0).toFixed(2),
      (Number(inv.kpra_tax) || Number(inv.tax) || 0).toFixed(2),
      (Number(inv.service_charges) || 0).toFixed(2),
      (Number(inv.total_amount) || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-5 text-gray-500">Loading invoice history...</div>;
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoice History</h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {filteredInvoices.length} invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSummaryPDF}
            disabled={filteredInvoices.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            PDF Report
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredInvoices.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">
            Subtotal
          </span>
          <span className="text-lg font-bold text-gray-800 mt-0.5 block">
            Rs {filteredTotals.subtotal.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 uppercase block">
            Total Discount
          </span>
          <span className="text-lg font-bold text-rose-700 mt-0.5 block">
            - Rs {filteredTotals.discount.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 uppercase block">
            KPRA Tax
          </span>
          <span className="text-lg font-bold text-blue-700 mt-0.5 block">
            + Rs {filteredTotals.kpraTax.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-[11px] font-semibold text-purple-600 uppercase block">
            Service Charges
          </span>
          <span className="text-lg font-bold text-purple-700 mt-0.5 block">
            + Rs {filteredTotals.serviceCharges.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border shadow-sm col-span-2 sm:col-span-1 border-green-200 bg-green-50/30">
          <span className="text-[11px] font-semibold text-green-700 uppercase block">
            Net Sales
          </span>
          <span className="text-lg font-bold text-green-800 mt-0.5 block">
            Rs {filteredTotals.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1">
            Filter:
          </span>
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "custom", label: "Custom Range" },
            { id: "all", label: "All Records" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setFilterPreset(preset.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                filterPreset === preset.id
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {filterPreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-gray-600">
                From:
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-gray-600">
                To:
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-red-600 hover:text-red-800 font-semibold px-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invoice Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-500 shadow-sm">
          No completed invoices found for the selected filter range.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredInvoices.map((invoice) => {
            const subtotal =
              Number(invoice.subtotal) || Number(invoice.total_amount) || 0;
            const discount = Number(invoice.discount) || 0;
            const kpraTax =
              Number(invoice.kpra_tax) || Number(invoice.tax) || 0;
            const serviceCharges = Number(invoice.service_charges) || 0;
            const total = Number(invoice.total_amount) || 0;
            const paymentMethod = invoice.payment_method || "cash";

            return (
              <div
                key={invoice.id}
                className="border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">
                        {invoice.invoiceNumber}
                      </h2>
                      <p className="text-[11px] text-gray-400">
                        ID: #{invoice.id} • {invoice.table_name || "Takeaway"}
                      </p>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">
                        {invoice.customer_name || "Walk-in"}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded border">
                      {paymentMethod}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Date & Time:</span>
                      <span className="font-medium text-gray-800">
                        {invoice.created_at
                          ? parseSqliteDate(invoice.created_at)?.toLocaleString(
                              [],
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            ) || "N/A"
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium text-gray-800">
                        Rs {subtotal.toFixed(2)}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount:</span>
                        <span className="font-medium">
                          - Rs {discount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {kpraTax > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>KPRA Tax:</span>
                        <span className="font-medium">
                          + Rs {kpraTax.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {serviceCharges > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Service Charges:</span>
                        <span className="font-medium">
                          + Rs {serviceCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1">
                      <span>Status:</span>
                      <span className="text-green-600 font-semibold capitalize">
                        {invoice.status || invoice.payment_status || "Paid"}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-green-700">
                    <span>Total Paid:</span>
                    <span>Rs {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t">
                  <div className="flex gap-1">
                    {/* <button
                      onClick={() => setSelectedInvoice(invoice.id)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-semibold py-1.5 px-1 rounded transition-colors border"
                      title="View Invoice Details"
                    >
                      Details
                    </button> */}

                    <button
                      onClick={() => handlePreviewReceipt(invoice)}
                      className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-semibold py-1.5 px-1 rounded transition-colors"
                      title="Preview Thermal Receipt"
                    >
                      Preview
                    </button>

                    <button
                      onClick={() => handlePrint(invoice)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-1.5 px-1 rounded transition-colors"
                      title="Print Receipt"
                    >
                      Print
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-[11px] font-semibold py-1.5 px-1 rounded transition-colors border border-indigo-200"
                      title="Download Invoice PDF"
                    >
                      PDF
                    </button>

                    <button
                      onClick={() => handleDeleteInvoice(invoice)}
                      className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[11px] font-semibold py-1.5 px-2 rounded transition-colors border border-red-200 hover:border-red-600"
                      title="Delete Invoice"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Structured Details Modal */}
      <InvoiceModal
        invoiceId={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Thermal Receipt Visual Preview Modal */}
      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={previewHtml}
      />
    </div>
  );
}

export default Invoices;
