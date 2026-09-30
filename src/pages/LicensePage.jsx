// import React, { useState, useEffect } from "react";
// import {
//   Key,
//   Monitor,
//   CheckCircle,
//   AlertCircle,
//   Copy,
//   RefreshCcw,
//   Clock,
//   Trash2,
//   FileUp,
//   Download,
//   RotateCcw,
//   Type,
//   Sparkles,
// } from "lucide-react";

// const electron = window.require ? window.require("electron") : null;
// const ipcRenderer = electron ? electron.ipcRenderer : null;

// const LicensePage = () => {
//   const [activeTab, setActiveTab] = useState("manual"); // 'manual' or 'upload'
//   const [deviceId, setDeviceId] = useState("Loading...");
//   const [licenseKey, setLicenseKey] = useState("");
//   const [status, setStatus] = useState({ type: "", message: "" });
//   const [testDays, setTestDays] = useState(30);

//   useEffect(() => {
//     if (ipcRenderer) ipcRenderer.invoke("get-device-id").then(setDeviceId);
//   }, []);

//   // --- ACTIONS ---
//   const handleRelaunch = () => ipcRenderer.invoke("relaunch-app");
//   const handleReset = () =>
//     ipcRenderer.invoke("reset-license").then(() => window.location.reload());

//   const handleTestGenerate = async () => {
//     const result = await ipcRenderer.invoke("generate-test-license", {
//       deviceId,
//       days: parseInt(testDays),
//     });
//     if (result.success) {
//       setLicenseKey(result.key);
//       const save = window.confirm(
//         "Key Generated! Do you want to export it as a .lic file?",
//       );
//       if (save)
//         await ipcRenderer.invoke("save-license-file", { key: result.key });
//     }
//   };

//   const handleFileUpload = async () => {
//     const result = await ipcRenderer.invoke("upload-license-file");
//     if (result.success) {
//       setStatus({ type: "success", message: "File uploaded! Relaunching..." });
//       setTimeout(handleRelaunch, 1500);
//     } else if (result.error)
//       setStatus({ type: "error", message: result.error });
//   };

//   const handleManualActivate = async () => {
//     const result = await ipcRenderer.invoke(
//       "activate-license",
//       licenseKey.trim(),
//     );
//     if (result.success) {
//       setStatus({ type: "success", message: "Activated! Relaunching..." });
//       setTimeout(handleRelaunch, 1000);
//     } else setStatus({ type: "error", message: "Invalid key." });
//   };

//   const handleCheckUpdates = async () => {
//     const result = await ipcRenderer.invoke("check-for-updates");
//     alert(result.message);
//   };

//   const handleRemoteActivate = async () => {
//     setIsActivating(true);

//     // Pass machine-specific or user-entered details
//     const clientData = {
//       clientName: "John Doe", // You can get this from an input field
//       appVersion: "1.0.4",
//     };

//     const result = await ipcRenderer.invoke(
//       "activate-online",
//       licenseKey,
//       clientData,
//     );

//     if (result.success) {
//       // ... success logic
//     }
//     setIsActivating(false);
//   };

//   return (
//     <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
//       {/* 1. TOP DEV TOOLS BAR */}
//       <div className="w-full max-w-md mb-4 bg-slate-900 rounded-xl p-3 flex justify-between items-center shadow-lg">
//         <div className="flex gap-3">
//           <button
//             onClick={handleRelaunch}
//             className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
//           >
//             <RotateCcw className="w-3 h-3" /> Relaunch
//           </button>
//           <button
//             onClick={handleReset}
//             className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
//           >
//             <Trash2 className="w-3 h-3" /> Reset App
//           </button>

//           {/* NEW: CHECK UPDATES BUTTON */}
//           <button
//             onClick={handleCheckUpdates}
//             className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter transition-colors"
//           >
//             <Sparkles className="w-3 h-3" /> Check Updates
//           </button>
//         </div>
//         <div className="flex items-center gap-2">
//           <input
//             type="number"
//             value={testDays}
//             onChange={(e) => setTestDays(e.target.value)}
//             className="w-12 bg-slate-800 border-none text-white text-[10px] rounded px-1"
//           />
//           <button
//             onClick={handleTestGenerate}
//             className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-indigo-500"
//           >
//             GENERATE TEST
//           </button>
//         </div>
//       </div>

//       <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
//         {/* Header */}
//         <div className="p-8 pb-4 text-center">
//           <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-indigo-200">
//             <Key className="text-white w-6 h-6" />
//           </div>
//           <h1 className="text-2xl font-black text-slate-800 tracking-tight">
//             Activation
//           </h1>
//           <p className="text-slate-400 text-xs mt-1">
//             Machine:{" "}
//             <span className="font-mono text-indigo-500">
//               {deviceId.slice(0, 12)}...
//             </span>
//           </p>
//         </div>

//         {/* 2. TAB NAVIGATION */}
//         <div className="flex px-8 gap-4 mb-6">
//           <button
//             onClick={() => setActiveTab("manual")}
//             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "manual" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
//           >
//             <Type className="w-4 h-4" /> Manual Key
//           </button>
//           <button
//             onClick={() => setActiveTab("upload")}
//             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "upload" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
//           >
//             <FileUp className="w-4 h-4" /> File Upload
//           </button>
//         </div>

//         {/* 3. TAB CONTENT */}
//         <div className="px-8 pb-8">
//           {activeTab === "manual" ? (
//             <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
//               <textarea
//                 rows="4"
//                 value={licenseKey}
//                 onChange={(e) => setLicenseKey(e.target.value)}
//                 placeholder="Paste your encrypted key here..."
//                 className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//               <button
//                 onClick={handleManualActivate}
//                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
//               >
//                 Verify & Activate
//               </button>
//             </div>
//           ) : (
//             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
//               <button
//                 onClick={handleFileUpload}
//                 className="w-full border-2 border-dashed border-slate-200 p-10 rounded-3xl flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 group transition-all"
//               >
//                 <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white transition-all shadow-sm">
//                   <FileUp className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
//                 </div>
//                 <div className="text-center">
//                   <p className="text-sm font-bold text-slate-700">
//                     Select .lic file
//                   </p>
//                   <p className="text-[10px] text-slate-400 mt-1">
//                     Browse your computer for the license
//                   </p>
//                 </div>
//               </button>
//             </div>
//           )}

//           {/* STATUS DISPLAY */}
//           {status.message && (
//             <div
//               className={`mt-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
//             >
//               {status.type === "success" ? (
//                 <CheckCircle className="w-4 h-4" />
//               ) : (
//                 <AlertCircle className="w-4 h-4" />
//               )}
//               {status.message}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LicensePage;

import React, { useState, useEffect } from "react";
import {
  Key,
  Monitor,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCcw,
  Clock,
  Trash2,
  FileUp,
  Download,
  RotateCcw,
  Type,
  Sparkles,
  Globe,
  // Globus,
} from "lucide-react";

const electron = window.require ? window.require("electron") : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const LicensePage = () => {
  const [activeTab, setActiveTab] = useState("manual");
  const [deviceId, setDeviceId] = useState("Loading...");
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [testDays, setTestDays] = useState(30);
  const [isActivating, setIsActivating] = useState(false); // Added loading state

  useEffect(() => {
    if (ipcRenderer) ipcRenderer.invoke("get-device-id").then(setDeviceId);
  }, []);

  const handleRelaunch = () => ipcRenderer.invoke("relaunch-app");
  const handleReset = () =>
    ipcRenderer.invoke("reset-license").then(() => window.location.reload());

  const handleManualActivate = async () => {
    if (!licenseKey.trim()) return;
    setStatus({ type: "", message: "" });
    const result = await ipcRenderer.invoke(
      "activate-license",
      licenseKey.trim(),
    );
    if (result.success) {
      setStatus({ type: "success", message: "Activated! Relaunching..." });
      setTimeout(handleRelaunch, 1000);
    } else setStatus({ type: "error", message: "Invalid offline key." });
  };

  // --- NEW FIREBASE ONLINE ACTIVATION ---
  const handleRemoteActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsActivating(true);
    setStatus({ type: "", message: "" });

    // 1. Calculate the dynamic expiry date based on testDays state
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(testDays));
    const dynamicExpiryString = expiry.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    const clientData = {
      platform: window.navigator.platform,
      activatedAt: new Date().toISOString(),
      expiryDate: dynamicExpiryString, // Now uses the input field value
    };

    try {
      const result = await ipcRenderer.invoke(
        "activate-online",
        licenseKey.trim(),
        clientData,
      );

      if (result.success) {
        setStatus({
          type: "success",
          message: `Activated for ${testDays} days! Relaunching...`,
        });
        setTimeout(handleRelaunch, 1500);
      } else {
        setStatus({
          type: "error",
          message: result.error || "Online verification failed.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Connection error. Check your internet.",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      {/* DEV TOOLS BAR */}
      <div className="w-full max-w-md mb-4 bg-slate-900 rounded-xl p-3 flex justify-between items-center shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={handleRelaunch}
            className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
          >
            <RotateCcw className="w-3 h-3" /> Relaunch
          </button>
          <button
            onClick={handleReset}
            className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={() =>
              ipcRenderer
                .invoke("check-for-updates")
                .then((res) => alert(res.message))
            }
            className="text-amber-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
          >
            <Sparkles className="w-3 h-3" /> Updates
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={testDays}
            onChange={(e) => setTestDays(e.target.value)}
            className="w-10 bg-slate-800 text-white text-[10px] rounded px-1"
          />
          <button
            onClick={async () => {
              const res = await ipcRenderer.invoke("generate-test-license", {
                deviceId,
                days: parseInt(testDays),
              });
              if (res.success) {
                setLicenseKey(res.key);
                alert("Offline Key Generated!");
              }
            }}
            className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold"
          >
            GEN TEST
          </button>
        </div>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 pb-4 text-center">
          <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg">
            <Key className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Activation
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Machine ID:{" "}
            <span className="font-mono text-indigo-500">
              {deviceId.slice(0, 15)}...
            </span>
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex px-8 gap-4 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "manual" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
          >
            <Type className="w-4 h-4" /> Manual / Online
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "upload" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
          >
            <FileUp className="w-4 h-4" /> File Upload
          </button>
        </div>

        <div className="px-8 pb-8">
          {activeTab === "manual" ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
              <textarea
                rows="3"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Enter License Key..."
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRemoteActivate}
                  disabled={isActivating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isActivating ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Activate Online (Firebase)
                </button>

                <button
                  onClick={handleManualActivate}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-xs transition-all"
                >
                  Verify Offline Key
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() =>
                  ipcRenderer
                    .invoke("upload-license-file")
                    .then((res) => res.success && handleRelaunch())
                }
                className="w-full border-2 border-dashed border-slate-200 p-10 rounded-3xl flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 group transition-all"
              >
                <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white shadow-sm">
                  <FileUp className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    Select .lic file
                  </p>
                </div>
              </button>
            </div>
          )}

          {status.message && (
            <div
              className={`mt-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            >
              {status.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicensePage;
