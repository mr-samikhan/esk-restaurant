// import { useOrders } from "@/hooks/useOrders";
// import OrderModal from "../components/pos/OrderModal";
// import { useOrderModal } from "../hooks/useOrderModal";

// export default function Orders() {
//   const { orders, updateStatus, deleteOrder } = useOrders();
//   const { openModal } = useOrderModal();

//   return (
//     <div className="p-5">
//       <h1 className="text-2xl font-bold mb-5">Active Orders</h1>

//       <div className="grid grid-cols-3 gap-4">
//         {orders.map((order) => (
//           <div key={order.id} className="bg-white rounded-xl shadow p-4 border">
//             {/* Header */}
//             <div className="flex justify-between items-center">
//               <h2 className="font-bold text-lg">{order.table_name}</h2>

//               <span
//                 className={`px-2 py-1 rounded text-xs text-white ${
//                   order.status === "pending"
//                     ? "bg-orange-500"
//                     : order.status === "preparing"
//                       ? "bg-yellow-500"
//                       : order.status === "served"
//                         ? "bg-blue-500"
//                         : "bg-green-500"
//                 }`}
//               >
//                 {order.status}
//               </span>
//             </div>

//             {/* Items */}
//             <div className="mt-3">
//               {order.items?.map((item) => (
//                 <div
//                   key={item.id}
//                   className="flex justify-between text-sm py-1"
//                 >
//                   <span>
//                     {item.item_name} × {item.qty}
//                   </span>

//                   <span>Rs {Number(item.price) * Number(item.qty)}</span>
//                 </div>
//               ))}
//             </div>

//             {/* Total */}
//             <div className="mt-3 border-t pt-2 font-bold text-green-600">
//               Total: Rs {order.total_amount}
//             </div>

//             {/* Actions */}
//             <div className="mt-4 flex flex-wrap gap-2">
//               <button
//                 onClick={() => openModal(order)}
//                 className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
//               >
//                 View
//               </button>

//               {/* <button
//                 onClick={() => updateStatus(order.id, "preparing")}
//                 className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
//               >
//                 Preparing
//               </button>

//               <button
//                 onClick={() => updateStatus(order.id, "served")}
//                 className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
//               >
//                 Served
//               </button> */}

//               <button
//                 onClick={() => updateStatus(order.id, "paid")}
//                 className="bg-green-600 text-white px-3 py-1 rounded text-sm"
//               >
//                 Paid
//               </button>

//               <button
//                 onClick={() => deleteOrder(order.id)}
//                 className="bg-red-500 text-white px-3 py-1 rounded text-sm"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       <OrderModal />
//     </div>
//   );
// }

import { useOrders } from "@/hooks/useOrders";
import OrderModal from "../components/pos/OrderModal";
import { useOrderModal } from "../hooks/useOrderModal";

export default function Orders() {
  const { orders, updateStatus, deleteOrder } = useOrders();
  const { openModal } = useOrderModal();

  // Filters OUT completed and paid orders
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "paid",
  );

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
            const paymentMethod = order.payment_method || "cash";

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

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t">
                  <button
                    onClick={() => openModal(order)}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Edit / Checkout
                  </button>

                  <button
                    onClick={() => updateStatus(order.id, "completed")}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Mark Paid
                  </button>

                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderModal />
    </div>
  );
}
