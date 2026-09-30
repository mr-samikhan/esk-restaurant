import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { API } from "../../constants/apiEndPoints";
import { useOrderModal } from "../../hooks/useOrderModal";
import { generateReceipt } from "../../lib/receipt-generator";
import { useSettings } from "../../hooks/useSettings";

export default function OrderModal() {
  const { isOpen, order, closeModal } = useOrderModal();
  const { settings } = useSettings();

  const { cart, removeItem, increaseQty, decreaseQty, getTotal, clearCart } =
    useCart(order);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [serviceCharges, setServiceCharges] = useState(0);

  // Sync initial variables when an order opens
  useEffect(() => {
    if (order) {
      setPaymentMethod(order.payment_method || "cash");
      setDiscount(Number(order.discount_amount) || 0);
      setServiceCharges(Number(order.service_charges) || 0);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const subtotal = getTotal();
  const kpraPercentage = paymentMethod === "cash" ? 10 : 6;
  const kpraTax =
    ((subtotal - discount + serviceCharges) * kpraPercentage) / 100;
  const finalTotal = Math.max(
    0,
    subtotal - discount + serviceCharges + kpraTax,
  );

  const handleCheckout = async () => {
    const payload = {
      orderId: order.id,
      customerId: order.customer_id || null,
      customerName: order.customer_name || "Walk-in",
      subtotal: subtotal,
      discount: Number(discount) || 0,
      serviceCharges: Number(serviceCharges) || 0,
      kpraPercentage: kpraPercentage,
      kpraTax: kpraTax,
      tax: kpraTax,
      total: finalTotal,
      paymentMethod: paymentMethod,
      status: "completed", // Complete and mark as paid
    };

    const checkoutRes = await API.orders.checkout(payload);
    if (!checkoutRes?.success) {
      alert(`Checkout failed: ${checkoutRes?.error || "Unknown error"}`);
      return;
    }

    clearCart();
    closeModal();
    window.location.reload();
  };

  const handlePrint = async () => {
    const html = generateReceipt(
      {
        order: {
          ...order,
          payment_method: paymentMethod,
          discount_amount: discount,
          service_charges: serviceCharges,
          kpra_tax: kpraTax,
          total_amount: finalTotal,
        },
        items: cart,
        total: finalTotal,
      },
      settings,
    );

    await API.print.printReceipt(html);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-gray-900 text-white px-5 py-4">
          <div>
            <h2 className="font-bold text-lg">
              Order #{order.id} - {order.table_name || "Takeaway"}
            </h2>
            <p className="text-xs text-gray-300">
              Customer: {order.customer_name || "Walk-in"}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-white text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* CART ITEMS */}
        <div className="p-5 overflow-y-auto flex-1 divide-y divide-gray-100">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2 text-sm"
              >
                <span className="font-medium text-gray-800 w-1/3">
                  {item.name || item.item_name}
                </span>

                <div className="flex items-center gap-2 border rounded px-2 py-0.5 bg-gray-50">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    className="text-gray-600 font-bold px-1"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-semibold">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => increaseQty(item.id)}
                    className="text-gray-600 font-bold px-1"
                  >
                    +
                  </button>
                </div>

                <span className="font-semibold text-gray-700 w-24 text-right">
                  Rs {(Number(item.price) * Number(item.qty)).toFixed(2)}
                </span>

                <button
                  className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* PAYMENT & ADJUSTMENTS */}
        <div className="bg-gray-50 border-t p-5 space-y-3">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-2 text-xs font-semibold rounded border transition-colors ${
                  paymentMethod === "cash"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Cash (10% KPRA)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`py-2 text-xs font-semibold rounded border transition-colors ${
                  paymentMethod === "online"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Online (6% KPRA)
              </button>
            </div>
          </div>

          {/* Adjustments: Discount & Service Charges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-gray-600 mb-1">
                Discount (Rs)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-600 mb-1">
                Service Charges (Rs)
              </label>
              <input
                type="number"
                min="0"
                value={serviceCharges}
                onChange={(e) => setServiceCharges(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* TOTAL BREAKDOWN */}
          <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>KPRA Tax ({kpraPercentage}%):</span>
              <span>Rs {kpraTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-1">
              <span>Total Amount:</span>
              <span>Rs {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center bg-gray-100 px-5 py-3 border-t">
          <button
            onClick={clearCart}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded text-xs font-semibold transition-colors"
          >
            Clear Cart
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold transition-colors"
            >
              Print Receipt
            </button>

            <button
              onClick={handleCheckout}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-xs font-semibold transition-colors"
            >
              Complete Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
