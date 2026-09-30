// import React, { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { dbService } from "@/lib/db-service";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Trash2, Plus, Search, User, Edit2 } from "lucide-react"; // Added Edit2
// import { useToast } from "@/components/ui/use-toast";
// import TraderHistoryModal from "./TraderHistoryModal";
// import TraderPaymentDialog from "./TraderPaymentDialog";
// import { cn } from "@/lib/utils";

// import {
//   Command,
//   CommandGroup,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
//   PopoverAnchor,
// } from "@/components/ui/popover";
// import { Check, ChevronsUpDown } from "lucide-react";
// import { Label } from "../ui/label";

// export default function TraderManager({ open, onOpenChange }) {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [paymentTrader, setPaymentTrader] = useState(null);
//   const [selectedTrader, setSelectedTrader] = useState(null);
//   const [editingTrader, setEditingTrader] = useState(null);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   // Expanded state to include WhatsApp and Secondary Phone
//   const [newTrader, setNewTrader] = useState({
//     name: "",
//     phone: "",
//     secondary_phone: "",
//     whatsapp: "",
//   });

//   const { data: traders = [] } = useQuery({
//     queryKey: ["traders"],
//     queryFn: () => dbService.getTraders(),
//   });

//   const createMutation = useMutation({
//     mutationFn: (data) => dbService.createTrader(data),
//     onSuccess: (result) => {
//       // Check if the backend returned our custom error object
//       if (result?.error === "ALREADY_EXISTS") {
//         toast({
//           variant: "destructive",
//           title: "Duplicate Name",
//           description: result.message,
//         });
//         return; // Stop here, don't clear the form
//       }

//       queryClient.invalidateQueries(["traders"]);
//       setNewTrader({ name: "", phone: "", secondary_phone: "", whatsapp: "" });
//       toast({ title: "Added", description: "Trader added successfully" });
//     },
//   });

//   const updateMutation = useMutation({
//     mutationFn: (payload) => dbService.updateTrader(payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["traders"]);
//       resetForm();
//       toast({ title: "Updated", description: "Trader updated successfully" });
//     },
//   });

//   const resetForm = () => {
//     setEditingTrader(null);
//     setNewTrader({ name: "", phone: "", secondary_phone: "", whatsapp: "" });
//   };

//   const handleEdit = (t) => {
//     setEditingTrader(t);
//     setNewTrader({
//       name: t.name,
//       phone: t.phone || "",
//       secondary_phone: t.secondary_phone || "",
//       whatsapp: t.whatsapp || "",
//     });
//   };

//   const filtered = traders.filter((t) =>
//     t.name.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const isDuplicate = traders.some(
//     (t) =>
//       t.name.toLowerCase().trim() === newTrader.name.toLowerCase().trim() &&
//       t.id !== editingTrader?.id, // 👈 This is the key fix
//   );

//   const suggestions = traders.filter(
//     (t) =>
//       newTrader.name.length > 1 &&
//       t.name.toLowerCase().includes(newTrader.name.toLowerCase()) &&
//       t.id !== editingTrader?.id,
//   );

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>
//             {editingTrader ? "Edit Trader" : "Manage Traders"}
//           </DialogTitle>
//         </DialogHeader>

//         {/* Input Fields Grid */}
//         <div className="grid grid-cols-2 gap-2 my-4">
//           <div className="col-span-2 relative">
//             <Label className="mb-1 block">Trader Name *</Label>

//             <Popover open={showSuggestions && suggestions.length > 0}>
//               {/* 2. Use PopoverAnchor so the Input is NOT a trigger */}
//               <PopoverAnchor asChild>
//                 <Input
//                   placeholder="Type trader name..."
//                   value={newTrader.name}
//                   onChange={(e) => {
//                     const val = e.target.value;
//                     setNewTrader({ ...newTrader, name: val });
//                     // Only show suggestions if we are NOT perfectly matching the current editing name
//                     setShowSuggestions(val.trim() !== editingTrader?.name);
//                   }}
//                   // Ensure the button enables/disables correctly on blur
//                   onBlur={() =>
//                     setTimeout(() => setShowSuggestions(false), 200)
//                   }
//                   className={cn(
//                     isDuplicate &&
//                       "border-red-500 bg-red-50 focus-visible:ring-red-500",
//                   )}
//                 />
//               </PopoverAnchor>

//               <PopoverContent
//                 className="p-0 w-[var(--radix-popover-trigger-width)]"
//                 align="start"
//                 // Prevent the popover from taking focus away from the input
//                 onOpenAutoFocus={(e) => e.preventDefault()}
//               >
//                 <Command>
//                   <CommandList>
//                     <CommandGroup heading="Existing Traders Found">
//                       {suggestions.map((t) => (
//                         <CommandItem
//                           key={t.id}
//                           onSelect={() => {
//                             handleEdit(t);
//                             setShowSuggestions(false);
//                           }}
//                           className="cursor-pointer"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-4 w-4",
//                               editingTrader?.id === t.id
//                                 ? "opacity-100"
//                                 : "opacity-0",
//                             )}
//                           />
//                           <div>
//                             <p className="text-sm font-medium">{t.name}</p>
//                             <p className="text-[10px] text-muted-foreground">
//                               {t.phone}
//                             </p>
//                           </div>
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>

//             {isDuplicate && (
//               <p className="text-[10px] text-red-600 mt-1 ml-1 font-medium">
//                 ⚠️ This name is already used by another trader.
//               </p>
//             )}
//           </div>
//           <Input
//             placeholder="Main Phone"
//             value={newTrader.phone}
//             onChange={(e) =>
//               setNewTrader({ ...newTrader, phone: e.target.value })
//             }
//           />
//           <Input
//             placeholder="WhatsApp Number"
//             value={newTrader.whatsapp}
//             onChange={(e) =>
//               setNewTrader({ ...newTrader, whatsapp: e.target.value })
//             }
//           />
//           <Input
//             placeholder="Secondary Phone"
//             value={newTrader.secondary_phone}
//             onChange={(e) =>
//               setNewTrader({ ...newTrader, secondary_phone: e.target.value })
//             }
//             className="col-span-2"
//           />

//           <div className="flex gap-2 col-span-2 mt-2">
//             <Button
//               className="flex-1"
//               type="button"
//               disabled={
//                 !newTrader.name.trim() ||
//                 isDuplicate ||
//                 createMutation.isPending ||
//                 updateMutation.isPending
//               }
//               onClick={() => {
//                 if (editingTrader) {
//                   updateMutation.mutate({
//                     id: editingTrader.id,
//                     data: newTrader,
//                   });
//                 } else {
//                   createMutation.mutate(newTrader);
//                 }
//               }}
//             >
//               {editingTrader ? "Update Trader" : "Add Trader"}
//             </Button>

//             {editingTrader && (
//               <Button variant="ghost" type="button" onClick={resetForm}>
//                 Cancel
//               </Button>
//             )}
//           </div>
//         </div>

//         <div className="relative my-2">
//           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <Input
//             placeholder="Search traders..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-9"
//           />
//         </div>

//         <div className="max-h-[300px] overflow-y-auto space-y-2 mt-2">
//           {filtered.map((t) => (
//             <div key={t.id} className="p-3 border rounded-lg space-y-3">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="font-medium">{t.name}</p>
//                   <p
//                     className={`text-xs font-bold ${t.current_balance > 0 ? "text-red-600" : "text-emerald-600"}`}
//                   >
//                     Balance: Rs.{t.current_balance?.toLocaleString()}
//                     {t.current_balance > 0 ? " (Payable)" : " (Clear)"}
//                   </p>
//                 </div>
//                 {/* EDIT & DELETE ACTION BUTTONS */}
//                 <div className="flex gap-1">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-8 w-8 text-blue-600"
//                     onClick={() => handleEdit(t)}
//                   >
//                     <Edit2 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-8 w-8 text-red-500"
//                     onClick={() =>
//                       dbService
//                         .deleteTrader(t.id)
//                         .then(() => queryClient.invalidateQueries(["traders"]))
//                     }
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>

//               {/* PAYMENT & HISTORY ACTION BUTTONS */}
//               <div className="flex gap-2 border-t pt-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1 text-emerald-600 border-emerald-200 h-8"
//                   onClick={() => setPaymentTrader(t)}
//                 >
//                   Record Payment
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1 h-8"
//                   onClick={() => setSelectedTrader(t)}
//                 >
//                   History
//                 </Button>
//               </div>
//             </div>
//           ))}
//         </div>

//         <TraderHistoryModal
//           open={!!selectedTrader}
//           onOpenChange={() => setSelectedTrader(null)}
//           trader={selectedTrader}
//         />

//         <TraderPaymentDialog
//           open={!!paymentTrader}
//           onOpenChange={() => setPaymentTrader(null)}
//           trader={paymentTrader}
//         />
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Search, User, Edit2, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TraderHistoryModal from "./TraderHistoryModal";
import TraderPaymentDialog from "./TraderPaymentDialog";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { Label } from "../ui/label";

export default function TraderManager({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTrader, setPaymentTrader] = useState(null);
  const [historyTrader, setHistoryTrader] = useState(null);
  const [editingTrader, setEditingTrader] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [newTrader, setNewTrader] = useState({
    name: "",
    phone: "",
    secondary_phone: "",
    whatsapp: "",
  });

  // --- DATA FETCHING ---
  const { data: traders = [] } = useQuery({
    queryKey: ["traders"],
    queryFn: () => dbService.getTraders(),
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (data) => dbService.createTrader(data),
    onSuccess: (result) => {
      if (result?.error === "ALREADY_EXISTS") {
        toast({
          variant: "destructive",
          title: "Duplicate Name",
          description: result.message,
        });
        return;
      }
      queryClient.invalidateQueries(["traders"]);
      resetForm();
      toast({ title: "Added", description: "Trader added successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => dbService.updateTrader(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["traders"]);
      resetForm();
      toast({ title: "Updated", description: "Trader updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tx) =>
      dbService.deleteTraderTransaction({
        transactionId: tx.id,
        traderId: tx.trader_id,
        type: tx.type,
        amount: tx.amount,
      }),
    onSuccess: () => {
      // Force both the nested history ledger modal views and the external parent manager view to pull live data
      queryClient.invalidateQueries({
        queryKey: ["trader-history", trader?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["traders"] });

      toast({
        title: "Deleted & Synced",
        description:
          "Transaction removed and master trader balances updated instantly.",
      });
    },
  });

  // --- HANDLERS ---
  const resetForm = () => {
    setEditingTrader(null);
    setNewTrader({ name: "", phone: "", secondary_phone: "", whatsapp: "" });
  };

  const handleEdit = (t) => {
    setEditingTrader(t);
    setNewTrader({
      name: t.name,
      phone: t.phone || "",
      secondary_phone: t.secondary_phone || "",
      whatsapp: t.whatsapp || "",
    });
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Delete this trader profile? Outstanding ledger values will be affected.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  // --- SEARCH AND SUGGESTIONS LOGIC ---
  const filteredTraders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return traders;
    return traders.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.phone && t.phone.includes(term)),
    );
  }, [traders, searchTerm]);

  const isDuplicate = traders.some(
    (t) =>
      t.name.toLowerCase().trim() === newTrader.name.toLowerCase().trim() &&
      t.id !== editingTrader?.id,
  );

  const suggestions = traders.filter(
    (t) =>
      newTrader.name.length > 1 &&
      t.name.toLowerCase().includes(newTrader.name.toLowerCase()) &&
      t.id !== editingTrader?.id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editingTrader ? "Edit Trader Profile" : "Trader Registry Manager"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-1 py-2">
          {/* LEFT COLUMN: Input Control Form Panel */}
          <div className="md:col-span-5 space-y-3 border-r pr-4">
            <div className="relative">
              <Label className="mb-1 block text-xs font-semibold">
                Trader Name *
              </Label>
              <Popover open={showSuggestions && suggestions.length > 0}>
                <PopoverAnchor asChild>
                  <Input
                    placeholder="Type trader name..."
                    value={newTrader.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTrader({ ...newTrader, name: val });
                      setShowSuggestions(val.trim() !== editingTrader?.name);
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    className={cn(
                      isDuplicate &&
                        "border-red-500 bg-red-50 focus-visible:ring-red-500",
                    )}
                  />
                </PopoverAnchor>
                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command>
                    <CommandList>
                      <CommandGroup heading="Existing Traders Match">
                        {suggestions.map((t) => (
                          <CommandItem
                            key={t.id}
                            onSelect={() => {
                              handleEdit(t);
                              setShowSuggestions(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editingTrader?.id === t.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div>
                              <p className="text-sm font-medium">{t.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {t.phone}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isDuplicate && (
                <p className="text-[10px] text-red-600 mt-1 font-medium">
                  ⚠️ Name taken by another trader profile.
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1 block text-xs font-semibold">
                Main Phone
              </Label>
              <Input
                placeholder="Primary voice contact"
                value={newTrader.phone}
                onChange={(e) =>
                  setNewTrader({ ...newTrader, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs font-semibold">
                WhatsApp Number
              </Label>
              <Input
                placeholder="Active chat channel number"
                value={newTrader.whatsapp}
                onChange={(e) =>
                  setNewTrader({ ...newTrader, whatsapp: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs font-semibold">
                Secondary Phone
              </Label>
              <Input
                placeholder="Backup alternate phone"
                value={newTrader.secondary_phone}
                onChange={(e) =>
                  setNewTrader({
                    ...newTrader,
                    secondary_phone: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                type="button"
                disabled={
                  !newTrader.name.trim() ||
                  isDuplicate ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                onClick={() => {
                  if (editingTrader) {
                    updateMutation.mutate({
                      id: editingTrader.id,
                      data: newTrader,
                    });
                  } else {
                    createMutation.mutate(newTrader);
                  }
                }}
              >
                {editingTrader ? "Update Trader" : "Save Trader Profile"}
              </Button>
              {editingTrader && (
                <Button variant="outline" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Live Registry Search Feed */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search database registry by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border rounded-md overflow-y-auto max-h-[48vh] bg-white divide-y">
              {filteredTraders.map((t) => {
                // CRITICAL FIX: Ensure this key exactly matches your database column 'debt_balance'
                const liveDebtBalance = Number(t.debt_balance) || 0;

                return (
                  <div
                    key={t.id}
                    className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-sm text-slate-800">
                          {t.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 pl-5 font-mono">
                        {t.phone || "No contact verified"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Outstanding Balance
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold font-mono",
                            liveDebtBalance > 0
                              ? "text-red-600"
                              : "text-emerald-600",
                          )}
                        >
                          Rs. {liveDebtBalance.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center border-l pl-2 gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
                          title="Account Statement History"
                          onClick={() => setHistoryTrader(t)}
                        >
                          <Search className="h-3.5 w-3.5" />
                        </Button>

                        {/* BUTTON UNLOCK FIX: Checks liveDebtBalance correctly */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                          title="Clear / Process Payout"
                          disabled={liveDebtBalance <= 0} // Will now evaluate to false if debt_balance > 0
                          onClick={() => setPaymentTrader(t)}
                        >
                          <Wallet className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit Profile Details"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50"
                          title="Remove Record Profile"
                          onClick={() => handleDelete(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTraders.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400 italic">
                  No registered traders match the current criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Overlay Triggers Area */}
        {paymentTrader && (
          <TraderPaymentDialog
            open={!!paymentTrader}
            onOpenChange={() => setPaymentTrader(null)}
            trader={paymentTrader}
          />
        )}
        {historyTrader && (
          <TraderHistoryModal
            open={!!historyTrader}
            onOpenChange={() => setHistoryTrader(null)}
            trader={historyTrader}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
