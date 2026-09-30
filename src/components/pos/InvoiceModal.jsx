import { useEffect, useState } from "react";
import { API } from "../../constants/apiEndPoints";

export default function InvoiceModal({ invoiceId, open, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;

    API.invoices.getById(invoiceId).then(setData);
  }, [invoiceId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-5 w-[700px]">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Invoice #{invoiceId}</h2>

          <button onClick={onClose}>✕</button>
        </div>

        {data?.items?.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b">
            <span>{item.name ?? item?.item_name ?? ""}</span>

            <span>
              {item.qty} × {item.price}
            </span>

            <span>{item.total}</span>
          </div>
        ))}

        <div className="mt-4 text-right font-bold">
          Total: Rs {data?.order?.total_amount}
        </div>
      </div>
    </div>
  );
}
