// import React, { useEffect, useState } from "react";
// import { dbService } from "@/lib/db-service";
// import { translations } from "@/lib/translations"; // Import translations
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useToast } from "@/components/ui/use-toast";
// import {
//   Download,
//   Upload,
//   HardDrive,
//   AlertTriangle,
//   CloudUpload,
//   Globe,
//   AlertOctagon,
//   Trash2,
// } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

// export default function Settings() {
//   const [config, setConfig] = useState({
//     app_name: "",
//     language: "en",
//     currency: "INR",
//     business_address: "",
//     business_city: "",
//     business_state: "",
//     business_phone: "",
//   });
//   const { toast } = useToast();

//   const [uploading, setUploading] = useState(false);

//   const handleCloudBackup = async () => {
//     setUploading(true);
//     try {
//       // Replace with your actual cloud endpoint (e.g., AWS S3 presigned URL or your API)
//       const success = await dbService.uploadToCloud("https://your-api.com");

//       toast({
//         title: success ? "Cloud Sync Success" : "Sync Failed",
//         variant: success ? "default" : "destructive",
//         description: success
//           ? "Database safely stored in cloud."
//           : "Check your internet connection.",
//       });
//     } catch (err) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     } finally {
//       setUploading(false);
//     }
//   };

//   // Get active translation based on current state
//   const t = translations[config.language] || translations.en;

//   useEffect(() => {
//     dbService.getSettings().then((data) => {
//       if (data) setConfig(data);
//     });
//   }, []);

//   const handleSave = async () => {
//     await dbService.updateSettings(config);

//     toast({
//       title:
//         config.language === "ur" ? "ترتیبات محفوظ ہو گئیں" : "Settings Saved",
//       description:
//         config.language === "ur"
//           ? "تبدیلیاں لاگو کر دی گئی ہیں۔"
//           : "Changes applied successfully.",
//     });

//     // FORCE RELOAD: This updates the Sidebar, Header, and RTL direction immediately
//     setTimeout(() => {
//       window.location.reload();
//     }, 1000);
//   };

//   const handleReset = async () => {
//     const res = await dbService.resetDatabase();
//     if (res?.error) {
//       toast({
//         variant: "destructive",
//         title: "Reset Failed",
//         description: res.error,
//       });
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 space-y-8" dir={t.dir}>
//       <div>
//         <h1 className="text-2xl font-bold">{t.settings}</h1>
//         <p className="text-slate-500">Configure your local POS environment.</p>
//       </div>

//       <div className="space-y-4 border p-4 rounded-lg bg-white">
//         <div className="space-y-2">
//           <Label>
//             {config.language === "ur" ? "کاروبار کا نام" : "Business Name"}
//           </Label>
//           <Input
//             value={config.app_name}
//             onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
//             className={t.dir === "rtl" ? "text-right" : "text-left"}
//           />
//         </div>

//         {/* Business Phone */}
//         <div className="space-y-2">
//           <Label>
//             {config.language === "ur" ? "فون نمبر" : "Business Phone"}
//           </Label>
//           <Input
//             value={config.business_phone}
//             onChange={(e) =>
//               setConfig({ ...config, business_phone: e.target.value })
//             }
//             placeholder="+92 300 0000000"
//           />
//         </div>

//         {/* Business Address */}
//         <div className="space-y-2">
//           <Label>{config.language === "ur" ? "پتہ" : "Address"}</Label>
//           <Input
//             value={config.business_address}
//             onChange={(e) =>
//               setConfig({ ...config, business_address: e.target.value })
//             }
//             placeholder="Street name, Area"
//           />
//         </div>

//         {/* City & State Grid */}
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label>{config.language === "ur" ? "شہر" : "City"}</Label>
//             <Input
//               value={config.business_city}
//               onChange={(e) =>
//                 setConfig({ ...config, business_city: e.target.value })
//               }
//             />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label>{config.language === "ur" ? "زبان" : "Language"}</Label>
//           <Select
//             value={config.language}
//             onValueChange={(v) => setConfig({ ...config, language: v })}
//           >
//             <SelectTrigger dir={t.dir}>
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="en">English</SelectItem>
//               <SelectItem value="ur">اردو (Urdu)</SelectItem>
//               <SelectItem value="ps">پښتو (Pashto)</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-4 border p-4 rounded-lg bg-white">
//           <Label>{config.language === "ur" ? "کرنسی" : "Currency"}</Label>
//           <Select
//             value={config.currency}
//             onValueChange={(v) => setConfig({ ...config, currency: v })}
//           >
//             <SelectTrigger dir={t.dir}>
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="PKR">PKR (Rs.)</SelectItem>
//               <SelectItem value="USD">USD ($)</SelectItem>
//               <SelectItem value="SAR">SAR (ر.س)</SelectItem>
//               <SelectItem value="AFN">AFN (؋)</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* ZAKAT SETTINGS SECTION */}
//         <div className="mt-10 space-y-4 border-t pt-6">
//           <h2 className="text-xl font-bold">
//             {config.language === "ur" ? "زکوٰۃ کی ترتیبات" : "Zakat Settings"}
//           </h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Gold Price (per gram)</Label>
//               <Input
//                 type="number"
//                 value={config.gold_price_per_gram}
//                 onChange={(e) =>
//                   setConfig({ ...config, gold_price_per_gram: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Zakat Rate (%)</Label>
//               <Input type="text" disabled value="2.5%" />
//             </div>
//           </div>
//         </div>

//         <Button onClick={handleSave} className="w-full">
//           {config.language === "ur" ? "تبدیلیاں محفوظ کریں" : "Save Changes"}
//         </Button>
//       </div>
//       <div className="mt-8 space-y-4 border-t pt-6">
//         <h2 className="text-xl font-bold flex items-center gap-2">
//           <Globe className="w-5 h-5 text-blue-500" />
//           {config.language === "ur" ? "کلاؤڈ بیک اپ" : "Cloud Backup"}
//         </h2>

//         <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
//           <div className="space-y-1">
//             <p className="text-sm font-medium text-blue-900">
//               Secure Online Storage
//             </p>
//             <p className="text-xs text-blue-700">
//               Upload your encrypted database to the cloud.
//             </p>
//           </div>
//           <Button
//             disabled={uploading}
//             onClick={handleCloudBackup}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {uploading ? "Uploading..." : <CloudUpload className="w-4 h-4" />}
//           </Button>
//         </div>
//       </div>
//       <div className="mt-10 space-y-6 border-t pt-8">
//         <div className="flex items-center gap-2">
//           <HardDrive className="w-6 h-6 text-slate-700" />
//           <h2 className="text-xl font-bold">
//             {config.language === "ur" ? "مقامی بیک اپ" : "Local Backup"}
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {/* EXPORT BUTTON */}
//           <Button
//             variant="outline"
//             onClick={async () => {
//               const res = await dbService.exportLocalBackup();
//               if (res.success)
//                 toast({
//                   title: "Success",
//                   description: "Backup saved to: " + res.path,
//                 });
//             }}
//             className="flex items-center gap-2 py-6 border-2"
//           >
//             <Download className="w-5 h-5 text-indigo-600" />
//             <div className="text-left">
//               <p className="font-bold">
//                 {config.language === "ur" ? "بیک اپ محفوظ کریں" : "Save Backup"}
//               </p>
//               <p className="text-[10px] text-slate-500">
//                 Export local.db to your PC
//               </p>
//             </div>
//           </Button>

//           {/* IMPORT BUTTON */}
//           <Button
//             variant="outline"
//             onClick={async () => {
//               const res = await dbService.importLocalBackup();
//               // If successful, the app will auto-restart
//               if (res.error)
//                 toast({
//                   title: "Error",
//                   description: res.error,
//                   variant: "destructive",
//                 });
//             }}
//             className="flex items-center gap-2 py-6 border-2 border-amber-100 hover:border-amber-300"
//           >
//             <Upload className="w-5 h-5 text-amber-600" />
//             <div className="text-left">
//               <p className="font-bold text-amber-900">
//                 {config.language === "ur"
//                   ? "بیک اپ بحال کریں"
//                   : "Restore Backup"}
//               </p>
//               <p className="text-[10px] text-slate-500">
//                 Upload and replace data
//               </p>
//             </div>
//           </Button>
//         </div>

//         {/* DANGER WARNING */}
//         <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
//           <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
//           <p className="text-xs text-red-800 italic leading-tight">
//             {config.language === "ur"
//               ? "بیک اپ بحال کرنے سے آپ کا موجودہ ڈیٹا ختم ہو جائے گا۔ براہ کرم احتیاط کریں۔"
//               : "Warning: Restoring a backup will overwrite your current data. Please proceed with caution."}
//           </p>
//         </div>
//       </div>
//       {/* DANGER ZONE */}
//       <div className="mt-12 border-t pt-8 border-red-100">
//         <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
//           <AlertOctagon className="w-5 h-5" />
//           {config.language === "ur" ? "خطرناک زون" : "Danger Zone"}
//         </h2>

//         <div className="p-4 border-2 border-red-50 bg-red-50/30 rounded-xl flex items-center justify-between">
//           <div className="space-y-1">
//             <p className="text-sm font-bold text-red-900">
//               {config.language === "ur"
//                 ? "تمام ڈیٹا صاف کریں"
//                 : "Reset Complete Database"}
//             </p>
//             <p className="text-xs text-red-700 max-w-[300px]">
//               {config.language === "ur"
//                 ? "یہ عمل تمام سیلز، مصنوعات اور کسٹمرز کو مستقل طور پر ختم کر دے گا۔"
//                 : "Permanently delete all sales, products, customers, and history. This cannot be undone."}
//             </p>
//           </div>

//           <AlertDialog>
//             <AlertDialogTrigger asChild>
//               <Button
//                 variant="destructive"
//                 className="bg-red-600 hover:bg-red-700"
//               >
//                 <Trash2 className="w-4 h-4 mr-2" />
//                 {config.language === "ur" ? "ری سیٹ کریں" : "Reset Now"}
//               </Button>
//             </AlertDialogTrigger>
//             <AlertDialogContent>
//               <AlertDialogHeader>
//                 <AlertDialogTitle className="text-red-600 flex items-center gap-2">
//                   <AlertTriangle className="w-5 h-5" />
//                   Are you absolutely sure?
//                 </AlertDialogTitle>
//                 <AlertDialogDescription>
//                   This action is **irreversible**. All your inventory, invoices,
//                   and customer balances will be wiped out.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <AlertDialogFooter>
//                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//                 <AlertDialogAction
//                   onClick={handleReset}
//                   className="bg-red-600 hover:bg-red-700"
//                 >
//                   Yes, Delete Everything
//                 </AlertDialogAction>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { dbService } from "@/lib/db-service";
import { translations_ } from "@/lib/translations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  Upload,
  HardDrive,
  AlertTriangle,
  CloudUpload,
  Globe,
  AlertOctagon,
  Trash2,
  Clock,
  ShieldCheck,
  RotateCcw,
  FolderOpen,
  Image as ImageIcon,
  X,
  Cpu,
  Database,
  Sliders,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSettings } from "../hooks/useSettings";

export default function Settings() {
  const { settings } = useSettings();
  const { toast } = useToast();

  const currentLang = settings?.language || "en";
  const dir = translations_[currentLang]?.dir || "ltr";
  const t = translations_[currentLang]?.settings || translations_.en.settings;

  const [config, setConfig] = useState({
    app_name: "",
    language: "en",
    currency: "PKR",
    business_address: "",
    business_city: "",
    business_state: "",
    business_phone: "",
    gold_price_per_gram: "",
    logo: "", // Base64 logo string
    logo_max_height: "45", // Default receipt logo height limit in pixels
  });

  const [uploading, setUploading] = useState(false);
  const [autoBackups, setAutoBackups] = useState([]);
  const [runningAutoBackup, setRunningAutoBackup] = useState(false);

  // System & Storage Info State
  const [systemInfo, setSystemInfo] = useState({
    platform: "Detecting...",
    totalStorage: "Calculating...",
    freeStorage: "Calculating...",
    dbSize: "Calculating...",
  });

  useEffect(() => {
    dbService.getSettings().then((data) => {
      if (data) {
        setConfig((prev) => ({
          ...prev,
          ...data,
          logo_max_height: data.logo_max_height || "45",
        }));
      }
    });
    loadAutoBackups();
    fetchSystemAndStorageInfo();
  }, []);

  const loadAutoBackups = async () => {
    if (dbService.getAutoBackupsList) {
      const list = await dbService.getAutoBackupsList();
      setAutoBackups(list || []);
    }
  };

  // Fetch Storage & System Diagnostics
  const fetchSystemAndStorageInfo = async () => {
    try {
      // Electron IPC bridge call if available
      if (window.electronAPI && window.electronAPI.getSystemStorageInfo) {
        const info = await window.electronAPI.getSystemStorageInfo();
        setSystemInfo({
          platform: info.platform || navigator.platform,
          totalStorage: info.totalStorage || "N/A",
          freeStorage: info.freeStorage || "N/A",
          dbSize: info.dbSize || "N/A",
        });
      } else if (navigator.storage && navigator.storage.estimate) {
        // Web storage API fallback
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024 * 1024)).toFixed(2);

        setSystemInfo({
          platform:
            window.navigator.userAgentData?.platform || navigator.platform,
          totalStorage: `${quotaMB} GB`,
          freeStorage: `~${(quotaMB - usedMB / 1024).toFixed(2)} GB`,
          dbSize: `${usedMB} MB`,
        });
      }
    } catch (e) {
      console.error("Storage measurement failed:", e);
    }
  };

  // Convert uploaded image file into base64 string
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (PNG, JPG, SVG).",
        variant: "destructive",
      });
      return;
    }

    // Limit image size to 2MB to keep DB lightweight
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig((prev) => ({ ...prev, logo: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setConfig((prev) => ({ ...prev, logo: "" }));
  };

  const handleRunAutoBackup = async () => {
    setRunningAutoBackup(true);
    try {
      const res = await dbService.runAutoBackup(7, true);
      if (res?.success) {
        toast({
          title: t.success || "Success",
          description: "Auto-backup created (7-day retention active).",
        });
        loadAutoBackups();
      } else if (res?.skipped) {
        toast({
          title: "Backup Skipped",
          description: res.message,
        });
      } else {
        toast({
          title: t.error || "Error",
          description: res?.error || "Failed to create auto backup.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t.error || "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRunningAutoBackup(false);
    }
  };

  const handleCloudBackup = async () => {
    setUploading(true);
    try {
      const success = await dbService.uploadToCloud("https://your-api.com");

      toast({
        title: success
          ? t.sync_success || "Cloud Sync Success"
          : t.sync_failed || "Sync Failed",
        variant: success ? "default" : "destructive",
        description: success
          ? t.sync_success_desc || "Database safely stored in cloud."
          : t.sync_failed_desc || "Check your internet connection.",
      });
    } catch (err) {
      toast({
        title: t.error || "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    await dbService.updateSettings(config);

    toast({
      title: t.saved_title || "Settings Saved",
      description: t.saved_desc || "Changes applied successfully.",
    });

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleReset = async () => {
    const res = await dbService.resetDatabase();
    if (res?.error) {
      toast({
        variant: "destructive",
        title: t.reset_failed || "Reset Failed",
        description: res.error,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold">{t.title || "Settings"}</h1>
        <p className="text-slate-500">
          {t.configure_desc || "Configure your local POS environment."}
        </p>
      </div>

      {/* SYSTEM & STORAGE INFORMATION DIAGNOSTICS */}
      <div className="border p-4 rounded-lg bg-slate-900 text-slate-100 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          System & Storage Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase">
              OS Platform
            </span>
            <span className="font-mono font-bold text-slate-200">
              {systemInfo.platform}
            </span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase">
              Database Size
            </span>
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
              <Database className="w-3 h-3" /> {systemInfo.dbSize}
            </span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase">
              Total Disk
            </span>
            <span className="font-mono font-bold text-slate-200">
              {systemInfo.totalStorage}
            </span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase">
              Available Disk
            </span>
            <span className="font-mono font-bold text-blue-400">
              {systemInfo.freeStorage}
            </span>
          </div>
        </div>
      </div>

      {/* GENERAL CONFIGURATION */}
      <div className="space-y-4 border p-4 rounded-lg bg-white">
        {/* LOGO UPLOAD & RECEIPT SIZE LIMIT SECTION */}
        <div className="space-y-4 border-b pb-4">
          <Label className="flex items-center gap-1.5 font-bold">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            {t.business_logo || "Business Logo & Receipt Settings"}
          </Label>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {config.logo ? (
              <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center group shrink-0">
                <img
                  src={config.logo}
                  alt="Business Logo"
                  className="w-full h-full object-contain p-1"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition"
                  title="Remove Logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
                <span className="text-[10px]">No Logo</span>
              </div>
            )}

            <div className="space-y-3 w-full">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-xs cursor-pointer max-w-xs"
              />
              <p className="text-[11px] text-slate-500">
                Recommended: Monochrome PNG/JPG (Max 2MB).
              </p>

              {/* LOGO RECEIPT HEIGHT LIMIT */}
              <div className="flex items-center gap-2 max-w-xs pt-1">
                <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="space-y-1 w-full">
                  <Label className="text-xs font-semibold">
                    Receipt Logo Max Height (px)
                  </Label>
                  <Input
                    type="number"
                    min="20"
                    max="120"
                    value={config.logo_max_height}
                    onChange={(e) =>
                      setConfig({ ...config, logo_max_height: e.target.value })
                    }
                    placeholder="45"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.business_name || "Business Name"}</Label>
          <Input
            value={config.app_name}
            onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t.business_phone || "Business Phone"}</Label>
          <Input
            value={config.business_phone}
            onChange={(e) =>
              setConfig({ ...config, business_phone: e.target.value })
            }
            placeholder="+92 300 0000000"
          />
        </div>

        <div className="space-y-2">
          <Label>{t.address || "Address"}</Label>
          <Input
            value={config.business_address}
            onChange={(e) =>
              setConfig({ ...config, business_address: e.target.value })
            }
            placeholder={t.address_placeholder || "Street name, Area"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t.city || "City"}</Label>
            <Input
              value={config.business_city}
              onChange={(e) =>
                setConfig({ ...config, business_city: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.language || "Language"}</Label>
          <Select
            value={config.language}
            onValueChange={(v) => setConfig({ ...config, language: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ur">اردو (Urdu)</SelectItem>
              <SelectItem value="ps">پښتو (Pashto)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.currency || "Currency"}</Label>
          <Select
            value={config.currency}
            onValueChange={(v) => setConfig({ ...config, currency: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PKR">PKR (Rs.)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="SAR">SAR (ر.س)</SelectItem>
              <SelectItem value="AFN">AFN (؋)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ZAKAT SETTINGS SECTION */}
        <div className="mt-10 space-y-4 border-t pt-6">
          <h2 className="text-xl font-bold">
            {t.zakat_settings || "Zakat Settings"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.gold_price || "Gold Price (per gram)"}</Label>
              <Input
                type="number"
                value={config.gold_price_per_gram}
                onChange={(e) =>
                  setConfig({ ...config, gold_price_per_gram: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t.zakat_rate || "Zakat Rate (%)"}</Label>
              <Input type="text" disabled value="2.5%" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {t.save_changes || "Save Changes"}
        </Button>
      </div>

      {/* CLOUD BACKUP SECTION */}
      <div className="mt-8 space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          {t.cloud_backup || "Cloud Backup"}
        </h2>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              {t.secure_online || "Secure Online Storage"}
            </p>
            <p className="text-xs text-blue-700">
              {t.secure_online_desc ||
                "Upload your encrypted database to the cloud."}
            </p>
          </div>
          <Button
            disabled={uploading}
            onClick={handleCloudBackup}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              t.uploading || "Uploading..."
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* AUTOMATIC BACKUP SECTION (7-DAY ROTATION) */}
      <div className="mt-8 space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold">Automatic Daily Backup</h2>
              <p className="text-xs text-slate-500">
                Keeps rolling backups for the past 7 days automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dbService.openBackupFolder?.()}
              className="flex items-center gap-1.5 border-slate-300"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              Open Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={runningAutoBackup}
              onClick={handleRunAutoBackup}
              className="flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${runningAutoBackup ? "animate-spin" : ""}`}
              />
              Run Auto Backup
            </Button>
          </div>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 border-b pb-2">
            <span>Stored Backups ({autoBackups.length} / 7 days)</span>
            <span>Retention Period: 7 Days</span>
          </div>

          {autoBackups.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No automatic backups generated yet. Click "Run Auto Backup" to
              create your first point.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {autoBackups.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-500">{item.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MANUAL LOCAL BACKUP SECTION */}
      <div className="mt-10 space-y-6 border-t pt-8">
        <div className="flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold">
            {t.local_backup || "Manual Local Backup"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await dbService.exportLocalBackup();
              if (res.success)
                toast({
                  title: t.success || "Success",
                  description: `${t.backup_saved || "Backup saved to:"} ${res.path}`,
                });
            }}
            className="flex items-center gap-2 py-6 border-2"
          >
            <Download className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <p className="font-bold">{t.save_backup || "Export Backup"}</p>
              <p className="text-[10px] text-slate-500">
                {t.save_backup_desc || "Export local.db to your PC"}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              const res = await dbService.importLocalBackup();
              if (res.error)
                toast({
                  title: t.error || "Error",
                  description: res.error,
                  variant: "destructive",
                });
            }}
            className="flex items-center gap-2 py-6 border-2 border-amber-100 hover:border-amber-300"
          >
            <Upload className="w-5 h-5 text-amber-600" />
            <div className="text-left">
              <p className="font-bold text-amber-900">
                {t.restore_backup || "Restore Backup"}
              </p>
              <p className="text-[10px] text-slate-500">
                {t.restore_backup_desc || "Upload and replace data"}
              </p>
            </div>
          </Button>
        </div>

        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800 italic leading-tight">
            {t.backup_warning ||
              "Warning: Restoring a backup will overwrite your current data. Please proceed with caution."}
          </p>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="mt-12 border-t pt-8 border-red-100">
        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
          <AlertOctagon className="w-5 h-5" />
          {t.danger_zone || "Danger Zone"}
        </h2>

        <div className="p-4 border-2 border-red-50 bg-red-50/30 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-900">
              {t.reset_database || "Reset Complete Database"}
            </p>
            <p className="text-xs text-red-700 max-w-[300px]">
              {t.reset_database_desc ||
                "Permanently delete all sales, products, customers, and history. This cannot be undone."}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.reset_now || "Reset Now"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t.reset_confirm_title || "Are you absolutely sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t.reset_confirm_desc ||
                    "This action is **irreversible**. All your inventory, invoices, and customer balances will be wiped out."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel || "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t.yes_delete || "Yes, Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
