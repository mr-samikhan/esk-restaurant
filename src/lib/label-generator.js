import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

export const printProductLabel = (product) => {
  // 50mm x 25mm Label
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [50, 25],
  });

  const canvas = document.createElement("canvas");
  // CODE128 is wide; let's use narrower bars to fit the 50mm width
  JsBarcode(canvas, product.barcode, {
    format: "CODE128",
    width: 1.2, // Narrower bars
    height: 50,
    displayValue: false,
    margin: 0,
  });

  const barcodeData = canvas.toDataURL("image/png");

  // --- Design (Centered and Margined) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  // Name at top
  const name = product.name.toUpperCase().substring(0, 22);
  doc.text(name, 25, 6, { align: "center" });

  // Barcode Image (Width 40mm, Height 10mm)
  // X: 5mm (center is 25mm), Y: 8mm
  doc.addImage(barcodeData, "PNG", 5, 8, 40, 10);

  // Barcode text below lines
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(product.barcode, 25, 20, { align: "center" });

  // Price at bottom
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Rs. ${Number(product.price).toLocaleString()}`, 25, 24, {
    align: "center",
  });

  const pdfUri = doc.output("datauristring");
  window.require("electron").ipcRenderer.invoke("print-receipt", pdfUri);
};
