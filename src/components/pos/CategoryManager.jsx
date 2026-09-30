import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/lib/db-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, Search, Edit2, Check, X } from "lucide-react";

export default function CategoryManager({ open, onOpenChange }) {
  const { toast } = useToast();

  const [newCat, setNewCat] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // NEW: State for Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => dbService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const trimmedName = name.trim();
      if (
        categories.some(
          (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
        )
      ) {
        throw new Error("Exists");
      }
      return await dbService.createCategory(trimmedName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setNewCat("");
      toast({ title: "Success", description: "Category created!" }); // 3. Use Toast
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err.message === "Exists" ? "Name already exists" : "Failed to create",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      if (
        categories.some(
          (c) =>
            c.id !== payload.id &&
            c.name.toLowerCase() === payload.name.trim().toLowerCase(),
        )
      ) {
        throw new Error("Exists");
      }
      return await dbService.updateCategory(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setEditingId(null);
      toast({
        title: "Updated",
        description: "Category name changed successfully.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          err.message === "Exists"
            ? "Name already taken"
            : "Something went wrong",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dbService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setDeleteId(null);
      toast({ title: "Deleted", description: "Category has been removed." });
    },
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add new category..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && createMutation.mutate(newCat)
              }
            />
            <Button
              onClick={() => createMutation.mutate(newCat)}
              size="icon"
              disabled={!newCat.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 mt-2 pr-1">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-slate-50"
              >
                {/* --- TOGGLE BETWEEN TEXT AND INPUT --- */}
                {editingId === cat.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 flex-1 mr-2"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium">{cat.name}</span>
                )}

                <div className="flex items-center gap-1">
                  {editingId === cat.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() =>
                          updateMutation.mutate({ id: cat.id, name: editValue })
                        }
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditValue(cat.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
