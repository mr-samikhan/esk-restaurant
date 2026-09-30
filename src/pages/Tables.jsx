import { useState } from "react";
import { useTables } from "@/hooks/useTables";
import { useActiveOrder } from "@/hooks/useActiveOrder";
import { useNavigate } from "react-router-dom";
import { API } from "../constants/apiEndPoints";

function Tables() {
  const { tables, addTable, updateTableName, deleteTable, clearTableStatus } =
    useTables();
  const { setOrder } = useActiveOrder();
  const [loadingTableId, setLoadingTableId] = useState(null);
  const navigate = useNavigate();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  const [editingTable, setEditingTable] = useState(null);
  const [editTableName, setEditTableName] = useState("");

  // Open table and navigate to POS
  const handleOpenTable = async (table) => {
    try {
      setLoadingTableId(table.id);
      const res = await API.orders.getOrCreate(table.id, table.name);

      if (res?.order) {
        setOrder(res.order);
        navigate("/pos");
      } else {
        alert("Could not open order for this table.");
      }
    } catch (error) {
      console.error("Error opening table:", error);
    } finally {
      setLoadingTableId(null);
    }
  };

  // Handle Clear / Reset Table Status
  const handleClearTable = async (table, e) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Are you sure you want to clear status for "${table.name}" and mark it as Available?`,
      )
    ) {
      await clearTableStatus(table.id);
    }
  };

  // Handle Add Table
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    await addTable(newTableName.trim());
    setNewTableName("");
    setIsAddModalOpen(false);
  };

  // Handle Edit Table
  const handleStartEdit = (table, e) => {
    e.stopPropagation();
    setEditingTable(table);
    setEditTableName(table.name);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTableName.trim() || !editingTable) return;

    await updateTableName(editingTable.id, editTableName.trim());
    setEditingTable(null);
    setEditTableName("");
  };

  // Handle Delete Table
  const handleDeleteTable = async (table, e) => {
    e.stopPropagation();

    if (table.status === "occupied") {
      alert(
        "Cannot delete an occupied table! Reset status or complete order first.",
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${table.name}"?`)) {
      await deleteTable(table.id);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Restaurant Tables
          </h1>
          <p className="text-sm text-gray-500">
            Manage seating layout and active orders
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
          <span className="text-base font-bold">+</span> Add Table
        </button>
      </div>

      {/* TABLES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {tables.map((table) => {
          const isOccupied = table.status === "occupied";
          const isLoading = loadingTableId === table.id;

          return (
            <div
              key={table.id}
              className={`rounded-xl p-5 shadow-sm border text-white flex flex-col justify-between transition-all ${
                isOccupied
                  ? "bg-red-500 border-red-600"
                  : "bg-emerald-600 border-emerald-700"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold tracking-wide pr-2">
                    {table.name}
                  </h2>
                  <span className="text-xs uppercase tracking-wider font-semibold bg-black/20 px-2 py-1 rounded-md">
                    {table.status}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-1.5 my-2 border-t border-white/20 pt-3 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => handleStartEdit(table, e)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-2 rounded font-medium transition-colors"
                >
                  Edit
                </button>

                {/* CLEAR / RESET TABLE BUTTON */}
                {isOccupied && (
                  <button
                    type="button"
                    onClick={(e) => handleClearTable(table, e)}
                    className="bg-white/20 hover:bg-yellow-600/80 text-white text-xs py-1.5 px-2 rounded font-medium transition-colors"
                    title="Reset table to Available"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleDeleteTable(table, e)}
                  className="bg-white/20 hover:bg-red-700/60 text-white text-xs py-1.5 px-2 rounded font-medium transition-colors"
                >
                  Delete
                </button>
              </div>

              <button
                disabled={isLoading}
                onClick={() => handleOpenTable(table)}
                className="mt-2 bg-white text-gray-900 font-semibold px-3 py-2 rounded-lg w-full shadow-sm hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                {isLoading ? "Opening..." : "Open Table"}
              </button>
            </div>
          );
        })}
      </div>

      {/* MODALS REMAIN THE SAME */}
    </div>
  );
}

export default Tables;
