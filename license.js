import { machineIdSync } from "node-machine-id";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { app } from "electron";

const SECRET_KEY =
  "a150144dfa1415fccd496fcd65f3604512ade929494261d20487d56bbbd5af04"; // Keep this safe
const LICENSE_PATH = path.join(app.getPath("userData"), "app.lic");

export const LicenseService = {
  // Get unique ID of the current PC
  getDeviceId: () => machineIdSync(),

  // Verify the existing license file
  verifyLicense: () => {
    if (!fs.existsSync(LICENSE_PATH))
      return { valid: false, reason: "MISSING" };

    try {
      const encryptedData = fs.readFileSync(LICENSE_PATH, "utf8");
      const decipher = crypto.createDecipher("aes-256-cbc", SECRET_KEY);
      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      const license = JSON.parse(decrypted);
      const currentId = machineIdSync();

      // Check if machine ID matches and license hasn't expired
      if (license.deviceId !== currentId)
        return { valid: false, reason: "INVALID_MACHINE" };
      if (new Date(license.expiry) < new Date())
        return { valid: false, reason: "EXPIRED" };

      return { valid: true, license };
    } catch (err) {
      return { valid: false, reason: "CORRUPTED" };
    }
  },
};
