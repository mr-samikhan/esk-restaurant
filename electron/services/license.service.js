import fs from "fs";
import path from "path";
import { app } from "electron";

import { encryptData, decryptData, getDeviceId } from "../utils/crypto.js";

const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");

export function isLicenseValid() {
  try {
    if (!fs.existsSync(LICENSE_PATH)) return false;

    const encrypted = fs.readFileSync(LICENSE_PATH, "utf8");

    const decrypted = decryptData(encrypted);

    const license = JSON.parse(decrypted);

    return (
      license.deviceId === getDeviceId() &&
      new Date(license.expiryDate) > new Date()
    );
  } catch {
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
