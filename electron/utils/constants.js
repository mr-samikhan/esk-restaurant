export function generateInvoiceHTML({ order, items = [], total = 0 }) {
  const safeItems = Array.isArray(items) ? items : [];

  const rows = safeItems
    .map(
      (i) => `
      <tr>
        <td>${i.name || ""}</td>
        <td>${i.qty || 0}</td>
        <td>${i.price || 0}</td>
        <td>${i.total || 0}</td>
      </tr>
    `,
    )
    .join("");

  return `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 10px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border-bottom: 1px solid #ddd; padding: 5px; }
        .total { font-weight: bold; font-size: 18px; margin-top: 10px; }
      </style>
    </head>

    <body>
      <h2>Restaurant Invoice</h2>

      <p><b>Order ID:</b> ${order?.id || ""}</p>
      <p><b>Table:</b> ${order?.table_name || ""}</p>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

      <p class="total">Total: ${total}</p>

      <p style="text-align:center;margin-top:20px;">
        Thank you!
      </p>
    </body>
  </html>
  `;
}
