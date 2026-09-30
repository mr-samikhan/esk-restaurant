import React, { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/pos/PageHeader";
import DataTable from "../components/pos/DataTable";
import EmptyState from "../components/pos/EmptyState";
import StockMovementDialog from "../components/pos/StockMovementDialog";
import StatCard from "../components/pos/StatCard";
import {
  Warehouse,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Stock() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();

  const [lang, setLang] = useState("en");

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  // 1. Update Product Fetching (reuse the service from Inventory)
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(),
  });

  // 2. Update Movement Fetching
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: () => dbService.getStockMovements(),
  });

  // 3. Update Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => dbService.saveStockMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
    },
  });

  const totalStock = products.reduce(
    (sum, p) => sum + (p.stock_quantity || 0),
    0,
  );
  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= (p.low_stock_threshold || 5),
  ).length;
  const stockInCount = movements.filter((m) => m.type === "stock_in").length;
  const stockOutCount = movements.filter((m) => m.type === "stock_out").length;

  const filteredMovements = movements.filter((m) => {
    const matchSearch =
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.reference?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= (p.low_stock_threshold || 5),
  );

  const typeColors = {
    stock_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stock_out: "bg-red-50 text-red-700 border-red-200",
    adjustment: "bg-blue-50 text-blue-700 border-blue-200",
    return: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const movementColumns = [
    {
      header: "Product",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.product_name}</span>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <Badge className={`capitalize text-xs ${typeColors[row.type] || ""}`}>
          {row.type?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Quantity",
      render: (row) => (
        <span
          className={`font-semibold ${row.type === "stock_in" || row.type === "return" ? "text-emerald-600" : "text-rose-600"}`}
        >
          {row.type === "stock_in" || row.type === "return" ? "+" : "-"}
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Stock Change",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {row.previous_stock} → {row.new_stock}
        </span>
      ),
    },
    {
      header: "Reference",
      render: (row) => (
        <span className="text-slate-500">{row.reference || "—"}</span>
      ),
    },
    {
      header: "Date",
      render: (row) => (
        <span className="text-slate-500">
          {format(new Date(row.created_date), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
  ];

  const stockColumns = [
    {
      header: "Product",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">
            {row.sku || row.category?.replace(/_/g, " ")}
          </p>
        </div>
      ),
    },
    {
      header: "Current Stock",
      render: (row) => {
        const isLow = row.stock_quantity <= (row.low_stock_threshold || 5);
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${isLow ? "text-amber-600" : "text-slate-900"}`}
            >
              {row.stock_quantity}
            </span>
            {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
        );
      },
    },
    {
      header: "Threshold",
      render: (row) => (
        <span className="text-slate-500">{row.low_stock_threshold || 5}</span>
      ),
    },
    {
      header: "Price",
      render: (row) => <span>₹{row.price?.toLocaleString()}</span>,
    },
    {
      header: "Stock Value",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          ₹
          {(
            (row.stock_quantity || 0) * (row.cost_price || row.price || 0)
          ).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir={t.dir}>
      <PageHeader
        title={t.stock} // Translated
        actionLabel={t.stock} // Translated
        subtitle="Track and manage your inventory levels"
        onAction={() => setShowForm(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stock"
          value={totalStock.toLocaleString()}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Stock In"
          value={stockInCount}
          icon={ArrowDownCircle}
          color="emerald"
        />
        <StatCard
          title="Stock Out"
          value={stockOutCount}
          icon={ArrowUpCircle}
          color="rose"
        />
      </div>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="low_stock">
            Low Stock ({lowStockCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search movements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock_in">Stock In</SelectItem>
                <SelectItem value="stock_out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isLoading && movements.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No stock movements"
              description="Record your first stock movement to start tracking."
              actionLabel="Record Movement"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <DataTable
              columns={movementColumns}
              data={filteredMovements}
              isLoading={isLoading}
              emptyMessage="No movements match your search"
            />
          )}
        </TabsContent>

        <TabsContent value="levels">
          <DataTable
            columns={stockColumns}
            data={products}
            isLoading={!products.length && isLoading}
            emptyMessage="No products in inventory"
          />
        </TabsContent>

        <TabsContent value="low_stock">
          {lowStockProducts.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="All good!"
              description="All products are well stocked."
            />
          ) : (
            <DataTable
              columns={stockColumns}
              data={lowStockProducts}
              isLoading={false}
            />
          )}
        </TabsContent>
      </Tabs>

      {showForm && (
        <StockMovementDialog
          open={showForm}
          onOpenChange={setShowForm}
          products={products}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
