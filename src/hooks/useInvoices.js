import { useEffect, useState, useCallback } from "react";
import { API } from "../constants/apiEndPoints";

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.invoices.getAll();
      setInvoices(data || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete invoice handler
  const deleteInvoice = async (invoiceId) => {
    try {
      // 1. Send API request to delete from backend/database
      if (API?.invoices?.delete) {
        await API.invoices.delete(invoiceId);
      } else if (API?.invoices?.remove) {
        await API.invoices.remove(invoiceId);
      } else {
        throw new Error(
          "Delete endpoint function is not defined on API.invoices",
        );
      }

      // 2. Optimistically update local state to remove the invoice immediately from UI
      setInvoices((prevInvoices) =>
        prevInvoices.filter((inv) => inv.id !== invoiceId),
      );

      return { success: true };
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      // Re-fetch invoices if server delete failed to ensure UI consistency
      await load();
      throw err;
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    invoices,
    loading,
    reload: load,
    refetch: load, // Alias so both refetch() and reload() work in components
    deleteInvoice,
  };
}
