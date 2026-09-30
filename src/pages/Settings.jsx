import React, { useEffect, useState } from "react";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations"; // Import translations
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

export default function Settings() {
  const [config, setConfig] = useState({
    app_name: "",
    language: "en",
    currency: "INR",
    business_address: "",
    business_city: "",
    business_state: "",
    business_phone: "",
  });
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);

  const handleCloudBackup = async () => {
    setUploading(true);
    try {
      // Replace with your actual cloud endpoint (e.g., AWS S3 presigned URL or your API)
      const success = await dbService.uploadToCloud("https://your-api.com");

      toast({
        title: success ? "Cloud Sync Success" : "Sync Failed",
        variant: success ? "default" : "destructive",
        description: success
          ? "Database safely stored in cloud."
          : "Check your internet connection.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Get active translation based on current state
  const t = translations[config.language] || translations.en;

  useEffect(() => {
    dbService.getSettings().then((data) => {
      if (data) setConfig(data);
    });
  }, []);

  const handleSave = async () => {
    await dbService.updateSettings(config);

    toast({
      title:
        config.language === "ur" ? "ترتیبات محفوظ ہو گئیں" : "Settings Saved",
      description:
        config.language === "ur"
          ? "تبدیلیاں لاگو کر دی گئی ہیں۔"
          : "Changes applied successfully.",
    });

    // FORCE RELOAD: This updates the Sidebar, Header, and RTL direction immediately
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleReset = async () => {
    const res = await dbService.resetDatabase();
    if (res?.error) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: res.error,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8" dir={t.dir}>
      <div>
        <h1 className="text-2xl font-bold">{t.settings}</h1>
        <p className="text-slate-500">Configure your local POS environment.</p>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-white">
        <div className="space-y-2">
          <Label>
            {config.language === "ur" ? "کاروبار کا نام" : "Business Name"}
          </Label>
          <Input
            value={config.app_name}
            onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
            className={t.dir === "rtl" ? "text-right" : "text-left"}
          />
        </div>

        {/* Business Phone */}
        <div className="space-y-2">
          <Label>
            {config.language === "ur" ? "فون نمبر" : "Business Phone"}
          </Label>
          <Input
            value={config.business_phone}
            onChange={(e) =>
              setConfig({ ...config, business_phone: e.target.value })
            }
            placeholder="+92 300 0000000"
          />
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <Label>{config.language === "ur" ? "پتہ" : "Address"}</Label>
          <Input
            value={config.business_address}
            onChange={(e) =>
              setConfig({ ...config, business_address: e.target.value })
            }
            placeholder="Street name, Area"
          />
        </div>

        {/* City & State Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{config.language === "ur" ? "شہر" : "City"}</Label>
            <Input
              value={config.business_city}
              onChange={(e) =>
                setConfig({ ...config, business_city: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{config.language === "ur" ? "زبان" : "Language"}</Label>
          <Select
            value={config.language}
            onValueChange={(v) => setConfig({ ...config, language: v })}
          >
            <SelectTrigger dir={t.dir}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ur">اردو (Urdu)</SelectItem>
              <SelectItem value="ps">پښتو (Pashto)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 border p-4 rounded-lg bg-white">
          <Label>{config.language === "ur" ? "کرنسی" : "Currency"}</Label>
          <Select
            value={config.currency}
            onValueChange={(v) => setConfig({ ...config, currency: v })}
          >
            <SelectTrigger dir={t.dir}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PKR">PKR (Rs.)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="SAR">SAR (ر.س)</SelectItem>
              <SelectItem value="AFN">AFN (؋)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ZAKAT SETTINGS SECTION */}
        <div className="mt-10 space-y-4 border-t pt-6">
          <h2 className="text-xl font-bold">
            {config.language === "ur" ? "زکوٰۃ کی ترتیبات" : "Zakat Settings"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gold Price (per gram)</Label>
              <Input
                type="number"
                value={config.gold_price_per_gram}
                onChange={(e) =>
                  setConfig({ ...config, gold_price_per_gram: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Zakat Rate (%)</Label>
              <Input type="text" disabled value="2.5%" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {config.language === "ur" ? "تبدیلیاں محفوظ کریں" : "Save Changes"}
        </Button>
      </div>
      <div className="mt-8 space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          {config.language === "ur" ? "کلاؤڈ بیک اپ" : "Cloud Backup"}
        </h2>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Secure Online Storage
            </p>
            <p className="text-xs text-blue-700">
              Upload your encrypted database to the cloud.
            </p>
          </div>
          <Button
            disabled={uploading}
            onClick={handleCloudBackup}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? "Uploading..." : <CloudUpload className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="mt-10 space-y-6 border-t pt-8">
        <div className="flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold">
            {config.language === "ur" ? "مقامی بیک اپ" : "Local Backup"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* EXPORT BUTTON */}
          <Button
            variant="outline"
            onClick={async () => {
              const res = await dbService.exportLocalBackup();
              if (res.success)
                toast({
                  title: "Success",
                  description: "Backup saved to: " + res.path,
                });
            }}
            className="flex items-center gap-2 py-6 border-2"
          >
            <Download className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <p className="font-bold">
                {config.language === "ur" ? "بیک اپ محفوظ کریں" : "Save Backup"}
              </p>
              <p className="text-[10px] text-slate-500">
                Export local.db to your PC
              </p>
            </div>
          </Button>

          {/* IMPORT BUTTON */}
          <Button
            variant="outline"
            onClick={async () => {
              const res = await dbService.importLocalBackup();
              // If successful, the app will auto-restart
              if (res.error)
                toast({
                  title: "Error",
                  description: res.error,
                  variant: "destructive",
                });
            }}
            className="flex items-center gap-2 py-6 border-2 border-amber-100 hover:border-amber-300"
          >
            <Upload className="w-5 h-5 text-amber-600" />
            <div className="text-left">
              <p className="font-bold text-amber-900">
                {config.language === "ur"
                  ? "بیک اپ بحال کریں"
                  : "Restore Backup"}
              </p>
              <p className="text-[10px] text-slate-500">
                Upload and replace data
              </p>
            </div>
          </Button>
        </div>

        {/* DANGER WARNING */}
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800 italic leading-tight">
            {config.language === "ur"
              ? "بیک اپ بحال کرنے سے آپ کا موجودہ ڈیٹا ختم ہو جائے گا۔ براہ کرم احتیاط کریں۔"
              : "Warning: Restoring a backup will overwrite your current data. Please proceed with caution."}
          </p>
        </div>
      </div>
      {/* DANGER ZONE */}
      <div className="mt-12 border-t pt-8 border-red-100">
        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
          <AlertOctagon className="w-5 h-5" />
          {config.language === "ur" ? "خطرناک زون" : "Danger Zone"}
        </h2>

        <div className="p-4 border-2 border-red-50 bg-red-50/30 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-900">
              {config.language === "ur"
                ? "تمام ڈیٹا صاف کریں"
                : "Reset Complete Database"}
            </p>
            <p className="text-xs text-red-700 max-w-[300px]">
              {config.language === "ur"
                ? "یہ عمل تمام سیلز، مصنوعات اور کسٹمرز کو مستقل طور پر ختم کر دے گا۔"
                : "Permanently delete all sales, products, customers, and history. This cannot be undone."}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {config.language === "ur" ? "ری سیٹ کریں" : "Reset Now"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action is **irreversible**. All your inventory, invoices,
                  and customer balances will be wiped out.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
