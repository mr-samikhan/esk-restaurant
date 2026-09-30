import { useEffect, useState } from "react";
import { API } from "../constants/apiEndPoints";

export function useItems(categoryId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = categoryId
      ? await API.items.getByCategory(categoryId)
      : await API.items.getAll();

    setItems(data || []);
  };

  const addItem = async (payload) => {
    setLoading(true);
    await API.items.create(payload);
    await load();
    setLoading(false);
  };

  const updateItem = async (id, payload) => {
    setLoading(true);
    await API.items.update(id, payload);
    await load();
    setLoading(false);
  };

  const deleteItem = async (id) => {
    setLoading(true);
    await API.items.delete(id);
    await load();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    reload: load,
  };
}
