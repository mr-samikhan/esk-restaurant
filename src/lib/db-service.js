// src/lib/db-service.js
const isElectron = window && window.process && window.process.type;
const electron = isElectron ? window.require("electron") : null;
const { ipcRenderer } = electron || {};

export const dbService = {
  // Auth
  login: async ({ username, password }) =>
    await ipcRenderer.invoke("auth-login", { username, password }),

  logout: async () => await ipcRenderer.invoke("auth-logout"),

  getSession: async () => await ipcRenderer.invoke("auth-get-session"),

  getUsers: async () => await ipcRenderer.invoke("auth-get-users"),

  createUser: async (data) =>
    await ipcRenderer.invoke("auth-create-user", data),

  updateUser: async (data) =>
    await ipcRenderer.invoke("auth-update-user", data),

  deleteUser: async (id) => await ipcRenderer.invoke("auth-delete-user", id),
  changePassword: async ({ id, old_password, new_password }) =>
    await ipcRenderer.invoke("auth-change-password", {
      id,
      old_password,
      new_password,
    }),
  resetPassword: async ({ username, newPassword }) =>
    await ipcRenderer.invoke("auth-reset-password", { username, newPassword }),
  //end of Auth
  // --- Backup & Cloud ---
  exportLocalBackup: async () => {
    return await ipcRenderer.invoke("db-backup-local");
  },

  importLocalBackup: async () => {
    return await ipcRenderer.invoke("db-restore-local");
  },

  uploadToCloud: async (endpointUrl) => {
    const buffer = await ipcRenderer.invoke("db-get-file-buffer");
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), `backup.db`);

    const response = await fetch(endpointUrl, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await ipcRenderer.invoke("db-update-sync-time");
      return true;
    }
    return false;
  },

  resetDatabase: async () => await ipcRenderer.invoke("db-reset-all"),

  getProducts: async () => {
    if (!ipcRenderer) return [];
    return await ipcRenderer.invoke("db-get-products");
  },

  createProduct: async (data) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-create-product", data);
  },

  // src/lib/db-service.js
  updateProduct: async (id, data) => {
    if (!ipcRenderer) return null;
    // Pass them as an object matching the { id, data: p } destructuring in main.mjs
    return await ipcRenderer.invoke("db-update-product", { id, data });
  },

  deleteProduct: async (id) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-delete-product", id);
  },

  // customers
  getCustomers: async () => {
    return await ipcRenderer.invoke("db-get-customers");
  },
  createCustomer: async (data) => {
    return await ipcRenderer.invoke("db-create-customer", data);
  },
  updateCustomer: async ({ id, data }) => {
    return await ipcRenderer.invoke("db-update-customer", { id, data });
  },
  deleteCustomer: async (id) => {
    return await ipcRenderer.invoke("db-delete-customer", id);
  },
  getCustomerLedger: async (id) =>
    await ipcRenderer.invoke("db-get-customer-ledger", id),
  getCustomerSales: async (id) =>
    await ipcRenderer.invoke("db-get-customer-sales", id),
  payCustomerDebt: async (payload) =>
    await ipcRenderer.invoke("db-pay-customer-debt", payload),
  deleteLedgerEntry: async (id) =>
    await ipcRenderer.invoke("db-delete-ledger-entry", id),
  reconcileCustomer: async (customerId) =>
    await ipcRenderer.invoke("db-reconcile-customer", customerId),

  //expenses
  getExpenses: async () => {
    return await ipcRenderer.invoke("db-get-expenses");
  },
  createExpense: async (data) => {
    return await ipcRenderer.invoke("db-create-expense", data);
  },
  updateExpense: async ({ id, data }) => {
    return await ipcRenderer.invoke("db-update-expense", { id, data });
  },
  deleteExpense: async (id) => {
    return await ipcRenderer.invoke("db-delete-expense", id);
  },

  //stock
  getStockMovements: async () => {
    return await ipcRenderer.invoke("db-get-stock-movements");
  },

  saveStockMovement: async (payload) => {
    return await ipcRenderer.invoke("db-save-stock-movement", payload);
  },

  //sales
  getSales: async () => await ipcRenderer.invoke("db-get-sales"),
  createSale: async (data) => await ipcRenderer.invoke("db-create-sale", data),
  updateSale: async (id, data) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-update-sale", { id, data });
  },
  deleteSale: async (id) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-delete-sale", id);
  },

  //print
  printReceipt: async (html) => {
    return await ipcRenderer.invoke("print-receipt", html);
  },

  //settings
  getSettings: async () => await ipcRenderer.invoke("db-get-settings"),
  updateSettings: async (settings) =>
    await ipcRenderer.invoke("db-update-settings", settings),

  //zakat
  getZakatHistory: async () => await ipcRenderer.invoke("db-get-zakat-history"),
  addZakatRecord: async (record) =>
    await ipcRenderer.invoke("db-add-zakat-record", record),

  //categories
  getCategories: async () => {
    if (!ipcRenderer) return [];
    return await ipcRenderer.invoke("db-get-categories");
  },

  createCategory: async (name) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-create-category", name);
  },

  updateCategory: async ({ id, name }) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-update-category", { id, name });
  },

  deleteCategory: async (id) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-delete-category", id);
  },

  updateCategory: async ({ id, name }) => {
    if (!ipcRenderer) return null;
    // This sends ONE object containing both 'id' and 'name'
    return await ipcRenderer.invoke("db-update-category", { id, name });
  },

  getProductByBarcode: async (barcode) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-get-product-by-barcode", barcode);
  },

  // Inside dbService object
  getTraders: async () => await ipcRenderer.invoke("db-get-traders"),
  createTrader: async (data) =>
    await ipcRenderer.invoke("db-create-trader", data),
  updateTrader: async ({ id, data }) =>
    await ipcRenderer.invoke("db-update-trader", { id, data }),

  deleteTrader: async (id) => await ipcRenderer.invoke("db-delete-trader", id),

  // --- Trader Transactions (Debits/Credits) ---
  addTraderTransaction: async ({ traderId, type, amount, description }) => {
    if (!ipcRenderer) return null;
    // This calls the db.transaction logic in your main.mjs
    return await ipcRenderer.invoke("db-add-trader-transaction", {
      traderId,
      type,
      amount,
      description,
    });
  },

  getTraderHistory: async (traderId) => {
    if (!ipcRenderer) return [];
    return await ipcRenderer.invoke("db-get-trader-history", traderId);
  },

  deleteTraderTransaction: async (payload) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-delete-trader-transaction", payload);
  },
  updateTraderTransaction: async (payload) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-update-trader-transaction", payload);
  },

  updateTrader: async ({ id, data }) => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("db-update-trader", { id, data });
  },

  // --- Reporting & Analytics ---
  getDetailedReports: async ({ range, startDate, endDate }) => {
    if (!ipcRenderer) {
      console.error("IPC Renderer not available");
      return {
        summary: {
          gross_sales: 0,
          total_kpra_tax: 0,
          net_sales: 0,
          total_orders: 0,
          avg_order_value: 0,
        },
        sales: [],
        paymentBreakdown: [],
        topSellingItems: [],
      };
    }

    try {
      const response = await ipcRenderer.invoke("db-get-detailed-reports", {
        range,
        startDate,
        endDate,
      });

      if (response?.success) {
        return response;
      }

      console.error("Report fetch error from backend:", response?.error);
      return {
        summary: {
          gross_sales: 0,
          total_kpra_tax: 0,
          net_sales: 0,
          total_orders: 0,
          avg_order_value: 0,
        },
        sales: [],
        paymentBreakdown: [],
        topSellingItems: [],
      };
    } catch (error) {
      console.error("Failed to invoke db-get-detailed-reports:", error);
      return {
        summary: {
          gross_sales: 0,
          total_kpra_tax: 0,
          net_sales: 0,
          total_orders: 0,
          avg_order_value: 0,
        },
        sales: [],
        paymentBreakdown: [],
        topSellingItems: [],
      };
    }
  },

  resetLicense: async () => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("reset-license");
  },
  getLicenseInfo: async () => {
    if (!ipcRenderer) return null;
    return await ipcRenderer.invoke("get-license-info");
  },

  // categories
  getCategories: () => ipcRenderer.invoke("db-get-categories"),
  createCategory: (name) => ipcRenderer.invoke("db-create-category", name),
  updateCategory: (data) => ipcRenderer.invoke("db-update-category", data),
  deleteCategory: (id) => ipcRenderer.invoke("db-delete-category", id),

  // items
  getItems: () => ipcRenderer.invoke("db-get-items"),
  getItemsByCategory: (id) =>
    ipcRenderer.invoke("db-get-items-by-category", id),
  createItem: (data) => ipcRenderer.invoke("db-create-item", data),
  updateItem: (id, data) => ipcRenderer.invoke("db-update-item", { id, data }),
  deleteItem: (id) => ipcRenderer.invoke("db-delete-item", id),

  // orders
  createOrder: (data) => ipcRenderer.invoke("db-create-order", data),
  getOrders: () => ipcRenderer.invoke("db-get-orders"),
  getOrderDetails: (id) => ipcRenderer.invoke("db-get-order-details", id),
  getActiveOrders: async () => await ipcRenderer.invoke("db-get-active-orders"),

  updateOrderStatus: async (orderId, status) =>
    await ipcRenderer.invoke("db-update-order-status", { orderId, status }),
  deleteOrder: async (orderId) =>
    await ipcRenderer.invoke("db-delete-order", orderId),

  getActiveOrderByTable: async (tableId) =>
    await ipcRenderer.invoke("db-get-active-order-by-table", tableId),

  getOrCreateOrder: async (tableId, tableName) =>
    await ipcRenderer.invoke("db-create-or-get-order", { tableId, tableName }),
  addItem: async (data) => await ipcRenderer.invoke("db-add-order-item", data),
  getItems: async (id) => await ipcRenderer.invoke("db-get-order-items", id),
  checkout: async (data) =>
    await ipcRenderer.invoke("db-checkout-order", { ...data }),
  clearCart: async (orderId) =>
    await ipcRenderer.invoke("db-clear-cart", orderId),

  getOrderItems: async (orderId) =>
    await ipcRenderer.invoke("db-get-order-items", orderId),

  updateOrderItemQty: async (payload) =>
    await ipcRenderer.invoke("db-update-order-item-qty", payload),

  deleteOrderItem: async (id) =>
    await ipcRenderer.invoke("db-delete-order-item", id),

  // invoices
  getInvoices: () => ipcRenderer.invoke("db-get-invoices"),

  getInvoice: (id) => ipcRenderer.invoke("db-get-invoice", id),

  //tables
  getTables: async () => await ipcRenderer.invoke("db-get-tables"),
  createTable: async (name) =>
    await ipcRenderer.invoke("db-create-table", name),
  updateTable: async (id, name) =>
    await ipcRenderer.invoke("db-update-table-name", { id, name }),
  updateTableStatus: async (id, status) =>
    await ipcRenderer.invoke("db-update-table-status", { id, status }),
  deleteTable: async (id) => await ipcRenderer.invoke("db-delete-table", id),
};
