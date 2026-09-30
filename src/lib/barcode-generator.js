import JsBarcode from "jsbarcode";

export const generateBarcodeBase64 = (text) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 2,
    height: 40,
    displayValue: true,
  });
  return canvas.toDataURL("image/png");
};
