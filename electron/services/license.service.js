// import fs from "fs";
// import path from "path";
// import crypto from "crypto";
// import { app } from "electron";
// import nodeMachineId from "node-machine-id";
// import { decryptData, getDeviceId } from "../utils/crypto.js";
// import { syncOfflineLicenseWithFirebase } from "../firebase/firebase-config.js";

// const { machineIdSync } = nodeMachineId;

// export const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");
// export const DEVICE_ID = machineIdSync();

// export const isDev = process.env.NODE_ENV === "development";

// // SHA256 returns 32 bytes (AES-256 requirement)
// export function getDerivedKey() {
//   const secret = process.env.VITE_LICENSE_KEY_HEX || "fallback";
//   return crypto
//     .createHash("sha256")
//     .update(secret + DEVICE_ID)
//     .digest();
// }

// // MD5 sliced to 16 returns 16 bytes (IV requirement)

// export function getDerivedIV() {
//   const ivSecret = process.env.IV_STRING || "fallback_iv";
//   return crypto
//     .createHash("md5")
//     .update(ivSecret + DEVICE_ID)
//     .digest("hex")
//     .slice(0, 16);
// }

// // --- ENCRYPTION HELPER ---
// export function encryptData(data) {
//   const cipher = crypto.createCipheriv(
//     "aes-256-cbc",
//     getDerivedKey(),
//     getDerivedIV(),
//   );
//   let encrypted = cipher.update(data, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return encrypted;
// }

// export function getDecryptedLicenseData() {
//   try {
//     if (!fs.existsSync(LICENSE_PATH)) return null;

//     const encrypted = fs.readFileSync(LICENSE_PATH, "utf8").trim();

//     // FIX: Use your dynamic helpers instead of static strings
//     // Ensure these functions (getDerivedKey, getDerivedIV) are defined in your main.mjs
//     const key = getDerivedKey();
//     const iv = getDerivedIV();

//     const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

//     let decrypted = decipher.update(encrypted, "hex", "utf8");
//     decrypted += decipher.final("utf8");

//     return JSON.parse(decrypted);
//   } catch (e) {
//     // Log the error to your terminal to see exactly why it failed
//     console.error("Decryption Error Details:", e.message);
//     return null;
//   }
// }

// export async function runBackgroundSync(win) {
//   try {
//     const localData = getDecryptedLicenseData();
//     console.log("localData info retrieved:", localData);
//     if (!localData || !localData.licenseKey) return;

//     // 1. Get current status from Firebase Cloud
//     const result = await syncOfflineLicenseWithFirebase(localData, DEVICE_ID);
//     if (!result) return;

//     // 🚨 2. IRONCLAD HARD-DELETION LOCKOUT INTERCEPT
//     // Detects if the document has been purged from Firestore or explicitly blocked by an admin
//     const isExpiredNow =
//       result.serverExpiry &&
//       new Date(result.serverExpiry).getTime() < Date.now();
//     const isRecordRemoved = result.action === "not_found";
//     const isRevokedByAdmin = result.action === "revoke";

//     if (isRecordRemoved || isRevokedByAdmin || isExpiredNow) {
//       console.warn(
//         `[SECURITY ALERT] Enforcing lock. Reason - Removed: ${isRecordRemoved}, Revoked: ${isRevokedByAdmin}, Expired: ${isExpiredNow}`,
//       );

//       // Delete local app.lic file to block subsequent offline re-entry bypass shortcuts completely
//       if (fs.existsSync(LICENSE_PATH)) {
//         fs.unlinkSync(LICENSE_PATH);
//       }

//       // Notify the React frontend layout layers to switch internal auth stores
//       win.webContents.send("license-status-changed", {
//         isValid: false,
//         reason: isRecordRemoved
//           ? "Revoked (Key Deleted)"
//           : isExpiredNow
//             ? "Expired"
//             : "Revoked",
//       });

//       // 3. FORCE REDIRECT: Drop workspace access and force load the lock screen URL
//       setTimeout(() => {
//         // const isDev = process.env.NODE_ENV === "development";
//         const licenseUrl = isDev
//           ? "http://localhost:3000/#/license"
//           : `file://${path.join(__dirname, "dist/index.html")}#/license`;

//         win.loadURL(licenseUrl);
//       }, 500);
//       return;
//     }

//     // 4. Handle DATE UPDATES (Renewal / Extensions)
//     if (
//       result.action === "synced" &&
//       result.serverExpiry &&
//       result.serverExpiry !== localData.expiryDate
//     ) {
//       console.log(
//         "[SYNC SUCCESS] Updating local license with new server expiration calendar thresholds...",
//       );

//       const updatedData = JSON.stringify({
//         deviceId: DEVICE_ID,
//         expiryDate: result.serverExpiry,
//         licenseKey: localData.licenseKey,
//       });

//       fs.writeFileSync(LICENSE_PATH, encryptData(updatedData));
//       win.webContents.send("license-updated", {
//         expiryDate: result.serverExpiry,
//       });
//     }

//     // 5. SUCCESS ROUTING: Handles onboarding to dashboard transitions cleanly
//     const isDev = process.env.NODE_ENV === "development";
//     const currentUrl = win.getURL();

//     if (currentUrl.includes("#/license") || currentUrl.includes("/license")) {
//       win.webContents.send("license-status-changed", { isValid: true });

//       if (isDev) {
//         win.loadURL("http://localhost:3000/#/dashboard");
//       } else {
//         win.loadURL(`file://${path.join(__dirname, "dist/index.html")}#/`);
//       }
//     }
//   } catch (err) {
//     console.log(
//       "[SYNC INFO] Skipping background check (User Operating Offline Mode Layouts)",
//     );
//   }
// }

// // --- LICENSE CONSTANTS ---
// // This is 64 hex chars = 32 bytes. Correct for aes-256.
// if (!process.env.VITE_LICENSE_KEY_HEX || !process.env.IV_STRING) {
//   console.error(
//     "FATAL: Environment variables are missing! Check your .env file.",
//   );
// }

// // export function isLicenseValid() {
// //   try {
// //     if (!fs.existsSync(LICENSE_PATH)) return false;

// //     const encrypted = fs.readFileSync(LICENSE_PATH, "utf8");

// //     const decrypted = decryptData(encrypted);

// //     const license = JSON.parse(decrypted);

// //     return (
// //       license.deviceId === getDeviceId() &&
// //       new Date(license.expiryDate) > new Date()
// //     );
// //   } catch {
// //     return false;
// //   }
// // }

// export function isLicenseValid() {
//   if (!fs.existsSync(LICENSE_PATH)) return false;
//   try {
//     const encrypted = fs.readFileSync(LICENSE_PATH, "utf8").trim();
//     const decipher = crypto.createDecipheriv(
//       "aes-256-cbc",
//       getDerivedKey(),
//       getDerivedIV(),
//     );

//     let decrypted =
//       decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
//     const license = JSON.parse(decrypted);

//     return (
//       license.deviceId === DEVICE_ID &&
//       new Date(license.expiryDate) > new Date()
//     );
//   } catch (err) {
//     console.error("License Decryption Failed (Machine Mismatch or Tampering)");
//     return false;
//   }
// }

// export function saveLicense(data) {
//   const encrypted = encryptData(JSON.stringify(data));

//   fs.writeFileSync(LICENSE_PATH, encrypted);
// }

// export function getLicenseInfo() {
//   if (!fs.existsSync(LICENSE_PATH)) return null;

//   const encrypted = fs.readFileSync(LICENSE_PATH, "utf8");

//   return JSON.parse(decryptData(encrypted));
// }

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { app } from "electron";
import nodeMachineId from "node-machine-id";
import { decryptData, getDeviceId } from "../utils/crypto.js";
import { syncOfflineLicenseWithFirebase } from "../firebase/firebase-config.js";

const { machineIdSync } = nodeMachineId;

export const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");
export const DEVICE_ID = machineIdSync();

// Module-level variable definition
export const isDev = process.env.NODE_ENV === "development";

// SHA256 returns 32 bytes (AES-256 requirement)
export function getDerivedKey() {
  const secret = process.env.VITE_LICENSE_KEY_HEX || "fallback";
  return crypto
    .createHash("sha256")
    .update(secret + DEVICE_ID)
    .digest();
}

// MD5 sliced to 16 returns 16 bytes (IV requirement)
export function getDerivedIV() {
  const ivSecret = process.env.IV_STRING || "fallback_iv";
  return crypto
    .createHash("md5")
    .update(ivSecret + DEVICE_ID)
    .digest("hex")
    .slice(0, 16);
}

// --- ENCRYPTION HELPER ---
export function encryptData(data) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    getDerivedKey(),
    getDerivedIV(),
  );
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function getDecryptedLicenseData() {
  try {
    if (!fs.existsSync(LICENSE_PATH)) return null;

    const encrypted = fs.readFileSync(LICENSE_PATH, "utf8").trim();

    const key = getDerivedKey();
    const iv = getDerivedIV();

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (e) {
    console.error("Decryption Error Details:", e.message);
    return null;
  }
}

export async function runBackgroundSync(win) {
  try {
    const localData = getDecryptedLicenseData();
    console.log("localData info retrieved:", localData);
    if (!localData || !localData.licenseKey) return;

    // 1. Get current status from Firebase Cloud
    const result = await syncOfflineLicenseWithFirebase(localData, DEVICE_ID);
    if (!result) return;

    // 🚨 2. IRONCLAD HARD-DELETION LOCKOUT INTERCEPT
    const isExpiredNow =
      result.serverExpiry &&
      new Date(result.serverExpiry).getTime() < Date.now();
    const isRecordRemoved = result.action === "not_found";
    const isRevokedByAdmin = result.action === "revoke";

    if (isRecordRemoved || isRevokedByAdmin || isExpiredNow) {
      console.warn(
        `[SECURITY ALERT] Enforcing lock. Reason - Removed: ${isRecordRemoved}, Revoked: ${isRevokedByAdmin}, Expired: ${isExpiredNow}`,
      );

      // Delete local app.lic file to block offline re-entry
      if (fs.existsSync(LICENSE_PATH)) {
        fs.unlinkSync(LICENSE_PATH);
      }

      // Notify the React frontend layout layers
      win.webContents.send("license-status-changed", {
        isValid: false,
        reason: isRecordRemoved
          ? "Revoked (Key Deleted)"
          : isExpiredNow
            ? "Expired"
            : "Revoked",
      });

      // 3. FORCE REDIRECT
      setTimeout(() => {
        const distIndexPath = path.join(app.getAppPath(), "dist", "index.html");
        if (isDev) {
          win.loadURL("http://localhost:3000/#/license");
        } else {
          win.loadFile(distIndexPath, { hash: "/license" });
        }
      }, 500);
      return;
    }

    // 4. Handle DATE UPDATES (Renewal / Extensions)
    if (
      result.action === "synced" &&
      result.serverExpiry &&
      result.serverExpiry !== localData.expiryDate
    ) {
      console.log(
        "[SYNC SUCCESS] Updating local license with new server expiration calendar thresholds...",
      );

      const updatedData = JSON.stringify({
        deviceId: DEVICE_ID,
        expiryDate: result.serverExpiry,
        licenseKey: localData.licenseKey,
      });

      fs.writeFileSync(LICENSE_PATH, encryptData(updatedData));
      win.webContents.send("license-updated", {
        expiryDate: result.serverExpiry,
      });
    }

    // 5. SUCCESS ROUTING: Handles onboarding to dashboard transitions cleanly
    const currentUrl = win.getURL();

    if (currentUrl.includes("#/license") || currentUrl.includes("/license")) {
      win.webContents.send("license-status-changed", { isValid: true });

      const distIndexPath = path.join(app.getAppPath(), "dist", "index.html");
      if (isDev) {
        win.loadURL("http://localhost:3000/#/dashboard");
      } else {
        win.loadFile(distIndexPath, { hash: "/dashboard" });
      }
    }
  } catch (err) {
    console.log(
      "[SYNC INFO] Skipping background check (User Operating Offline Mode Layouts)",
    );
  }
}

// --- LICENSE CONSTANTS ---
if (!process.env.VITE_LICENSE_KEY_HEX || !process.env.IV_STRING) {
  console.error(
    "FATAL: Environment variables are missing! Check your .env file.",
  );
}

export function isLicenseValid() {
  if (!fs.existsSync(LICENSE_PATH)) return false;
  try {
    const encrypted = fs.readFileSync(LICENSE_PATH, "utf8").trim();
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      getDerivedKey(),
      getDerivedIV(),
    );

    let decrypted =
      decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    const license = JSON.parse(decrypted);

    return (
      license.deviceId === DEVICE_ID &&
      new Date(license.expiryDate) > new Date()
    );
  } catch (err) {
    console.error("License Decryption Failed (Machine Mismatch or Tampering)");
    return false;
  }
}

export function saveLicense(data) {
  const encrypted = encryptData(JSON.stringify(data));
  fs.writeFileSync(LICENSE_PATH, encrypted);
}

export function getLicenseInfo() {
  if (!fs.existsSync(LICENSE_PATH)) return null;
  const encrypted = fs.readFileSync(LICENSE_PATH, "utf8");
  return JSON.parse(decryptData(encrypted));
}
