// import React, { useState, useEffect } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { dbService } from "@/lib/db-service";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { toast } from "@/components/ui/use-toast";

// export default function TraderPaymentDialog({ open, onOpenChange, trader }) {
//   const queryClient = useQueryClient();
//   const [form, setForm] = useState({
//     type: "credit", // Default to 'Payment'
//     amount: "",
//     description: "",
//   });

//   useEffect(() => {
//     if (open) setForm({ type: "credit", amount: "", description: "" });
//   }, [open]);

//   const transactionMutation = useMutation({
//     mutationFn: (data) =>
//       dbService.addTraderTransaction({
//         traderId: trader.id,
//         ...data,
//         amount: parseFloat(data.amount),
//       }),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["traders"]);
//       queryClient.invalidateQueries(["trader-history", trader?.id]);
//       onOpenChange(false);
//       toast({
//         title: "Success",
//         description: "Transaction recorded successfully.",
//       });
//     },
//   });

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Record Transaction: {trader?.name}</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4 py-4">
//           <div className="space-y-2">
//             <Label>Transaction Type</Label>
//             <Select
//               value={form.type}
//               onValueChange={(v) => setForm({ ...form, type: v })}
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="credit">
//                   Payment (Money Paid to Trader)
//                 </SelectItem>
//                 <SelectItem value="debit">
//                   Purchase (Stock Bought on Credit)
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="space-y-2">
//             <Label>Amount</Label>
//             <Input
//               type="number"
//               value={form.amount}
//               onChange={(e) => setForm({ ...form, amount: e.target.value })}
//               placeholder="0.00"
//             />
//           </div>
//           <div className="space-y-2">
//             <Label>Description / Note</Label>
//             <Input
//               value={form.description}
//               onChange={(e) =>
//                 setForm({ ...form, description: e.target.value })
//               }
//               placeholder="e.g. Cash payment for Invoice #123"
//             />
//           </div>
//           <Button
//             className="w-full"
//             onClick={() => transactionMutation.mutate(form)}
//             disabled={!form.amount || transactionMutation.isPending}
//           >
//             {transactionMutation.isPending
//               ? "Recording..."
//               : "Save Transaction"}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export default function TraderPaymentDialog({ open, onOpenChange, trader }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    type: "credit", // Default to 'Payment' (Money Paid to Trader)
    amount: "",
    description: "",
  });

  useEffect(() => {
    if (open) setForm({ type: "credit", amount: "", description: "" });
  }, [open]);

  // Read the active dynamic outstanding balance passed down from your trader grid row
  const activeDebt = Number(trader?.debt_balance) || 0;

  const transactionMutation = useMutation({
    // FIX: Only call the valid addTraderTransaction endpoint.
    // Your backend handler already handles the balance calculations inline!
    mutationFn: async (formData) => {
      return await dbService.addTraderTransaction({
        traderId: trader.id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description || "Manual Transaction Entry",
      });
    },
    onSuccess: () => {
      // 1. Force the React Query cache to dump stale data immediately
      queryClient.invalidateQueries({ queryKey: ["traders"] });
      queryClient.invalidateQueries({
        queryKey: ["trader-history", trader?.id],
      });

      // 2. CLOSE THE DIALOG (This will now run 100% of the time)
      onOpenChange(false);

      toast({
        title: "Success",
        description: "Transaction recorded and master balance synchronized.",
      });
    },
    onError: (err) => {
      console.error("Payment Submission Failure:", err);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description:
          err.message || "Failed to communicate with the database service.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Transaction: {trader?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Outstanding Profile Tracker Box */}
          <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border">
            <span className="text-xs text-slate-500 uppercase font-bold">
              Current Account Debt:
            </span>
            <span
              className={`font-mono font-bold text-sm ${activeDebt > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              Rs. {activeDebt.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">
                  Payment (Money Paid to Trader)
                </SelectItem>
                <SelectItem value="debit">
                  Purchase (Stock Bought on Credit)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Amount</Label>
              {/* Added: Pay Full Balance helper link when processing a payment mapping */}
              {form.type === "credit" && activeDebt > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, amount: activeDebt.toString() })
                  }
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  Pay Full (Rs. {activeDebt})
                </button>
              )}
            </div>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Description / Note</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={
                form.type === "credit"
                  ? "e.g. Paid cash balance out"
                  : "e.g. Manual restock receipt ledger"
              }
            />
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5"
            onClick={() => transactionMutation.mutate(form)}
            disabled={!form.amount || transactionMutation.isPending}
          >
            {transactionMutation.isPending
              ? "Recording & Syncing..."
              : "Save Transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
