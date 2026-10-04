// import path from "path";
// import { BrowserWindow, net } from "electron";

// import { isLicenseValid } from "../services/license.service.js";
// import { runBackgroundSync } from "../services/sync.service.js";

// const isDev = process.env.NODE_ENV === "development";

// export function createMainWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   });

//   const licenseURL = isDev
//     ? "http://localhost:3000/#/dashboard"
//     : `file://${path.join(process.cwd(), "dist/index.html")}#/dashboard`;

//   if (!isLicenseValid()) {
//     win.loadURL(licenseURL);
//   } else {
//     if (isDev) {
//       win.loadURL("http://localhost:3000");
//     } else {
//       win.loadFile(path.join(process.cwd(), "dist/index.html"));
//     }

//     win.webContents.once("did-finish-load", () => {
//       setTimeout(() => runBackgroundSync(win), 2000);
//     });

//     win.on("focus", () => {
//       if (net.isOnline()) {
//         runBackgroundSync(win);
//       }
//     });
//   }

//   return win;
// }

// import path from "path";
// import { app, BrowserWindow, net } from "electron";

// import { isLicenseValid } from "../services/license.service.js";
// import { runBackgroundSync } from "../services/sync.service.js";

// const isDev = process.env.NODE_ENV === "development";

// export function createMainWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//       webSecurity: false, // Helps bypass local file restrictions on production builds
//     },
//   });

//   const distIndexPath = path.join(app.getAppPath(), "dist", "index.html");

//   if (!isLicenseValid()) {
//     if (isDev) {
//       win.loadURL("http://localhost:3000/#/dashboard");
//     } else {
//       // ✅ Correct way to load local file with HashRouter route
//       win.loadFile(distIndexPath, { hash: "/dashboard" });
//     }
//   } else {
//     if (isDev) {
//       win.loadURL("http://localhost:3000");
//     } else {
//       // ✅ Loads main app cleanly
//       win.loadFile(distIndexPath);
//     }

//     win.webContents.once("did-finish-load", () => {
//       setTimeout(() => runBackgroundSync(win), 2000);
//     });

//     win.on("focus", () => {
//       if (net.isOnline()) {
//         runBackgroundSync(win);
//       }
//     });
//   }

//   return win;
// }

// *************************************
import path from "path";
import { app, BrowserWindow, net, ipcMain } from "electron";

import {
  isLicenseValid,
  runBackgroundSync,
} from "../services/license.service.js";
// import { runBackgroundSync } from "../services/sync.service.js";

const isDev = process.env.NODE_ENV === "development";

export function createMainWindow() {
  const distIndexPath = path.join(app.getAppPath(), "dist", "index.html");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: process.env.NODE_ENV === "development",
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      preload: path.join(app.getAppPath(), "preload.mjs"),
    },
  });

  const loadLicensePage = () => {
    if (isDev) {
      win.loadURL("http://localhost:3000/#/license");
    } else {
      win.loadFile(distIndexPath, { hash: "/license" });
    }
  };

  // 🚨 IPC LISTENER FOR LIVE ONBOARDING HANDSHAKES
  ipcMain.handle("trigger-license-verification-sync", async () => {
    console.log(
      "[IPC MAIN] Activation event captured from React frontend. Syncing...",
    );
    if (net.isOnline()) {
      await runBackgroundSync(win);
      return { success: true };
    }
    return {
      success: false,
      error: "Offline validation unavailable. Check network.",
    };
  });

  // 1. INITIAL LOCAL CHECK RUN AT PROJECT LAUNCH
  if (!isLicenseValid()) {
    loadLicensePage();
  } else {
    // Load Core App content
    if (isDev) {
      win.loadURL("http://localhost:3000/#/dashboard");
    } else {
      win.loadFile(distIndexPath);
    }

    win.webContents.once("did-finish-load", () => {
      setTimeout(() => runBackgroundSync(win), 2000);
    });

    // BACKGROUND SYNC ON INITIAL APPLICATION LOAD & FOCUS
    win.on("focus", () => {
      if (net.isOnline()) {
        runBackgroundSync(win);
      }
    });
  }

  // 2. RUNTIME MONITOR INTERRUPT LIFECYCLE (Enforces route locks dynamically)
  const licenseCheckInterval = setInterval(() => {
    const currentUrl = win.getURL();

    // Prevent loop from overriding while user is on the license page
    if (currentUrl.includes("#/license") || currentUrl.includes("/license")) {
      return;
    }

    if (!isLicenseValid()) {
      console.log(
        "[MONITOR LOCKOUT] Local validation failure. Revoking environment space access...",
      );
      loadLicensePage();
    }
  }, 30000);

  // Clean up listeners & interval memory leaks on window close
  win.on("closed", () => {
    clearInterval(licenseCheckInterval);
    ipcMain.removeHandler("trigger-license-verification-sync");
  });

  return win;
}
