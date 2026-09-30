import { useEffect, useState } from "react";
import { API } from "../constants/apiEndPoints";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await API.categories.getAll();
    setCategories(data || []);
  };

  const addCategory = async (name) => {
    setLoading(true);
    await API.categories.create(name);
    await load();
    setLoading(false);
  };

  const updateCategory = async (id, name) => {
    setLoading(true);
    await API.categories.update(id, name);
    await load();
    setLoading(false);
  };

  const deleteCategory = async (id) => {
    setLoading(true);
    await API.categories.delete(id);
    await load();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reload: load,
    loading,
  };
}
