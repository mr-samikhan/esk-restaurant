import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { createHash } from "crypto";

const firebaseConfig = {
  apiKey: "AIzaSyAPtFyt_n9W0llnU-VsiMnrYTDVYTuy-Iw",
  authDomain: "fir-crud-1d431.firebaseapp.com",
  databaseURL: "https://fir-crud-1d431-default-rtdb.firebaseio.com",
  projectId: "fir-crud-1d431",
  storageBucket: "fir-crud-1d431.firebasestorage.app",
  messagingSenderId: "53648875910",
  appId: "1:53648875910:web:02592f40c3fbbf61e98c07",
  measurementId: "G-WN88D874E8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function syncOfflineLicenseWithFirebase(licenseData, deviceId) {
  try {
    const docRef = doc(db, "licenses", licenseData.licenseKey);
    const docSnap = await getDoc(docRef);

    console.log("docSnap", docSnap);

    if (docSnap.exists()) {
      const serverData = docSnap.data();
      if (serverData.isActive === false) return { action: "revoke" };

      // Update last active status
      await updateDoc(docRef, { lastActive: serverTimestamp() });

      // Return the date found on the server so the main process can compare it
      return {
        action: "synced",
        serverExpiry: serverData.expiryDate,
      };
    }
    return { action: "not_found" };
  } catch (err) {
    return { action: "offline" };
  }
}

//new work

export async function verifyLicenseOnline(
  inputKey,
  deviceId,
  additionalInfo = {},
) {
  try {
    const cleanKey = inputKey.trim();
    const docRef = doc(db, "licenses", cleanKey);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("License key not found.");
    }

    const data = docSnap.data();

    // 🚨 1. ENFORCE THE APPROVAL CHECK RULE GUARD
    if (data.status === "Pending") {
      throw new Error(
        "Your onboarding request is still pending approval from administration.",
      );
    }
    if (data.status === "Blocked") {
      throw new Error(
        "This terminal license has been explicitly revoked or blocked.",
      );
    }

    // 2. Hardware Machine Lock Check
    if (data.deviceId && data.deviceId !== deviceId) {
      throw new Error(
        "License already active on another machine fingerprint layout.",
      );
    }

    const finalExpiry = additionalInfo.expiryDate || data.expiryDate;
    if (!finalExpiry) {
      throw new Error(
        "No license duration active or configured for this key registry.",
      );
    }

    // 3. Prepare activation payload using serializable values for your React dashboard
    const activationData = {
      ...data,
      activatedAt: data.activatedAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...additionalInfo,
    };

    await updateDoc(docRef, activationData);

    return {
      success: true,
      expiryDate: finalExpiry,
      licenseKey: cleanKey,
      status: "Active",
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function requestLicenseOnboarding(
  businessName,
  contactEmail,
  deviceId,
) {
  try {
    // 🌟 SHORT KEY GENERATION: Creates a unique, clean, 12-character short key
    const cleanDevice = deviceId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const shortHash = createHash("sha256")
      .update(cleanDevice)
      .digest("hex")
      .slice(0, 12)
      .toUpperCase();
    const generatedKey = `LIC-${shortHash}`; // Example: LIC-A1B2C3D4E5F6

    const docRef = doc(db, "licenses", generatedKey);
    const docSnap = await getDoc(docRef);

    // 🌟 DUPLICATE CHECK & ERROR HANDLER:
    if (docSnap.exists()) {
      const existingData = docSnap.data();
      const currentStatus = existingData.status;

      console.warn(
        `[ONBOARD REJECTED] Machine already exists. Status: ${currentStatus}`,
      );

      let userFriendlyMessage = "This device is already registered.";
      if (currentStatus === "Pending") {
        userFriendlyMessage =
          "Your registration request is still pending approval.";
      } else if (currentStatus === "Blocked") {
        userFriendlyMessage = "This device has been blocked from registering.";
      } else if (currentStatus === "Active") {
        userFriendlyMessage = "This device is already actively licensed.";
      }

      return {
        success: false,
        error: "ALREADY_REGISTERED",
        status: currentStatus,
        message: userFriendlyMessage,
      };
    }

    // 2. Only write a fresh document if this hardware has never touched your system before
    const initialRequestData = {
      businessName: businessName.trim(),
      contactEmail: contactEmail.trim(),
      deviceId: deviceId, // Kept raw device ID inside the document for debugging/admin views
      status: "Pending",
      platform: process.platform,
      requestedAt: new Date().toISOString(),
      expiryDate: "",
      type: "Restaurant",
    };

    await setDoc(docRef, initialRequestData);

    return {
      success: true,
      licenseKey: generatedKey,
      status: "Pending",
    };
  } catch (err) {
    console.error(
      "[ONBOARD EXCEPTION] Handshake validation failure:",
      err.message,
    );
    return { success: false, error: err.message };
  }
}

export async function checkRemoteLicenseStatus(licenseKey) {
  try {
    const docRef = doc(db, "licenses", licenseKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const serverData = docSnap.data();
      return {
        success: true,
        status: serverData.status || "Active", // "Active", "Pending", or "Blocked"
        serverExpiry: serverData.expiryDate || null,
      };
    }
    return { success: false, error: "not_found" };
  } catch (err) {
    return { success: false, error: "offline" };
  }
}
