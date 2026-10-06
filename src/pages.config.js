import Layout from "@/Layout";

import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Orders from "@/pages/Orders";
import Categories from "@/pages/Categories";
import MenuItems from "@/pages/MenuItems";
import Tables from "@/pages/Tables";
import Customers from "@/pages/Customers";
// import Kitchen from "@/pages/Kitchen";
import Invoices from "@/pages/Invoices";
import Settings from "@/pages/Settings";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";

export const pagesConfig = {
  Pages: {
    dashboard: Dashboard,
    Reports: Reports,
    POS: POS,
    Orders: Orders,
    Categories: Categories,
    MenuItems: MenuItems,
    Tables: Tables,
    Customers: Customers,
    Expenses: Expenses,
    // Kitchen: Kitchen,
    Invoices: Invoices,
    Users: Users,
    settings: Settings,
  },

  mainPage: "POS",

  Layout: Layout,
};
