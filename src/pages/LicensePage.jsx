// import React, { useState, useEffect } from "react";
// import {
//   Key,
//   RotateCcw,
//   Trash2,
//   Sparkles,
//   Globe,
//   FileUp,
//   Building,
//   Mail,
//   UserCheck,
//   AlertCircle,
//   CheckCircle,
//   RefreshCcw,
// } from "lucide-react";

// const electron = window.require ? window.require("electron") : null;
// const ipcRenderer = electron ? electron.ipcRenderer : null;

// const LicensePage = () => {
//   const [activeTab, setActiveTab] = useState("onboard"); // Default to Request Onboarding
//   const [deviceId, setDeviceId] = useState("Loading...");
//   const [status, setStatus] = useState({ type: "", message: "" });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Form Input States for Registration Onboarding
//   const [businessName, setBusinessName] = useState("");
//   const [contactEmail, setContactEmail] = useState("");
//   const [licenseKey, setLicenseKey] = useState("");

//   // Dev Tools State Tracking
//   const [testDays, setTestDays] = useState(30);

//   useEffect(() => {
//     if (ipcRenderer) ipcRenderer.invoke("get-device-id").then(setDeviceId);
//   }, []);

//   const handleRelaunch = () => ipcRenderer?.invoke("relaunch-app");
//   const handleReset = () =>
//     ipcRenderer?.invoke("reset-license").then(() => window.location.reload());

//   // 1. SUBMIT FRESH ONBOARDING REQUEST TO FIRESTORE
//   const handleOnboardRequest = async (e) => {
//     e.preventDefault();
//     if (!businessName.trim() || !contactEmail.trim()) {
//       setStatus({
//         type: "error",
//         message: "Please fill out all onboarding details.",
//       });
//       return;
//     }

//     setIsSubmitting(true);
//     setStatus({ type: "", message: "" });

//     try {
//       // Invokes our new self-registration logic sequence in electron main process
//       const result = await ipcRenderer.invoke("request-license-onboarding", {
//         businessName: businessName.trim(),
//         contactEmail: contactEmail.trim(),
//         deviceId: deviceId,
//       });

//       if (result.success) {
//         setLicenseKey(result.licenseKey); // Auto-populate their assigned key string
//         setStatus({
//           type: "success",
//           message: `Request Sent! Key: ${result.licenseKey}. Share this key with your Admin for instant activation.`,
//         });
//         setActiveTab("activate"); // Shift view panel cleanly over onto validation tab
//       } else {
//         setStatus({
//           type: "error",
//           message: result.error || "Onboarding pipeline dropped.",
//         });
//       }
//     } catch (err) {
//       setStatus({
//         type: "error",
//         message: "Network connection loss. Cloud Firestore unreachable.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // 2. VERIFY IF ADMIN HAS APPROVED THE REQUEST FROM DASHBOARD
//   const handleRemoteActivate = async () => {
//     if (!licenseKey.trim()) return;
//     setIsSubmitting(true);
//     setStatus({ type: "", message: "" });

//     try {
//       // 🚨 FIX: Package arguments into a single payload object structure
//       const result = await ipcRenderer.invoke("activate-online", {
//         licenseKey: licenseKey.trim(),
//         clientData: {
//           deviceId: deviceId, // 🌟 This provides the missing hardware identification data
//           platform: window.navigator.platform,
//           activatedAt: new Date().toISOString(),
//         },
//       });

//       if (result.success) {
//         setStatus({
//           type: "success",
//           message: "Terminal Approved! Informing core engine...",
//         });

//         // Notify the main process to verify the newly written file and redirect
//         await ipcRenderer.invoke("trigger-license-verification-sync");
//       } else {
//         setStatus({
//           type: "error",
//           message:
//             result.error ||
//             "Verification rejected. Waiting for Admin approval.",
//         });
//       }
//     } catch (err) {
//       setStatus({
//         type: "error",
//         message: "Sync breakdown. Please verify internet access.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
//       {/* DEV TOOLS BAR */}
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
//             <Trash2 className="w-3 h-3" /> Reset
//           </button>
//           <button
//             onClick={() =>
//               ipcRenderer
//                 ?.invoke("check-for-updates")
//                 .then((res) => alert(res.message))
//             }
//             className="text-amber-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter"
//           >
//             <Sparkles className="w-3 h-3" /> Updates
//           </button>
//         </div>
//         {/* <div className="flex items-center gap-2">
//           <input
//             type="number"
//             value={testDays}
//             onChange={(e) => setTestDays(e.target.value)}
//             className="w-10 bg-slate-800 text-white text-[10px] rounded px-1"
//           />
//           <button
//             onClick={async () => {
//               const res = await ipcRenderer.invoke("generate-test-license", {
//                 deviceId,
//                 days: parseInt(testDays),
//               });
//               if (res.success) {
//                 setLicenseKey(res.key);
//                 alert("Offline Key Generated!");
//               }
//             }}
//             className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold"
//           >
//             GEN TEST
//           </button>
//         </div> */}
//       </div>

//       {/* CORE INTERFACE BOX */}
//       <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
//         <div className="p-8 pb-4 text-center">
//           <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg">
//             <Key className="text-white w-6 h-6" />
//           </div>
//           <h1 className="text-2xl font-black text-slate-800 tracking-tight">
//             POS Handshake Activation
//           </h1>
//           <p className="text-slate-400 text-xs mt-1">
//             Machine Fingerprint ID:{" "}
//             <span className="font-mono text-indigo-500">
//               {deviceId.slice(0, 18)}...
//             </span>
//           </p>
//         </div>

//         {/* WORKSPACE TAB SWITCH NAVIGATION BAR */}
//         <div className="flex px-8 gap-4 mb-4">
//           <button
//             onClick={() => setActiveTab("onboard")}
//             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "onboard" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
//           >
//             <Building className="w-4 h-4" /> 1. Onboard Request
//           </button>
//           <button
//             onClick={() => setActiveTab("activate")}
//             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "activate" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
//           >
//             <UserCheck className="w-4 h-4" /> 2. Verify Online
//           </button>
//         </div>

//         <div className="px-8 pb-8">
//           {/* DYNAMIC OPERATION NOTIFICATION STRIP */}
//           {status.message && (
//             <div
//               className={`p-3.5 mb-4 rounded-xl text-xs font-medium flex items-center gap-2 ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
//             >
//               {status.type === "success" ? (
//                 <CheckCircle className="w-4 h-4 shrink-0" />
//               ) : (
//                 <AlertCircle className="w-4 h-4 shrink-0" />
//               )}
//               <span>{status.message}</span>
//             </div>
//           )}

//           {activeTab === "onboard" ? (
//             /* TAB A: DEVICE ONBOARDING REGISTRATION SUBMISSION FORM */
//             <form onSubmit={handleOnboardRequest} className="space-y-3">
//               <div className="relative">
//                 <Building className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="POS Business / Store Name"
//                   value={businessName}
//                   onChange={(e) => setBusinessName(e.target.value)}
//                   className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
//                   required
//                 />
//               </div>
//               <div className="relative">
//                 <Mail className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
//                 <input
//                   type="email"
//                   placeholder="Contact Email Address"
//                   value={contactEmail}
//                   onChange={(e) => setContactEmail(e.target.value)}
//                   className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
//                   required
//                 />
//               </div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 text-xs uppercase tracking-wider"
//               >
//                 Submit Machine Request
//               </button>
//             </form>
//           ) : (
//             /* TAB B: ACTIVE VERIFICATION LICENSE TRIGGER PANEL */
//             /* TAB B: ACTIVE VERIFICATION LICENSE TRIGGER PANEL */
//             <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
//               <div className="relative">
//                 <Key className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="Enter or paste your license key request code..."
//                   value={licenseKey}
//                   onChange={(e) => setLicenseKey(e.target.value)}
//                   className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
//                 />
//               </div>

//               <button
//                 onClick={handleRemoteActivate}
//                 disabled={isSubmitting || !licenseKey.trim()}
//                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider"
//               >
//                 {isSubmitting ? (
//                   <RefreshCcw className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <Globe className="w-4 h-4" />
//                 )}
//                 Activate Online
//               </button>
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
  RotateCcw,
  Trash2,
  Sparkles,
  Globe,
  Building,
  Mail,
  UserCheck,
  AlertCircle,
  CheckCircle,
  RefreshCcw,
  PhoneCall,
  ShieldCheck,
  Copy,
  Info,
  Laptop,
} from "lucide-react";

const electron = window.require ? window.require("electron") : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

// SOFTWARE & SUPPORT METADATA CONFIGURATION
const SOFTWARE_INFO = {
  name: "ESK TECH POS",
  // version: "v2.4.0 Enterprise",
  supportPhone: "+92 344 3777814", // Replace with your primary contact number
  supportEmail: "support@esktech.com",
  website: "www.esktech.com",
};

const LicensePage = () => {
  const [activeTab, setActiveTab] = useState("onboard"); // Default to Request Onboarding
  const [deviceId, setDeviceId] = useState("Loading...");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form Input States for Registration Onboarding
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [licenseKey, setLicenseKey] = useState("");

  // Dev Tools State Tracking
  const [testDays, setTestDays] = useState(30);

  useEffect(() => {
    if (ipcRenderer) ipcRenderer.invoke("get-device-id").then(setDeviceId);
  }, []);

  const handleRelaunch = () => ipcRenderer?.invoke("relaunch-app");
  const handleReset = () =>
    ipcRenderer?.invoke("reset-license").then(() => window.location.reload());

  const handleCopyDeviceId = () => {
    if (deviceId && deviceId !== "Loading...") {
      navigator.clipboard.writeText(deviceId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // 1. SUBMIT FRESH ONBOARDING REQUEST TO FIRESTORE
  const handleOnboardRequest = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !contactEmail.trim()) {
      setStatus({
        type: "error",
        message: "Please fill out all onboarding details.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      // Invokes self-registration logic sequence in electron main process
      const result = await ipcRenderer.invoke("request-license-onboarding", {
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim(),
        deviceId: deviceId,
      });

      if (result.success) {
        setLicenseKey(result.licenseKey); // Auto-populate assigned key string
        setStatus({
          type: "success",
          message: `Request Sent! Key: ${result.licenseKey}. Share this key with your Admin for instant activation.`,
        });
        setActiveTab("activate"); // Shift view panel cleanly over onto validation tab
      } else {
        setStatus({
          type: "error",
          message: result.error || "Onboarding pipeline dropped.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Network connection loss. Cloud Firestore unreachable.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. VERIFY IF ADMIN HAS APPROVED THE REQUEST FROM DASHBOARD
  const handleRemoteActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await ipcRenderer.invoke("activate-online", {
        licenseKey: licenseKey.trim(),
        clientData: {
          deviceId: deviceId,
          platform: window.navigator.platform,
          activatedAt: new Date().toISOString(),
        },
      });

      if (result.success) {
        setStatus({
          type: "success",
          message: "Terminal Approved! Informing core engine...",
        });

        // Notify the main process to verify the newly written file and redirect
        await ipcRenderer.invoke("trigger-license-verification-sync");
      } else {
        setStatus({
          type: "error",
          message:
            result.error ||
            "Verification rejected. Waiting for Admin approval.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Sync breakdown. Please verify internet access.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-lg space-y-4">
        {/* DEV TOOLS BAR */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-2.5 px-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRelaunch}
              className="text-slate-400 hover:text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" /> Relaunch
            </button>
            <div className="w-px h-3.5 bg-slate-800" />
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-rose-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Reset
            </button>
            <div className="w-px h-3.5 bg-slate-800" />
            <button
              type="button"
              onClick={() =>
                ipcRenderer
                  ?.invoke("check-for-updates")
                  .then((res) => alert(res.message))
              }
              className="text-slate-400 hover:text-amber-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Updates
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
            System Dev Mode
          </span>
        </div>

        {/* CORE INTERFACE BOX */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
          {/* TOP HEADER */}
          <div className="p-8 pb-6 border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Software Activation
                  </h1>
                  {/* <p className="text-xs text-slate-400 mt-0.5">
                    {SOFTWARE_INFO.name} • {SOFTWARE_INFO.version}
                  </p> */}
                </div>
              </div>
            </div>

            {/* FINGERPRINT ID CARD */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Hardware Fingerprint ID
                  </p>
                  <p className="text-xs font-mono font-medium text-slate-300 truncate">
                    {deviceId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                title="Copy Device ID"
              >
                {copiedId ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800/60 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("onboard")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "onboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Building className="w-4 h-4" /> 1. Onboard Request
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activate")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "activate"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <UserCheck className="w-4 h-4" /> 2. Verify Online
            </button>
          </div>

          {/* MAIN FORM & INTERACTION CONTENT AREA */}
          <div className="p-6 md:p-8 space-y-4">
            {/* DYNAMIC OPERATION NOTIFICATION STRIP */}
            {status.message && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 border transition-all ${
                  status.type === "success"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                    : "bg-rose-950/40 text-rose-300 border-rose-800/50"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}

            {activeTab === "onboard" ? (
              /* TAB A: DEVICE ONBOARDING REGISTRATION FORM */
              <form onSubmit={handleOnboardRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 ml-1">
                    Store / Business Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="e.g. ESK TECH"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 ml-1">
                    Contact Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                    <input
                      type="email"
                      placeholder="admin@yourbusiness.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-xs tracking-wide uppercase mt-2"
                >
                  {isSubmitting ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Machine Request"
                  )}
                </button>
              </form>
            ) : (
              /* TAB B: ACTIVE VERIFICATION LICENSE TRIGGER PANEL */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 ml-1">
                    License Activation Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Paste your key assigned by Admin..."
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono text-indigo-300 placeholder:text-slate-600 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoteActivate}
                  disabled={isSubmitting || !licenseKey.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-xs tracking-wide uppercase"
                >
                  {isSubmitting ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Globe className="w-4 h-4" /> Verify & Activate Online
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* TECHNICAL SUPPORT & CONTACT FOOTER */}
          <div className="p-4 px-6 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Support:{" "}
                <span className="font-semibold text-slate-200">
                  {SOFTWARE_INFO.supportPhone}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Contact support for manual license clearance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensePage;
