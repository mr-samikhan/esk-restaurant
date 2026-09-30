import { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";

const currencyMap = {
  USD: "$",
  PKR: "Rs.",
  INR: "₹",
  SAR: "ر.س",
  AFN: "؋", //
};

export function useSettings() {
  const [settings, setSettings] = useState({
    business_name: "MY LOCAL STORE",
    business_address: "",
    business_phone: "",
    currency: "PKR",
    language: "en",
  });

  const [currencySymbol, setCurrencySymbol] = useState("Rs.");

  useEffect(() => {
    dbService.getSettings().then((s) => {
      if (s) {
        setSettings(s);
        // Retain your old logic for symbol mapping
        if (s.currency) {
          setCurrencySymbol(currencyMap[s.currency] || "Rs.");
        }
      }
    });
  }, []);

  return {
    settings,
    symbol: currencySymbol,
    businessName: settings.business_name,
  };
}
