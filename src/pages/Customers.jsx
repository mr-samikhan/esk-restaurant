import React, { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/pos/PageHeader";
import DataTable from "../components/pos/DataTable";
import EmptyState from "../components/pos/EmptyState";
import CustomerFormDialog from "../components/pos/CustomerFormDialog";
import { Users, Search, Edit2, Trash2, ReceiptText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "../hooks/useCurrency";
import { cn } from "@/lib/utils";
import CustomerHistoryModal from "../components/pos/CustomerHistoryModal";

export default function Customers() {
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("en");
  const { symbol } = useCurrency();

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => dbService.getCustomers(), // 2. Updated
  });

  const createMutation = useMutation({
    mutationFn: (data) => dbService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
    },
    onError: (error) => {
      // Check if the error is a unique constraint violation
      if (error.message.includes("UNIQUE constraint failed")) {
        alert(
          lang === "ur"
            ? "یہ فون نمبر پہلے سے موجود ہے!"
            : "This phone number is already registered to another customer.",
        );
      } else {
        alert("An error occurred while saving.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dbService.updateCustomer({ id, data }), // 4. Updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
      setEditCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dbService.deleteCustomer(id), // 5. Updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteId(null);
    },
  });

  const handleSave = (data) => {
    if (editCustomer) {
      updateMutation.mutate({ id: editCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email || "—"}</p>
        </div>
      ),
    },
    {
      header: "Phone",
      render: (row) => <span className="text-slate-600">{row.phone}</span>,
    },
    {
      header: "Orders",
      render: (row) => (
        <span className="text-slate-600">{row.total_orders || 0}</span>
      ),
    },
    {
      header: "Total Spent",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {symbol}
          {(row.total_purchases || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Points",
      render: (row) => (
        <span className="text-indigo-600 font-medium">
          {row.loyalty_points || 0}
        </span>
      ),
    },
    {
      header: "Total Orders",
      render: (row) => (
        <span className="text-slate-600">{row.total_orders || 0}</span>
      ),
    },
    {
      header: "Debt Balance",
      render: (row) => (
        <span
          className={cn(
            "font-bold",
            row.debt_balance > 0 ? "text-red-600" : "text-emerald-600",
          )}
        >
          {symbol}
          {(row.debt_balance || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* NEW HISTORY BUTTON */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={() => setViewingCustomer(row)}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            History
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditCustomer(row);
              setShowForm(true);
            }}
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={true}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir={t.dir}>
      <PageHeader
        title={t.customers_title}
        actionLabel={t.add_customer}
        subtitle={`${customers.length} customers`}
        onAction={() => {
          setEditCustomer(null);
          setShowForm(true);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-48 sm:w-64"
          />
        </div>
      </PageHeader>

      {!isLoading && customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start tracking purchases."
          actionLabel="Add Customer"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No customers match your search"
        />
      )}

      {showForm && (
        <CustomerFormDialog
          open={showForm}
          onOpenChange={(v) => {
            setShowForm(v);
            if (!v) setEditCustomer(null);
          }}
          customer={editCustomer}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {viewingCustomer && (
        <CustomerHistoryModal
          open={!!viewingCustomer}
          onOpenChange={() => setViewingCustomer(null)}
          customer={viewingCustomer}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
