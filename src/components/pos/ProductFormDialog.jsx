import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dbService } from "../../lib/db-service";
import { isValidBarcode } from "../../lib/barcode-validator";
import { useToast } from "../ui/use-toast";

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSave,
  saving,
  categories,
  traders,
}) {
  const defaultState = {
    name: "",
    sku: "",
    category: "other",
    trader: "",
    trader_id: null,
    price: "",
    cost_price: "",
    stock_quantity: 0,
    low_stock_threshold: 5,
    barcode: "",
    description: "",
    expiry_date: "",
    is_expiry_active: 0,
    shelf_number: "",
    expiry_alert_before_days: 7,
    amount_paid_now: 0,
    unit_type: "pcs",
    is_bulk_packaging: 0,
    packaging_conversion_factor: 1,
  };
  const nameInputRef = useRef(null);
  const { toast } = useToast();

  const [form, setForm] = useState(defaultState);

  useEffect(() => {
    if (open) {
      setForm(product || defaultState);

      // 3. Auto-focus the Name field when the dialog opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, product]);

  useEffect(() => {
    if (open) {
      if (product && product.id) {
        const conversionFactor =
          parseFloat(product.packaging_conversion_factor) || 1;
        const looseStock = parseInt(product.stock_quantity) || 0;

        setForm({
          ...product,
          // Reverse-calculate loose stock to show pack quantities in the input box
          stock_quantity: looseStock / conversionFactor,
          trader_id: product.trader_id ? String(product.trader_id) : "",
        });
      } else {
        setForm(defaultState);
      }

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, product]);

  const handleChange = (field, value, type) => {
    let finalValue = value;

    // Only apply "no minus" logic if the input type is 'number'
    if (type === "number") {
      const num = parseFloat(value);
      finalValue = isNaN(num) ? 0 : Math.max(0, num);
    }

    setForm((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.stock_quantity === 0) {
      toast({
        variant: "destructive",
        title: "Stock Quantity",
        description: "The stock quanity is 0 which is invalid.",
      });
      return;
    }

    if (form.barcode && !isValidBarcode(form.barcode)) {
      toast({
        variant: "destructive",
        title: "Invalid Barcode",
        description: "The scanned code does not match universal GS1 standards.",
      });
      return;
    }

    const inputStock = parseFloat(form.stock_quantity) || 0;
    const conversionFactor = parseFloat(form.packaging_conversion_factor) || 1;

    // Transform package volume to loose database unit count (e.g. 2 Bags * 12 = 24 Units)
    const calculatedBaseStock = inputStock * conversionFactor;

    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      stock_quantity: calculatedBaseStock,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      is_expiry_active: parseInt(form.is_expiry_active) || 0,
      expiry_date: form.expiry_date || null,
      shelf_number: form.shelf_number || "",
      trader_id: form.trader_id ? Number(form.trader_id) : null,
      unit_type: form.unit_type || "pcs",
      packaging_conversion_factor: conversionFactor,
    });
  };

  // const handleManualFetch = async (value) => {
  //   // Only search if the input is a valid length (e.g., > 3 characters)
  //   if (value.length > 3) {
  //     const found = await dbService.getProductByBarcode(value);
  //     if (found) {
  //       // Update form state with found product data
  //       setForm(found);
  //       toast({
  //         title: "Product Found",
  //         description: `Loaded details for ${found.name}`,
  //       });
  //     }
  //   }
  // };

  const handleManualFetch = async (value) => {
    const cleanBarcode = value?.trim();

    // Prevent searching for empty or very short strings
    if (!cleanBarcode || cleanBarcode.length < 3) return;

    try {
      const found = await dbService.getProductByBarcode(cleanBarcode);

      if (found) {
        // Use functional state update to ensure we don't lose existing fields
        setForm((prev) => ({
          ...prev,
          ...found,
          // Ensure trader stays consistent or updates from found record
          trader: found.trader_id || prev.trader,
        }));

        toast({
          title: "Product Auto-Filled",
          description: `Found: ${found.name}`,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // DEBUG
  // console.log("form", form);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {/* Changed to check for id to differentiate scan vs edit */}
            {product?.id ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Product Name *</Label>
              <Input
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(val) => handleChange("category", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.name || `id-${cat.id}`}
                      >
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="other">Other</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trader / Supplier</Label>
              <Select
                // Use String to ensure match, and use the correct key from your console log
                value={form.trader_id ? String(form.trader_id) : ""}
                onValueChange={(val) => handleChange("trader_id", val)} // Update trader_id, not trader
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Trader" />
                </SelectTrigger>
                <SelectContent>
                  {traders.length > 0 ? (
                    traders.map((t) => (
                      // Value must be a string to match the Select 'value' prop
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No Traders Found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Selling Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  handleChange("price", e.target.value, "number")
                }
                required
              />
            </div>
            <div>
              <Label>Cost Price</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) =>
                  handleChange("cost_price", e.target.value, "number")
                }
              />
            </div>
            <div>
              <Label>Amount Paid to Trader Now</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount_paid_now || ""}
                onChange={(e) =>
                  handleChange("amount_paid_now", e.target.value, "number")
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Stock Quantity</Label>
              <Input
                required
                type="number"
                value={form.stock_quantity}
                onChange={(e) =>
                  handleChange("stock_quantity", e.target.value, "number")
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-slate-50 col-span-2">
              <div>
                <Label>Base Unit Measure</Label>
                <Select
                  value={form.unit_type}
                  onValueChange={(val) => handleChange("unit_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (Pcs)</SelectItem>
                    <SelectItem value="kg">Kilogram (KG)</SelectItem>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="carton">Carton / Cotton</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pack Conversion Factor</Label>
                <Input
                  type="number"
                  disabled={form.unit_type === "pcs" || form.unit_type === "kg"}
                  value={form.packaging_conversion_factor}
                  onChange={(e) =>
                    handleChange(
                      "packaging_conversion_factor",
                      e.target.value,
                      "number",
                    )
                  }
                  placeholder="e.g. 25 if 1 Bag has 25 KG"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  How many base units are contained inside this item box/bag?
                </p>
              </div>
            </div>

            <div>
              <Label>Low Stock Alert</Label>
              <Input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  handleChange("low_stock_threshold", e.target.value, "number")
                }
              />
            </div>
            <div>
              <Label className="flex justify-between mt-2">
                Barcode
                <button
                  type="button"
                  onClick={() => handleChange("barcode", Date.now().toString())}
                  className="text-[10px] text-blue-500 hover:underline"
                >
                  Generate Auto
                </button>
              </Label>
              <div className="relative">
                <Input
                  required
                  value={form.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  onBlur={(e) => handleManualFetch(e.target.value)}
                  placeholder="Scan or enter barcode"
                  className={cn(
                    "font-mono pr-16",
                    form.barcode &&
                      !isValidBarcode(form.barcode) &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                />
                {form.barcode && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">
                    {isValidBarcode(form.barcode) ? "✅ Valid" : "❌ Invalid"}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 col-span-2 pt-2 border-t mt-2">
              <div>
                <Label>Shelf / Location</Label>
                <Input
                  placeholder="e.g. A-12, Row-4"
                  value={form.shelf_number || ""}
                  onChange={(e) => handleChange("shelf_number", e.target.value)}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="expiry_active"
                  className="w-4 h-4 accent-indigo-600"
                  checked={form.is_expiry_active === 1}
                  onChange={(e) =>
                    handleChange("is_expiry_active", e.target.checked ? 1 : 0)
                  }
                />
                <Label
                  htmlFor="expiry_active"
                  className="text-xs cursor-pointer text-slate-600"
                >
                  Enable expiry alerts for this product
                </Label>
              </div>
              {form.is_expiry_active === 1 && (
                <>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      className="block"
                      value={form.expiry_date || ""}
                      onChange={(e) =>
                        handleChange("expiry_date", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Custom Expiry Counter(days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.expiry_alert_before_days}
                      onChange={(e) =>
                        handleChange(
                          "expiry_alert_before_days",
                          e.target.value,
                          "number",
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={saving}
            >
              {/* Changed label logic to match scanning vs edit state */}
              {saving ? "Saving..." : product?.id ? "Update" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
