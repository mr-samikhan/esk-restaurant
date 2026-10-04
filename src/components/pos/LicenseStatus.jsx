// import React, { useState, useEffect } from "react";
// import { dbService } from "@/lib/db-service";

// const LicenseStatus = () => {
//   const [daysRemaining, setDaysRemaining] = useState(null);

//   useEffect(() => {
//     const fetchExpiry = async () => {
//       const info = await dbService.getLicenseInfo();
//       if (info && info.expiryDate) {
//         const expiry = new Date(info.expiryDate);
//         const now = new Date();

//         // Calculate difference in milliseconds
//         const diffInMs = expiry - now;

//         // Convert to days and round up
//         const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
//         setDaysRemaining(days > 0 ? days : 0);
//       }
//     };
//     fetchExpiry();
//   }, []);

//   return (
//     <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
//       <h3 className="text-sm font-semibold text-slate-500">License Status</h3>
//       <div className="mt-2 flex items-baseline gap-2">
//         <span
//           className={`text-2xl font-bold ${daysRemaining < 7 ? "text-red-500" : "text-indigo-600"}`}
//         >
//           {daysRemaining !== null ? daysRemaining : "--"}
//         </span>
//         <span className="text-slate-400 text-sm">days remaining</span>
//       </div>
//       {daysRemaining < 7 && (
//         <p className="text-[10px] text-red-400 mt-1 font-medium italic">
//           * License expiring soon. Please contact support.
//         </p>
//       )}
//     </div>
//   );
// };

// export default LicenseStatus;

import React, { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";
import { useNavigate } from "react-router-dom";

// Access Electron's IPC safely
const electron = window.require ? window.require("electron") : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const LicenseStatus = () => {
  const navigate = useNavigate();
  const [daysRemaining, setDaysRemaining] = useState(null);

  // Helper function to calculate days
  const calculateDays = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInMs = expiry - now;
    const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    // 1. Initial Fetch on Load
    const fetchExpiry = async () => {
      const info = await dbService.getLicenseInfo();
      console.log("info", info);
      if (info && info.expiryDate) {
        setDaysRemaining(calculateDays(info.expiryDate));
      }

      if (info?.status === "Blocked") {
        navigate("/license");
      }
    };
    fetchExpiry();

    // 2. Listen for background updates from Main Process
    if (ipcRenderer) {
      const handleUpdate = (event, data) => {
        console.log("License updated from background sync:", data.expiryDate);
        setDaysRemaining(calculateDays(data.expiryDate));
      };

      ipcRenderer.on("license-updated", handleUpdate);

      // Cleanup listener on unmount
      return () => {
        ipcRenderer.removeListener("license-updated", handleUpdate);
      };
    }
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-slate-500">License Status</h3>
        {/* Optional: Online indicator */}
        <div
          className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
          title="Synced with Cloud"
        />
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold transition-colors duration-500 ${
            daysRemaining !== null && daysRemaining < 7
              ? "text-red-500"
              : "text-indigo-600"
          }`}
        >
          {daysRemaining !== null ? daysRemaining : "--"}
        </span>
        <span className="text-slate-400 text-sm">days remaining</span>
      </div>

      {daysRemaining !== null && daysRemaining < 7 && (
        <p className="text-[10px] text-red-500 mt-1 font-bold animate-bounce">
          {daysRemaining === 0 ? "EXPIRED" : "* Expiring soon. Please renew."}
        </p>
      )}
    </div>
  );
};

export default LicenseStatus;
