// import { useState, useEffect } from "react";
// import { useCategories } from "@/hooks/useCategories";
// import { useItems } from "@/hooks/useItems";
// import { useCart } from "@/hooks/useCart";
// import { useActiveOrder } from "@/hooks/useActiveOrder";
// import { API } from "../constants/apiEndPoints";
// import { useNavigate } from "react-router-dom";
// import { generateReceipt } from "../lib/receipt-generator";
// import { useSettings } from "../hooks/useSettings";
// import PageHeader from "../components/pos/PageHeader";
// import { translations } from "../lib/translations";

// export default function POS() {
//   const navigate = useNavigate();
//   const { settings } = useSettings();

//   const t = translations[settings.language] || translations.en;

//   const { categories } = useCategories();
//   const [selectedCategory, setSelectedCategory] = useState(null);

//   const [discount, setDiscount] = useState(0);
//   const [tax, setTax] = useState(0);
//   const [customer, setCustomer] = useState(null);

//   const { order } = useActiveOrder();
//   const { items } = useItems(selectedCategory);

//   const {
//     cart,
//     addToCart,
//     removeItem,
//     increaseQty,
//     decreaseQty,
//     getTotal,
//     clearCart,
//   } = useCart(order);

//   const handleCheckout = async () => {
//     try {
//       if (!order?.id) return;
//       const payload = {
//         orderId: order.id,

//         customerId: customer?.id || null,
//         customerName: customer?.name || "Walk-in",

//         subtotal: getTotal(),
//         discount: discountAmount,
//         tax: taxAmount,
//         total: finalTotal,
//       };

//       // console.log("payload", payload);
//       // return;

//       const checkoutRes = await API.orders.checkout({ ...payload });

//       if (!checkoutRes.success) {
//         alert("Checkout failed");
//         return;
//       }

//       const receipt = generateReceipt(
//         {
//           id: order.id,
//           table_name: order.table_name,
//           items: cart,

//           subtotal: getTotal(),
//           discount: discountAmount,
//           tax: taxAmount,
//           total: finalTotal,

//           customer_name: customer?.name,
//         },
//         settings,
//       );

//       await API.print.printReceipt(receipt);

//       window.location.reload();
//     } catch (err) {
//       console.error(err);
//     }
//   };
//   const handlePrint = async () => {
//     try {
//       if (!order?.id) return;

//       const html = generateReceipt(
//         {
//           id: order?.id,
//           table_name: order?.table_name,
//           items: cart,
//           total: getTotal(),
//           discount: 0,
//           paid_amount: 0,
//         },
//         settings,
//       );

//       const res = await API.print.printReceipt(html);

//       if (res.success) {
//         console.log("Printed successfully");
//       }
//     } catch (err) {
//       console.error("Print failed:", err);
//     }
//   };

//   const subTotal = getTotal();

//   const discountAmount = Number(discount) || 0;
//   const taxAmount = Number(tax) || 0;

//   const finalTotal = Math.max(0, subTotal - discountAmount - taxAmount);

//   if (!order) {
//     return (
//       <>
//         <PageHeader
//           title={t.pos} // Translated
//           actionLabel={t.pos} // Translated
//           subtitle={t.pos_title}
//         />
//         <div className="p-10 text-center text-gray-500">
//           No active table selected
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <PageHeader
//         title={t.pos} // Translated
//         actionLabel={t.pos} // Translated
//         subtitle={t.pos_title}
//       />
//       <div className="flex h-screen">
//         {/* LEFT */}
//         <div className="w-1/5 border-r p-3">
//           {categories.map((cat) => (
//             <button
//               key={cat.id}
//               onClick={() => setSelectedCategory(cat.id)}
//               className="w-full p-2 mb-2 bg-gray-100 rounded"
//             >
//               {cat.name}
//             </button>
//           ))}
//         </div>

//         {/* MIDDLE */}
//         <div className="flex-1 p-4">
//           {items.map((item) => (
//             <div key={item.id} className="border p-3 mb-2">
//               <h3>{item.name}</h3>

//               <button
//                 onClick={() => addToCart(item)}
//                 className="bg-blue-500 text-white px-3 py-1"
//               >
//                 Add
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* RIGHT CART */}
//         <div className="w-1/4 border-l p-3 flex flex-col">
//           <h2 className="font-bold mb-3">Cart</h2>

//           <div className="flex-1 overflow-auto">
//             {cart.map((item) => (
//               <div key={item.id} className="border-b py-2">
//                 <p className="font-semibold">{item.name || item?.item_name}</p>

//                 <div className="flex items-center gap-2 mt-1">
//                   <button onClick={() => decreaseQty(item.id)}>-</button>
//                   <span>{item.qty}</span>
//                   <button onClick={() => increaseQty(item.id)}>+</button>

//                   <span className="ml-auto">Rs {item.total}</span>
//                 </div>

//                 <button
//                   onClick={() => removeItem(item.id)}
//                   className="text-red-500 text-sm"
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>

//           {/* CUSTOMER (optional) */}
//           <div className="mb-3">
//             <label className="text-sm font-semibold">Customer (optional)</label>

//             <input
//               className="w-full border p-2 rounded mt-1"
//               placeholder="Walk-in / Search customer"
//               value={customer?.name || ""}
//               onChange={(e) => setCustomer({ id: null, name: e.target.value })}
//             />
//           </div>

//           {/* DISCOUNT */}
//           <div className="mb-3">
//             <label className="text-sm font-semibold">Discount</label>

//             <input
//               type="number"
//               className="w-full border p-2 rounded mt-1"
//               value={discount}
//               onChange={(e) => setDiscount(Number(e.target.value))}
//               placeholder="0"
//             />
//           </div>

//           {/* TAX */}
//           <div className="mb-3">
//             <label className="text-sm font-semibold">Tax</label>

//             <input
//               type="number"
//               className="w-full border p-2 rounded mt-1"
//               value={tax}
//               onChange={(e) => setTax(Number(e.target.value))}
//               placeholder="0"
//             />
//           </div>

//           {/* TOTAL + CHECKOUT */}
//           <div className="border-t pt-3">
//             <h3 className="font-bold">Total: Rs {finalTotal || "0.00"}</h3>

//             {cart.length > 0 && (
//               <>
//                 <button
//                   className="w-full mt-2 bg-green-600 text-white py-2 rounded"
//                   onClick={handleCheckout}
//                 >
//                   Checkout
//                 </button>
//                 <button
//                   onClick={handlePrint}
//                   className="w-full mt-2 bg-black text-white py-2 rounded"
//                 >
//                   Print Invoice
//                 </button>
//                 <button
//                   onClick={clearCart}
//                   className="w-full bg-red-500 text-white py-2 rounded mt-2"
//                 >
//                   Clear Cart
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useItems } from "@/hooks/useItems";
import { useCart } from "@/hooks/useCart";
import { useActiveOrder } from "@/hooks/useActiveOrder";
import { API } from "../constants/apiEndPoints";
import { useNavigate } from "react-router-dom";
import { generateReceipt } from "../lib/receipt-generator";
import { useSettings } from "../hooks/useSettings";
import PageHeader from "../components/pos/PageHeader";
import { translations } from "../lib/translations";

export default function POS() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const t = translations[settings.language] || translations.en;

  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [discount, setDiscount] = useState(0);
  const [serviceCharges, setServiceCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' or 'online'
  const [customer, setCustomer] = useState(null);

  const { order } = useActiveOrder();
  const { items } = useItems(selectedCategory);

  const {
    cart,
    addToCart,
    removeItem,
    increaseQty,
    decreaseQty,
    getTotal,
    clearCart,
  } = useCart(order);

  // Financial Calculations
  const subTotal = getTotal();
  const discountAmount = Number(discount) || 0;
  const serviceChargeAmount = Number(serviceCharges) || 0;

  // KPRA Tax: 10% for Cash, 6% for Online based on Subtotal
  const kpraPercentage = paymentMethod === "cash" ? 0.1 : 0.06;
  const kpraTaxAmount = subTotal * kpraPercentage;

  const finalTotal = Math.max(
    0,
    subTotal - discountAmount + serviceChargeAmount + kpraTaxAmount,
  );

  const handleCheckout = async (isPrint = true) => {
    try {
      if (!order?.id) return;

      const payload = {
        orderId: order.id,
        customerId: customer?.id || null,
        customerName: customer?.name || "Walk-in",
        paymentMethod: paymentMethod,
        subtotal: subTotal,
        discount: discountAmount,
        serviceCharges: serviceChargeAmount,
        kpraTax: kpraTaxAmount,
        kpraPercentage: kpraPercentage * 100,
        total: finalTotal,
        status: isPrint ? "completed" : "pending",
      };

      const checkoutRes = await API.orders.checkout({ ...payload });

      if (!checkoutRes.success) {
        alert("Checkout failed");
        return;
      }

      if (isPrint) {
        const receipt = generateReceipt(
          {
            id: order.id,
            table_name: order.table_name,
            items: cart,
            subtotal: subTotal,
            discount: discountAmount,
            serviceCharges: serviceChargeAmount,
            kpraTax: kpraTaxAmount,
            paymentMethod: paymentMethod,
            total: finalTotal,
            customer_name: customer?.name,
          },
          settings,
        );

        await API.print.printReceipt(receipt);
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (!order) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
        <div className="p-10 text-center text-gray-500">
          No active table selected
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-4 pt-2 flex-shrink-0">
        <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT CATEGORIES */}
        <div className="w-1/5 border-r p-3 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="w-full p-2 mb-2 bg-gray-100 rounded text-left hover:bg-gray-200"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* MIDDLE ITEMS */}
        <div className="flex-1 p-4 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="border p-3 mb-2 flex justify-between items-center rounded"
            >
              <h3>{item.name}</h3>
              <button
                onClick={() => addToCart(item)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT CART */}
        <div className="w-1/4 border-l p-3 flex flex-col h-full bg-white overflow-hidden">
          <h2 className="font-bold mb-2 text-lg flex-shrink-0">Cart</h2>

          {/* SCROLLABLE CART ITEMS ONLY */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 border-b mb-2">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-4 text-center">
                Cart is empty
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border-b py-2">
                  <p className="font-semibold text-sm">
                    {item.name || item?.item_name}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="px-2 py-0.5 bg-gray-200 rounded font-bold hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() => increaseQty(item.id)}
                      className="px-2 py-0.5 bg-gray-200 rounded font-bold hover:bg-gray-300"
                    >
                      +
                    </button>

                    <span className="ml-auto font-medium text-sm">
                      Rs {item.total}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-xs mt-1 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* FIXED BOTTOM CONTROLS & SUMMARY */}
          <div className="flex-shrink-0 space-y-2 pt-1">
            {/* CUSTOMER */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Customer (optional)
              </label>
              <input
                className="w-full border p-1.5 rounded text-sm mt-0.5"
                placeholder="Walk-in / Search customer"
                value={customer?.name || ""}
                onChange={(e) =>
                  setCustomer({ id: null, name: e.target.value })
                }
              />
            </div>

            {/* PAYMENT METHOD DROPDOWN */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Payment Method
              </label>
              <select
                className="w-full border p-1.5 rounded text-sm mt-0.5 bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash (10% KPRA)</option>
                <option value="online">Online (6% KPRA)</option>
              </select>
            </div>

            {/* DISCOUNT & SERVICE CHARGES */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Discount
                </label>
                <input
                  type="number"
                  className="w-full border p-1.5 rounded text-sm mt-0.5"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Service Charges
                </label>
                <input
                  type="number"
                  className="w-full border p-1.5 rounded text-sm mt-0.5"
                  value={serviceCharges}
                  onChange={(e) => setServiceCharges(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* SUMMARY BREAKDOWN */}
            <div className="border-t pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>Rs {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>KPRA ({paymentMethod === "cash" ? "10%" : "6%"}):</span>
                <span>Rs {kpraTaxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-800 border-t pt-1">
                <span>Total:</span>
                <span>Rs {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {cart.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <button
                  className="w-full bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                  onClick={() => handleCheckout(true)}
                >
                  Pay with Print
                </button>
                <button
                  className="w-full bg-yellow-600 text-white py-2 rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
                  onClick={() => handleCheckout(false)}
                >
                  Pay without Print (Pending)
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-red-500 text-white py-1.5 rounded text-xs font-medium hover:bg-red-600 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
