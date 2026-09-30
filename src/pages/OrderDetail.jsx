import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../constants/apiEndPoints";

export default function OrderDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  const load = async () => {
    const o = await API.orders.getById(id);
    const i = await API.orders.getItems(id);

    setOrder(o);
    setItems(i || []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const addItem = async (item) => {
    await API.orders.addItem({
      orderId: id,
      item,
    });

    load();
  };

  const total = items.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="flex h-screen">
      {/* LEFT */}
      <div className="flex-1 p-5">
        <h2 className="text-xl font-bold">Table: {order?.table_name}</h2>

        <p>Status: {order?.status}</p>

        <div className="mt-5 space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between border p-2">
              <span>{i.name}</span>
              <span>Qty: {i.qty}</span>
              <span>Rs {i.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-80 p-4 border-l">
        <h3 className="font-bold">Bill Summary</h3>

        <p className="mt-2">Total: Rs {total}</p>

        <button className="w-full mt-3 bg-green-600 text-white py-2 rounded">
          Checkout
        </button>
      </div>
    </div>
  );
}
