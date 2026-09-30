import fs from "fs";
import path from "path";

import { ipcMain, app, dialog, BrowserWindow } from "electron";

import { encryptData, getDeviceId } from "../utils/crypto.js";

import { getLicenseInfo, saveLicense } from "../services/license.service.js";

import { verifyLicenseOnline } from "../firebase/firebase-config.js";

const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");

const isDev = process.env.NODE_ENV === "development";

export function registerLicenseHandlers() {
  // GET DEVICE ID
  ipcMain.handle("get-device-id", () => {
    return getDeviceId();
  });

  // ACTIVATE LICENSE
  ipcMain.handle("activate-license", async (event, encryptedData) => {
    try {
      fs.writeFileSync(LICENSE_PATH, encryptedData.trim());

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // LICENSE INFO
  ipcMain.handle("get-license-info", () => {
    try {
      return getLicenseInfo();
    } catch (err) {
      return null;
    }
  });

  // RESET LICENSE
  ipcMain.handle("reset-license", (event) => {
    try {
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH);
      }

      const win = BrowserWindow.fromWebContents(event.sender);

      const licenseURL = isDev
        ? "http://localhost:3000/#/license"
        : `file://${path.join(process.cwd(), "dist/index.html")}#/license`;

      win.loadURL(licenseURL);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // FORCE EXPIRE
  ipcMain.handle("force-expire-license", () => {
    try {
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH);
      }

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

  // SAVE LICENSE FILE
  ipcMain.handle("save-license-file", async (event, { key }) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    const result = await dialog.showSaveDialog(win, {
      title: "Export License File",
      defaultPath: path.join(app.getPath("downloads"), "license.lic"),
      filters: [
        {
          name: "License Files",
          extensions: ["lic"],
        },
      ],
    });

    if (!result.filePath) {
      return { success: false };
    }

    fs.writeFileSync(result.filePath, key);

    return { success: true };
  });

  // UPLOAD LICENSE FILE
  ipcMain.handle("upload-license-file", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    const result = await dialog.showOpenDialog(win, {
      title: "Select License File",
      filters: [
        {
          name: "License Files",
          extensions: ["lic"],
        },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    try {
      const content = fs.readFileSync(result.filePaths[0], "utf8");

      fs.writeFileSync(LICENSE_PATH, content.trim());

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // ONLINE ACTIVATION
  ipcMain.handle("activate-online", async (event, inputKey, clientData) => {
    const result = await verifyLicenseOnline(
      inputKey,
      getDeviceId(),
      clientData,
    );

    if (!result.success) {
      return result;
    }

    const localData = {
      deviceId: getDeviceId(),
      expiryDate: result.expiryDate,
      licenseKey: inputKey.trim(),
    };

    saveLicense(localData);

    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.send("license-status-updated", {
      expiryDate: result.expiryDate,
    });

    return {
      success: true,
    };
  });

  //RELAUNCH APP
  ipcMain.handle("relaunch-app", () => {
    app.relaunch();
    app.exit(0);
  });
}
