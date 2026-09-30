import { useEffect, useState } from "react";
import { API } from "../constants/apiEndPoints";

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const data = await API.invoices.getAll();

      setInvoices(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    invoices,
    loading,
    reload: load,
  };
}
