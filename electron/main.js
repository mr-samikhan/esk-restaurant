import { app } from "electron";
import dotenv from "dotenv";

import { initDatabase } from "./db/index.js";
import { registerAuthHandlers } from "./handlers/auth.handlers.js";
import { registerLicenseHandlers } from "./handlers/license.handlers.js";
import { registerDbHandlers } from "./handlers/db.handlers.js";
import { registerSettingsHandlers } from "./handlers/settings.handlers.js";
import { registerPrinterHandlers } from "./handlers/printer.handlers.js";
import { registerUpdaterHandlers } from "./handlers/updater.handlers.js";
//new
import { registerCategoryHandlers } from "./handlers/categories.handler.js";
import { registerMenuItemHandlers } from "./handlers/menuItems.handler.js";
import { tableHandlers } from "./handlers/table.handlers.js";
import { invoiceHanlders } from "./handlers/invoices.handlers.js";

import { orderHandlers } from "./handlers/orders.handler.js";

import { createMainWindow } from "./windows/mainWindow.js";

dotenv.config();

app.whenReady().then(() => {
  initDatabase();

  registerAuthHandlers();
  registerLicenseHandlers();
  registerDbHandlers();
  registerSettingsHandlers();
  registerPrinterHandlers();
  registerUpdaterHandlers();

  //new
  registerCategoryHandlers();
  registerMenuItemHandlers();
  orderHandlers();
  tableHandlers();
  invoiceHanlders();

  createMainWindow();
});
