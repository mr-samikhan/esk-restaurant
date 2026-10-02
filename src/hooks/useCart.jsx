import { useEffect, useState } from "react";
import { API } from "../constants/apiEndPoints";

export function useCart(activeOrder) {
  const [cart, setCart] = useState([]);

  const loadCart = async () => {
    // DO NOT load items if the order is already paid/completed
    if (
      !activeOrder?.id ||
      activeOrder.status === "completed" ||
      activeOrder.status === "paid"
    ) {
      setCart([]);
      return;
    }

    const data = await API.orders.getItems(activeOrder.id);
    setCart(data || []);
  };

  // RESET / LOAD CART WHEN ORDER CHANGES OR STATUS CHANGES
  useEffect(() => {
    if (!activeOrder?.id) {
      setCart([]);
      return;
    }

    loadCart();
  }, [activeOrder?.id, activeOrder?.status]);

  // ADD ITEM
  const addToCart = async (item) => {
    if (!activeOrder?.id) return;

    const existing = cart.find((i) => i.id === item.id);
    let updatedCart;

    if (existing) {
      updatedCart = cart.map((i) =>
        i.id === item.id
          ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price }
          : i,
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          total: item.price,
        },
      ];
    }

    setCart(updatedCart);

    await API.orders.addItem({
      orderId: activeOrder.id,
      item: { ...item, qty: 1 },
    });
  };

  // REMOVE ITEM
  const removeItem = async (id) => {
    await API.orders.deleteItem(id);
    setCart(cart.filter((i) => i.id !== id));
  };

  // INCREASE QTY
  const increaseQty = async (id) => {
    let targetItem = null;

    const updated = cart.map((i) => {
      if (i.id === id) {
        const qty = (i.qty || 1) + 1;
        const total = qty * i.price;
        targetItem = { id: i.id, qty, total };
        return { ...i, qty, total };
      }
      return i;
    });

    setCart(updated);

    if (targetItem && activeOrder?.id) {
      await API.orders.updateItemQty({
        orderId: activeOrder.id,
        id: targetItem.id, // item.id (product ID)
        qty: targetItem.qty,
        total: targetItem.total,
      });
    }
  };

  // DECREASE QTY
  const decreaseQty = async (id) => {
    let targetItem = null;

    const updated = cart.map((i) => {
      if (i.id === id && i.qty > 1) {
        const qty = i.qty - 1;
        const total = qty * i.price;
        targetItem = { id: i.id, qty, total };
        return { ...i, qty, total };
      }
      return i;
    });

    setCart(updated);

    if (targetItem && activeOrder?.id) {
      await API.orders.updateItemQty({
        orderId: activeOrder.id,
        id: targetItem.id,
        qty: targetItem.qty,
        total: targetItem.total,
      });
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, i) => sum + Number(i.total || 0), 0);
  };

  const clearCart = async () => {
    if (!activeOrder?.id) return;
    await API.orders.clearCart(activeOrder.id);
    setCart([]);
  };

  return {
    cart,
    addToCart,
    removeItem,
    increaseQty,
    decreaseQty,
    getTotal,
    clearCart,
  };
}
