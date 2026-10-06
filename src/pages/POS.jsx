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
//   const [serviceCharges, setServiceCharges] = useState(0);
//   const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' or 'online'
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

//   // Financial Calculations
//   const subTotal = getTotal();
//   const discountAmount = Number(discount) || 0;
//   const serviceChargeAmount = Number(serviceCharges) || 0;

//   // KPRA Tax: 10% for Cash, 6% for Online based on Subtotal
//   const kpraPercentage = paymentMethod === "cash" ? 0.1 : 0.06;
//   const kpraTaxAmount = subTotal * kpraPercentage;

//   const finalTotal = Math.max(
//     0,
//     subTotal - discountAmount + serviceChargeAmount + kpraTaxAmount,
//   );

//   const handleCheckout = async (isPrint = true) => {
//     try {
//       if (!order?.id) return;

//       const payload = {
//         orderId: order.id,
//         customerId: customer?.id || null,
//         customerName: customer?.name || "Walk-in",
//         paymentMethod: paymentMethod,
//         subtotal: subTotal,
//         discount: discountAmount,
//         serviceCharges: serviceChargeAmount,
//         kpraTax: kpraTaxAmount,
//         kpraPercentage: kpraPercentage * 100,
//         total: finalTotal,
//         status: isPrint ? "completed" : "pending",
//       };

//       const checkoutRes = await API.orders.checkout({ ...payload });

//       if (!checkoutRes.success) {
//         alert("Checkout failed");
//         return;
//       }

//       if (isPrint) {
//         const receipt = generateReceipt(
//           {
//             id: order.id,
//             table_name: order.table_name,
//             items: cart,
//             subtotal: subTotal,
//             discount: discountAmount,
//             serviceCharges: serviceChargeAmount,
//             kpraTax: kpraTaxAmount,
//             paymentMethod: paymentMethod,
//             total: finalTotal,
//             customer_name: customer?.name,
//           },
//           settings,
//         );

//         await API.print.printReceipt(receipt);
//       }

//       window.location.reload();
//       // navigate("/orders");
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   if (!order) {
//     return (
//       <div className="h-full flex flex-col overflow-hidden p-3">
//         <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
//         <div className="p-10 text-center text-gray-500">
//           No active table selected
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col overflow-hidden bg-white">
//       <div className="px-4 pt-2 flex-shrink-0">
//         <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
//       </div>

//       <div className="flex flex-1 overflow-hidden min-h-0">
//         {/* LEFT CATEGORIES */}
//         <div className="w-1/5 border-r p-3 overflow-y-auto">
//           {categories.map((cat) => (
//             <button
//               key={cat.id}
//               onClick={() => setSelectedCategory(cat.id)}
//               className="w-full p-2 mb-2 bg-gray-100 rounded text-left hover:bg-gray-200"
//             >
//               {cat.name}
//             </button>
//           ))}
//         </div>

//         {/* MIDDLE ITEMS */}
//         <div className="flex-1 p-4 overflow-y-auto">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className="border p-3 mb-2 flex justify-between items-center rounded"
//             >
//               <h3>{item.name}</h3>
//               <button
//                 onClick={() => addToCart(item)}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//               >
//                 Add
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* RIGHT CART */}
//         <div className="w-1/4 border-l p-3 flex flex-col h-full bg-white overflow-hidden">
//           <h2 className="font-bold mb-2 text-lg flex-shrink-0">Cart</h2>

//           {/* SCROLLABLE CART ITEMS ONLY */}
//           <div className="flex-1 min-h-0 overflow-y-auto pr-1 border-b mb-2">
//             {cart.length === 0 ? (
//               <p className="text-gray-400 text-sm italic py-4 text-center">
//                 Cart is empty
//               </p>
//             ) : (
//               cart.map((item) => (
//                 <div key={item.id} className="border-b py-2">
//                   <p className="font-semibold text-sm">
//                     {item.name || item?.item_name}
//                   </p>

//                   <div className="flex items-center gap-2 mt-1">
//                     <button
//                       onClick={() => decreaseQty(item.id)}
//                       className="px-2 py-0.5 bg-gray-200 rounded font-bold hover:bg-gray-300"
//                     >
//                       -
//                     </button>
//                     <span>{item.qty}</span>
//                     <button
//                       onClick={() => increaseQty(item.id)}
//                       className="px-2 py-0.5 bg-gray-200 rounded font-bold hover:bg-gray-300"
//                     >
//                       +
//                     </button>

//                     <span className="ml-auto font-medium text-sm">
//                       Rs {item.total}
//                     </span>
//                   </div>

//                   <button
//                     onClick={() => removeItem(item.id)}
//                     className="text-red-500 text-xs mt-1 hover:underline"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* FIXED BOTTOM CONTROLS & SUMMARY */}
//           <div className="flex-shrink-0 space-y-2 pt-1">
//             {/* CUSTOMER */}
//             <div>
//               <label className="text-xs font-semibold text-gray-600">
//                 Customer (optional)
//               </label>
//               <input
//                 className="w-full border p-1.5 rounded text-sm mt-0.5"
//                 placeholder="Walk-in / Search customer"
//                 value={customer?.name || ""}
//                 onChange={(e) =>
//                   setCustomer({ id: null, name: e.target.value })
//                 }
//               />
//             </div>

//             {/* PAYMENT METHOD DROPDOWN */}
//             <div>
//               <label className="text-xs font-semibold text-gray-600">
//                 Payment Method
//               </label>
//               <select
//                 className="w-full border p-1.5 rounded text-sm mt-0.5 bg-white"
//                 value={paymentMethod}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//               >
//                 <option value="cash">Cash (10% KPRA)</option>
//                 <option value="online">Online (6% KPRA)</option>
//               </select>
//             </div>

//             {/* DISCOUNT & SERVICE CHARGES */}
//             <div className="grid grid-cols-2 gap-2">
//               <div>
//                 <label className="text-xs font-semibold text-gray-600">
//                   Discount
//                 </label>
//                 <input
//                   type="number"
//                   className="w-full border p-1.5 rounded text-sm mt-0.5"
//                   value={discount}
//                   onChange={(e) => setDiscount(Number(e.target.value))}
//                   placeholder="0"
//                 />
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-gray-600">
//                   Service Charges
//                 </label>
//                 <input
//                   type="number"
//                   className="w-full border p-1.5 rounded text-sm mt-0.5"
//                   value={serviceCharges}
//                   onChange={(e) => setServiceCharges(Number(e.target.value))}
//                   placeholder="0"
//                 />
//               </div>
//             </div>

//             {/* SUMMARY BREAKDOWN */}
//             <div className="border-t pt-2 space-y-1 text-xs">
//               <div className="flex justify-between text-gray-600">
//                 <span>Subtotal:</span>
//                 <span>Rs {subTotal.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between text-gray-600">
//                 <span>KPRA ({paymentMethod === "cash" ? "10%" : "6%"}):</span>
//                 <span>Rs {kpraTaxAmount.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between font-bold text-base text-gray-800 border-t pt-1">
//                 <span>Total:</span>
//                 <span>Rs {finalTotal.toFixed(2)}</span>
//               </div>
//             </div>

//             {/* ACTION BUTTONS */}
//             {cart.length > 0 && (
//               <div className="pt-1 space-y-1.5">
//                 <button
//                   className="w-full bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
//                   onClick={() => handleCheckout(true)}
//                 >
//                   Pay with Print
//                 </button>
//                 <button
//                   className="w-full bg-yellow-600 text-white py-2 rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
//                   onClick={() => handleCheckout(false)}
//                 >
//                   Pay without Print (Pending)
//                 </button>
//                 <button
//                   onClick={clearCart}
//                   className="w-full bg-red-500 text-white py-1.5 rounded text-xs font-medium hover:bg-red-600 transition-colors"
//                 >
//                   Clear Cart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
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

  const { order, setOrder } = useActiveOrder();
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
        window.location.reload();
      } else {
        // 1. Clear cart and reset state before navigating
        // clearCart();
        // setDiscount(0);
        // setServiceCharges(0);
        // setCustomer(null);
        // setPaymentMethod("cash");

        // 2. Clear/reset active order if useActiveOrder provides a reset method:
        // clearActiveOrder();

        // setOrder(null);

        // 3. Navigate to orders
        window.location.reload();
        setTimeout(() => {
          navigate("/orders");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!order) {
    return (
      <div className="h-full flex flex-col overflow-hidden p-4 bg-gray-50">
        <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm mt-4 border border-gray-200">
          <p className="text-lg font-medium">No active table selected</p>
          <p className="text-xs text-gray-400 mt-1">
            Please select an active order or table to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <div className="px-5 pt-3 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
        <PageHeader title={t.pos} actionLabel={t.pos} subtitle={t.pos_title} />
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT CATEGORIES */}
        <div className="w-1/5 border-r border-gray-200 p-3 overflow-y-auto bg-white space-y-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
              selectedCategory === null
                ? "bg-blue-600 text-white shadow-sm font-semibold"
                : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* MIDDLE ITEMS */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-blue-600 font-bold text-sm mt-1">
                    Rs {Number(item.price || item.unit_price || 0).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 w-full bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                >
                  <span>+ Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CART */}
        <div className="w-80 border-l border-gray-200 p-4 flex flex-col h-full bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0 border-b pb-2">
            <h2 className="font-bold text-gray-800 text-base">Current Cart</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              {cart.reduce((sum, item) => sum + (item.qty || 1), 0)} items
            </span>
          </div>

          {/* SCROLLABLE CART ITEMS */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 border-b pb-3 mb-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <p className="text-xs font-medium">Cart is empty</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Select items to add
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-xs text-gray-800 leading-tight">
                      {item.name || item?.item_name}
                    </p>
                    <span className="font-bold text-xs text-gray-900 shrink-0">
                      Rs {Number(item.total || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/60">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md p-0.5 shadow-2xs">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold px-1.5 text-gray-800">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FIXED BOTTOM CONTROLS & SUMMARY */}
          <div className="flex-shrink-0 space-y-2.5">
            {/* CUSTOMER */}
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block uppercase tracking-wider">
                Customer (optional)
              </label>
              <input
                className="w-full border border-gray-300 p-1.5 rounded-lg text-xs mt-1 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Walk-in / Search customer"
                value={customer?.name || ""}
                onChange={(e) =>
                  setCustomer({ id: null, name: e.target.value })
                }
              />
            </div>

            {/* PAYMENT METHOD DROPDOWN */}
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block uppercase tracking-wider">
                Payment Method
              </label>
              <select
                className="w-full border border-gray-300 p-1.5 rounded-lg text-xs mt-1 bg-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
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
                <label className="text-[11px] font-semibold text-gray-600 block uppercase tracking-wider">
                  Discount
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-1.5 rounded-lg text-xs mt-1 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block uppercase tracking-wider">
                  Service Charges
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-1.5 rounded-lg text-xs mt-1 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  value={serviceCharges}
                  onChange={(e) => setServiceCharges(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* SUMMARY BREAKDOWN */}
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-800">
                  Rs {subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>KPRA ({paymentMethod === "cash" ? "10%" : "6%"}):</span>
                <span className="font-medium text-gray-800">
                  Rs {kpraTaxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-green-700 border-t border-gray-200 pt-1 mt-1">
                <span>Total:</span>
                <span>Rs {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {cart.length > 0 && (
              <div className="pt-1 flex flex-col gap-2">
                <button
                  className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-green-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  onClick={() => handleCheckout(true)}
                >
                  Pay with Print
                </button>
                <button
                  className="w-full bg-amber-600 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-amber-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  onClick={() => handleCheckout(false)}
                >
                  Pay without Print (Pending)
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs mt-0.5"
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
