import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Search,
  ScanLine,
  Trash2,
  Plus,
  Minus,
  Printer,
  User,
  CreditCard,
  Package,
  Lock,
  LogOut,
  Settings,
  ShoppingCart,
} from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dbService } from "@/lib/db-service";
import { generateReceipt } from "@/lib/receipt-generator";

import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

export default function Sales() {
  const queryClient = useQueryClient();

  // ======================================================
  // STATES
  // ======================================================

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("walkin");

  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [clock, setClock] = useState(new Date());

  const barcodeBuffer = useRef("");

  // ======================================================
  // CLOCK
  // ======================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ======================================================
  // FETCH DATA
  // ======================================================

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => dbService.getCustomers(),
  });

  // ======================================================
  // FILTERED PRODUCTS
  // ======================================================

  const filteredProducts = useMemo(() => {
    if (!search) return [];

    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search) ||
        p.sku?.includes(search),
    );
  }, [search, products]);

  // ======================================================
  // TOTALS
  // ======================================================

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const grandTotal = subtotal - Number(discount || 0);

  const dueAmount = grandTotal - Number(paidAmount || 0);

  // ======================================================
  // ADD TO CART
  // ======================================================

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.product_id === product.id);

      if (exists) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          quantity: 1,
          unit_price: Number(product.price),
          total: Number(product.price),
          cost_price: product.cost_price,
        },
      ];
    });

    setSearch("");

    toast({
      title: "Added To Cart",
      description: product.name,
    });
  };

  // ======================================================
  // UPDATE QTY
  // ======================================================

  const updateQty = (id, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === id) {
          const qty =
            type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);

          return {
            ...item,
            quantity: qty,
          };
        }

        return item;
      }),
    );
  };

  // ======================================================
  // REMOVE ITEM
  // ======================================================

  const removeItem = (id) => {
    setCart((prev) => prev.filter((p) => p.product_id !== id));
  };

  // ======================================================
  // SEARCH ENTER
  // ======================================================

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      const found = filteredProducts[0];

      if (found) {
        addToCart(found);
      }
    }
  };

  // ======================================================
  // BARCODE SCANNER
  // ======================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "Enter") {
        const scanned = barcodeBuffer.current.trim();

        if (scanned.length > 2) {
          const product = products.find(
            (p) => p.barcode === scanned || p.sku === scanned,
          );

          if (product) {
            addToCart(product);
          } else {
            toast({
              variant: "destructive",
              title: "Product Not Found",
              description: scanned,
            });
          }
        }

        barcodeBuffer.current = "";
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [products]);

  // ======================================================
  // SHORTCUT KEYS
  // ======================================================

  useEffect(() => {
    const handleShortcuts = (e) => {
      // F1 → NEW SALE
      if (e.key === "F1") {
        e.preventDefault();

        setCart([]);
        setDiscount(0);
        setPaidAmount(0);

        toast({
          title: "New Sale Started",
        });
      }

      // F2 → CHECKOUT
      if (e.key === "F2") {
        e.preventDefault();

        handleCheckout();
      }

      // F3 → FOCUS SEARCH
      if (e.key === "F3") {
        e.preventDefault();

        document.getElementById("product-search")?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcuts);

    return () => {
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [cart, discount, paidAmount]);

  // ======================================================
  // CREATE SALE
  // ======================================================

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => dbService.createSale(saleData),

    onSuccess: (data, variables) => {
      const customer =
        selectedCustomer === "walkin"
          ? null
          : customers.find((c) => String(c.id) === String(selectedCustomer));

      const receiptData = {
        ...variables,
        customer_name: customer?.name || "Walk-in Customer",
        customer_phone: customer?.phone || "",
      };

      try {
        const receiptUri = generateReceipt(receiptData);

        dbService.printReceipt(receiptUri);
      } catch (err) {
        console.error(err);
      }

      queryClient.invalidateQueries({
        queryKey: ["sales"],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      setSelectedCustomer("walkin");

      toast({
        title: "Sale Completed",
      });
    },

    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Unable to complete sale",
      });
    },
  });

  // ======================================================
  // CHECKOUT
  // ======================================================

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart Empty",
      });

      return;
    }

    const payload = {
      customer_id: selectedCustomer,
      items: cart,
      total: subtotal,
      discount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status: dueAmount <= 0 ? "completed" : "partial",
    };

    createSaleMutation.mutate(payload);
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="h-screen overflow-hidden bg-zinc-100 p-3">
      <div className="flex h-full flex-col gap-3">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-6 py-4 shadow-lg">
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">
              AFRIDI TRADERS
            </h1>

            <p className="text-sm text-slate-400">Point Of Sale Workspace</p>
          </div>

          <div className="text-right">
            <p className="text-4xl font-black text-orange-400">
              {clock.toLocaleTimeString()}
            </p>

            <p className="text-sm text-slate-400">{clock.toDateString()}</p>
          </div>
        </div>

        {/* ================================================= */}
        {/* MAIN */}
        {/* ================================================= */}

        <div className="grid flex-1 grid-cols-12 gap-3 overflow-hidden">
          {/* ================================================= */}
          {/* LEFT PANEL */}
          {/* ================================================= */}

          <div className="col-span-9 flex flex-col gap-3 overflow-hidden">
            {/* SEARCH */}
            <div className="rounded-xl border bg-white p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="product-search"
                  type="text"
                  placeholder="Search Product / Scan Barcode"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  className="w-full rounded-lg border py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* DROPDOWN */}
                {search && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-xl border bg-white shadow-2xl">
                    {filteredProducts.slice(0, 8).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full border-b px-4 py-3 text-left hover:bg-blue-50"
                      >
                        <p className="font-semibold">{product.name}</p>

                        <div className="mt-1 flex justify-between text-sm text-slate-500">
                          <span>{product.barcode}</span>

                          <span>Rs {product.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TABLE */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-white">
              {/* TABLE HEADER */}
              <div className="grid grid-cols-12 border-b bg-slate-100 px-4 py-3 text-sm font-semibold">
                <div className="col-span-2">CODE</div>

                <div className="col-span-4">DESCRIPTION</div>

                <div className="col-span-2 text-center">QTY</div>

                <div className="col-span-2 text-center">PRICE</div>

                <div className="col-span-2 text-right">TOTAL</div>
              </div>

              {/* TABLE BODY */}
              <div className="h-[500px] overflow-auto">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <ShoppingCart className="mb-3 h-14 w-14" />

                    <p className="text-lg font-semibold">Cart Empty</p>

                    <p className="text-sm">Scan barcode or search products</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="grid grid-cols-12 items-center border-b px-4 py-4 hover:bg-slate-50"
                    >
                      <div className="col-span-2">{item.barcode}</div>

                      <div className="col-span-4 font-semibold">
                        {item.product_name}
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQty(item.product_id, "dec")}
                          className="flex h-7 w-7 items-center justify-center rounded bg-slate-200"
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() => updateQty(item.product_id, "inc")}
                          className="flex h-7 w-7 items-center justify-center rounded bg-slate-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="col-span-2 text-center">
                        Rs {item.unit_price}
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-3">
                        <span className="font-bold text-green-700">
                          Rs {item.quantity * item.unit_price}
                        </span>

                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT SIDEBAR */}
          {/* ================================================= */}

          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto pr-1">
            {/* TOTAL CARD */}
            <div className="sticky top-0 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-widest opacity-80">
                NET TOTAL
              </p>

              <h1 className="mt-3 text-5xl font-black">
                Rs {grandTotal.toLocaleString()}
              </h1>

              {/* INPUTS */}
              <div className="mt-6 space-y-3">
                <div>
                  <Label>Discount</Label>
                  <input
                    type="number"
                    placeholder="Discount"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full rounded-lg px-4 py-3 text-black outline-none"
                  />
                </div>
                <div>
                  <Label>Paid Amount</Label>
                  <input
                    type="number"
                    placeholder="Paid Amount"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full rounded-lg px-4 py-3 text-black outline-none"
                  />
                </div>

                <div>
                  <Label>Customer</Label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-black outline-none"
                  >
                    <option value="walkin">Walk-in Customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <span>Rs {subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>

                  <span>Rs {discount}</span>
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Due</span>

                  <span>Rs {dueAmount}</span>
                </div>
              </div>

              {/* CHECKOUT */}
              <button
                onClick={handleCheckout}
                disabled={createSaleMutation.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-green-700 transition hover:bg-slate-100"
              >
                <ShoppingCart />

                {createSaleMutation.isPending
                  ? "PROCESSING..."
                  : "COMPLETE SALE"}
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              <SidebarButton
                icon={<Printer />}
                label="Print"
                color="bg-indigo-500"
              />

              <SidebarButton
                icon={<Package />}
                label="Products"
                color="bg-orange-500"
              />

              <SidebarButton
                icon={<User />}
                label="Customer"
                color="bg-blue-500"
              />

              <SidebarButton
                icon={<CreditCard />}
                label="Payment"
                color="bg-green-500"
              />

              <SidebarButton
                icon={<Lock />}
                label="Lock"
                color="bg-yellow-500"
              />

              <SidebarButton
                icon={<LogOut />}
                label="Logout"
                color="bg-red-500"
              />

              <SidebarButton
                icon={<Settings />}
                label="Settings"
                color="bg-slate-700"
              />
            </div>

            {/* SHORTCUT KEYS */}
            <ShortcutKeys />
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SIDEBAR BUTTON
// ======================================================

function SidebarButton({ icon, label, color }) {
  return (
    <button
      className={`${color} flex flex-col items-center justify-center gap-3 rounded-xl p-4 text-white shadow-lg transition hover:scale-[1.02]`}
    >
      <div className="rounded-full bg-white/20 p-3">{icon}</div>

      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

// ======================================================
// SHORTCUT KEYS
// ======================================================

function ShortcutKeys() {
  const shortcuts = [
    ["F1", "New Sale"],
    ["F2", "Checkout"],
    ["F3", "Focus Search"],
    ["F4", "Delete Row"],
    ["F5", "Change Qty"],
    ["F6", "Discount"],
    ["CTRL+P", "Print"],
    ["CTRL+S", "Save"],
  ];

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-4 font-bold text-slate-800">Shortcut Keys</h3>

      <div className="space-y-2">
        {shortcuts.map(([key, action]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <kbd className="min-w-[70px] rounded bg-slate-900 px-2 py-1 text-center font-bold text-white">
              {key}
            </kbd>

            <span className="text-slate-600">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
