// import { useOrders } from "@/hooks/useOrders";
// import OrderModal from "../components/pos/OrderModal";
// import { useOrderModal } from "../hooks/useOrderModal";

// export default function Orders() {
//   const { orders, updateStatus, deleteOrder } = useOrders();
//   const { openModal } = useOrderModal();

//   // Filters OUT completed and paid orders
//   const activeOrders = orders?.filter(
//     (order) => order.status !== "completed" && order.status !== "paid",
//   );

//   return (
//     <div className="p-5">
//       <div className="flex justify-between items-center mb-5">
//         <h1 className="text-2xl font-bold">Active / Unpaid Orders</h1>
//         <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
//           {activeOrders?.length || 0} Pending
//         </span>
//       </div>

//       {!activeOrders || activeOrders.length === 0 ? (
//         <div className="bg-white rounded-xl border p-10 text-center text-gray-500 shadow-sm">
//           No pending or unpaid orders found.
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {activeOrders.map((order) => {
//             const subtotal = Number(order.subtotal) || 0;
//             const discount = Number(order.discount_amount) || 0;
//             const serviceCharges = Number(order.service_charges) || 0;
//             const kpraTax = Number(order.kpra_tax) || Number(order.tax) || 0;
//             const total = Number(order.total_amount) || 0;
//             const paymentMethod = order.payment_method || "cash";

//             return (
//               <div
//                 key={order.id}
//                 className="bg-white rounded-xl shadow p-4 border flex flex-col justify-between"
//               >
//                 <div>
//                   {/* Header */}
//                   <div className="flex justify-between items-center border-b pb-2">
//                     <div>
//                       <h2 className="font-bold text-lg text-gray-800">
//                         {order.table_name || "Takeaway"}
//                       </h2>
//                       <p className="text-xs text-gray-500">
//                         Order #{order.id} • Customer:{" "}
//                         {order.customer_name || "Walk-in"}
//                       </p>
//                     </div>

//                     <span className="px-2 py-1 rounded text-xs font-semibold text-white uppercase bg-amber-500">
//                       {order.status || "Pending"}
//                     </span>
//                   </div>

//                   {/* Items List */}
//                   <div className="mt-3 space-y-1 max-h-36 overflow-y-auto pr-1">
//                     {order.items?.map((item) => (
//                       <div
//                         key={item.id}
//                         className="flex justify-between text-sm text-gray-700 py-0.5"
//                       >
//                         <span>
//                           {item.item_name} × {item.qty}
//                         </span>
//                         <span className="font-medium">
//                           Rs{" "}
//                           {(Number(item.price) * Number(item.qty)).toFixed(2)}
//                         </span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Financial Breakdown */}
//                   <div className="mt-3 border-t pt-2 space-y-1 text-xs text-gray-600">
//                     <div className="flex justify-between">
//                       <span>Subtotal:</span>
//                       <span>Rs {subtotal.toFixed(2)}</span>
//                     </div>

//                     {discount > 0 && (
//                       <div className="flex justify-between text-red-500">
//                         <span>Discount:</span>
//                         <span>- Rs {discount.toFixed(2)}</span>
//                       </div>
//                     )}

//                     {serviceCharges > 0 && (
//                       <div className="flex justify-between">
//                         <span>Service Charges:</span>
//                         <span>Rs {serviceCharges.toFixed(2)}</span>
//                       </div>
//                     )}

//                     {kpraTax > 0 && (
//                       <div className="flex justify-between">
//                         <span>KPRA Tax:</span>
//                         <span>Rs {kpraTax.toFixed(2)}</span>
//                       </div>
//                     )}

//                     <div className="flex justify-between border-t pt-1 font-bold text-sm text-green-700">
//                       <span>Total Due:</span>
//                       <span>Rs {total.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Actions */}
//                 <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t">
//                   <button
//                     onClick={() => openModal(order)}
//                     className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
//                   >
//                     Edit / Checkout
//                   </button>

//                   <button
//                     onClick={() => updateStatus(order.id, "completed")}
//                     className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
//                   >
//                     Mark Paid
//                   </button>

//                   <button
//                     onClick={() => deleteOrder(order.id)}
//                     className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors ml-auto"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <OrderModal />
//     </div>
//   );
// }

import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import OrderModal from "../components/pos/OrderModal";
import ReceiptPreviewModal from "../components/pos/ReceiptPreviewModal";
import { useOrderModal } from "../hooks/useOrderModal";
import { generateReceipt } from "../lib/receipt-generator";
import { API } from "../constants/apiEndPoints";
import { useSettings } from "../hooks/useSettings";
import { useActiveOrder } from "../hooks/useActiveOrder";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Orders() {
  const { isAdmin } = useAuth();
  // console.log("isAdmin", isAdmin);

  const { orders, updateStatus, deleteOrder } = useOrders();
  const navigate = useNavigate();
  const { setOrder } = useActiveOrder();
  const { openModal } = useOrderModal();
  const { settings } = useSettings();

  // Receipt Preview States
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters OUT completed and paid orders
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "paid",
  );

  // Helper to format receipt data payload
  const createReceiptPayload = (order) => ({
    ...order,
    items: order.items || [],
    subtotal: Number(order.subtotal) || 0,
    total: Number(order.total_amount) || 0,
    discount: Number(order.discount_amount) || Number(order.discount) || 0,
    kpra_tax: Number(order.kpra_tax) || Number(order.tax) || 0,
    service_charges: Number(order.service_charges) || 0,
    paid_amount: Number(order.paid_amount) || Number(order.total_amount) || 0,
    settings: settings || {},
  });

  // Action 1: Preview Thermal Receipt
  const handlePreviewReceipt = (order) => {
    const payload = createReceiptPayload(order);
    const html = generateReceipt(payload, settings);
    setPreviewHtml(html);
    setIsPreviewOpen(true);
  };

  // Action 2: Direct Print (Fallback to Preview if no printer)
  const handlePrint = async (order) => {
    try {
      const payload = createReceiptPayload(order);
      const html = generateReceipt(payload, settings);

      const res = await API.print.printReceipt(html);

      // If no printer detected or failed, open preview modal automatically
      if (res?.noPrinter || !res?.success) {
        setPreviewHtml(html);
        setIsPreviewOpen(true);
      } else if (res?.success) {
        console.log("Printed successfully");
      }
    } catch (err) {
      console.error("Print failed:", err);
      handlePreviewReceipt(order);
    }
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Active / Unpaid Orders</h1>
        <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
          {activeOrders?.length || 0} Pending
        </span>
      </div>

      {!activeOrders || activeOrders.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-500 shadow-sm">
          No pending or unpaid orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((order) => {
            const subtotal = Number(order.subtotal) || 0;
            const discount = Number(order.discount_amount) || 0;
            const serviceCharges = Number(order.service_charges) || 0;
            const kpraTax = Number(order.kpra_tax) || Number(order.tax) || 0;
            const total = Number(order.total_amount) || 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow p-4 border flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">
                        {order.table_name || "Takeaway"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Order #{order.id} • Customer:{" "}
                        {order.customer_name || "Walk-in"}
                      </p>
                    </div>

                    <span className="px-2 py-1 rounded text-xs font-semibold text-white uppercase bg-amber-500">
                      {order.status || "Pending"}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="mt-3 space-y-1 max-h-36 overflow-y-auto pr-1">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm text-gray-700 py-0.5"
                      >
                        <span>
                          {item.item_name} × {item.qty}
                        </span>
                        <span className="font-medium">
                          Rs{" "}
                          {(Number(item.price) * Number(item.qty)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="mt-3 border-t pt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs {subtotal.toFixed(2)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Discount:</span>
                        <span>- Rs {discount.toFixed(2)}</span>
                      </div>
                    )}

                    {serviceCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Service Charges:</span>
                        <span>Rs {serviceCharges.toFixed(2)}</span>
                      </div>
                    )}

                    {kpraTax > 0 && (
                      <div className="flex justify-between">
                        <span>KPRA Tax:</span>
                        <span>Rs {kpraTax.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-1 font-bold text-sm text-green-700">
                      <span>Total Due:</span>
                      <span>Rs {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t">
                  {/* <button
                    onClick={() => openModal(order)}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Edit / Checkout
                  </button> */}
                  <button
                    onClick={async () => {
                      // console.log("Opening POS for order:", order);
                      // return;
                      const res = await API.orders.getOrCreate(
                        order.table_id,
                        order.table_name,
                      );

                      if (res?.order) {
                        setOrder(res.order);
                        navigate("/pos");
                      } else {
                        alert("Could not open order for this table.");
                      }
                    }}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Edit / Checkout
                  </button>

                  <button
                    onClick={() => handlePreviewReceipt(order)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 border px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                    title="Preview Receipt"
                  >
                    Preview
                  </button>

                  <button
                    onClick={() => handlePrint(order)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                    title="Print Receipt"
                  >
                    Print
                  </button>

                  <button
                    onClick={() => updateStatus(order.id, "completed")}
                    className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Mark Paid
                  </button>
                  {isAdmin && (
                    <button
                      // disabled={!isAdmin}
                      onClick={() => deleteOrder(order.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors ml-auto"
                      title="Delete Order"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Modal */}
      <OrderModal />

      {/* Receipt Thermal Visual Preview Modal */}
      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={previewHtml}
      />
    </div>
  );
}
