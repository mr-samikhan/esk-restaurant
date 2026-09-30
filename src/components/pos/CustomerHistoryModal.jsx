import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import { toast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search } from "lucide-react"; // Added Search icon
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Download, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import PayDebtDialog from "./PayDebtDialog";

export default function CustomerHistoryModal({ open, onOpenChange, customer }) {
  const [showPayDialog, setShowPayDialog] = useState(false);
  const queryClient = useQueryClient(); // ✅ fixed: was missing
  const [searchTerm, setSearchTerm] = useState("");

  // Always get the latest customer data so balances are fresh
  const { data: allCustomers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => dbService.getCustomers(),
  });

  const freshCustomer =
    allCustomers.find((c) => c.id === customer?.id) || customer;

  const { data: ledger = [] } = useQuery({
    queryKey: ["customer-ledger", customer?.id],
    queryFn: () => dbService.getCustomerLedger(customer.id),
    enabled: !!customer?.id,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["customer-sales", customer?.id],
    queryFn: () => dbService.getCustomerSales(customer.id),
    enabled: !!customer?.id,
  });

  // ---- Mutations ----
  const reconcileMutation = useMutation({
    mutationFn: (id) => dbService.reconcileCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["customer-ledger", customer.id]);
      toast({
        title: "Reconciled",
        description: "Balances recalculated from ledger.",
      });
    },
  });

  const deleteLedgerMutation = useMutation({
    mutationFn: (id) => dbService.deleteLedgerEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-ledger", customer.id]);
      queryClient.invalidateQueries(["customers"]);
      toast({
        title: "Deleted",
        description: "Record removed and balance updated.",
      });
    },
  });

  const handleDeleteLedgerEntry = (id) => {
    if (
      confirm(
        "Delete this transaction? The customer's balance will be adjusted.",
      )
    ) {
      deleteLedgerMutation.mutate(id);
    }
  };

  //search ledger
  const filteredLedger = useMemo(() => {
    if (!searchTerm) return ledger;
    const term = searchTerm.toLowerCase();
    return ledger.filter((tx) => {
      const description = (tx.description || "").toLowerCase();
      const amount = tx.amount.toString();
      const date = new Date(tx.date).toLocaleDateString().toLowerCase();
      const type = tx.type?.toLowerCase();
      // Check if description, amount, or date or type matches

      const isSearchingInvoice =
        "invoice".includes(term) || term.startsWith("inv");
      const isSearchingPayment =
        "payment".includes(term) ||
        term.startsWith("pay") ||
        term.startsWith("cre");
      return (
        description.includes(term) ||
        amount.includes(term) ||
        date.includes(term) ||
        (isSearchingInvoice && type === "debit") ||
        (isSearchingPayment && type === "credit")
      );
    });
  }, [ledger, searchTerm]);

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    const term = searchTerm.toLowerCase();
    return sales.filter(
      (s) =>
        s.invoice_number?.toLowerCase().includes(term) ||
        s.total.toString().includes(term),
    );
  }, [sales, searchTerm]);

  // ---- WhatsApp share ----
  const shareToWhatsApp = () => {
    if (!freshCustomer?.phone) {
      toast({
        variant: "destructive",
        title: "Missing Number",
        description: "Customer has no phone number.",
      });
      return;
    }
    const message = encodeURIComponent(
      `*Statement of Account*\n` +
        `Customer: ${freshCustomer.name}\n` +
        `Date: ${new Date().toLocaleDateString()}\n\n` +
        `*Current Summary*\n` +
        `Total Purchases: Rs. ${freshCustomer.total_purchases?.toLocaleString()}\n` +
        `Remaining Balance: *Rs. ${freshCustomer.debt_balance?.toLocaleString()}*\n\n` +
        `Please contact us for details.`,
    );
    const cleanPhone = freshCustomer.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  // ---- PDF download ----
  const downloadPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const fileName = `Statement_${freshCustomer.name.replace(/\s+/g, "_")}_${dateStr}`;

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("ACCOUNT STATEMENT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dateStr}`, 14, 30);

    doc.setDrawColor(230);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, 35, 182, 25, 2, 2, "FD");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Customer: ${freshCustomer.name}`, 20, 43);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${freshCustomer.phone || "N/A"}`, 20, 50);
    doc.text(`Address: ${freshCustomer.address || "N/A"}`, 20, 55);

    const totalPurchases = ledger
      .filter((tx) => tx.type === "debit")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalPaid = ledger
      .filter((tx) => tx.type === "credit")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const currentDebt = totalPurchases - totalPaid;

    doc.setFontSize(11);
    doc.text("Account Summary", 130, 43);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Invoices: Rs. ${totalPurchases.toLocaleString()}`, 130, 49);
    doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString()}`, 130, 54);
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text(`Balance Due: Rs. ${currentDebt.toLocaleString()}`, 130, 60);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Transaction History", 14, 75);

    const tableColumn = [
      "Date",
      "Description",
      "Type",
      "Debit (+)",
      "Credit (-)",
    ];
    const tableRows = ledger.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.type === "debit" ? "Invoice" : "Payment",
      tx.type === "debit" ? tx.amount.toLocaleString() : "-",
      tx.type === "credit" ? tx.amount.toLocaleString() : "-",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
      styles: { fontSize: 9 },
    });

    const finalY = doc.lastAutoTable.finalY || 90;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("_______________________", 14, finalY + 30);
    doc.text("Customer Signature", 14, finalY + 35);
    doc.text("_______________________", 150, finalY + 30);
    doc.text("Authorized Signature", 150, finalY + 35);
    doc.setTextColor(150);
    doc.text("Generated by POS System", 105, finalY + 50, { align: "center" });

    doc.save(`${fileName}.pdf`);
  };

  console.log("freshCustomer", freshCustomer);
  console.log("ledger", ledger);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>Account: {freshCustomer?.name}</DialogTitle>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-8"
              onClick={() => setShowPayDialog(true)}
              disabled={freshCustomer?.debt_balance <= 0}
            >
              Receive Payment
            </Button>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="p-2 bg-slate-50 rounded border text-sm">
              <span className="text-slate-500">Total Spent: </span>
              <span className="font-bold">
                Rs.{freshCustomer?.total_purchases?.toLocaleString()}
              </span>
            </div>
            <div className="p-2 bg-red-50 rounded border border-red-100 text-sm flex items-center gap-2">
              <span className="text-red-600">Remaining Balance: </span>
              <span className="font-bold text-red-700">
                Rs. {freshCustomer?.debt_balance?.toLocaleString()}
              </span>
              {/* Reconcile button — re-calculates balance from ledger */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                title="Recalculate balance from ledger"
                onClick={() => reconcileMutation.mutate(customer.id)}
                disabled={reconcileMutation.isPending}
              >
                <RefreshCw
                  className={cn(
                    "w-3 h-3",
                    reconcileMutation.isPending && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={shareToWhatsApp}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-2" />
              WhatsApp Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-indigo-600 border-indigo-200"
              onClick={downloadPDF}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by description, invoice #, or amount..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs
          defaultValue="invoices"
          className="mt-4 flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices">
              Invoice History:{filteredSales?.length}
            </TabsTrigger>
            <TabsTrigger value="ledger">
              Financial Ledger:{filteredLedger?.length}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="invoices"
            className="flex-1 overflow-y-auto mt-2 border rounded"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inv #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right text-amber-600">
                    Discount
                  </TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right text-emerald-600">
                    Paid
                  </TableHead>
                  <TableHead className="text-right text-red-600">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-slate-400"
                    >
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((s) => {
                    // Subtotal = total before discount.
                    // If we have a discount column, reverse-calculate it.
                    const discount = s.discount || 0;
                    const subtotal = s.total + discount; // gross = net + discount

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.invoice_number}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {new Date(s.created_date).toLocaleDateString()}
                        </TableCell>
                        {/* Subtotal */}
                        <TableCell className="text-right text-slate-500">
                          Rs.{subtotal.toLocaleString()}
                        </TableCell>
                        {/* Discount — only show if non-zero */}
                        <TableCell className="text-right">
                          {discount > 0 ? (
                            <span className="text-amber-600 font-medium">
                              − Rs.{discount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        {/* Net total */}
                        <TableCell className="text-right font-semibold">
                          Rs.{s.total.toLocaleString()}
                        </TableCell>
                        {/* Paid */}
                        <TableCell className="text-right text-emerald-600">
                          Rs.{s.paid_amount.toLocaleString()}
                        </TableCell>
                        {/* Due */}
                        <TableCell className="text-right text-red-600 font-bold">
                          Rs.{s.due_amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Summary row at the bottom */}
            {sales.length > 0 &&
              (() => {
                const totalSubtotal = sales.reduce(
                  (s, r) => s + (r.total + (r.discount || 0)),
                  0,
                );
                const totalDiscount = sales.reduce(
                  (s, r) => s + (r.discount || 0),
                  0,
                );
                const totalNet = sales.reduce((s, r) => s + r.total, 0);
                const totalPaid = sales.reduce((s, r) => s + r.paid_amount, 0);
                const totalDue = sales.reduce((s, r) => s + r.due_amount, 0);

                return (
                  <div className="border-t bg-slate-50 px-4 py-2 flex justify-between text-sm font-medium">
                    <span className="text-slate-500">
                      {sales.length} invoice{sales.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-6">
                      {totalDiscount > 0 && (
                        <span className="text-amber-600">
                          Discount: − Rs.{totalDiscount.toLocaleString()}
                        </span>
                      )}
                      <span className="text-slate-700">
                        Net: Rs.{totalNet.toLocaleString()}
                      </span>
                      <span className="text-emerald-600">
                        Paid: Rs.{totalPaid.toLocaleString()}
                      </span>
                      <span className="text-red-600 font-bold">
                        Due: Rs.{totalDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}
          </TabsContent>

          <TabsContent
            value="ledger"
            className="flex-1 overflow-y-auto mt-2 border rounded"
          >
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24 text-center">Type</TableHead>
                  <TableHead className="text-right">Debit (+)</TableHead>
                  <TableHead className="text-right">Credit (-)</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.length > 0 &&
                  filteredLedger.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {/* 1. Extract the base description */}
                        {(tx.description || "").split("||")[0]}

                        {/* 2. If it's linked to an invoice, show the Invoice label instead of raw ID */}
                        {tx.sale_id && (
                          <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {/* Try to find the invoice number from your sales list, otherwise show the ID */}
                            {sales.find((s) => s.id === tx.sale_id)
                              ?.invoice_number || `Invoice #${tx.sale_id}`}
                          </span>
                        )}
                      </TableCell>
                      {/* <TableCell className="text-sm font-medium">
                        {tx.description}
                      </TableCell> */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase",
                            tx.type === "debit"
                              ? "border-red-200 text-red-700 bg-red-50"
                              : "border-emerald-200 text-emerald-700 bg-emerald-50",
                          )}
                        >
                          {tx.type === "debit" ? "Invoice" : "Payment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {tx.type === "debit" ? tx.amount.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-700">
                        {tx.type === "credit"
                          ? tx.amount.toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.type === "credit" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteLedgerEntry(tx.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredLedger.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-slate-400"
                    >
                      No matching transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        {/* ✅ Pass freshCustomer so the PayDebtDialog always has the live balance */}
        <PayDebtDialog
          open={showPayDialog}
          onOpenChange={setShowPayDialog}
          customer={freshCustomer}
        />
      </DialogContent>
    </Dialog>
  );
}
