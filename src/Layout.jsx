// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { createPageUrl } from "./utils";
// import { dbService } from "@/lib/db-service";
// import { translations } from "@/lib/translations";
// import {
//   LayoutDashboard,
//   Package,
//   ShoppingCart,
//   Users,
//   Receipt,
//   Warehouse,
//   LogOut,
//   PanelLeft,
//   Settings,
//   ShoppingBag,
//   HeartHandshake,
//   SunMedium,
//   ClipboardList,
//   UtensilsCrossed,
//   ShoppingBasket,
//   ChefHat,
//   Table2,
//   PackageCheck,
//   Users2,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { useAuth } from "@/lib/AuthContext";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { useConfirm } from "./hooks/useConfirm";
// import { ConfirmDialog } from "./components/pos/ConfirmDialog";

// export default function Layout({ children, currentPageName }) {
//   // ── Auth ──────────────────────────────────────────────────
//   const { logout, user } = useAuth();

//   const { confirm, state, handleConfirm, handleCancel } = useConfirm();

//   // ── UI state ─────────────────────────────────────────────
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [showLogoutDialog, setShowLogoutDialog] = useState(false);
//   const [viewMode, setViewMode] = useState(
//     () => localStorage.getItem("pos_view_mode") || "sidebar",
//   );

//   // Check if current page is POS to adjust layouts accordingly
//   const isPosPage = currentPageName?.toLowerCase() === "pos";

//   // ── App settings ─────────────────────────────────────────
//   const [appSettings, setAppSettings] = useState({
//     app_name: "SwiftPOS",
//     language: "en",
//   });

//   useEffect(() => {
//     dbService.getSettings().then((data) => {
//       if (data) setAppSettings(data);
//     });
//     localStorage.setItem("pos_view_mode", viewMode);
//   }, [viewMode, currentPageName]);

//   // ── Translations ─────────────────────────────────────────
//   const t = translations[appSettings.language] || translations.en;
//   const isRtl = t.dir === "rtl";

//   // ── User display ─────────────────────────────────────────
//   const displayName = user?.full_name || user?.username || "User";
//   const initials = displayName
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   // ── Nav items ─────────────────────────────────────────────
//   const navItems = [
//     { name: t.dashboard, page: "Dashboard", icon: LayoutDashboard },
//     { name: t.reports || "Reports", page: "Reports", icon: LayoutDashboard },
//     { name: t.pos, page: "POS", icon: ShoppingBasket },
//     { name: t.orders, page: "Orders", icon: ClipboardList },
//     { name: t.menu_categories, page: "Categories", icon: UtensilsCrossed },
//     { name: t.menu_items, page: "MenuItems", icon: ChefHat },
//     { name: t.tables, page: "Tables", icon: Table2 },
//     { name: t.invoices, page: "Invoices", icon: Receipt },
//     { name: t.customers, page: "Customers", icon: Users },
//     { name: t.users || "Users", page: "Users", icon: Users2 },
//     { name: t.settings, page: "Settings", icon: Settings },
//   ];

//   if (currentPageName === "Login") return <>{children}</>;

//   if (viewMode === "grid") {
//     return (
//       <div className="h-screen overflow-hidden bg-slate-100" dir={t.dir}>
//         {/* TOP HEADER */}
//         <header className="h-16 border-b bg-slate-900 px-6 flex items-center justify-between shadow-lg flex-shrink-0 gap-4">
//           <div
//             className={`flex items-center gap-3 min-w-0 max-w-[280px] lg:max-w-[360px] ${
//               isRtl ? "flex-row-reverse" : ""
//             }`}
//           >
//             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
//               <ShoppingBag className="w-5 h-5 text-white" />
//             </div>
//             <div className="min-w-0 flex-1">
//               <h1
//                 className="text-lg font-black tracking-wide text-white truncate leading-tight"
//                 title={appSettings.app_name}
//               >
//                 {appSettings.app_name}
//               </h1>
//               <p className="text-[11px] text-slate-400 truncate">
//                 Point Of Sale Workspace
//               </p>
//             </div>
//           </div>

//           <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
//             {navItems.map((item) => (
//               <Link
//                 key={item.page}
//                 to={createPageUrl(item.page)}
//                 className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
//                   currentPageName?.toLowerCase() === item.page?.toLowerCase()
//                     ? "bg-indigo-600 text-white shadow-lg"
//                     : "text-slate-300 hover:bg-slate-800 hover:text-white"
//                 }`}
//               >
//                 <item.icon className="w-4 h-4 flex-shrink-0" />
//                 {item.name}
//               </Link>
//             ))}
//           </div>

//           <div
//             className={`flex items-center gap-3 flex-shrink-0 ${
//               isRtl ? "flex-row-reverse" : ""
//             }`}
//           >
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setViewMode("sidebar")}
//               className="text-slate-300 hover:bg-slate-800 hover:text-white"
//             >
//               <PanelLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
//             </Button>

//             <Button
//               onClick={() =>
//                 confirm({
//                   open: true,
//                   title: t.logout_confirm_title || "Sign out?",
//                   description: t.logout_confirm_desc
//                     ? t.logout_confirm_desc.replace("{name}", displayName)
//                     : `You are signed in as "${displayName}".`,
//                   confirmLabel: "Logout",
//                   confirmVariant: "destructive",
//                 })
//               }
//               className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
//             >
//               <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
//               <span className="whitespace-nowrap">{t.logout || "Logout"}</span>
//             </Button>
//           </div>
//         </header>

//         {/* BODY */}
//         <div className="h-[calc(100vh-64px)] overflow-hidden flex">
//           <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3 overflow-y-auto flex-shrink-0">
//             {navItems.map((item) => (
//               <Link
//                 key={item.page}
//                 to={createPageUrl(item.page)}
//                 title={item.name}
//                 className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
//                   currentPageName.toLowerCase() === item.page.toLowerCase()
//                     ? "bg-indigo-600 text-white shadow-lg"
//                     : "text-slate-400 hover:bg-slate-800 hover:text-white"
//                 }`}
//               >
//                 <item.icon className="w-5 h-5" />
//               </Link>
//             ))}
//           </aside>

//           <main
//             className={`flex-1 bg-slate-100 ${
//               isPosPage ? "p-0 h-full overflow-hidden" : "p-4 overflow-auto"
//             }`}
//           >
//             <div className={isPosPage ? "h-full" : "max-w-[1800px] mx-auto"}>
//               {children}
//             </div>
//           </main>
//         </div>

//         <ConfirmDialog
//           state={state}
//           onConfirm={() => {
//             logout();
//             handleConfirm();
//           }}
//           onCancel={handleCancel}
//         />
//       </div>
//     );
//   }

//   // ── SIDEBAR MODE ──────────────────────────────────────────
//   return (
//     <div
//       className="h-screen max-h-screen overflow-hidden bg-slate-50 flex"
//       dir={t.dir}
//     >
//       {/* Sidebar */}
//       <aside
//         className={`fixed inset-y-0 z-50 bg-slate-900 transition-all duration-300 ${
//           sidebarOpen ? "w-64" : "w-20"
//         } hidden lg:flex flex-col ${isRtl ? "right-0" : "left-0"}`}
//       >
//         <div
//           className={`flex items-center gap-3 px-5 h-16 border-b border-slate-800/50 ${
//             isRtl ? "flex-row-reverse" : ""
//           }`}
//         >
//           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
//             <ShoppingBag className="w-5 h-5 text-white" />
//           </div>
//           {sidebarOpen && (
//             <span
//               className="text-base font-bold text-white truncate min-w-0 flex-1"
//               title={appSettings.app_name}
//             >
//               {appSettings.app_name}
//             </span>
//           )}
//         </div>

//         <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//           {navItems.map((item) => (
//             <Link
//               key={item.page}
//               to={createPageUrl(item.page)}
//               title={!sidebarOpen ? item.name : undefined}
//               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
//                 isRtl ? "flex-row-reverse text-right" : ""
//               } ${
//                 currentPageName === item.page
//                   ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
//                   : "text-slate-400 hover:text-white hover:bg-slate-800"
//               }`}
//             >
//               <item.icon className="w-5 h-5 flex-shrink-0" />
//               {sidebarOpen && (
//                 <span className="truncate min-w-0">{item.name}</span>
//               )}
//             </Link>
//           ))}
//         </nav>

//         <div
//           className={`p-4 border-t border-slate-800 flex items-center gap-3 ${
//             isRtl ? "flex-row-reverse" : ""
//           }`}
//         >
//           <Avatar className="h-8 w-8 flex-shrink-0">
//             <AvatarFallback className="bg-slate-700 text-white text-xs">
//               {initials}
//             </AvatarFallback>
//           </Avatar>
//           {sidebarOpen && (
//             <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : ""}`}>
//               <p className="text-white text-xs font-medium truncate">
//                 {displayName}
//               </p>
//               <p className="text-slate-500 text-[10px] truncate capitalize">
//                 {user?.role ?? "user"}
//               </p>
//             </div>
//           )}
//         </div>
//       </aside>

//       {/* Main content area */}
//       <div
//         className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
//           isRtl
//             ? sidebarOpen
//               ? "lg:mr-64"
//               : "lg:mr-20"
//             : sidebarOpen
//               ? "lg:ml-64"
//               : "lg:ml-20"
//         }`}
//       >
//         {/* Top header */}
//         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-40 gap-4">
//           <div
//             className={`flex items-center gap-4 min-w-0 ${
//               isRtl ? "flex-row-reverse" : ""
//             }`}
//           >
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="flex-shrink-0"
//               title={
//                 sidebarOpen
//                   ? (t.collapse_sidebar ?? "Collapse")
//                   : (t.expand_sidebar ?? "Expand")
//               }
//             >
//               <PanelLeft
//                 className={`w-5 h-5 text-slate-500 ${isRtl ? "rotate-180" : ""}`}
//               />
//             </Button>
//             <h2
//               className="font-semibold text-slate-800 truncate"
//               title={`${t.welcome}, ${displayName}`}
//             >
//               {t.welcome}, {displayName}
//             </h2>
//           </div>

//           <div
//             className={`flex items-center gap-3 flex-shrink-0 ${
//               isRtl ? "flex-row-reverse" : ""
//             }`}
//           >
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setViewMode("grid")}
//               title={t.grid_view ?? "Grid view"}
//             >
//               <Settings className="w-5 h-5 text-slate-500" />
//             </Button>

//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() =>
//                 confirm({
//                   open: true,
//                   title: t.logout_confirm_title ?? "Sign out?",
//                   description: t.logout_confirm_desc
//                     ? t.logout_confirm_desc.replace("{name}", displayName)
//                     : `You are signed in as "${displayName}".`,
//                   confirmLabel: "Yes",
//                   confirmVariant: "destructive",
//                 })
//               }
//               className="text-red-500 hover:bg-red-50"
//             >
//               <LogOut
//                 className={`w-4 h-4 flex-shrink-0 ${isRtl ? "ml-2" : "mr-2"}`}
//               />
//               <span className="whitespace-nowrap">
//                 {t.logout ?? "Sign Out"}
//               </span>
//             </Button>
//           </div>
//         </header>

//         {/* MAIN BODY - Padding removed for POS, overflow hidden */}
//         <main
//           className={`flex-1 flex flex-col overflow-hidden ${
//             isPosPage ? "p-0" : "p-8 overflow-y-auto"
//           }`}
//         >
//           {children}
//         </main>
//       </div>

//       <ConfirmDialog
//         state={state}
//         onConfirm={() => {
//           logout();
//           handleConfirm();
//         }}
//         onCancel={handleCancel}
//       />
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import {
  LayoutDashboard,
  Users,
  Receipt,
  LogOut,
  PanelLeft,
  Settings,
  ShoppingBag,
  ClipboardList,
  UtensilsCrossed,
  ShoppingBasket,
  ChefHat,
  Table2,
  Users2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";

import { useConfirm } from "./hooks/useConfirm";
import { ConfirmDialog } from "./components/pos/ConfirmDialog";

export default function Layout({ children, currentPageName }) {
  // ── Auth ──────────────────────────────────────────────────
  const { logout, user } = useAuth();

  const { confirm, state, handleConfirm, handleCancel } = useConfirm();

  // ── UI state ─────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("pos_view_mode") || "sidebar",
  );

  // Check if current page is POS to adjust layouts accordingly
  const isPosPage = currentPageName?.toLowerCase() === "pos";

  // role
  const isAdmin = user?.role === "admin" || false;

  // ── App settings ─────────────────────────────────────────
  const [appSettings, setAppSettings] = useState({
    app_name: "ESK TECH",
    language: "en",
  });

  useEffect(() => {
    dbService.getSettings().then((data) => {
      if (data) setAppSettings(data);
    });
    localStorage.setItem("pos_view_mode", viewMode);
  }, [viewMode, currentPageName]);

  // ── Translations ─────────────────────────────────────────
  const t = translations[appSettings.language] || translations.en;
  const isRtl = t.dir === "rtl";

  // ── User display ─────────────────────────────────────────
  const displayName = user?.full_name || user?.username || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── All Nav items (for Sidebar) ───────────────────────────
  const allNavItems = [
    { name: t.dashboard, page: "Dashboard", icon: LayoutDashboard },
    { name: t.reports || "Reports", page: "Reports", icon: LayoutDashboard },
    { name: t.pos, page: "POS", icon: ShoppingBasket },
    { name: t.orders, page: "Orders", icon: ClipboardList },
    {
      name: t.menu_categories,
      page: "Categories",
      icon: UtensilsCrossed,
      adminOnly: true,
    },
    { name: t.menu_items, page: "MenuItems", icon: ChefHat, adminOnly: true },
    { name: t.tables, page: "Tables", icon: Table2 },
    { name: t.invoices, page: "Invoices", icon: Receipt },
    // { name: t.customers, page: "Customers", icon: Users },
    { name: t.expenses || "Expenses", page: "Expenses", icon: CreditCard },
    { name: t.users || "Users", page: "Users", icon: Users2, adminOnly: true },
    { name: t.settings, page: "Settings", icon: Settings, adminOnly: true },
  ];

  // Filter out admin-only pages if user is not an admin
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  // ── Top Bar Priority Nav items (Most Important Only) ─────
  const topBarPages = ["POS", "Orders", "Dashboard", "Invoices"];
  const topNavItems = navItems.filter((item) =>
    topBarPages.includes(item.page),
  );

  if (currentPageName === "Login") return <>{children}</>;

  if (viewMode === "grid") {
    return (
      <div className="h-screen overflow-hidden bg-slate-100" dir={t.dir}>
        {/* TOP HEADER */}
        <header className="h-16 border-b bg-slate-900 px-6 flex items-center justify-between shadow-lg flex-shrink-0 gap-4">
          <div
            className={`flex items-center gap-3 min-w-0 max-w-[280px] lg:max-w-[360px] ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-lg font-black tracking-wide text-white truncate leading-tight"
                title={appSettings.app_name}
              >
                {appSettings.app_name}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Point Of Sale Workspace
              </p>
            </div>
          </div>

          {/* Top Navbar showing only essential/primary links */}
          <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {topNavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  currentPageName?.toLowerCase() === item.page?.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </div>

          <div
            className={`flex items-center gap-3 flex-shrink-0 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("sidebar")}
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <PanelLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            </Button>

            <Button
              onClick={() =>
                confirm({
                  open: true,
                  title: t.logout_confirm_title || "Sign out?",
                  description: t.logout_confirm_desc
                    ? t.logout_confirm_desc.replace("{name}", displayName)
                    : `You are signed in as "${displayName}".`,
                  confirmLabel: "Logout",
                  confirmVariant: "destructive",
                })
              }
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="whitespace-nowrap">{t.logout || "Logout"}</span>
            </Button>
          </div>
        </header>

        {/* BODY */}
        <div className="h-[calc(100vh-64px)] overflow-hidden flex">
          {/* Sidebar displaying ALL items */}
          <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3 overflow-y-auto flex-shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                title={item.name}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  currentPageName?.toLowerCase() === item.page?.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </aside>

          <main
            className={`flex-1 bg-slate-100 ${
              isPosPage ? "p-0 h-full overflow-hidden" : "p-4 overflow-auto"
            }`}
          >
            <div className={isPosPage ? "h-full" : "max-w-[1800px] mx-auto"}>
              {children}
            </div>
          </main>
        </div>

        <ConfirmDialog
          state={state}
          onConfirm={() => {
            logout();
            handleConfirm();
          }}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // ── SIDEBAR MODE ──────────────────────────────────────────
  return (
    <div
      className="h-screen max-h-screen overflow-hidden bg-slate-50 flex"
      dir={t.dir}
    >
      {/* Sidebar displaying ALL items */}
      <aside
        className={`fixed inset-y-0 z-50 bg-slate-900 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } hidden lg:flex flex-col ${isRtl ? "right-0" : "left-0"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 h-16 border-b border-slate-800/50 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span
              className="text-base font-bold text-white truncate min-w-0 flex-1"
              title={appSettings.app_name}
            >
              {appSettings.app_name}
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              title={!sidebarOpen ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isRtl ? "flex-row-reverse text-right" : ""
              } ${
                currentPageName?.toLowerCase() === item.page?.toLowerCase()
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="truncate min-w-0">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        <div
          className={`p-4 border-t border-slate-800 flex items-center gap-3 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-slate-700 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : ""}`}>
              <p className="text-white text-xs font-medium truncate">
                {displayName}
              </p>
              <p className="text-slate-500 text-[10px] truncate capitalize">
                {user?.role ?? "user"}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
          isRtl
            ? sidebarOpen
              ? "lg:mr-64"
              : "lg:mr-20"
            : sidebarOpen
              ? "lg:ml-64"
              : "lg:ml-20"
        }`}
      >
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-40 gap-4">
          <div
            className={`flex items-center gap-4 min-w-0 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex-shrink-0"
              title={
                sidebarOpen
                  ? (t.collapse_sidebar ?? "Collapse")
                  : (t.expand_sidebar ?? "Expand")
              }
            >
              <PanelLeft
                className={`w-5 h-5 text-slate-500 ${isRtl ? "rotate-180" : ""}`}
              />
            </Button>
            <h2
              className="font-semibold text-slate-800 truncate"
              title={`${t.welcome}, ${displayName}`}
            >
              {t.welcome}, {displayName}
            </h2>
          </div>

          <div
            className={`flex items-center gap-3 flex-shrink-0 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              title={t.grid_view ?? "Grid view"}
            >
              <Settings className="w-5 h-5 text-slate-500" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                confirm({
                  open: true,
                  title: t.logout_confirm_title ?? "Sign out?",
                  description: t.logout_confirm_desc
                    ? t.logout_confirm_desc.replace("{name}", displayName)
                    : `You are signed in as "${displayName}".`,
                  confirmLabel: "Yes",
                  confirmVariant: "destructive",
                })
              }
              className="text-red-500 hover:bg-red-50"
            >
              <LogOut
                className={`w-4 h-4 flex-shrink-0 ${isRtl ? "ml-2" : "mr-2"}`}
              />
              <span className="whitespace-nowrap">
                {t.logout ?? "Sign Out"}
              </span>
            </Button>
          </div>
        </header>

        {/* MAIN BODY */}
        <main
          className={`flex-1 flex flex-col overflow-hidden ${
            isPosPage ? "p-0" : "p-8 overflow-y-auto"
          }`}
        >
          {children}
        </main>
      </div>

      <ConfirmDialog
        state={state}
        onConfirm={() => {
          logout();
          handleConfirm();
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}
