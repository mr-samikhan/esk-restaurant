import crypto from "crypto";
import nodeMachineId from "node-machine-id";

const { machineIdSync } = nodeMachineId;

const DEVICE_ID = machineIdSync();

export function getDeviceId() {
  return DEVICE_ID;
}

export function getDerivedKey() {
  const secret = process.env.VITE_LICENSE_KEY_HEX || "fallback";

  return crypto
    .createHash("sha256")
    .update(secret + DEVICE_ID)
    .digest();
}

export function getDerivedIV() {
  const ivSecret = process.env.IV_STRING || "fallback_iv";

  return crypto
    .createHash("md5")
    .update(ivSecret + DEVICE_ID)
    .digest("hex")
    .slice(0, 16);
}

export function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password + "SwiftPOS_salt")
    .digest("hex");
}

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

export function decryptData(data) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    getDerivedKey(),
    getDerivedIV(),
  );

  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
