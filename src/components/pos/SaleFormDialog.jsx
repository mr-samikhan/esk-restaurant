// import React, { useState, useMemo, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Trash2, Search } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/components/ui/use-toast";

// export default function SaleFormDialog({
//   open,
//   onOpenChange,
//   products,
//   customers,
//   onSave,
//   saving,
//   initialData,
//   initialScannedItems,
// }) {
//   console.log("initialData", initialData);
//   const [items, setItems] = useState([]);
//   const [discount, setDiscount] = useState(0);
//   const [tax, setTax] = useState(0);
//   const [paidAmount, setPaidAmount] = useState(0);
//   const [paymentMethod, setPaymentMethod] = useState("cash");
//   const [customerId, setCustomerId] = useState("");
//   const [notes, setNotes] = useState("");
//   const [productSearch, setProductSearch] = useState("");

//   const { toast } = useToast();

//   // Sync data if editing an existing invoice
//   // Inside SaleFormDialog.jsx
//   // useEffect(() => {
//   //   if (open) {
//   //     if (initialData) {
//   //       setItems(
//   //         typeof initialData.items === "string"
//   //           ? JSON.parse(initialData.items)
//   //           : initialData.items,
//   //       );
//   //       setPaidAmount(initialData.paid_amount || 0); // This fixes the 0 issue
//   //       setCustomerId(
//   //         initialData.customer_id ? String(initialData.customer_id) : "walkin",
//   //       );
//   //     } else {
//   //       setItems([]);
//   //       setPaidAmount(0);
//   //       setCustomerId("walkin");
//   //     }
//   //   }
//   // }, [open, initialData]);

//   const isEditMode = !!initialData?.id; // True only if editing an existing invoice

//   // useEffect(() => {
//   //   if (open) {
//   //     if (isEditMode) {
//   //       // EDIT MODE: Load old data
//   //       setItems(
//   //         typeof initialData.items === "string"
//   //           ? JSON.parse(initialData.items)
//   //           : initialData.items,
//   //       );
//   //       setPaidAmount(initialData.paid_amount || 0);
//   //     } else if (initialScannedItems?.length > 0) {
//   //       // NEW SALE (SCAN): Load the scanned cart
//   //       setItems(initialScannedItems);
//   //       setPaidAmount(0);
//   //     }
//   //   }
//   // }, [open, initialData, initialScannedItems]);

//   // useEffect(() => {
//   //   if (open) {
//   //     if (isEditMode) {
//   //       // 1. Load Items
//   //       const savedItems =
//   //         typeof initialData.items === "string"
//   //           ? JSON.parse(initialData.items)
//   //           : initialData.items;
//   //       setItems(savedItems);

//   //       // 2. Load Customer (Ensure it matches the Select value type)
//   //       setCustomerId(
//   //         initialData.customer_id ? String(initialData.customer_id) : "walkin",
//   //       );

//   //       // 3. Load Financials
//   //       setDiscount(initialData.discount || 0);
//   //       setTax(initialData.tax || 0);
//   //       setPaidAmount(initialData.paid_amount || 0);
//   //       setPaymentMethod(initialData.payment_method || "cash");
//   //       setNotes(initialData.notes || "");
//   //     } else {
//   //       // RESET FORM FOR NEW SALE
//   //       setItems(initialScannedItems?.length > 0 ? initialScannedItems : []);
//   //       setCustomerId("walkin");
//   //       setDiscount(0);
//   //       setTax(0);
//   //       setPaidAmount(0);
//   //       setPaymentMethod("cash");
//   //       setNotes("");
//   //     }
//   //   }
//   // }, [open, initialData, isEditMode, initialScannedItems]);

//   useEffect(() => {
//     if (open) {
//       if (isEditMode) {
//         const savedItems =
//           typeof initialData.items === "string"
//             ? JSON.parse(initialData.items)
//             : initialData.items;
//         setItems(savedItems);

//         const cid = initialData.customer_id
//           ? String(initialData.customer_id)
//           : "walkin";
//         setCustomerId(cid);

//         setDiscount(initialData.discount || 0);
//         setTax(initialData.tax || 0);
//         setPaymentMethod(initialData.payment_method || "cash");
//         setNotes(initialData.notes || "");

//         // If walkin, force paid amount to total, otherwise use saved value
//         if (cid === "walkin") {
//           const total = savedItems.reduce(
//             (sum, item) => sum + item.quantity * item.unit_price,
//             0,
//           );
//           setPaidAmount(total - (initialData.discount || 0));
//         } else {
//           setPaidAmount(initialData.paid_amount || 0);
//         }
//       } else {
//         setItems(initialScannedItems?.length > 0 ? initialScannedItems : []);
//         setCustomerId("walkin");
//         setDiscount(0);
//         setTax(0);
//         setPaymentMethod("cash");
//         setNotes("");
//         // Paid amount will be handled by the auto-sync effect below
//       }
//     }
//   }, [open, initialData, isEditMode, initialScannedItems]);

//   // Calculate Net Total
//   const subtotal_ = items.reduce(
//     (sum, item) => sum + item.quantity * (item.unit_price || item.price || 0),
//     0,
//   );
//   const netTotal = subtotal_ - discount + tax;

//   useEffect(() => {
//     // If customer is Walk-in, they MUST pay full amount. No credit allowed.
//     if (customerId === "walkin") {
//       setPaidAmount(netTotal > 0 ? netTotal : 0);
//     }
//   }, [customerId, netTotal]); // Runs whenever customer changes or total changes

//   useEffect(() => {
//     const searchTerm = productSearch.trim();
//     if (searchTerm.length > 3) {
//       const exactMatch = products.find((p) => p.barcode === searchTerm);
//       if (exactMatch) {
//         addItem(exactMatch);
//         setProductSearch(""); // Clear search after adding
//       }
//     }
//   }, [productSearch, products]);

//   // const filteredProducts = useMemo(() => {
//   //   if (!productSearch) return products.slice(0, 10);
//   //   return products.filter(
//   //     (p) =>
//   //       p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
//   //       p.sku?.toLowerCase().includes(productSearch.toLowerCase()),
//   //   );
//   // }, [products, productSearch]);

//   const filteredProducts = useMemo(() => {
//     if (!productSearch) return products.slice(0, 10);

//     const searchLower = productSearch.toLowerCase().trim();

//     return products.filter(
//       (p) =>
//         p.name?.toLowerCase().includes(searchLower) ||
//         p.sku?.toLowerCase().includes(searchLower) ||
//         p.barcode?.toLowerCase() === searchLower, // 👈 Exact match for barcode
//     );
//   }, [products, productSearch]);

//   const addItem = (product) => {
//     const existing = items.find((i) => i.product_id === product.id);
//     if (existing) {
//       setItems(
//         items.map((i) =>
//           i.product_id === product.id
//             ? {
//                 ...i,
//                 quantity: i.quantity + 1,
//                 total: (i.quantity + 1) * i.unit_price,
//               }
//             : i,
//         ),
//       );
//     } else {
//       setItems([
//         ...items,
//         {
//           product_id: product.id,
//           product_name: product.name,
//           quantity: 1,
//           unit_price: product.price,
//           total: product.price,
//         },
//       ]);
//     }
//     setProductSearch("");
//   };

//   const updateItemQty = (index, qty) => {
//     const q = Math.max(1, parseInt(qty) || 1);
//     setItems(
//       items.map((item, i) =>
//         i === index
//           ? { ...item, quantity: q, total: q * item.unit_price }
//           : item,
//       ),
//     );
//   };

//   const removeItem = (index) => {
//     setItems(items.filter((_, i) => i !== index));
//   };

//   const subtotal = items.reduce((sum, i) => sum + i.total, 0);
//   const total = subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

//   // Calculate Balance Due
//   const dueAmount = Math.max(0, total - (parseFloat(paidAmount) || 0));

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (items.length === 0) return;

//     // 1. Calculate the actual net total
//     const subtotal = items.reduce(
//       (sum, item) => sum + Number(item.quantity) * Number(item.unit_price || 0),
//       0,
//     );
//     const netTotal = subtotal - Number(discount || 0) + Number(tax || 0);

//     // 2. Validation: Paid amount must cover the total
//     if (Number(paidAmount) > netTotal) {
//       toast({
//         variant: "destructive",
//         title: "Payment Mismatched",
//         description: `Total is ${netTotal}. Paid amount must be equal or less.`,
//       });
//       return; // Stop the function here
//     }

//     let finalCustomerName = "Walk-in";
//     if (customerId && customerId !== "walkin") {
//       const found = customers.find((c) => String(c.id) === String(customerId));
//       if (found) finalCustomerName = found.name;
//     }

//     // Determine Status dynamically
//     let status = "completed";
//     if (dueAmount > 0) {
//       status = parseFloat(paidAmount) > 0 ? "partial" : "pending";
//     }

//     onSave({
//       invoice_number:
//         initialData?.invoice_number ||
//         `INV-${Date.now().toString(36).toUpperCase()}`,
//       customer_id: customerId === "walkin" ? null : customerId,
//       customer_name: finalCustomerName,
//       items,
//       subtotal,
//       discount: parseFloat(discount) || 0,
//       tax: parseFloat(tax) || 0,
//       total,
//       paid_amount: parseFloat(paidAmount) || 0,
//       due_amount: dueAmount,
//       payment_method: paymentMethod,
//       status: status,
//       notes,
//     });
//   };

//   const handleSearchKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault(); // Stop form submission
//       const searchTerm = productSearch.trim();
//       const exactMatch = products.find(
//         (p) => p.barcode === searchTerm || p.sku === searchTerm,
//       );

//       if (exactMatch) {
//         addItem(exactMatch);
//         setProductSearch(""); // Clear search after adding
//       }
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {isEditMode
//               ? `Edit Invoice #${initialData.invoice_number}`
//               : "New Sale"}
//           </DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Customer */}
//           <div>
//             <Label>Customer</Label>
//             <Select value={customerId} onValueChange={setCustomerId}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Walk-in Customer" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="walkin">Walk-in Customer</SelectItem>
//                 {customers.map((c) => (
//                   <SelectItem key={c.id} value={String(c.id)}>
//                     {c.name} — {c.phone}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Product search and add */}
//           <div>
//             <Label>Add Products</Label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//               <Input
//                 placeholder="Search by name or SKU..."
//                 value={productSearch}
//                 onChange={(e) => setProductSearch(e.target.value)}
//                 className="pl-9"
//                 onKeyDown={handleSearchKeyDown}
//               />
//             </div>
//             {productSearch && (
//               <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto divide-y">
//                 {filteredProducts.map((p) => (
//                   <button
//                     key={p.id}
//                     type="button"
//                     className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors text-left"
//                     onClick={() => addItem(p)}
//                   >
//                     <div>
//                       <p className="text-sm font-medium">{p.name}</p>
//                       <p className="text-xs text-slate-400">
//                         {p.sku || p.category?.replace(/_/g, " ")}
//                       </p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Badge variant="outline" className="text-xs">
//                         Stock: {p.stock_quantity}
//                       </Badge>
//                       <span className="text-sm font-semibold">₹{p.price}</span>
//                     </div>
//                   </button>
//                 ))}
//                 {filteredProducts.length === 0 && (
//                   <p className="text-sm text-slate-400 text-center py-3">
//                     No products found
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Items */}
//           {items.length > 0 && (
//             <div className="border rounded-xl overflow-hidden">
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-50">
//                   <tr className="text-xs text-slate-500 uppercase">
//                     <th className="text-left px-3 py-2">Product</th>
//                     <th className="text-center px-3 py-2 w-20">Qty</th>
//                     <th className="text-right px-3 py-2">Price</th>
//                     <th className="text-right px-3 py-2">Total</th>
//                     <th className="w-10"></th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {items.map((item, i) => (
//                     <tr key={i}>
//                       <td className="px-3 py-2 font-medium">
//                         {item.product_name}
//                       </td>
//                       <td className="px-3 py-2">
//                         <Input
//                           type="number"
//                           min="1"
//                           value={item.quantity}
//                           onChange={(e) => updateItemQty(i, e.target.value)}
//                           className="h-8 w-16 text-center mx-auto"
//                         />
//                       </td>
//                       <td className="px-3 py-2 text-right">
//                         ₹{item.unit_price}
//                       </td>
//                       <td className="px-3 py-2 text-right font-semibold">
//                         ₹{item.total}
//                       </td>
//                       <td className="px-2">
//                         <Button
//                           type="button"
//                           variant="ghost"
//                           size="icon"
//                           className="h-7 w-7"
//                           onClick={() => removeItem(i)}
//                         >
//                           <Trash2 className="w-3.5 h-3.5 text-red-500" />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Totals */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label>Discount</Label>
//               <Input
//                 type="number"
//                 step="0.01"
//                 value={discount}
//                 onChange={(e) => setDiscount(e.target.value)}
//               />
//             </div>
//             <div>
//               <Label>Tax</Label>
//               <Input
//                 type="number"
//                 step="0.01"
//                 value={tax}
//                 onChange={(e) => setTax(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4 border-t pt-4">
//             <div className="space-y-2">
//               <Label>Payment Method</Label>
//               <Select value={paymentMethod} onValueChange={setPaymentMethod}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="cash">Cash</SelectItem>
//                   <SelectItem value="bank">Bank Transfer</SelectItem>
//                   <SelectItem value="card">Card</SelectItem>
//                   <SelectItem value="credit">Customer Credit</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Amount Paid *</Label>
//               <Input
//                 type="number"
//                 // className="font-bold text-emerald-600"
//                 value={paidAmount}
//                 disabled={customerId === "walkin"} // 👈 Prevents manual editing for walk-ins
//                 className={customerId === "walkin" ? "bg-slate-100 italic" : ""}
//                 onChange={(e) => setPaidAmount(e.target.value)}
//               />
//             </div>
//           </div>

//           <div>
//             <Label>Notes</Label>
//             <Textarea
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               rows={2}
//             />
//           </div>

//           {/* Summary */}
//           {/* Calculations Summary */}
//           <div className="bg-slate-50 p-4 rounded-xl space-y-2">
//             <div className="flex justify-between text-sm">
//               <span>Subtotal:</span>
//               <span>₹{subtotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between text-sm text-red-600">
//               <span>Discount:</span>
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   className="h-6 w-20 text-right"
//                   value={discount}
//                   onChange={(e) => setDiscount(e.target.value)}
//                 />
//               </div>
//             </div>
//             <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
//               <span>Total Payable:</span>
//               <span>₹{total.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between font-bold text-md text-red-600">
//               <span>Balance Due:</span>
//               <span>₹{dueAmount.toLocaleString()}</span>
//             </div>
//           </div>

//           <div className="flex justify-end gap-3">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={saving || items.length === 0}>
//               {saving
//                 ? "Processing..."
//                 : initialData
//                   ? "Update Invoice"
//                   : "Complete Sale"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function SaleFormDialog({
  open,
  onOpenChange,
  products,
  customers,
  onSave,
  saving,
  initialData,
  initialScannedItems,
}) {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { toast } = useToast();
  const isEditMode = !!initialData?.id;

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        const savedItems =
          typeof initialData.items === "string"
            ? JSON.parse(initialData.items)
            : initialData.items;

        const localizedItems = savedItems.map((item) => {
          const originalProduct = products.find(
            (p) => p.id === item.product_id,
          );
          return {
            ...item,
            unit_type: originalProduct?.unit_type || "pcs",
            packaging_conversion_factor:
              originalProduct?.packaging_conversion_factor || 1,
            sale_unit_mode: item.sale_unit_mode || "base",
          };
        });
        setItems(localizedItems);

        const cid = initialData.customer_id
          ? String(initialData.customer_id)
          : "walkin";
        setCustomerId(cid);
        setDiscount(Math.max(0, initialData.discount || 0));
        setTax(Math.max(0, initialData.tax || 0));
        setPaymentMethod(initialData.payment_method || "cash");
        setNotes(initialData.notes || "");

        if (cid === "walkin") {
          const initialSub = localizedItems.reduce((sum, item) => {
            const factor =
              item.sale_unit_mode === "bulk"
                ? Number(item.packaging_conversion_factor || 1)
                : 1;
            return sum + item.quantity * item.unit_price * factor;
          }, 0);
          setPaidAmount(Math.max(0, initialSub - (initialData.discount || 0)));
        } else {
          setPaidAmount(Math.max(0, initialData.paid_amount || 0));
        }
      } else {
        const structuralScanned = (initialScannedItems || []).map((item) => {
          const originalProduct = products.find(
            (p) => p.id === item.product_id,
          );
          return {
            ...item,
            unit_type: originalProduct?.unit_type || "pcs",
            packaging_conversion_factor:
              originalProduct?.packaging_conversion_factor || 1,
            sale_unit_mode: "base",
          };
        });
        setItems(structuralScanned);
        setCustomerId("walkin");
        setDiscount(0);
        setTax(0);
        setPaymentMethod("cash");
        setNotes("");
      }
    }
  }, [open, initialData, isEditMode, initialScannedItems, products]);

  // --- COMPUTE ACTIVE DYNAMIC TOTALS ---
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const multiplier =
        item.sale_unit_mode === "bulk"
          ? Number(item.packaging_conversion_factor || 1)
          : 1;
      const rate = item.unit_price || item.price || 0;
      return sum + Number(item.quantity) * rate * multiplier;
    }, 0);
  }, [items]);

  // Prevent negative net totals
  const total = useMemo(() => {
    return Math.max(
      0,
      subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0),
    );
  }, [subtotal, discount, tax]);

  const dueAmount = useMemo(() => {
    return Math.max(0, total - (parseFloat(paidAmount) || 0));
  }, [total, paidAmount]);

  useEffect(() => {
    if (customerId === "walkin") {
      setPaidAmount(total > 0 ? total : 0);
    }
  }, [customerId, total]);

  useEffect(() => {
    const searchTerm = productSearch.trim();
    if (searchTerm.length > 3) {
      const exactMatch = products.find((p) => p.barcode === searchTerm);
      if (exactMatch) {
        addItem(exactMatch);
      }
    }
  }, [productSearch, products]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    const searchLower = productSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase() === searchLower,
    );
  }, [products, productSearch]);

  // Helper validation logic to evaluate stock availability limits
  const verifyStockAvailability = (product, requestedQty, mode) => {
    if (isEditMode) return true; // Bypass restriction check when managing old receipts modifications
    const factor =
      mode === "bulk" ? Number(product.packaging_conversion_factor || 1) : 1;
    const totalRequiredUnits = requestedQty * factor;
    const availableStock = Number(product.stock_quantity) || 0;
    return availableStock >= totalRequiredUnits;
  };

  const addItem = (product) => {
    const existing = items.find((i) => i.product_id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const prospectiveQty = currentQty + 1;
    const selectedMode = existing ? existing.sale_unit_mode : "base";

    if (!verifyStockAvailability(product, prospectiveQty, selectedMode)) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `Cannot add more. Remaining balance for ${product.name} is only ${product.stock_quantity} base loose units.`,
      });
      return;
    }

    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          unit_type: product.unit_type || "pcs",
          packaging_conversion_factor: product.packaging_conversion_factor || 1,
          sale_unit_mode: "base",
        },
      ]);
    }
    setProductSearch("");
  };

  const updateItemQty = (index, qty) => {
    const rawQty = parseInt(qty) || 0;
    const sanitizedQty = Math.max(1, rawQty);
    const item = items[index];
    const originalProduct = products.find((p) => p.id === item.product_id);

    if (
      originalProduct &&
      !verifyStockAvailability(
        originalProduct,
        sanitizedQty,
        item.sale_unit_mode,
      )
    ) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Requested quantity exceeds available stock (${originalProduct.stock_quantity} units remaining).`,
      });
      return;
    }

    setItems(
      items.map((it, i) =>
        i === index ? { ...it, quantity: sanitizedQty } : it,
      ),
    );
  };

  const toggleItemMode = (index, mode) => {
    const item = items[index];
    const originalProduct = products.find((p) => p.id === item.product_id);

    if (
      originalProduct &&
      !verifyStockAvailability(originalProduct, item.quantity, mode)
    ) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock for Packaging Mode",
        description: `Switching to bulk requires ${item.quantity * Number(originalProduct.packaging_conversion_factor)} units, but only ${originalProduct.stock_quantity} remain.`,
      });
      return;
    }

    setItems(
      items.map((it, i) =>
        i === index ? { ...it, sale_unit_mode: mode } : it,
      ),
    );
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFinancialInput = (value, setter) => {
    const parsed = parseFloat(value) || 0;
    setter(Math.max(0, parsed)); // Guarantee zero constraint baseline block out
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    // 1. Stock verification block check validation
    if (!isEditMode) {
      for (const item of items) {
        const originalProduct = products.find((p) => p.id === item.product_id);
        if (originalProduct) {
          const factor =
            item.sale_unit_mode === "bulk"
              ? Number(item.packaging_conversion_factor || 1)
              : 1;
          if (originalProduct.stock_quantity < item.quantity * factor) {
            toast({
              variant: "destructive",
              title: "Checkout Blocked",
              description: `Item "${item.product_name}" exceeds stock limits. Please fix items volume before generating billing row.`,
            });
            return;
          }
        }
      }
    }

    // 2. Clear out negative numbers baseline
    const sanitizedDiscount = Math.max(0, parseFloat(discount) || 0);
    const sanitizedTax = Math.max(0, parseFloat(tax) || 0);
    const sanitizedPaid = Math.max(0, parseFloat(paidAmount) || 0);

    // 3. CLEAN COMPATIBILITY LAYER: Remove custom keys before sending to backend
    const processedItems = items.map((item) => {
      const isBulk = item.sale_unit_mode === "bulk";
      const factor = Number(item.packaging_conversion_factor) || 1;
      const basePrice = Number(item.unit_price || item.price || 0);

      return {
        product_id: item.product_id,
        // Backend expects standard keys: product_id, product_name, quantity, price / unit_price
        product_name: isBulk
          ? `${item.product_name} (${item.unit_type.toUpperCase()} x${item.quantity})`
          : item.product_name,
        quantity: isBulk
          ? Number(item.quantity) * factor
          : Number(item.quantity),
        price: basePrice, // Explicit key mapping for backend loops
        unit_price: basePrice, // Dual key safety verification mapping
      }; // 👈 CRITICAL FIX: 'sale_unit_mode' and custom properties are safely stripped out here!
    });

    // 4. Trigger the parent onSave mutation handler
    onSave({
      invoice_number: initialData?.invoice_number || `INV-${Date.now()}`,
      customer_id: customerId,
      customer_name:
        customerId === "walkin"
          ? "Walk-in Customer"
          : customers.find((c) => String(c.id) === customerId)?.name ||
            "Unknown Customer",
      items: processedItems, // Passed perfectly clean to backend query handler loops
      total: Number(total) || 0,
      paid_amount: sanitizedPaid,
      discount: sanitizedDiscount,
      tax: sanitizedTax,
      payment_method: paymentMethod,
      notes: notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Sale Invoice" : "Create New Sale"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="grid grid-cols-12 gap-6 mt-2"
        >
          {/* Left panel: Catalog and Cart Selection layout */}
          <div className="col-span-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products by Name, SKU, or scan Barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {productSearch && (
              <div className="border rounded-md max-h-40 overflow-y-auto bg-white p-1 divide-y z-50 relative">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="p-2 text-sm flex justify-between items-center cursor-pointer hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        Stock: {p.stock_quantity} ({p.unit_type})
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="uppercase text-[10px]"
                    >
                      Rs. {p.price} / {p.unit_type || "pcs"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="border rounded-md overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-center w-36">Unit Mode</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    <th className="p-3 text-right w-28">Rate</th>
                    <th className="p-3 text-right w-32">Total</th>
                    <th className="p-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, index) => {
                    const isBulkCapable = item.packaging_conversion_factor > 1;
                    const isBulk = item.sale_unit_mode === "bulk";
                    const displayMultiplier = isBulk
                      ? Number(item.packaging_conversion_factor)
                      : 1;
                    const rowTotal =
                      item.quantity * item.unit_price * displayMultiplier;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-medium text-slate-800">
                            {item.product_name}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase">
                            Base Unit: {item.unit_type}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isBulkCapable ? (
                            <select
                              value={item.sale_unit_mode}
                              onChange={(e) =>
                                toggleItemMode(index, e.target.value)
                              }
                              className="text-xs border rounded p-1 w-full bg-white h-8"
                            >
                              <option value="base">
                                Loose ({item.unit_type})
                              </option>
                              <option value="bulk">
                                Bulk ({item.unit_type.toUpperCase()})
                              </option>
                            </select>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 uppercase">
                              {item.unit_type}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQty(index, e.target.value)
                            }
                            className="h-8 text-center px-1"
                          />
                        </td>
                        <td className="p-3 text-right font-mono">
                          Rs. {(item.unit_price * displayMultiplier).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-semibold font-mono">
                          Rs. {rowTotal.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-7 w-7 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center p-8 text-slate-400 italic"
                      >
                        No products added to the invoice workspace yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Textarea
              placeholder="Add order remarks or credit references here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* Right panel: Financial Summary configuration parameter */}
          <div className="col-span-4 bg-slate-50 border p-4 rounded-lg space-y-4 h-fit">
            <div className="space-y-2">
              <Label>Target Customer Account</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Assign account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walkin">
                    Walk-in Customer (Full Cash)
                  </SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} (Debt: Rs.{c.debt_balance})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode channel</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash Ledger</SelectItem>
                  <SelectItem value="bank">Bank / Digital Transfer</SelectItem>
                  <SelectItem value="credit">
                    Open Book Account (Debt)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="divide-y border-t border-b py-2 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Items Val:</span>
                <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-500">Discount Given:</span>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) =>
                    handleFinancialInput(e.target.value, setDiscount)
                  }
                  className="w-24 h-7 text-right font-mono text-xs bg-white"
                />
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-500">Tax Levy:</span>
                <Input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => handleFinancialInput(e.target.value, setTax)}
                  className="w-24 h-7 text-right font-mono text-xs bg-white"
                />
              </div>
              <div className="flex justify-between pt-2 font-bold text-base text-slate-900">
                <span>Net Invoice Value:</span>
                <span className="font-mono text-indigo-600">
                  Rs. {total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-emerald-700">
                  Amount Tendered Paid Now
                </Label>
                {customerId !== "walkin" && (
                  <button
                    type="button"
                    onClick={() => setPaidAmount(total)}
                    className="text-[11px] text-indigo-600 font-medium hover:underline"
                  >
                    Clear Full Invoice
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="0"
                disabled={customerId === "walkin"}
                value={paidAmount}
                onChange={(e) =>
                  handleFinancialInput(e.target.value, setPaidAmount)
                }
                className="bg-white font-mono text-base font-bold text-emerald-600 text-right"
              />
            </div>

            {customerId !== "walkin" && (
              <div className="p-2 rounded bg-red-50 text-red-700 flex justify-between text-xs font-semibold">
                <span>Deferred Balance Due (Book Debt):</span>
                <span className="font-mono">Rs. {dueAmount.toFixed(2)}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={items.length === 0 || saving}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-5 text-sm font-semibold"
            >
              {saving
                ? "Processing Transaction..."
                : isEditMode
                  ? "Commit Invoice Changes"
                  : "Finalize & Generate Receipt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
