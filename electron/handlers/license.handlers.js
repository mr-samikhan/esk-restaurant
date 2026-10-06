import fs from "fs";
import path from "path";

import { ipcMain, app, dialog, BrowserWindow, net } from "electron";
import crypto from "crypto";

import {
  getLicenseInfo,
  saveLicense,
  LICENSE_PATH,
  DEVICE_ID,
  isDev,
  getDerivedKey,
  getDerivedIV,
  encryptData,
  getDecryptedLicenseData,
  runBackgroundSync,
} from "../services/license.service.js";

import {
  verifyLicenseOnline,
  requestLicenseOnboarding,
  checkRemoteLicenseStatus,
} from "../firebase/firebase-config.js";

// const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");

// const isDev = process.env.NODE_ENV === "development";

export function registerLicenseHandlers() {
  // GET DEVICE ID
  ipcMain.handle("get-device-id", () => DEVICE_ID);

  // ACTIVATE LICENSE
  ipcMain.handle("activate-license", (event, encryptedData) => {
    try {
      // Basic cleanup of the input string to remove any accidental spaces/newlines
      const cleanData = encryptedData.trim();
      fs.writeFileSync(LICENSE_PATH, cleanData);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  // LICENSE INFO
  ipcMain.handle("get-license-info", async () => {
    try {
      if (!fs.existsSync(LICENSE_PATH)) return null;

      const encrypted = fs.readFileSync(LICENSE_PATH, "utf8").trim();

      const key = getDerivedKey();
      const iv = getDerivedIV();

      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      const localData = JSON.parse(decrypted);

      // 1. Execute live cloud verification handshake
      const remoteCheck = await checkRemoteLicenseStatus(localData.licenseKey);

      if (remoteCheck.success) {
        console.log(
          `[LAUNCH CHECK] Cloud license document state evaluated: ${remoteCheck.status}`,
        );
        return {
          ...localData,
          status: remoteCheck.status,
          serverExpiry: remoteCheck.serverExpiry,
        };
      }

      // 🚨 2. CRITICAL SHIELD: INTERCEPT HARD DELETIONS
      // If the server confirms the document does not exist, block access and purge the local file cache
      if (remoteCheck.error === "not_found") {
        console.warn(
          `[SECURITY ALERT] License key ${localData.licenseKey} has been hard-deleted from Firestore! Revoking local access terms...`,
        );

        // Clear out local license file to prevent subsequent offline bypass attempts
        if (fs.existsSync(LICENSE_PATH)) {
          fs.unlinkSync(LICENSE_PATH);
        }

        return {
          ...localData,
          status: "Blocked", // 🔴 Force-locks the React frontend and sends them to the license page
          serverExpiry: null,
        };
      }

      // 3. SAFE OFFLINE FALLBACK RULE
      // Only fall back to Active status if the error is purely a network connection drop ("offline")
      console.log(
        "[SYNC INFO] Machine running offline or server un-syncable. Reading local parameters.",
      );
      return {
        ...localData,
        status: "Active",
      };
    } catch (err) {
      console.error("Failed to get license info for UI pipeline:", err.message);
      return null;
    }
  });

  // RESET LICENSE
  ipcMain.handle("reset-license", async (event) => {
    try {
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH);

        // Notify the frontend immediately
        const win = BrowserWindow.fromWebContents(event.sender);
        if (isDev) {
          win.loadURL("http://localhost:3000/#/license");
        } else {
          win.loadURL(
            `file://${path.join(__dirname, "dist/index.html")}#/license`,
          );
        }

        return { success: true };
      }
      return { success: false, error: "No license file found." };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // FORCE EXPIRE
  ipcMain.handle("force-expire-license", () => {
    try {
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH); // Physically deletes the app.lic file
        return { success: true, message: "License file removed." };
      }
      return { success: false, message: "No license file found." };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // GENERATE TEST LICENSE
  ipcMain.handle("generate-test-license", async (event, { deviceId, days }) => {
    try {
      const expiryDate = new Date();

      expiryDate.setDate(expiryDate.getDate() + days);

      const data = JSON.stringify({
        deviceId,
        expiryDate: expiryDate.toISOString(),
        licenseKey: "OFFLINE-TEST-KEY",
      });

      const encrypted = encryptData(data);

      return {
        success: true,
        key: encrypted,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // 1. SAVE/DOWNLOAD HANDLER (For Testing/Admin)
  ipcMain.handle("save-license-file", async (event, { key }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { filePath } = await dialog.showSaveDialog(win, {
      title: "Export License File",
      defaultPath: path.join(app.getPath("downloads"), "license.lic"),
      filters: [{ name: "License Files", extensions: ["lic"] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, key);
      return { success: true };
    }
    return { success: false };
  });

  // 2. UPLOAD HANDLER (For Clients)
  ipcMain.handle("upload-license-file", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Select License File",
      filters: [{ name: "License Files", extensions: ["lic"] }],
      properties: ["openFile"],
    });

    if (!canceled && filePaths.length > 0) {
      try {
        const content = fs.readFileSync(filePaths[0], "utf8");
        fs.writeFileSync(LICENSE_PATH, content.trim()); // Save to app data
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false };
  });

  // ONLINE ACTIVATION
  ipcMain.handle("activate-online", async (event, payload) => {
    try {
      const { licenseKey, clientData } = payload;

      // 1. Fire the cloud validation trigger to Firebase
      const result = await verifyLicenseOnline(
        licenseKey,
        clientData.deviceId,
        clientData,
      );

      if (result.success) {
        // 🚨 EXPIRATION CHECK: Verify if the returned expiryDate is in the past
        if (
          result.expiryDate &&
          new Date(result.expiryDate).getTime() < Date.now()
        ) {
          console.warn(
            "[IPC MAIN] Cloud activation rejected: License has expired.",
          );
          return {
            success: false,
            error:
              "License has expired. Please renew your subscription to activate.",
          };
        }

        console.log(
          "[IPC MAIN] Cloud activation succeeded. Writing local license file...",
        );

        // 2. Package the verified data cleanly
        const licenseFileContent = JSON.stringify({
          deviceId: clientData.deviceId,
          expiryDate: result.expiryDate, // Derived from Firebase
          licenseKey: result.licenseKey,
        });

        // 3. Encrypt and write to disk immediately BEFORE background sync runs
        fs.writeFileSync(LICENSE_PATH, encryptData(licenseFileContent));

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error("Activation handler failure:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("request-license-onboarding", async (event, payload) => {
    return await requestLicenseOnboarding(
      payload.businessName,
      payload.contactEmail,
      payload.deviceId,
    );
  });

  // // Triggers instantly from React once an onboarding activation flow completes successfully
  // ipcMain.handle("trigger-license-verification-sync", async () => {
  //   console.log(
  //     "[IPC MAIN] Activation event captured from React frontend. Syncing...",
  //   );
  //   if (net.isOnline()) {
  //     await runBackgroundSync(win);
  //     return { success: true };
  //   }
  //   return {
  //     success: false,
  //     error: "Offline validation unavailable. Check network.",
  //   };
  // });

  //RELAUNCH APP
  ipcMain.handle("relaunch-app", () => {
    app.relaunch();
    app.exit(0);
  });
}
