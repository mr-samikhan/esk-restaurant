// import { jsPDF } from "jspdf";

// export const generateReceipt = (saleData = {}, settings = {}) => {
//   // console.log("settings", settings);
//   // ======================
//   // STATIC VALUES
//   // ======================
//   const businessName = settings?.app_name || "";
//   const address = settings?.business_address || "Main Market, Pakistan";
//   const phone = settings?.business_phone || "+92 300 0000000";

//   // ======================
//   // SAFE DATA
//   // ======================
//   const items = Array.isArray(saleData.items) ? saleData.items : [];

//   const billAmount = Number(saleData.total) || 0;
//   const discount = Number(saleData.discount) || 0;
//   const paidToday = Number(saleData.paid_amount) || 0;

//   const netInvoice = billAmount - discount;

//   // ======================
//   // PDF SIZE
//   // ======================
//   const itemRowHeight = 7;
//   const height = 120 + items.length * itemRowHeight;

//   const doc = new jsPDF({
//     unit: "mm",
//     format: [80, height],
//   });

//   const width = 80;
//   const margin = 5;
//   const rightX = width - margin;
//   let y = 10;

//   // ======================
//   // HEADER
//   // ======================
//   doc.setFont("helvetica", "bold").setFontSize(14);
//   doc.text(businessName, width / 2, y, { align: "center" });

//   y += 6;
//   doc.setFontSize(8).setFont("helvetica", "normal");
//   doc.text(address, width / 2, y, { align: "center" });

//   y += 4;
//   doc.text(phone, width / 2, y, { align: "center" });

//   // ======================
//   // ORDER INFO
//   // ======================
//   y += 8;
//   doc.setFontSize(9).setFont("helvetica", "bold");

//   doc.text(`Order #${saleData.id || "0000"}`, margin, y);
//   doc.text(new Date().toLocaleDateString(), rightX, y, {
//     align: "right",
//   });

//   y += 6;
//   doc.setFont("helvetica", "normal");
//   doc.text(`Table: ${saleData.table_name || "Takeaway"}`, margin, y);

//   // ======================
//   // TABLE HEADER
//   // ======================
//   y += 8;
//   doc.setFont("helvetica", "bold");
//   doc.text("Item", margin, y);
//   doc.text("Qty", 35, y);
//   doc.text("Rate", 48, y);
//   doc.text("Total", rightX, y, { align: "right" });

//   y += 2;
//   doc.line(margin, y, rightX, y);

//   // ======================
//   // ITEMS
//   // ======================
//   y += 6;
//   doc.setFont("helvetica", "normal");

//   let totalQty = 0;

//   items.forEach((item) => {
//     const name = item.name || item?.item_name || "Item";
//     const qty = Number(item.qty || 1);
//     const price = Number(item.price || 0);
//     const total = qty * price;

//     totalQty += qty;

//     doc.text(name.substring(0, 18), margin, y);
//     doc.text(String(qty), 35, y);
//     doc.text(String(price), 48, y);
//     doc.text(String(total.toFixed(0)), rightX, y, {
//       align: "right",
//     });

//     y += itemRowHeight;
//   });

//   // ======================
//   // TOTALS
//   // ======================
//   y += 4;
//   doc.line(margin, y, rightX, y);

//   y += 6;
//   doc.setFont("helvetica", "bold");

//   doc.text(`Total Qty: ${totalQty}`, margin, y);
//   doc.text("Total:", 48, y);
//   doc.text(String(billAmount.toFixed(0)), rightX, y, {
//     align: "right",
//   });

//   if (discount > 0) {
//     y += 5;
//     doc.setFont("helvetica", "normal");
//     doc.text("Discount:", 48, y);
//     doc.text(`-${discount}`, rightX, y, { align: "right" });
//   }

//   y += 6;
//   doc.setFont("helvetica", "bold");
//   doc.text("Net:", 48, y);
//   doc.text(String(netInvoice.toFixed(0)), rightX, y, {
//     align: "right",
//   });

//   // ======================
//   // FOOTER
//   // ======================
//   y += 12;
//   doc.setFontSize(8);
//   doc.setFont("helvetica", "normal");
//   doc.text("Thank you for visiting!", width / 2, y, {
//     align: "center",
//   });

//   return doc.output("datauristring");
// };

export const generateReceipt = (saleData = {}) => {
  console.log("saleData", saleData);
  // 1. Safe Settings & Business Info Extraction
  const settings = saleData.settings || {};

  const logoUrl = settings.logo_url || settings.logo || "";

  const businessName =
    settings.app_name ||
    settings.store_name ||
    settings.business_name ||
    "MY LOCAL STORE";

  const addressLine =
    settings.business_address ||
    settings.address ||
    settings.store_address ||
    "";
  const cityLine = settings.business_city || settings.city || "";
  const stateLine = settings.business_state || settings.state || "";

  const fullAddress = [addressLine, cityLine, stateLine]
    .filter(Boolean)
    .join(", ");

  const phone =
    settings.business_phone ||
    settings.phone ||
    settings.contact ||
    settings.mobile ||
    "";

  const kpraRegistrationNo =
    settings.kpra_no || settings.ntn || settings.strn || saleData.kpra_no || "";

  const payment_method = saleData?.payment_method || "Cash";

  const invoiceNumber = String(saleData.invoice_number || saleData.id || "N/A");

  // Helper function to safely parse numbers and avoid NaN errors
  const safeNum = (val, fallback = 0) => {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  // 2. Financial Calculations
  const billAmount = safeNum(
    saleData.subtotal ||
      saleData.bill_amount ||
      saleData.total_amount ||
      saleData.total,
  );
  const discount = safeNum(saleData.discount || saleData.discount_amount || 0);

  // KPRA Tax calculation
  const kpraRate = safeNum(saleData.kpra_tax_rate || settings.kpra_tax_rate);
  const kpraTax =
    saleData.kpra_tax !== undefined
      ? safeNum(saleData.kpra_tax)
      : saleData.tax !== undefined
        ? safeNum(saleData.tax)
        : (billAmount - discount) * (kpraRate / 100);

  // Service Charges calculation
  const serviceChargeRate = safeNum(
    saleData.service_charge_rate || settings.service_charge_rate,
  );
  const serviceCharges =
    saleData.service_charges !== undefined
      ? safeNum(saleData.service_charges)
      : saleData.service_charge !== undefined
        ? safeNum(saleData.service_charge)
        : (billAmount - discount) * (serviceChargeRate / 100);

  // Net Calculation
  const netInvoice =
    saleData.total !== undefined && saleData.subtotal !== undefined
      ? safeNum(saleData.total)
      : billAmount - discount + kpraTax + serviceCharges;

  const paidToday = safeNum(
    saleData.paid_amount || saleData.paid || saleData.cash_paid,
  );

  // Ledger / Balance calculations
  const oldBalance = safeNum(
    saleData.old_balance !== undefined
      ? saleData.old_balance
      : saleData.previous_balance || saleData.customer_balance,
  );

  const currentInvoiceRemaining = Math.max(0, netInvoice - paidToday);
  const totalBalanceDue = oldBalance;
  const prevBalance = Math.max(0, oldBalance - currentInvoiceRemaining);

  const hasCustomer =
    saleData.customer_id &&
    saleData.customer_id !== "walkin" &&
    saleData.customer_id !== null;

  const showDuesSection = hasCustomer || totalBalanceDue > 0 || prevBalance > 0;

  // 3. Items Loop
  let totalItemsQty = 0;
  const itemsList = Array.isArray(saleData.items)
    ? saleData.items
    : typeof saleData.items === "string"
      ? (() => {
          try {
            return JSON.parse(saleData.items || "[]");
          } catch {
            return [];
          }
        })()
      : [];

  const itemsHtml = itemsList
    .map((item) => {
      const name = item.item_name || item.product_name || item.title || "Item";
      const qty = safeNum(item.quantity || item.qty, 1);
      const rate = safeNum(item.price || item.unit_price || item.rate);
      const lineTotal = (qty * rate).toFixed(2);
      totalItemsQty += qty;

      return `
        <tr>
          <td class="col-item">${name}</td>
          <td class="col-qty">${qty}</td>
          <td class="col-rate">${rate.toFixed(0)}</td>
          <td class="col-total">${lineTotal}</td>
        </tr>
      `;
    })
    .join("");

  // 4. HTML Template Generation
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }

        *, *:before, *:after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          width: 70mm !important;
          margin: 0 !important;
          padding: 2mm 0 10mm 3mm !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 10px;
          line-height: 1.25;
          color: #000000 !important;
          background: #ffffff;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }

        .header { margin-bottom: 4px; }
        .header-logo {
          max-width: 120px;
          max-height: 45px;
          object-fit: contain;
          display: block;
          margin: 0 auto 4px auto;
          image-rendering: pixelated;
          image-rendering: -webkit-optimize-contrast;
          filter: grayscale(100%) contrast(200%);
        }
        .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 9px; color: #000000; margin-top: 1px; }

        .info {
          margin: 4px 0;
          border-top: 1px dashed #000000;
          border-bottom: 1px dashed #000000;
          padding: 3px 0;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
          table-layout: fixed;
        }

        th {
          font-size: 9px;
          border-bottom: 1px solid #000000;
          padding-bottom: 2px;
          color: #000000;
        }

        td {
          padding: 2px 0;
          word-wrap: break-word;
          vertical-align: top;
        }

        .col-item { width: 40%; text-align: left; }
        .col-qty  { width: 14%; text-align: center; }
        .col-rate { width: 22%; text-align: right; }
        .col-total{ width: 24%; text-align: right; font-weight: bold; }

        .divider {
          border-top: 1px solid #000000;
          margin: 3px 0;
        }

        .dashed-divider {
          border-top: 1px dashed #000000;
          margin: 3px 0;
        }

        .totals { margin-top: 4px; }
        .totals .row { margin-bottom: 2px; }

        .barcode-container {
          margin-top: 10px;
          text-align: center;
        }

        .barcode-container svg {
          max-width: 100%;
          height: 40px;
        }

        .footer {
          margin-top: 6px;
          font-size: 9px;
          text-align: center;
        }

        .software-credit {
          margin-top: 6px;
          font-size: 8px;
          text-align: center;
          border-top: 1px dotted #000000;
          padding-top: 4px;
          font-weight: 500;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="header text-center">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="header-logo" />` : ""}
        <h1 class="title">${businessName}</h1>
        ${fullAddress ? `<div class="subtitle">Add: ${fullAddress}</div>` : ""}
        ${phone ? `<div class="subtitle">Contact: ${phone}</div>` : ""}
        ${kpraRegistrationNo ? `<div class="subtitle">KPRA / NTN #: ${kpraRegistrationNo}</div>` : ""}
        ${payment_method ? `<div class="subtitle">Payment: ${payment_method}</div>` : ""}
      </div>

      <div class="info">
        <div class="row">
          <span class="bold">Inv: #${invoiceNumber}</span>
          <span>${new Date(saleData.date || saleData.created_date || new Date()).toLocaleDateString()}</span>
        </div>
        <div class="row">
          <span>Customer: ${saleData.customer_name || "Walk-in"}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-item">Item</th>
            <th class="col-qty">Qty</th>
            <th class="col-rate">Rate</th>
            <th class="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals">
        <div class="row">
          <span class="bold">Total Qty: ${totalItemsQty}</span>
          <span>Subtotal: <span class="bold">${billAmount.toFixed(2)}</span></span>
        </div>

        ${
          discount > 0
            ? `<div class="row">
                 <span>Discount:</span>
                 <span>-${discount.toFixed(2)}</span>
               </div>`
            : ""
        }

        ${
          kpraTax > 0
            ? `<div class="row">
                 <span>KPRA Tax ${kpraRate > 0 ? `(${kpraRate}%)` : ""}:</span>
                 <span>+${kpraTax.toFixed(2)}</span>
               </div>`
            : ""
        }

        ${
          serviceCharges > 0
            ? `<div class="row">
                 <span>Service Charges ${serviceChargeRate > 0 ? `(${serviceChargeRate}%)` : ""}:</span>
                 <span>+${serviceCharges.toFixed(2)}</span>
               </div>`
            : ""
        }

        <div class="row bold" style="font-size: 11px; margin-top: 2px;">
          <span>Net Invoice:</span>
          <span>${netInvoice.toFixed(2)}</span>
        </div>

        <div class="row">
          <span>Paid Amount:</span>
          <span>${paidToday.toFixed(2)}</span>
        </div>

        ${
          showDuesSection
            ? `
          <div class="dashed-divider"></div>

          ${
            currentInvoiceRemaining > 0
              ? `<div class="row">
                   <span>Inv. Remaining:</span>
                   <span>${currentInvoiceRemaining.toFixed(2)}</span>
                 </div>`
              : ""
          }

          ${
            prevBalance > 0
              ? `<div class="row">
                   <span>Previous Balance:</span>
                   <span>${prevBalance.toFixed(2)}</span>
                 </div>`
              : ""
          }

          <div class="row bold" style="font-size: 11px; margin-top: 2px;">
            <span>TOTAL DUE:</span>
            <span>${totalBalanceDue.toFixed(2)}</span>
          </div>
        `
            : ""
        }
      </div>

      <div class="barcode-container">
        <svg id="barcode"></svg>
      </div>

      <div class="footer">
        Thank you for shopping with us!
      </div>

      <div class="software-credit">
        Software by ESK TECH 03443777814
      </div>

      <script>
        document.addEventListener("DOMContentLoaded", function() {
          if (typeof JsBarcode === "function") {
            try {
              JsBarcode("#barcode", "${invoiceNumber}", {
                format: "CODE128",
                width: 1.5,
                height: 35,
                displayValue: true,
                fontSize: 10,
                margin: 0,
                lineColor: "#000000"
              });
            } catch (e) {
              console.error("Barcode generation failed:", e);
            }
          }
        });
      </script>
    </body>
    </html>
  `;
};
