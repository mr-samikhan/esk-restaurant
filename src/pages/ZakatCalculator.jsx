import React, { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";
import { translations } from "@/lib/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coins, Landmark, Calculator } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ZakatDashboard() {
  const [settings, setSettings] = useState({});
  const [inventoryValue, setInventoryValue] = useState(0);
  const [manualCash, setManualCash] = useState(0);

  useEffect(() => {
    // Fetch Settings & Inventory in parallel
    Promise.all([dbService.getSettings(), dbService.getProducts()]).then(
      ([s, products]) => {
        setSettings(s);
        const totalValue = products.reduce(
          (sum, p) => sum + p.stock_quantity * p.cost_price,
          0,
        );
        setInventoryValue(totalValue);
      },
    );
  }, []);

  const t = translations[settings.language] || translations.en;
  const goldPrice = Number(settings.gold_price_per_gram || 0);
  const nisabThreshold = goldPrice * 87.48; // 7.5 Tola Gold
  const totalAssets = inventoryValue + Number(manualCash);
  const isEligible = totalAssets >= nisabThreshold;
  const zakatAmount = isEligible ? totalAssets * 0.025 : 0;

  const [history, setHistory] = useState([]);
  const [newRecord, setNewRecord] = useState({
    recipient_name: "",
    amount: "",
    category: "General",
  });

  useEffect(() => {
    dbService.getZakatHistory().then(setHistory);
  }, []);

  const handleAddRecord = async () => {
    await dbService.addZakatRecord(newRecord);
    const updated = await dbService.getZakatHistory();
    setHistory(updated);
    setNewRecord({ recipient_name: "", amount: "", category: "General" });
  };

  const totalPaid = history.reduce((sum, h) => sum + h.amount, 0);
  const totalPayable = Math.round(zakatAmount);
  const remainingZakat = Math.max(0, totalPayable - totalPaid);

  return (
    <div className="space-y-6" dir={t.dir}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.zakat_dashboard}</h1>
        <div className="text-sm bg-slate-100 px-3 py-1 rounded-full border">
          {t.gold_rate}: {settings.currency} {goldPrice.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assets Section */}
        <Card className="border-l-4 border-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.inventory_worth}
            </CardTitle>
            <Landmark className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.currency} {inventoryValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.cash_in_hand}
            </CardTitle>
            <Coins className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={manualCash}
              onChange={(e) => setManualCash(e.target.value)}
              className="text-lg font-bold border-none p-0 focus-visible:ring-0"
            />
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card
          className={`border-l-4 ${isEligible ? "border-emerald-500 bg-emerald-50/30" : "border-amber-500 bg-amber-50/30"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.nisab_status}
            </CardTitle>
            <Calculator className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-bold ${isEligible ? "text-emerald-700" : "text-amber-700"}`}
            >
              {isEligible ? t.above_nisab : t.below_nisab}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Threshold: {settings.currency}{" "}
              {Math.round(nisabThreshold).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payable Result */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl text-center space-y-4">
        <h2 className="text-slate-400 uppercase tracking-widest text-sm">
          {t.zakat_payable}
        </h2>
        <div className="text-5xl font-black text-indigo-400">
          {settings.currency} {Math.round(zakatAmount).toLocaleString()}
        </div>
        <p className="text-slate-500 text-xs italic">
          Calculated at 2.5% of total wealth (Inventory + Cash)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Payment Form */}
        <div className="space-y-4 border p-6 rounded-xl bg-white">
          <h3 className="font-bold text-lg">{t.add_record}</h3>
          <Input
            placeholder={t.recipient}
            value={newRecord.recipient_name}
            onChange={(e) =>
              setNewRecord({ ...newRecord, recipient_name: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder={t.amount_paid}
            value={newRecord.amount}
            onChange={(e) =>
              setNewRecord({ ...newRecord, amount: Number(e.target.value) })
            }
          />
          <Button onClick={handleAddRecord} className="w-full">
            {t.add_record}
          </Button>
        </div>

        {/* History Table */}
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="p-4 border-b font-bold bg-slate-50">{t.history}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.recipient}</TableHead>
                <TableHead>{t.amount_paid}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.recipient_name}</TableCell>
                  <TableCell className="font-bold text-emerald-600">
                    {settings.currency} {h.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
