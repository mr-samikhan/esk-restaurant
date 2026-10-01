import { ipcMain, BrowserWindow } from "electron";

export function registerPrinterHandlers() {
  ipcMain.handle("print-receipt", async (event, htmlContent) => {
    let workerWindow = null;
    try {
      workerWindow = new BrowserWindow({
        show: false,
        width: 400,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
        },
      });

      // 1. Check for attached printers
      const printers = await workerWindow.webContents.getPrintersAsync();
      const hasPrinter = printers && printers.length > 0;

      // 2. If NO printer is attached, close window and notify React to show preview
      if (!hasPrinter) {
        if (workerWindow && !workerWindow.isDestroyed()) {
          workerWindow.close();
        }
        return {
          success: false,
          noPrinter: true,
          html: htmlContent, // Return HTML back to React for preview
        };
      }

      // 3. If printer exists, load HTML and print
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(
        htmlContent,
      )}`;

      const printPromise = new Promise((resolve, reject) => {
        workerWindow.webContents.on("did-finish-load", async () => {
          try {
            await new Promise((r) => setTimeout(r, 100));

            workerWindow.webContents.print(
              {
                silent: false,
                printBackground: true,
                margins: { marginType: "none" },
              },
              (success, errorType) => {
                if (workerWindow && !workerWindow.isDestroyed()) {
                  workerWindow.close();
                }
                if (!success && errorType !== "cancelled") {
                  reject(new Error(errorType));
                } else {
                  resolve({ success: true });
                }
              },
            );
          } catch (err) {
            reject(err);
          }
        });
      });

      await workerWindow.loadURL(dataUri);
      return await printPromise;
    } catch (err) {
      if (workerWindow && !workerWindow.isDestroyed()) {
        workerWindow.close();
      }
      console.error("Electron Print Error:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  });
}
