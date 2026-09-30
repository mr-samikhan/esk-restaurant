import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import PageHeader from "../components/pos/PageHeader";
import DataTable from "../components/pos/DataTable";
import EmptyState from "../components/pos/EmptyState";
import ProductFormDialog from "../components/pos/ProductFormDialog";
import { Package, Search, Edit2, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
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
import { Printer } from "lucide-react"; // Import Icon
import { printProductLabel } from "@/lib/label-generator";
import CategoryManager from "../components/pos/CategoryManager";
import { useToast } from "../components/ui/use-toast";
import TraderManager from "../components/pos/TraderManager";

export default function Inventory() {
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("PKR");

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTraderManager, setShowTraderManager] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => dbService.getCategories(),
  });

  const { data: traders = [] } = useQuery({
    queryKey: ["traders"],
    queryFn: () => dbService.getTraders(),
  });

  useEffect(() => {
    dbService.getSettings().then((s) => setCurrency(s.currency || "PKR"));
  }, []);

  useEffect(() => {
    dbService.getSettings().then((s) => setLang(s.language || "en"));
  }, []);

  const t = translations[lang] || translations.en;

  const scanBuffer = useRef("");

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore keys if the user is currently typing in an Input or Textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "Enter") {
        const barcode = scanBuffer.current.trim();
        if (barcode.length > 3) {
          processBarcode(barcode);
        }
        scanBuffer.current = ""; // Reset buffer
      } else {
        // Build the barcode string from key presses
        if (e.key.length === 1) {
          scanBuffer.current += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const processBarcode = async (barcode) => {
    // Check if product exists
    const existingProduct = await dbService.getProductByBarcode(barcode);

    if (existingProduct) {
      try {
        // AUTO-INCREMENT LOGIC:
        // Update stock directly without opening dialog
        const updatedData = {
          ...existingProduct,
          stock_quantity: (existingProduct.stock_quantity || 0) + 1,
        };

        await updateMutation.mutateAsync({
          id: existingProduct.id,
          data: updatedData,
        });

        toast({
          title: "Stock Updated (+1)",
          description: `${existingProduct.name} stock is now ${updatedData.stock_quantity}`,
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Update Failed" });
      }
    } else {
      // NEW PRODUCT LOGIC:
      setEditProduct({ barcode, name: "", price: "", stock_quantity: 1 });
      setShowForm(true);
      toast({
        title: "New Barcode",
        description: "Product not found. Please add details.",
      });
    }
  };

  // 1. Update Fetching
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(), // Changed
  });

  // 2. Update Create
  const createMutation = useMutation({
    mutationFn: (data) => dbService.createProduct(data), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["traders"] });
      setShowForm(false);
    },
  });

  // 3. Update Update
  const updateMutation = useMutation({
    // FIX: Pass the 'id' and 'data' as two separate parameters, matching the dbService method signature
    mutationFn: ({ id, data }) => dbService.updateProduct(id, data),
    onSuccess: (result) => {
      if (result?.error === "ALREADY_EXISTS") {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message,
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["traders"] });

      queryClient.invalidateQueries({ queryKey: ["trader-history"] });
      setShowForm(false);
      setEditProduct(null);
      toast({ title: "Success", description: "Product updated successfully." });
    },
  });

  // 4. Update Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => dbService.deleteProduct(id), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
    },
  });

  // const handleSave = (data) => {
  //   // 1. Prepare the product data with an auto-generated barcode if missing
  //   const productData = {
  //     ...data,
  //     barcode:
  //       data.barcode ||
  //       Math.floor(10000000 + Math.random() * 90000000).toString(),
  //   };

  //   if (editProduct) {
  //     // 2. Use productData so the generated barcode is included in updates
  //     updateMutation.mutate({ id: editProduct.id, data: productData });
  //   } else {
  //     // 3. Use productData for new creations
  //     createMutation.mutate(productData);
  //   }
  // };

  const [duplicateFound, setDuplicateFound] = useState(null);

  const handleSave = async (data) => {
    const productData = { ...data, barcode: data.barcode?.trim() };
    console.log("productData", productData);

    if (editProduct?.id) {
      // Passes the nested structure your mutation expects
      updateMutation.mutate({
        id: editProduct.id,
        data: productData,
      });
    } else {
      // Attempt Create
      const result = await dbService.createProduct(productData);

      if (result?.error === "ALREADY_EXISTS") {
        const existing = await dbService.getProductByBarcode(
          productData.barcode,
        );
        setDuplicateFound({ new: productData, existing });
      } else {
        queryClient.invalidateQueries(["products"]);
        setShowForm(false);
      }
    }
  };

  const handleMerge = () => {
    if (!duplicateFound) return;

    const { new: newData, existing } = duplicateFound;

    const mergedData = {
      ...existing,
      // Add new stock to existing stock
      stock_quantity:
        (existing.stock_quantity || 0) + (newData.stock_quantity || 0),
      // Optional: Update price if the new one is different
      price: newData.price || existing.price,
    };

    updateMutation.mutate({ id: existing.id, data: mergedData });
    setDuplicateFound(null);
    setShowForm(false);

    toast({
      title: "Merged Successfully",
      description: `Added ${newData.stock_quantity} units to ${existing.name}.`,
    });
  };

  const handleOverwrite = () => {
    if (!duplicateFound) return;

    const { new: newData, existing } = duplicateFound;

    // Create a payload that uses the existing ID but NEW data
    const overwrittenData = {
      ...newData,
      id: existing.id, // Keep the same ID to maintain database history
    };

    // Trigger the update mutation
    updateMutation.mutate({ id: existing.id, data: overwrittenData });

    setDuplicateFound(null);
    setShowForm(false);

    toast({
      title: "Product Overwritten",
      description: `${existing.name} has been replaced with ${newData.name}.`,
    });
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const columns = [
    {
      header: "Product",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.sku || "—"}</p>
        </div>
      ),
    },
    {
      header: "Barcode",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border w-fit">
            {row.barcode || "No Barcode"}
          </span>
        </div>
      ),
    },
    {
      header: "Category",
      render: (row) => (
        <Badge variant="secondary" className="capitalize text-xs">
          {row.category?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Price",
      render: (row) => (
        <span className="font-semibold">
          {currency === "USD" ? "$" : currency === "PKR" ? "Rs." : "₹"}
          {row.price?.toLocaleString()}
        </span>
      ),
      // render: (row) => (
      //   <span className="font-semibold">₹{row.price?.toLocaleString()}</span>
      // ),
    },
    {
      header: "Cost",
      render: (row) => (
        <span className="text-slate-500">
          {currency === "USD" ? "$" : currency === "PKR" ? "Rs." : "₹"}
          {row.cost_price?.toLocaleString() || "—"}
        </span>
      ),
    },
    {
      header: "Stock",
      render: (row) => {
        const isLow = row.stock_quantity <= (row.low_stock_threshold || 5);
        return (
          <Badge
            className={
              isLow
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }
          >
            {row.stock_quantity}
          </Badge>
        );
      },
    },
    {
      header: "Expiry Status",
      render: (row) => {
        // 1. Check if tracking is active
        if (!row.is_expiry_active) {
          return (
            <span className="text-muted-foreground text-xs italic">N/A</span>
          );
        }

        if (!row.expiry_date) return null;

        // 2. Normalize dates to Midnight for accurate day-by-day comparison
        const expiryDate = new Date(row.expiry_date);
        const today = new Date();

        expiryDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate exact day difference
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // 3. Alert settings
        const alertThreshold = row.expiry_alert_before_days || 7;
        const isExpired = diffDays < 0;
        const isToday = diffDays === 0;
        const isNearExpiry = diffDays > 0 && diffDays <= alertThreshold;

        // 4. Styling Logic
        let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        let statusText = row.expiry_date;

        if (isExpired) {
          badgeClass = "bg-red-500 text-white border-transparent shadow-sm";
          statusText = `Expired (${row.expiry_date})`;
        } else if (isToday) {
          badgeClass = "bg-amber-500 text-white border-transparent";
          statusText = "Expires Today";
        } else if (isNearExpiry) {
          badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
          statusText = `Expires in ${diffDays} days`;
        }

        return (
          <Badge className={badgeClass}>{`${statusText}(${diffDays})`}</Badge>
        );
      },
    },
    {
      header: "Actions",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* 1. PRINT LABEL BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            title="Print Barcode Label"
            onClick={(e) => {
              e.stopPropagation();
              printProductLabel(row);
            }}
          >
            <Printer className="w-4 h-4" />
          </Button>

          {/* 2. EDIT BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditProduct(row);
              setShowForm(true);
            }}
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
          </Button>

          {/* 3. DELETE BUTTON */}
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

  const handleSearchChange = async (val) => {
    setSearch(val);

    // If the user types a full barcode manually in the search box
    if (val.length >= 8) {
      const found = await dbService.getProductByBarcode(val);
      if (found) {
        setEditProduct(found);
        setShowForm(true);
        setSearch(""); // Clear search after finding
      }
    }
  };

  // DEBUG
  console.log("products", products);
  console.log("traders", traders);
  console.log("editProduct", editProduct);

  return (
    <div className="space-y-6" dir={t.dir}>
      {/* <PageHeader
        title={t.inventory_title} // Translated
        actionLabel={t.inventory_title} // Translated
        subtitle={`${products.length} products`}
        onAction={() => {
          setEditProduct(null);
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
              className="pl-9 w-48 sm:w-64"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="mobile_phones">Mobile Phones</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="chargers">Chargers</SelectItem>
              <SelectItem value="cases">Cases</SelectItem>
              <SelectItem value="screen_protectors">
                Screen Protectors
              </SelectItem>
              <SelectItem value="clothing_men">Men's Clothing</SelectItem>
              <SelectItem value="clothing_women">Women's Clothing</SelectItem>
              <SelectItem value="clothing_kids">Kids' Clothing</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader> */}

      <PageHeader
        title={t.inventory_title}
        subtitle={`${products.length} products`}
        /* 1. Added actionLabel back so the 'Add' button appears */
        actionLabel={t.inventory_title}
        onAction={() => {
          setEditProduct(null);
          setShowForm(true);
        }}
      >
        <div className="flex items-center gap-3">
          {/* 2. Added the Search Input back */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search_placeholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 w-48 sm:w-64"
            />
          </div>

          {/* TRADER MANAGER BUTTON */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowTraderManager(true)}
            title="Manage Traders/Suppliers"
          >
            <Users className="w-4 h-4" />
          </Button>

          {/* 3. Manage Categories Button */}
          <Button
            variant="outline"
            onClick={() => setShowCategoryManager(true)}
          >
            Manage Categories
          </Button>

          {/* 4. Dynamic Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(
                (cat) =>
                  cat.name && (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <CategoryManager
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
      />

      <TraderManager
        open={showTraderManager}
        onOpenChange={setShowTraderManager}
      />

      {!isLoading && products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start managing your inventory."
          actionLabel="Add Product"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage="No products match your search"
        />
      )}

      {showForm && (
        <ProductFormDialog
          open={showForm}
          onOpenChange={(v) => {
            setShowForm(v);
            if (!v) setEditProduct(null);
          }}
          product={editProduct}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
          categories={categories}
          traders={traders}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently
              removed.
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

      <AlertDialog
        open={!!duplicateFound}
        onOpenChange={() => setDuplicateFound(null)}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Barcode Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                The barcode <strong>{duplicateFound?.new.barcode}</strong> is
                already assigned to:
                <span className="block mt-1 p-2 bg-slate-100 rounded border font-medium text-slate-900">
                  {duplicateFound?.existing.name} (Current Stock:{" "}
                  {duplicateFound?.existing.stock_quantity})
                </span>
              </p>
              <div className="text-sm border-t pt-3">
                <p>
                  <strong>Merge:</strong> Adds the new quantity (
                  {duplicateFound?.new.stock_quantity}) to the existing stock.
                </p>
                <p className="mt-1">
                  <strong>Overwrite:</strong> Replaces the old name, price, and
                  details with the new data.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            {/* OVERWRITE BUTTON */}
            <Button
              variant="secondary"
              onClick={handleOverwrite}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900"
            >
              Overwrite
            </Button>

            {/* MERGE BUTTON */}
            <AlertDialogAction
              onClick={handleMerge}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Merge & Add Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
