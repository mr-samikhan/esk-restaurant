// import React, { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { dbService } from "@/lib/db-service";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "@/components/ui/use-toast";

// export default function PayDebtDialog({ open, onOpenChange, customer }) {
//   const queryClient = useQueryClient();
//   const [amount, setAmount] = useState("");

//   const payMutation = useMutation({
//     mutationFn: (amt) =>
//       dbService.payCustomerDebt({
//         customerId: customer.id,
//         amount: parseFloat(amt),
//         description: `Manual Debt Payment`,
//       }),
//     onSuccess: () => {
//       // CRITICAL: Invalidate both the general list and the specific ledger
//       queryClient.invalidateQueries({ queryKey: ["customers"] });
//       queryClient.invalidateQueries({
//         queryKey: ["customer-ledger", customer.id],
//       });
//       queryClient.invalidateQueries({
//         queryKey: ["customer-sales", customer.id],
//       });

//       onOpenChange(false);
//       setAmount("");
//       toast({
//         title: "Payment Recorded",
//         description: `Successfully paid Rs. ${amount}`,
//       });
//     },
//   });

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Receive Payment: {customer?.name}</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4 py-4">
//           <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
//             <span className="text-sm text-slate-500">Current Debt:</span>
//             <span className="font-bold text-red-600 underline">
//               Rs. {customer?.debt_balance?.toLocaleString()}
//             </span>
//           </div>
//           <div className="space-y-2">
//             <Label>Payment Amount (Rs.)</Label>
//             <Input
//               type="number"
//               autoFocus
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               placeholder="Enter amount paid by customer"
//             />
//           </div>
//           <Button
//             className="w-full bg-emerald-600 hover:bg-emerald-700"
//             disabled={!amount || payMutation.isPending}
//             onClick={() => payMutation.mutate(amount)}
//           >
//             Confirm Payment
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function PayDebtDialog({ open, onOpenChange, customer }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("general");
  const [searchTerm, setSearchTerm] = useState(""); // Search state

  const { data: sales = [] } = useQuery({
    queryKey: ["customer-sales", customer?.id],
    queryFn: () => dbService.getSalesByCustomer(customer?.id),
    enabled: !!customer?.id && open,
  });

  // Filter logic for the dropdown
  const unpaidInvoices = useMemo(() => {
    return sales
      .filter((s) => s.total - s.paid_amount - (s.discount || 0) > 0)
      .filter(
        (s) =>
          s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id.toString().includes(searchTerm),
      );
  }, [sales, searchTerm]);

  // Find the currently selected invoice object to show its balance
  const activeInvoice = sales.find((s) => s.id.toString() === selectedInvoice);
  const remainingOnSelected = activeInvoice
    ? activeInvoice.total -
      activeInvoice.paid_amount -
      (activeInvoice.discount || 0)
    : null;

  const payMutation = useMutation({
    mutationFn: (amt) => {
      const isGeneral = selectedInvoice === "general";
      const saleIdNum = isGeneral ? null : parseInt(selectedInvoice);

      const description = isGeneral
        ? "Manual Debt Payment (General)"
        : `Manual Debt Payment||${JSON.stringify([{ saleId: saleIdNum, applied: parseFloat(amt) }])}`;

      return dbService.payCustomerDebt({
        customerId: customer.id,
        amount: parseFloat(amt),
        description: description,
        sale_id: saleIdNum, // Correctly pass null or number
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({
        queryKey: ["customer-ledger", customer?.id],
      });
      onOpenChange(false);
      setAmount("");
      setSearchTerm("");
      setSelectedInvoice("general");
      toast({
        title: "Payment Recorded",
        description: `Successfully paid Rs. ${amount}`,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Payment: {customer?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
            <span className="text-sm text-slate-500">Total Debt:</span>
            <span className="font-bold text-red-600">
              Rs. {customer?.debt_balance?.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Apply Payment To:</Label>
            <Select
              value={selectedInvoice}
              onValueChange={(val) => {
                setSelectedInvoice(val);
                setSearchTerm(""); // Reset search on select
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <div className="flex items-center px-2 pb-2 border-b">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search Invoice #..."
                    className="h-8 border-none focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()} // Prevent select from closing
                  />
                </div>
                <SelectItem value="general">
                  General Account (Floating Credit)
                </SelectItem>
                {unpaidInvoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id.toString()}>
                    #{inv.invoice_number} (Rem:{" "}
                    {inv.total - inv.paid_amount - (inv.discount || 0)})
                  </SelectItem>
                ))}
                {unpaidInvoices.length === 0 && searchTerm && (
                  <div className="p-2 text-xs text-center text-muted-foreground">
                    No invoices found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Payment Amount (Rs.)</Label>
              {remainingOnSelected > 0 && (
                <button
                  onClick={() => setAmount(remainingOnSelected.toString())}
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Pay Full (Rs. {remainingOnSelected})
                </button>
              )}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!amount || payMutation.isPending}
            onClick={() => payMutation.mutate(amount)}
          >
            {payMutation.isPending ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
