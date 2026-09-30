import { useEffect, useState } from "react";
import { API } from "../constants/apiEndPoints";

export function useOrders() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const data = await API.orders.getActive();
    setOrders(data || []);
  };

  const updateStatus = async (orderId, status) => {
    await API.orders.updateStatus(orderId, status);

    load();
  };

  const deleteOrder = async (id) => {
    await API.orders.delete(id);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  // DEBUG
  console.log("orders", orders);

  return {
    orders,
    updateStatus,
    deleteOrder,
    reload: load,
  };
}
