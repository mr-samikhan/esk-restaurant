import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useItems } from "../hooks/useItems";

export default function MenuItems() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { categories } = useCategories();
  const { items, addItem, deleteItem, updateItem } = useItems(selectedCategory);

  const [form, setForm] = useState({
    name: "",
    price: "",
  });

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    const payload = {
      category_id: selectedCategory,
      name: form.name,
      price: Number(form.price),
    };

    if (editItem) {
      await updateItem(editItem.id, payload);
    } else {
      await addItem(payload);
    }

    setForm({ name: "", price: "" });
    setEditItem(null);
    setOpen(false);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: item.price,
    });
    setOpen(true);
  };

  return (
    <div className="flex h-full">
      {/* LEFT: CATEGORIES */}
      <div className="w-1/4 border-r p-3">
        <h2 className="text-lg font-bold mb-3">Categories</h2>

        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full p-2 rounded ${
                selectedCategory === cat.id
                  ? "bg-green-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: ITEMS */}
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Items</h2>

          <button
            onClick={() => {
              setEditItem(null);
              setForm({ name: "", price: "" });
              setOpen(true);
            }}
            disabled={!selectedCategory}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            + Add Item
          </button>
        </div>

        {/* ITEMS GRID */}
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 border rounded shadow-sm bg-white"
            >
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-green-600">Rs {item.price}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openEdit(item)}
                  className="text-blue-500 text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedCategory && items.length === 0 && (
          <p className="text-gray-400 mt-5">No items in this category</p>
        )}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded w-[300px]">
            <h3 className="text-lg font-bold mb-3">
              {editItem ? "Edit Item" : "Add Item"}
            </h3>

            <input
              className="w-full border p-2 mb-2"
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full border p-2 mb-3"
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1">
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
