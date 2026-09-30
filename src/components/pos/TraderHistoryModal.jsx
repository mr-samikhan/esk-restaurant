// import React, { useState } from "react";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { dbService } from "@/lib/db-service";
// import { cn } from "@/lib/utils"; // Ensure cn is imported
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Check, Edit2, Trash2, X } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { TableFooter } from "@/components/ui/table";
// import { useCurrency } from "@/hooks/useCurrency";

// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { Download } from "lucide-react";

// export default function TraderHistoryModal({ open, onOpenChange, trader }) {
//   const queryClient = useQueryClient();
//   const { currency } = useCurrency();

//   const [editingTxId, setEditingTxId] = useState(null);

//   const [editFields, setEditFields] = useState({ description: "", date: "" });

//   const { data: history = [], isLoading } = useQuery({
//     queryKey: ["trader-history", trader?.id],
//     queryFn: () => dbService.getTraderHistory(trader.id),
//     enabled: !!trader?.id,
//   });

//   const updateMetadataMutation = useMutation({
//     mutationFn: (data) => dbService.updateTraderTransaction(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["trader-history", trader?.id]);
//       setEditingTxId(null);
//       toast({ title: "Updated", description: "Transaction details changed." });
//     },
//   });

//   const handleSaveEdit = (id) => {
//     updateMetadataMutation.mutate({ id, ...editFields });
//   };

//   const deleteMutation = useMutation({
//     mutationFn: (tx) =>
//       dbService.deleteTraderTransaction({
//         transactionId: tx.id,
//         traderId: tx.trader_id,
//         type: tx.type,
//         amount: tx.amount,
//       }),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["trader-history", trader?.id]);
//       queryClient.invalidateQueries(["traders"]); // Refresh balance in the main list
//       toast({
//         title: "Deleted",
//         description: "Transaction removed and balance updated.",
//       });
//     },
//   });

//   const handleDelete = (tx) => {
//     if (
//       window.confirm(
//         "Are you sure you want to delete this transaction? The trader's balance will be adjusted.",
//       )
//     ) {
//       deleteMutation.mutate(tx);
//     }
//   };

//   const totalBalance = history.reduce((acc, tx) => {
//     // Debit (Purchase) adds to what you owe (+), Credit (Payment) reduces it (-)
//     return acc + (tx.type === "debit" ? tx.amount : -tx.amount);
//   }, 0);

//   const downloadPDF = () => {
//     const doc = new jsPDF();
//     const dateStr = new Date().toLocaleDateString();

//     // 1. Add Header Information
//     doc.setFontSize(18);
//     doc.text("Trader Account Statement", 14, 20);

//     doc.setFontSize(11);
//     doc.setTextColor(100);
//     doc.text(`Trader: ${trader.name}`, 14, 30);
//     doc.text(`Date Generated: ${dateStr}`, 14, 35);
//     doc.text(`Current Balance: ${totalBalance.toLocaleString()}`, 14, 40);

//     // 2. Generate the Table
//     const tableColumn = ["Date", "Description", "Ref #", "Type", "Amount"];
//     const tableRows = history.map((tx) => [
//       new Date(tx.date).toLocaleDateString(),
//       tx.description,
//       tx.reference_id || "-",
//       tx.type === "debit" ? "Purchase" : "Payment",
//       `${tx.type === "debit" ? "+" : "-"}${tx.amount.toLocaleString()}`,
//     ]);

//     autoTable(doc, {
//       startY: 50,
//       head: [tableColumn],
//       body: tableRows,
//       theme: "grid",
//       headStyles: { fillColor: [79, 70, 229] }, // Indigo color to match your UI
//       columnStyles: {
//         4: { halign: "right", fontStyle: "bold" }, // Right-align Amount
//       },
//     });

//     // 3. Save the File
//     doc.save(`Statement_${trader.name.replace(/\s+/g, "_")}_${dateStr}.pdf`);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
//         <DialogHeader>
//           <DialogTitle>Transaction History: {trader?.name}</DialogTitle>
//           <Button
//             variant="outline"
//             size="sm"
//             className="mr-8 flex gap-2"
//             onClick={downloadPDF}
//             disabled={history.length === 0}
//           >
//             <Download className="w-4 h-4" />
//             Download PDF
//           </Button>
//         </DialogHeader>

//         <div className="flex-1 overflow-y-auto mt-4 border rounded-md">
//           <Table>
//             <TableHeader className="bg-slate-50 sticky top-0">
//               <TableRow>
//                 {/* Fixed: Moved w-32 into className */}
//                 <TableHead className="w-32">Date</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead className="w-24">Type</TableHead>
//                 <TableHead className="text-right w-32">Amount</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {isLoading ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-10">
//                     Loading history...
//                   </TableCell>
//                 </TableRow>
//               ) : history.length > 0 ? (
//                 history.map((tx) => (
//                   <TableRow key={tx.id} className="group">
//                     {/* DATE COLUMN */}
//                     <TableCell className="w-32">
//                       {editingTxId === tx.id ? (
//                         <Input
//                           type="date"
//                           className="h-8 text-xs"
//                           value={editFields.date.split("T")[0]}
//                           onChange={(e) =>
//                             setEditFields({
//                               ...editFields,
//                               date: e.target.value,
//                             })
//                           }
//                         />
//                       ) : (
//                         <span className="text-xs text-slate-500">
//                           {new Date(tx.date).toLocaleDateString()}
//                         </span>
//                       )}
//                     </TableCell>

//                     {/* DESCRIPTION & REFERENCE COLUMN */}
//                     <TableCell>
//                       {editingTxId === tx.id ? (
//                         <div className="space-y-1">
//                           <Input
//                             placeholder="Description"
//                             className="h-8 text-sm"
//                             value={editFields.description}
//                             onChange={(e) =>
//                               setEditFields({
//                                 ...editFields,
//                                 description: e.target.value,
//                               })
//                             }
//                           />
//                           <Input
//                             placeholder="Ref # (Invoice/Cheque)"
//                             className="h-7 text-[10px] bg-slate-50"
//                             value={editFields.reference_id || ""}
//                             onChange={(e) =>
//                               setEditFields({
//                                 ...editFields,
//                                 reference_id: e.target.value,
//                               })
//                             }
//                           />
//                         </div>
//                       ) : (
//                         <div>
//                           <p className="text-sm font-medium">
//                             {tx.description}
//                           </p>
//                           {tx.reference_id && (
//                             <p className="text-[10px] text-slate-400 font-mono uppercase">
//                               Ref: {tx.reference_id}
//                             </p>
//                           )}
//                         </div>
//                       )}
//                     </TableCell>

//                     {/* TYPE BADGE */}
//                     <TableCell className="w-24">
//                       <Badge
//                         variant="outline"
//                         className={cn(
//                           "capitalize text-[10px] px-1.5 py-0",
//                           tx.type === "debit"
//                             ? "text-red-600 border-red-200 bg-red-50"
//                             : "text-emerald-700 border-emerald-200 bg-emerald-50",
//                         )}
//                       >
//                         {tx.type === "debit" ? "Purchase" : "Payment"}
//                       </Badge>
//                     </TableCell>

//                     {/* AMOUNT COLUMN */}
//                     <TableCell
//                       className={cn(
//                         "text-right font-mono font-bold w-32",
//                         tx.type === "debit"
//                           ? "text-red-600"
//                           : "text-emerald-700",
//                       )}
//                     >
//                       {tx.type === "debit" ? "+" : "-"}
//                       {tx.amount.toLocaleString()}
//                     </TableCell>

//                     {/* ACTIONS COLUMN */}
//                     <TableCell className="text-right w-24">
//                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                         {editingTxId === tx.id ? (
//                           <>
//                             <Button
//                               variant="ghost"
//                               size="icon"
//                               className="h-7 w-7 text-green-600 hover:bg-green-50"
//                               onClick={() => handleSaveEdit(tx.id)}
//                             >
//                               <Check className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               variant="ghost"
//                               size="icon"
//                               className="h-7 w-7 text-slate-400"
//                               onClick={() => setEditingTxId(null)}
//                             >
//                               <X className="h-4 w-4" />
//                             </Button>
//                           </>
//                         ) : (
//                           <>
//                             <Button
//                               variant="ghost"
//                               size="icon"
//                               className="h-7 w-7 text-slate-400 hover:text-blue-600"
//                               onClick={() => {
//                                 setEditingTxId(tx.id);
//                                 setEditFields({
//                                   description: tx.description,
//                                   date: tx.date,
//                                   reference_id: tx.reference_id,
//                                 });
//                               }}
//                             >
//                               <Edit2 className="h-3.5 w-3.5" />
//                             </Button>
//                             <Button
//                               variant="ghost"
//                               size="icon"
//                               className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
//                               onClick={() => handleDelete(tx)}
//                             >
//                               <Trash2 className="h-3.5 w-3.5" />
//                             </Button>
//                           </>
//                         )}
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell
//                     colSpan={5}
//                     className="text-center py-10 text-slate-400"
//                   >
//                     No transactions found for this trader.
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//             <TableFooter className="bg-slate-100/50 sticky bottom-0 border-t">
//               <TableRow>
//                 <TableCell
//                   colSpan={3}
//                   className="text-sm font-bold text-slate-700 uppercase tracking-wider"
//                 >
//                   Current Outstanding Balance
//                 </TableCell>
//                 <TableCell
//                   className={cn(
//                     "text-right font-mono text-base font-black",
//                     totalBalance > 0 ? "text-red-600" : "text-emerald-700",
//                   )}
//                 >
//                   {currency === "PKR" ? "Rs." : "$"}
//                   {Math.abs(totalBalance).toLocaleString()}
//                   <span className="text-[10px] ml-1 block font-normal uppercase opacity-70">
//                     {totalBalance > 0
//                       ? "You Owe Trader"
//                       : totalBalance < 0
//                         ? "Advance Payment"
//                         : "Settled"}
//                   </span>
//                 </TableCell>
//                 <TableCell /> {/* Empty cell for the Actions column spacing */}
//               </TableRow>
//             </TableFooter>
//           </Table>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Check, Edit2, Trash2, X, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast"; // Fixed: Added missing hook import
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TraderHistoryModal({ open, onOpenChange, trader }) {
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Fixed: Initialized missing toast instance

  const [searchTerm, setSearchTerm] = useState(""); // Added: Search filter state
  const [editingTxId, setEditingTxId] = useState(null);
  const [editFields, setEditFields] = useState({
    description: "",
    date: "",
    reference_id: "",
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["trader-history", trader?.id],
    queryFn: () => dbService.getTraderHistory(trader.id),
    enabled: !!trader?.id && open,
  });

  // --- SEARCH AND FILTER FILTERING ENGINE ---
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase().trim();

    return history.filter((tx) => {
      const desc = (tx.description || "").toLowerCase();
      const ref = (tx.reference_id || "").toLowerCase();
      const amount = tx.amount.toString();
      const type = tx.type.toLowerCase(); // 'debit' or 'credit'

      const isSearchingPurchase =
        "purchase".includes(term) ||
        term.startsWith("pur") ||
        term.startsWith("deb");
      const isSearchingPayment =
        "payment".includes(term) ||
        term.startsWith("pay") ||
        term.startsWith("cre");

      return (
        desc.includes(term) ||
        ref.includes(term) ||
        amount.includes(term) ||
        (isSearchingPurchase && type === "debit") ||
        (isSearchingPayment && type === "credit")
      );
    });
  }, [history, searchTerm]);

  const updateMetadataMutation = useMutation({
    mutationFn: (data) => dbService.updateTraderTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["trader-history", trader?.id]);
      setEditingTxId(null);
      toast({ title: "Updated", description: "Transaction details changed." });
    },
  });

  const handleStartEdit = (tx) => {
    setEditingTxId(tx.id);
    setEditFields({
      description: tx.description || "",
      date: tx.date || "",
      reference_id: tx.reference_id || "",
    });
  };

  const handleSaveEdit = (id) => {
    updateMetadataMutation.mutate({ id, ...editFields });
  };

  const deleteMutation = useMutation({
    mutationFn: (tx) =>
      dbService.deleteTraderTransaction({
        transactionId: tx.id,
        traderId: tx.trader_id,
        type: tx.type,
        amount: tx.amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["trader-history", trader?.id]);
      queryClient.invalidateQueries(["traders"]);
      toast({
        title: "Deleted",
        description: "Transaction removed and balance updated.",
      });
    },
  });

  const handleDelete = (tx) => {
    if (
      window.confirm(
        "Are you sure you want to delete this transaction? The trader's balance will be adjusted.",
      )
    ) {
      deleteMutation.mutate(tx);
    }
  };

  const totalBalance = history.reduce((acc, tx) => {
    return acc + (tx.type === "debit" ? tx.amount : -tx.amount);
  }, 0);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Trader Account Statement", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Trader: ${trader.name}`, 14, 30);
    doc.text(`Date Generated: ${dateStr}`, 14, 35);
    doc.text(`Current Balance: Rs. ${totalBalance.toLocaleString()}`, 14, 40);

    const tableColumn = ["Date", "Description", "Ref #", "Type", "Amount"];
    const tableRows = filteredHistory.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.reference_id || "-",
      tx.type === "debit" ? "Purchase" : "Payment",
      `${tx.type === "debit" ? "+" : "-"}${tx.amount.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
    });

    doc.save(`Statement_${trader.name.replace(/\s+/g, "_")}_${dateStr}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-center pr-6">
          <div>
            <DialogTitle>Account Statement: {trader?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Net Due Balance:{" "}
              <span className="font-bold text-red-600 font-mono">
                Rs. {totalBalance.toLocaleString()}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex gap-2"
            onClick={downloadPDF}
            disabled={filteredHistory.length === 0}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </DialogHeader>

        {/* Added: Search Filter input field */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by keywords, purchases, payments, ref # or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-3 border rounded-md bg-white">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-32">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-center">Type</TableHead>
                <TableHead className="text-right w-32">Amount</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-slate-400"
                  >
                    Loading account history entries...
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((tx) => (
                  <TableRow key={tx.id} className="group hover:bg-slate-50/50">
                    {/* DATE ELEMENT */}
                    <TableCell className="w-32">
                      {editingTxId === tx.id ? (
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={
                            editFields.date ? editFields.date.split("T")[0] : ""
                          }
                          onChange={(e) =>
                            setEditFields({
                              ...editFields,
                              date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>

                    {/* DESCRIPTION TEXT */}
                    <TableCell>
                      {editingTxId === tx.id ? (
                        <div className="space-y-1">
                          <Input
                            placeholder="Description detail"
                            className="h-8 text-sm"
                            value={editFields.description}
                            onChange={(e) =>
                              setEditFields({
                                ...editFields,
                                description: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Ref # (Invoice / voucher)"
                            className="h-7 text-[10px] bg-slate-50 font-mono"
                            value={editFields.reference_id || ""}
                            onChange={(e) =>
                              setEditFields({
                                ...editFields,
                                reference_id: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {tx.description}
                          </p>
                          {tx.reference_id && (
                            <span className="inline-block text-[9px] text-indigo-600 bg-indigo-50 font-mono uppercase px-1.5 py-0.5 rounded mt-0.5">
                              Ref: {tx.reference_id}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* TRANSACTION METRIC TYPE BADGE */}
                    <TableCell className="w-24 text-center">
                      <Badge
                        variant={
                          tx.type === "debit" ? "destructive" : "secondary"
                        }
                        className="text-[10px] uppercase px-2 py-0"
                      >
                        {tx.type === "debit" ? "Purchase" : "Payment"}
                      </Badge>
                    </TableCell>

                    {/* FINANCIAL TRANSACTION AMOUNT */}
                    <TableCell
                      className={cn(
                        "text-right font-semibold font-mono w-32 text-sm",
                        tx.type === "debit"
                          ? "text-red-600"
                          : "text-emerald-600",
                      )}
                    >
                      {tx.type === "debit" ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </TableCell>

                    {/* ACTION TRIGGERS OVERLAYS CONTROL PANEL */}
                    <TableCell className="w-20">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingTxId === tx.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleSaveEdit(tx.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:bg-slate-100"
                              onClick={() => setEditingTxId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => handleStartEdit(tx)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(tx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-slate-400 italic"
                  >
                    No transactions found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
