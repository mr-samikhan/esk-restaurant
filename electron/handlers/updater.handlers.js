import { ipcMain, app, dialog } from "electron";

import log from "electron-log";
import pkgUpdater from "electron-updater";

const { autoUpdater } = pkgUpdater;

export function registerUpdaterHandlers() {
  // LOGGER
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";

  // CHECK FOR UPDATES
  ipcMain.handle("check-for-updates", async () => {
    try {
      if (!app.isPackaged) {
        return {
          success: false,
          message: "Updater only works in production builds.",
        };
      }

      autoUpdater.checkForUpdatesAndNotify();

      return {
        success: true,
        message: "Checking for updates...",
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // UPDATE AVAILABLE
  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: "A new version is available. Downloading now...",
    });
  });

  // NO UPDATE
  autoUpdater.on("update-not-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "No Updates",
      message: "You are already using the latest version.",
    });
  });

  // DOWNLOAD COMPLETE
  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Install Updates",
      message: "Updates downloaded. Restart the app to install?",
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // ERROR
  autoUpdater.on("error", (err) => {
    console.error("AutoUpdater Error:", err.message);

    dialog.showMessageBox({
      type: "error",
      title: "Update Error",
      message: err.message,
    });
  });
}
