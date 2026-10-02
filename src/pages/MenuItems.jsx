// import { useState } from "react";
// import { useCategories } from "@/hooks/useCategories";
// import { useItems } from "../hooks/useItems";

// export default function MenuItems() {
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [open, setOpen] = useState(false);
//   const [editItem, setEditItem] = useState(null);

//   const { categories } = useCategories();
//   const { items, addItem, deleteItem, updateItem } = useItems(selectedCategory);

//   const [form, setForm] = useState({
//     name: "",
//     price: "",
//   });

//   const handleSubmit = async () => {
//     if (!selectedCategory) return;

//     const payload = {
//       category_id: selectedCategory,
//       name: form.name,
//       price: Number(form.price),
//     };

//     if (editItem) {
//       await updateItem(editItem.id, payload);
//     } else {
//       await addItem(payload);
//     }

//     setForm({ name: "", price: "" });
//     setEditItem(null);
//     setOpen(false);
//   };

//   const openEdit = (item) => {
//     setEditItem(item);
//     setForm({
//       name: item.name,
//       price: item.price,
//     });
//     setOpen(true);
//   };

//   return (
//     <div className="flex h-full">
//       {/* LEFT: CATEGORIES */}
//       <div className="w-1/4 border-r p-3">
//         <h2 className="text-lg font-bold mb-3">Categories</h2>

//         <div className="space-y-2">
//           {categories.map((cat) => (
//             <button
//               key={cat.id}
//               onClick={() => setSelectedCategory(cat.id)}
//               className={`w-full p-2 rounded ${
//                 selectedCategory === cat.id
//                   ? "bg-green-500 text-white"
//                   : "bg-gray-100"
//               }`}
//             >
//               {cat.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* RIGHT: ITEMS */}
//       <div className="flex-1 p-4">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">Items</h2>

//           <button
//             onClick={() => {
//               setEditItem(null);
//               setForm({ name: "", price: "" });
//               setOpen(true);
//             }}
//             disabled={!selectedCategory}
//             className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
//           >
//             + Add Item
//           </button>
//         </div>

//         {/* ITEMS GRID */}
//         <div className="grid grid-cols-3 gap-4">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className="p-3 border rounded shadow-sm bg-white"
//             >
//               <h3 className="font-bold">{item.name}</h3>
//               <p className="text-green-600">Rs {item.price}</p>

//               <div className="flex gap-2 mt-2">
//                 <button
//                   onClick={() => openEdit(item)}
//                   className="text-blue-500 text-sm"
//                 >
//                   Edit
//                 </button>

//                 <button
//                   onClick={() => deleteItem(item.id)}
//                   className="text-red-500 text-sm"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         {selectedCategory && items.length === 0 && (
//           <p className="text-gray-400 mt-5">No items in this category</p>
//         )}
//       </div>

//       {/* MODAL */}
//       {open && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white p-5 rounded w-[300px]">
//             <h3 className="text-lg font-bold mb-3">
//               {editItem ? "Edit Item" : "Add Item"}
//             </h3>

//             <input
//               className="w-full border p-2 mb-2"
//               placeholder="Item name"
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//             />

//             <input
//               className="w-full border p-2 mb-3"
//               placeholder="Price"
//               type="number"
//               value={form.price}
//               onChange={(e) => setForm({ ...form, price: e.target.value })}
//             />

//             <div className="flex justify-end gap-2">
//               <button onClick={() => setOpen(false)} className="px-3 py-1">
//                 Cancel
//               </button>

//               <button
//                 onClick={handleSubmit}
//                 className="bg-green-600 text-white px-3 py-1 rounded"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useItems } from "../hooks/useItems";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  UtensilsCrossed,
  Package,
  DollarSign,
  X,
  Tag,
} from "lucide-react";

export default function MenuItems() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { categories } = useCategories();
  const { items, addItem, deleteItem, updateItem } = useItems(selectedCategory);

  const [form, setForm] = useState({
    name: "",
    price: "",
  });

  // Auto-select first category on initial load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCategory || !form.name.trim() || !form.price) return;

    const payload = {
      category_id: selectedCategory,
      name: form.name.trim(),
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteItem(id);
    }
  };

  // Filter items by search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT: CATEGORIES SIDEBAR */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Categories</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {categories.length}
          </span>
        </div>

        <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}

          {categories.length === 0 && (
            <p className="text-xs text-slate-400 p-4 text-center">
              No categories created yet.
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: MENU ITEMS MANAGEMENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER & SEARCH */}
        <div className="bg-white border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {activeCategoryObj?.name || "Select a Category"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"} available
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditItem(null);
                setForm({ name: "", price: "" });
                setOpen(true);
              }}
              disabled={!selectedCategory}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* ITEMS CONTENT CONTAINER */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      Rs {Number(item.price).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                      title="Edit Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <UtensilsCrossed className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
              <p className="text-base font-medium text-slate-600">
                No items found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {!selectedCategory
                  ? "Select a category from the sidebar to view menu items."
                  : searchTerm
                    ? "No items match your search term."
                    : "Click 'Add Item' above to populate this category."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT ITEM MODAL */}
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                {editItem ? "Edit Menu Item" : "Add New Item"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Chicken Biryani"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (Rs) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  {editItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
