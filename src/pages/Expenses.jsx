import React, { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/pos/PageHeader";
import DataTable from "../components/pos/DataTable";
import EmptyState from "../components/pos/EmptyState";
import ExpenseFormDialog from "../components/pos/ExpenseFormDialog";
import StatCard from "../components/pos/StatCard";
import {
  Receipt,
  Search,
  Edit2,
  Trash2,
  TrendingDown,
  Repeat,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("en");

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => dbService.getExpenses(), // 2. Updated
  });

  const createMutation = useMutation({
    mutationFn: (data) => dbService.createExpense(data), // 3. Updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dbService.updateExpense({ id, data }), // 4. Updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
      setEditExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dbService.deleteExpense(id), // 5. Updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeleteId(null);
    },
  });

  const handleSave = (data) => {
    if (editExpense) {
      updateMutation.mutate({ id: editExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const recurringCount = expenses.filter((e) => e.is_recurring).length;

  const categoryColors = {
    rent: "bg-orange-50 text-orange-700",
    utilities: "bg-green-50 text-green-700",
    salaries: "bg-blue-50 text-blue-700",
    supplies: "bg-purple-50 text-purple-700",
    marketing: "bg-pink-50 text-pink-700",
    transport: "bg-cyan-50 text-cyan-700",
    maintenance: "bg-amber-50 text-amber-700",
    taxes: "bg-red-50 text-red-700",
    insurance: "bg-indigo-50 text-indigo-700",
    other: "bg-slate-50 text-slate-700",
  };

  const columns = [
    {
      header: "Expense",
      render: (row) => (
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900">{row.title}</p>
          {row.is_recurring && (
            <Repeat className="w-3.5 h-3.5 text-indigo-500" />
          )}
        </div>
      ),
    },
    {
      header: "Category",
      render: (row) => (
        <Badge
          className={`capitalize text-xs ${categoryColors[row.category] || ""}`}
        >
          {row.category?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Date",
      render: (row) => (
        <span className="text-slate-500">
          {row.date ? format(new Date(row.date), "MMM d, yyyy") : "—"}
        </span>
      ),
    },
    {
      header: "Payment",
      render: (row) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.payment_method}
        </Badge>
      ),
    },
    {
      header: "Amount",
      cellClassName: "text-right",
      render: (row) => (
        <span className="font-semibold text-rose-600">
          ₹{row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditExpense(row);
              setShowForm(true);
            }}
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
        title={t.expenses} // Translated
        actionLabel={t.expenses} // Translated
        subtitle={`${expenses.length} records`}
        onAction={() => {
          setEditExpense(null);
          setShowForm(true);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48 sm:w-64"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="salaries">Salaries</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="taxes">Taxes</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="This Month"
          value={`₹${expenses
            .filter((e) => {
              const d = new Date(e.date || e.created_date);
              const now = new Date();
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            })
            .reduce((s, e) => s + (e.amount || 0), 0)
            .toLocaleString()}`}
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Recurring"
          value={recurringCount}
          icon={Repeat}
          color="indigo"
        />
      </div>

      {!isLoading && expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Track your business expenses here."
          actionLabel="Add Expense"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No expenses match your search"
        />
      )}

      {showForm && (
        <ExpenseFormDialog
          open={showForm}
          onOpenChange={(v) => {
            setShowForm(v);
            if (!v) setEditExpense(null);
          }}
          expense={editExpense}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this expense record.
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
