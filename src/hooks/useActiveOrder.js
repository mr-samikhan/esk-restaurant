import { useState, useEffect } from "react";

let globalOrder = null;
let listeners = [];

export function useActiveOrder() {
  const [order, setOrderState] = useState(globalOrder);

  useEffect(() => {
    const listener = (newOrder) => {
      setOrderState(newOrder);
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setOrder = (newOrder) => {
    globalOrder = newOrder;
    listeners.forEach((l) => l(newOrder));
  };

  return {
    order,
    setOrder,
  };
}
