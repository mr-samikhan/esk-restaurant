import { useEffect, useState, useCallback } from "react";
import { API } from "../constants/apiEndPoints";

export function useTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all tables
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.tables.getAll();
      setTables(data || []);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update table status
  const updateStatus = async (id, status) => {
    try {
      setTables((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      await API.tables.updateStatus(id, status);
    } catch (err) {
      console.error("Failed to update table status:", err);
      await load();
    }
  };

  // NEW: Clear table status (Resets status to 'available')
  const clearTableStatus = async (id) => {
    try {
      setTables((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "available" } : t)),
      );
      await API.tables.clearStatus(id);
    } catch (err) {
      console.error("Failed to clear table status:", err);
      await load();
    }
  };

  // Add new table
  const addTable = async (name) => {
    try {
      if (!name?.trim()) return;
      await API.tables.create(name.trim());
      await load();
    } catch (err) {
      console.error("Failed to create table:", err);
    }
  };

  // Edit table name
  const updateTableName = async (id, name) => {
    try {
      if (!name?.trim()) return;
      setTables((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
      );
      await API.tables.update(id, name.trim());
    } catch (err) {
      console.error("Failed to update table name:", err);
      await load();
    }
  };

  // Delete table
  const deleteTable = async (id) => {
    try {
      setTables((prev) => prev.filter((t) => t.id !== id));
      await API.tables.delete(id);
    } catch (err) {
      console.error("Failed to delete table:", err);
      await load();
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    tables,
    loading,
    updateStatus,
    clearTableStatus, // Exported here
    addTable,
    updateTableName,
    deleteTable,
    reload: load,
  };
}
