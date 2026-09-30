import { jsPDF } from "jspdf";

export const generateReceipt = (saleData = {}, settings = {}) => {
  // console.log("settings", settings);
  // ======================
  // STATIC VALUES
  // ======================
  const businessName = settings?.app_name || "";
  const address = settings?.business_address || "Main Market, Pakistan";
  const phone = settings?.business_phone || "+92 300 0000000";

  // ======================
  // SAFE DATA
  // ======================
  const items = Array.isArray(saleData.items) ? saleData.items : [];

  const billAmount = Number(saleData.total) || 0;
  const discount = Number(saleData.discount) || 0;
  const paidToday = Number(saleData.paid_amount) || 0;

  const netInvoice = billAmount - discount;

  // ======================
  // PDF SIZE
  // ======================
  const itemRowHeight = 7;
  const height = 120 + items.length * itemRowHeight;

  const doc = new jsPDF({
    unit: "mm",
    format: [80, height],
  });

  const width = 80;
  const margin = 5;
  const rightX = width - margin;
  let y = 10;

  // ======================
  // HEADER
  // ======================
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text(businessName, width / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(8).setFont("helvetica", "normal");
  doc.text(address, width / 2, y, { align: "center" });

  y += 4;
  doc.text(phone, width / 2, y, { align: "center" });

  // ======================
  // ORDER INFO
  // ======================
  y += 8;
  doc.setFontSize(9).setFont("helvetica", "bold");

  doc.text(`Order #${saleData.id || "0000"}`, margin, y);
  doc.text(new Date().toLocaleDateString(), rightX, y, {
    align: "right",
  });

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Table: ${saleData.table_name || "Takeaway"}`, margin, y);

  // ======================
  // TABLE HEADER
  // ======================
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Item", margin, y);
  doc.text("Qty", 35, y);
  doc.text("Rate", 48, y);
  doc.text("Total", rightX, y, { align: "right" });

  y += 2;
  doc.line(margin, y, rightX, y);

  // ======================
  // ITEMS
  // ======================
  y += 6;
  doc.setFont("helvetica", "normal");

  let totalQty = 0;

  items.forEach((item) => {
    const name = item.name || item?.item_name || "Item";
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const total = qty * price;

    totalQty += qty;

    doc.text(name.substring(0, 18), margin, y);
    doc.text(String(qty), 35, y);
    doc.text(String(price), 48, y);
    doc.text(String(total.toFixed(0)), rightX, y, {
      align: "right",
    });

    y += itemRowHeight;
  });

  // ======================
  // TOTALS
  // ======================
  y += 4;
  doc.line(margin, y, rightX, y);

  y += 6;
  doc.setFont("helvetica", "bold");

  doc.text(`Total Qty: ${totalQty}`, margin, y);
  doc.text("Total:", 48, y);
  doc.text(String(billAmount.toFixed(0)), rightX, y, {
    align: "right",
  });

  if (discount > 0) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Discount:", 48, y);
    doc.text(`-${discount}`, rightX, y, { align: "right" });
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Net:", 48, y);
  doc.text(String(netInvoice.toFixed(0)), rightX, y, {
    align: "right",
  });

  // ======================
  // FOOTER
  // ======================
  y += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for visiting!", width / 2, y, {
    align: "center",
  });

  return doc.output("datauristring");
};
