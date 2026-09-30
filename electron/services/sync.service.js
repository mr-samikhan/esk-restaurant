import fs from "fs";
import path from "path";
import { app } from "electron";

import { encryptData, getDeviceId } from "../utils/crypto.js";

import { syncOfflineLicenseWithFirebase } from "../firebase/firebase-config.js";

import { getLicenseInfo } from "./license.service.js";

const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");

export async function runBackgroundSync(win) {
  try {
    const localData = getLicenseInfo();

    if (!localData || !localData.licenseKey) {
      return;
    }

    const result = await syncOfflineLicenseWithFirebase(
      localData,
      getDeviceId(),
    );

    if (!result) return;

    const isExpiredNow =
      result.serverExpiry &&
      new Date(result.serverExpiry).getTime() < Date.now();

    if (result.action === "revoke" || isExpiredNow) {
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH);
      }

      win.webContents.send("license-status-changed", {
        isValid: false,
        reason: isExpiredNow ? "Expired" : "Revoked",
      });

      return;
    }

    if (result.serverExpiry && result.serverExpiry !== localData.expiryDate) {
      const updatedData = JSON.stringify({
        deviceId: getDeviceId(),
        expiryDate: result.serverExpiry,
        licenseKey: localData.licenseKey,
      });

      fs.writeFileSync(LICENSE_PATH, encryptData(updatedData));

      win.webContents.send("license-updated", {
        expiryDate: result.serverExpiry,
      });
    }
  } catch (err) {
    console.log("[SYNC ERROR]", err.message);
  }
}
