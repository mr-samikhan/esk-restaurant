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

import path from "path";
import { app, BrowserWindow, net } from "electron";

import { isLicenseValid } from "../services/license.service.js";
import { runBackgroundSync } from "../services/sync.service.js";

const isDev = process.env.NODE_ENV === "development";

export function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Helps bypass local file restrictions on production builds
    },
  });

  const distIndexPath = path.join(app.getAppPath(), "dist", "index.html");

  if (!isLicenseValid()) {
    if (isDev) {
      win.loadURL("http://localhost:3000/#/dashboard");
    } else {
      // ✅ Correct way to load local file with HashRouter route
      win.loadFile(distIndexPath, { hash: "/dashboard" });
    }
  } else {
    if (isDev) {
      win.loadURL("http://localhost:3000");
    } else {
      // ✅ Loads main app cleanly
      win.loadFile(distIndexPath);
    }

    win.webContents.once("did-finish-load", () => {
      setTimeout(() => runBackgroundSync(win), 2000);
    });

    win.on("focus", () => {
      if (net.isOnline()) {
        runBackgroundSync(win);
      }
    });
  }

  return win;
}
