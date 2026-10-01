import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import InvoiceModal from "../components/pos/InvoiceModal";
import ReceiptPreviewModal from "../components/pos/ReceiptPreviewModal";
import { generateReceipt } from "../lib/receipt-generator";
import { API } from "../constants/apiEndPoints";
import { useSettings } from "../hooks/useSettings";

function Invoices() {
  const { invoices, loading } = useInvoices();
  const { settings } = useSettings();

  // State for Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // States for Receipt Preview Modal
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const completedInvoices = invoices?.filter(
    (inv) => inv.status === "completed" || inv.payment_status === "paid",
  );

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

  // Action 1: Open Thermal Receipt Preview directly
  const handlePreviewReceipt = (invoice) => {
    const payload = createReceiptPayload(invoice);
    const html = generateReceipt(payload, settings);
    setPreviewHtml(html);
    setIsPreviewOpen(true);
  };

  // Action 2: Trigger Physical Print (Fallback to Preview if no printer)
  const handlePrint = async (invoice) => {
    console.log("invoice", invoice);
    try {
      const payload = createReceiptPayload(invoice);
      const html = generateReceipt(payload, settings);

      const res = await API.print.printReceipt(html);

      // If no printer detected, open receipt preview modal automatically
      if (res?.noPrinter || !res?.success) {
        setPreviewHtml(html);
        setIsPreviewOpen(true);
      } else if (res?.success) {
        console.log("Printed successfully");
      }
    } catch (err) {
      console.error("Print failed:", err);
      handlePreviewReceipt(invoice);
    }
  };

  if (loading) {
    return <div className="p-5 text-gray-500">Loading invoice history...</div>;
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Invoice History</h1>
        <span className="text-sm font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-300">
          {completedInvoices?.length || 0} Paid Invoices
        </span>
      </div>

      {!completedInvoices || completedInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-500 shadow-sm">
          No completed invoices found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {completedInvoices.map((invoice) => {
            const total = Number(invoice.total_amount) || 0;
            const paymentMethod = invoice.payment_method || "cash";

            return (
              <div
                key={invoice.id}
                className="border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">
                        Invoice #{invoice.id}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {invoice.table_name || "Takeaway"} •{" "}
                        {invoice.customer_name || "Walk-in"}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded border">
                      {paymentMethod}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>
                        {invoice.created_at
                          ? new Date(invoice.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600 font-semibold capitalize">
                        {invoice.status || "Paid"}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-green-700">
                    <span>Total Paid:</span>
                    <span>Rs {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Separate Actions Bar */}
                <div className="flex gap-1.5 mt-4 pt-3 border-t">
                  {/* 1. View Invoice Details Modal */}
                  <button
                    onClick={() => setSelectedInvoice(invoice.id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-semibold py-1.5 px-1 rounded transition-colors border"
                    title="View Invoice Details"
                  >
                    Details
                  </button>

                  {/* 2. Preview Receipt View */}
                  <button
                    onClick={() => handlePreviewReceipt(invoice)}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-semibold py-1.5 px-1 rounded transition-colors"
                    title="Preview Thermal Receipt"
                  >
                    Preview
                  </button>

                  {/* 3. Send to Printer */}
                  <button
                    onClick={() => handlePrint(invoice)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-1.5 px-1 rounded transition-colors"
                    title="Print Receipt"
                  >
                    Print
                  </button>
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
