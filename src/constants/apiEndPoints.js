// src/lib/api.js
import { dbService } from "@/lib/db-service";

export const API = {
  categories: {
    getAll: () => dbService.getCategories(),
    create: (name) => dbService.createCategory(name),
    update: (id, name) => dbService.updateCategory({ id, name }),
    delete: (id) => dbService.deleteCategory(id),
  },
  items: {
    getAll: () => dbService.getItems(),
    getByCategory: (id) => dbService.getItemsByCategory(id),
    create: (data) => dbService.createItem(data),
    update: (id, data) => dbService.updateItem(id, data),
    delete: (id) => dbService.deleteItem(id),
  },

  orders: {
    getAll: () => dbService.getOrders(),
    createOrder: (data) => dbService.createOrder(data),
    getActive: async () => await dbService.getActiveOrders(),
    updateStatus: async (orderId, status) =>
      await dbService.updateOrderStatus(orderId, status),
    delete: async (orderId) => await dbService.deleteOrder(orderId),

    getActiveByTable: async (tableId) =>
      await dbService.getActiveOrderByTable(tableId),

    getOrCreate: async (tableId, tableName) =>
      await dbService.getOrCreateOrder(tableId, tableName),

    addItem: async (payload) => await dbService.addItem(payload),

    close: (orderId) => ipcRenderer.invoke("db-close-order", orderId),
    checkout: async (data) => await dbService.checkout(data),

    getItems: async (orderId) => await dbService.getOrderItems(orderId),
    getById: (id) => dbService.getOrderById(id),

    updateItemQty: async (payload) =>
      await dbService.updateOrderItemQty(payload),

    deleteItem: async (id) => await dbService.deleteOrderItem(id),

    clearCart: async (orderId) => {
      return await dbService.clearCart(orderId);
    },
  },

  tables: {
    getAll: () => dbService.getTables(),
    create: (name) => dbService.createTable(name),
    update: (id, name) => dbService.updateTable(id, name),
    updateStatus: (id, status) => dbService.updateTableStatus(id, status),
    delete: (id) => dbService.deleteTable(id),
    clearStatus: (id) => dbService.updateTableStatus(id, "available"),
  },
  print: {
    printReceipt: async (html) => await dbService.printReceipt(html),
  },
  invoices: {
    getAll: async () => await dbService.getInvoices(),
    getById: async (id) => await dbService.getInvoice(id),
    print: async (html) => await dbService.printReceipt(html),
  },
};
