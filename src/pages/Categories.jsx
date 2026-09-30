import { useEffect, useState } from "react";
import { dbService } from "@/lib/db-service";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // LOAD
  const loadCategories = async () => {
    const data = await dbService.getCategories();
    setCategories(data || []);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ADD / UPDATE
  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);

    if (editingId) {
      await dbService.updateCategory({ id: editingId, name });
    } else {
      await dbService.createCategory(name);
    }

    setName("");
    setEditingId(null);
    await loadCategories();
    setLoading(false);
  };

  // EDIT
  const handleEdit = (cat) => {
    setName(cat.name);
    setEditingId(cat.id);
  };

  // DELETE
  const handleDelete = async (id) => {
    await dbService.deleteCategory(id);
    await loadCategories();
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      {/* INPUT BOX */}
      <div className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name (e.g. Biryani, Drinks)"
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded-lg"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="border rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="font-semibold">{cat.name}</p>
              <p className="text-xs text-gray-400">ID: {cat.id}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(cat)}
                className="text-blue-600 text-sm"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(cat.id)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
