import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import { generateReceipt } from "@/lib/receipt-generator";
import PageHeader from "../components/pos/PageHeader";
import DataTable from "../components/pos/DataTable";
import EmptyState from "../components/pos/EmptyState";
import SaleFormDialog from "../components/pos/SaleFormDialog";
import { ShoppingCart, Search, Edit2, Trash2, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "../hooks/useCurrency";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../components/pos/ConfirmDialog";
import { useSettings } from "../hooks/useSettings";

export default function Sales() {
  const { symbol } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editSale, setEditSale] = useState(null); // Added missing state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("en");

  const { confirm, state, handleConfirm, handleCancel } = useConfirm();
  const { settings } = useSettings();

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  // --- DATA FETCHING ---
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => dbService.getSales(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => dbService.getCustomers(),
  });

  // --- MUTATIONS ---
  // const createSaleMutation = useMutation({
  //   mutationFn: (saleData) => dbService.createSale(saleData),
  //   onSuccess: (data, variables) => {
  //     const receiptUri = generateReceipt(variables);
  //     dbService.printReceipt(receiptUri);
  //     queryClient.invalidateQueries([
  //       "sales",
  //       "products",
  //       "customers",
  //       "stock_movements",
  //     ]);
  //     setShowForm(false);
  //     toast({ title: "Success", description: "Sale recorded successfully" });
  //   },
  // });

  // const createSaleMutation = useMutation({
  //   mutationFn: (saleData) => dbService.createSale(saleData),
  //   onSuccess: (data, variables) => {
  //     // 1. Find the customer to get their existing debt from the database
  //     const customer = customers.find((c) => c.id === variables.customer_id);

  //     const billAmount = Number(variables.total) || 0;
  //     const discountAmount = Number(variables.discount) || 0;
  //     const paidAmount = Number(variables.paid_amount) || 0;
  //     const existingDebt = Number(customer?.debt_balance) || 0;

  //     // 2. Calculation for this specific invoice
  //     // Net Invoice = (Items - Discount)
  //     const netInvoiceAmount = billAmount - discountAmount;

  //     // 3. Calculation for Total Account (Cumulative)
  //     // Total Debt = (Existing Debt + Items) - (Discount + Paid)
  //     const finalTotalDebt =
  //       existingDebt + billAmount - (discountAmount + paidAmount);

  //     const receiptData = {
  //       ...variables,
  //       old_balance: existingDebt,
  //       total_debt: finalTotalDebt, // This now strictly subtracts the discount
  //       customer_name: customer ? customer.name : "Walk-in",
  //       customer_phone: customer ? customer.phone : "",
  //     };

  //     // 4. Generate and Print
  //     const receiptUri = generateReceipt(receiptData);
  //     dbService.printReceipt(receiptUri);

  //     queryClient.invalidateQueries(["sales", "customers", "products"]);
  //     setShowForm(false);
  //     toast({
  //       title: "Success",
  //       description: "Invoice generated and debt updated.",
  //     });
  //   },
  // });

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => dbService.createSale(saleData),
    onSuccess: (data, variables) => {
      // 1. SAFE CHECK: Check if customer is a walk-in to prevent undefined mapping crashes
      const isWalkIn = variables.customer_id === "walkin";
      const customer = isWalkIn
        ? null
        : customers.find((c) => String(c.id) === String(variables.customer_id));

      const billAmount = Number(variables.total) || 0;
      const discountAmount = Number(variables.discount) || 0;
      const paidAmount = Number(variables.paid_amount) || 0;
      const existingDebt = customer ? Number(customer.debt_balance) || 0 : 0;

      // 2. Calculation for cumulative account mapping
      const finalTotalDebt =
        existingDebt + billAmount - (discountAmount + paidAmount);

      const receiptData = {
        ...variables,
        old_balance: existingDebt,
        total_debt: finalTotalDebt,
        customer_name: customer ? customer.name : "Walk-in Customer",
        customer_phone: customer ? customer.phone : "",
      };

      try {
        // 3. Generate and Print Receipt
        const receiptUri = generateReceipt(receiptData);
        dbService.printReceipt(receiptUri);
      } catch (printError) {
        console.error("Receipt Printer Interface Error:", printError.message);
      }

      // 4. CRITICAL FIX: Wrapped query invalidate targets inside the required configuration object syntax
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      // 5. CLOSE THE MODAL (Guaranteed to execute now)
      setShowForm(false);

      toast({
        title: "Success",
        description: "Invoice generated and sales record synchronized.",
      });
    },
    onError: (err) => {
      console.error("Sale Workspace Mutation Failure Error:", err.message);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: "Failed to persist sales data into database rows.",
      });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: ({ id, data }) => dbService.updateSale(id, data),
    onSuccess: (result) => {
      if (result?.error === "STOCK_ERROR") {
        toast({
          variant: "destructive",
          title: "Inventory Error",
          description: result.message,
        });
        return;
      }
      queryClient.invalidateQueries(["sales", "products", "stock_movements"]);
      setShowForm(false);
      toast({ title: "Updated", description: "Invoice and Stock updated." });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: (id) => dbService.deleteSale(id),
    onSuccess: () => {
      // This tells the app to refetch EVERYTHING, including the charts
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["detailed-reports"] });

      toast({
        title: "Deleted",
        description: "Record removed and reports updated.",
      });
    },
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ["customer-ledger", editSale?.customer_id],
    queryFn: () => dbService.getCustomerLedger(editSale?.customer_id),
    enabled: !!editSale?.customer_id,
  });

  const totalCredit = ledger.reduce((sum, item) => {
    const types = ["credit"];
    return types.includes(item.type) ? sum + item.amount : sum;
  }, 0);

  // --- HANDLERS ---
  const handleDeleteSale = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone.",
      )
    ) {
      deleteSaleMutation.mutate(id);
    }
  };

  const handleSaveSale = async (data) => {
    if (editSale) {
      // 1. Get credits that are either Manual (null) or belong to this Sale
      const relevantCredits = ledger.filter(
        (item) =>
          item.type === "credit" &&
          (item.sale_id === null || item.sale_id === editSale.id),
      );

      // 2. Calculate Manual Payments specifically linked to THIS sale_id
      // We look inside the description string for: "saleId": 4 (or whatever the current ID is)
      const manualAppliedToThisSale = relevantCredits
        .filter((item) => item.sale_id === null)
        .reduce((sum, item) => {
          try {
            // Extract the JSON part from: "Manual Debt Payment||[{"saleId":4,"applied":200}]"
            const jsonPart = item.description.split("||")[1];
            if (jsonPart) {
              const applications = JSON.parse(jsonPart);
              const specificApp = applications.find(
                (app) => app.saleId === editSale.id,
              );
              return sum + (specificApp ? Number(specificApp.applied) : 0);
            }
          } catch (e) {
            console.error("Error parsing manual payment", e);
          }
          return sum;
        }, 0);

      const newInvoiceTotal = Number(data.total) || 0;
      const newPaidOnInvoice = Number(data.paid_amount) || 0;
      const newDiscount = Number(data.discount) || 0;

      // 3. The "Perfect Number"
      // (Total Cost) - (Discount) - (Manual money already assigned to this invoice)
      const suggestedPaidAmount = Math.max(
        0,
        newInvoiceTotal - newDiscount - manualAppliedToThisSale,
      );

      // 4. Check for overpayment
      const totalBenefit =
        manualAppliedToThisSale + newPaidOnInvoice + newDiscount;

      if (totalBenefit > newInvoiceTotal) {
        const overpayment = totalBenefit - newInvoiceTotal;

        const confirmed = await confirm({
          open: true,
          title: "Overpayment Warning",
          description: `This invoice already has ${symbol}${manualAppliedToThisSale} assigned via manual payments.
          Setting "Paid" to ${symbol}${newPaidOnInvoice} will result in an overpayment of ${symbol}${overpayment}.

          💡 To keep this invoice fully paid (0 balance), change your "Paid" column to: ${suggestedPaidAmount}`,
          confirmLabel: "Continue Anyway",
          cancelLabel: "Fix Amount",
          confirmVariant: "destructive",
        });

        if (!confirmed) return;
      }

      updateSaleMutation.mutate({ id: editSale.id, data });
    } else {
      createSaleMutation.mutate(data);
    }
  };

  // const handleSaveSale = (data) => {
  //   if (editSale) {
  //     updateSaleMutation.mutate({ id: editSale.id, data });
  //   } else {
  //     createSaleMutation.mutate(data);
  //   }
  // };

  // --- BARCODE SCANNING ---

  const barcodeBuffer = useRef("");
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
  //       return;
  //     if (e.key === "Enter") {
  //       if (barcodeBuffer.current.length > 3) {
  //         const product = products.find(
  //           (p) =>
  //             p.barcode === barcodeBuffer.current ||
  //             p.sku === barcodeBuffer.current,
  //         );
  //         if (product) {
  //           setShowForm(true); // Open form and you'd typically pass product to a cart state
  //           toast({ title: "Product Found", description: product.name });
  //         }
  //       }
  //       barcodeBuffer.current = "";
  //     } else if (e.key.length === 1) {
  //       barcodeBuffer.current += e.key;
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [products]);

  // Inside Sales.jsx, above your useEffect
  const [cart, setCart] = useState([]);

  const handleScan = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product_id === product.id,
      );

      if (existingIndex > -1) {
        // 1. If product exists in cart, increment quantity
        const updatedCart = [...prevCart];
        const item = updatedCart[existingIndex];
        const newQty = item.quantity + 1;

        updatedCart[existingIndex] = {
          ...item,
          quantity: newQty,
          total: newQty * item.unit_price,
        };

        toast({
          title: `Updated: ${product.name}`,
          description: `Quantity: ${newQty}`,
        });
        return updatedCart;
      } else {
        // 2. If it's a new product, add it as a new row
        toast({ title: "Product Found", description: product.name });
        return [
          ...prevCart,
          {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            total: product.price,
            cost_price: product.cost_price, // Essential for profit reporting
          },
        ];
      }
    });

    // Automatically open the sale form to show the updated cart
    if (!showForm) setShowForm(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "Enter") {
        const scannedCode = barcodeBuffer.current.trim();
        if (scannedCode.length > 3) {
          const product = products.find((p) => p.barcode === scannedCode);

          if (product) {
            handleScan(product); // This now works!
          } else {
            toast({
              variant: "destructive",
              title: "Not Found",
              description: `Barcode: ${scannedCode}`,
            });
          }
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, showForm]);

  const filtered = sales.filter((s) => {
    // Checks if search is empty, or equals "all", or matches the fields
    const matchSearch =
      !search ||
      search.toLowerCase() === "all" ||
      s.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || s.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const statusColors = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    partial: "bg-blue-50 text-blue-700 border-blue-200", // Added for partial payments
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const columns = [
    {
      header: "Invoice",
      render: (row) => <span className="font-bold">#{row.invoice_number}</span>,
    },
    {
      header: "Customer",
      render: (row) => (
        <span className="text-slate-600">{row.customer_name || "Walk-in"}</span>
      ),
    },
    {
      header: "Date",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {format(new Date(row.created_date), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      header: "Total",
      render: (row) => (
        <span className="font-semibold">
          {symbol}
          {row.total?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Due",
      render: (row) => (
        <span
          className={
            row.due_amount > 0 ? "text-red-600 font-bold" : "text-slate-400"
          }
        >
          {symbol}
          {row.due_amount?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <Badge
          className={`capitalize text-[10px] ${statusColors[row.status] || ""}`}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* REPRINT BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
            title="Reprint Receipt"
            onClick={async () => {
              // 1. Get the ledger for this specific customer
              const ledger = await dbService.getCustomerLedger(row.customer_id);

              // 2. Calculate Old Balance:
              // Sum of all transactions (debits - credits) that happened BEFORE this invoice date
              const invoiceDate = new Date(row.date);
              const oldBalance = ledger
                // .filter((tx) => new Date(tx.date) < invoiceDate)
                .reduce(
                  (sum, tx) =>
                    tx.type === "debit" ? sum + tx.amount : sum - tx.amount,
                  0,
                );

              // 3. Prepare Sale Data
              const saleData = {
                ...row,
                items:
                  typeof row.items === "string"
                    ? JSON.parse(row.items)
                    : row.items,
                customer_name: row.customer_name || "Walk-in",
                old_balance: oldBalance,
                business_name: settings?.app_name,
                settings,
              };
              console.log("saleData", saleData);

              // 4. Print
              const receiptUri = generateReceipt(saleData);
              dbService.printReceipt(receiptUri);

              toast({
                title: "Printing",
                description: `Re-printing Invoice #${row.invoice_number}`,
              });
            }}
          >
            <Printer className="w-4 h-4" />
          </Button>

          {/* EDIT BUTTON */}
          <Button
            // disabled={true}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600"
            onClick={() => {
              setEditSale(row);
              setShowForm(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          {/* DELETE BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => handleDeleteSale(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // DEBUG
  console.log("sales", sales);
  console.log("products", products);
  console.log("customers", customers);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.sales} // e.g. "Sales"
        subtitle={`${sales.length} transactions`}
        /* This creates the "+" button in the header */
        actionLabel="New Sale"
        onAction={() => {
          setEditSale(null);
          setShowForm(true);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No sales recorded yet."
      />

      {showForm && (
        <SaleFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setCart([]); // Reset cart when closing to prevent ghost items in next sale
              setEditSale(null);
            }
          }}
          initialScannedItems={cart} // Pass your live cart here
          initialData={editSale}
          onSave={handleSaveSale}
          saving={createSaleMutation.isPending || updateSaleMutation.isPending}
          products={products}
          customers={customers}
        />
      )}
      <ConfirmDialog
        state={state}
        onConfirm={() => {
          handleConfirm();
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}
