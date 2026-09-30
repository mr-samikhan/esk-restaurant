import React, { useState, useMemo } from "react";
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
import { Search } from "lucide-react";

export default function StockMovementDialog({
  open,
  onOpenChange,
  products,
  onSave,
  saving,
}) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [products, productSearch]);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !quantity) return;

    const qty = parseInt(quantity);
    const prevStock = selectedProduct?.stock_quantity || 0;
    let newStock = prevStock;

    if (type === "stock_in" || type === "return") {
      newStock = prevStock + qty;
    } else if (type === "stock_out") {
      newStock = Math.max(0, prevStock - qty);
    } else {
      newStock = qty; // adjustment sets absolute value
    }

    onSave({
      movement: {
        product_id: productId,
        product_name: selectedProduct?.name || "",
        type,
        quantity: qty,
        previous_stock: prevStock,
        new_stock: newStock,
        reference,
        notes,
      },
      productUpdate: {
        productId,
        stock_quantity: newStock,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product selector */}
          <div>
            <Label>Product *</Label>
            {productId && selectedProduct ? (
              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
                <div>
                  <p className="font-medium text-sm">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-400">
                    Current stock: {selectedProduct.stock_quantity}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProductId("")}
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {productSearch && (
                  <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto divide-y">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left text-sm"
                        onClick={() => {
                          setProductId(p.id);
                          setProductSearch("");
                        }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-slate-400">
                          Stock: {p.stock_quantity}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Movement Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_in">Stock In</SelectItem>
                  <SelectItem value="stock_out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {type === "adjustment" ? "New Quantity *" : "Quantity *"}
              </Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number, invoice, etc."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
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
              disabled={!productId || !quantity || saving}
            >
              {saving ? "Processing..." : "Record Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
