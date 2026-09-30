import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import InvoiceModal from "../components/pos/InvoiceModal";
import { generateReceipt } from "../lib/receipt-generator";
import { API } from "../constants/apiEndPoints";
import { useSettings } from "../hooks/useSettings";

function Invoices() {
  const { invoices, loading } = useInvoices();
  const { settings } = useSettings();

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter ONLY completed / paid orders for the invoice history
  const completedInvoices = invoices?.filter(
    (inv) => inv.status === "completed" || inv.payment_status === "paid",
  );

  const handlePrint = async (invoice) => {
    try {
      const html = generateReceipt(
        {
          order: invoice,
          items: invoice.items || [],
          total: Number(invoice.total_amount) || 0,
        },
        settings,
      );

      const res = await API.print.printReceipt(html);

      if (res?.success) {
        console.log("Printed successfully");
      }
    } catch (err) {
      console.error("Print failed:", err);
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

                  {/* Summary Details */}
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

                  {/* Total */}
                  <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-green-700">
                    <span>Total Paid:</span>
                    <span>Rs {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => setSelectedInvoice(invoice.id)}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    View
                  </button>

                  <button
                    onClick={() => handlePrint(invoice)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InvoiceModal
        invoiceId={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

export default Invoices;
