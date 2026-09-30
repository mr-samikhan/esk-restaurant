import { ipcMain, BrowserWindow } from "electron";

export function registerPrinterHandlers() {
  ipcMain.handle("print-receipt", async (event, pdfDataUri) => {
    try {
      const workerWindow = new BrowserWindow({
        show: true,
        width: 400,
        height: 600,
      });

      workerWindow.webContents.on("did-finish-load", () => {
        workerWindow.webContents.print({
          silent: false,
          printBackground: true,
        });
      });

      await workerWindow.loadURL(pdfDataUri);

      return {
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // ipcMain.handle("print-invoice", async (event, orderId) => {
  //   try {
  //     const order = db
  //       .prepare("SELECT * FROM orders WHERE id = ?")
  //       .get(orderId);

  //     const items = db
  //       .prepare("SELECT * FROM order_items WHERE order_id = ?")
  //       .all(orderId);

  //     const win = new BrowserWindow({
  //       show: false,
  //       width: 400,
  //       height: 600,
  //     });

  //     const html = generateInvoiceHTML(order, items);

  //     await win.loadURL(
  //       "data:text/html;charset=utf-8," + encodeURIComponent(html),
  //     );

  //     win.webContents.on("did-finish-load", () => {
  //       win.webContents.print(
  //         {
  //           silent: false, // set true for thermal printer auto-print
  //           printBackground: true,
  //         },
  //         (success, error) => {
  //           if (!success) console.error("Print failed:", error);
  //         },
  //       );
  //     });

  //     return { success: true };
  //   } catch (err) {
  //     console.error("Print error:", err.message);
  //     return { success: false, error: err.message };
  //   }
  // });

  // ipcMain.handle("print-receipt", async (event, html) => {
  //   console.log("PRINT HANDLER HIT", html);
  //   try {
  //     const win = new BrowserWindow({
  //       show: false,
  //       width: 400,
  //       height: 600,
  //     });

  //     await win.loadURL(
  //       "data:text/html;charset=utf-8," + encodeURIComponent(html),
  //     );

  //     // IMPORTANT: wait for ready
  //     await new Promise((resolve) => {
  //       win.webContents.once("did-finish-load", resolve);
  //     });

  //     await new Promise((resolve) => {
  //       setTimeout(() => {
  //         win.webContents.print(
  //           {
  //             silent: false,
  //             printBackground: true,
  //           },
  //           (success, errorType) => {
  //             if (!success) {
  //               console.error("Print failed:", errorType);
  //             }
  //             resolve();
  //           },
  //         );
  //       }, 300); // small delay fixes race condition
  //     });

  //     win.close();

  //     return { success: true };
  //   } catch (err) {
  //     console.error("PRINT ERROR:", err);
  //     return { success: false, error: err.message };
  //   }
  // });
}
