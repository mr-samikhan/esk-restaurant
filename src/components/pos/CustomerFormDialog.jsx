import React, { useState, useEffect } from "react";
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

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(customer || EMPTY_FORM);

  // ✅ Re-initialize form whenever the dialog opens or the customer prop changes
  useEffect(() => {
    if (open) {
      setForm(customer || EMPTY_FORM);
    }
  }, [open, customer]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              value={form.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
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
              disabled={saving}
            >
              {saving ? "Saving..." : customer ? "Update" : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
