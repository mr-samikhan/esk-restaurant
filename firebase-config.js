import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

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

/**
 * Validates a license key against Firestore
 * @param {string} inputKey - The license key entered by user
 * @param {string} deviceId - The current machine ID
 */

// export async function verifyLicenseOnline(
//   inputKey,
//   deviceId,
//   additionalInfo = {},
// ) {
//   try {
//     const cleanKey = inputKey.trim();
//     console.log("Searching for document at: licenses/" + cleanKey);

//     const docRef = doc(db, "licenses", cleanKey);
//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       // This logs if the document is missing
//       console.error("No document found with ID:", cleanKey);
//       throw new Error("License key not found.");
//     }

//     const data = docSnap.data();

//     // Prevent re-use on different machines
//     if (data.deviceId && data.deviceId !== deviceId) {
//       throw new Error("License already active on another machine.");
//     }

//     // Prepare data to save
//     const activationData = {
//       deviceId: deviceId,
//       activatedAt: data.activatedAt || serverTimestamp(), // Only set if empty
//       lastActive: serverTimestamp(),
//       platform: process.platform, // 'win32', 'darwin', etc.
//       ...additionalInfo, // Add any extra fields from your React UI
//     };

//     // Save/Update the client information in Firestore
//     await updateDoc(docRef, activationData);

//     return { success: true, expiryDate: data.expiryDate };
//   } catch (err) {
//     return { success: false, error: err.message };
//   }
// }

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

    // 1. Machine Lock Check
    if (data.deviceId && data.deviceId !== deviceId) {
      throw new Error("License already active on another machine.");
    }

    // 2. DATE PRIORITY FIX:
    // We prioritize additionalInfo.expiryDate (from UI) over data.expiryDate (from DB)
    const finalExpiry = additionalInfo.expiryDate || data.expiryDate;

    if (!finalExpiry) {
      throw new Error("No expiry date found in database or request.");
    }

    // 3. Prepare Update Data
    const activationData = {
      deviceId: deviceId,
      expiryDate: finalExpiry, // This saves the NEW date to Firebase
      activatedAt: data.activatedAt || serverTimestamp(),
      lastActive: serverTimestamp(),
      platform: process.platform,
      ...additionalInfo,
    };

    // 4. Save to Firestore
    await updateDoc(docRef, activationData);

    return {
      success: true,
      expiryDate: finalExpiry, // Return the NEW date to Main process
      licenseKey: cleanKey,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

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
