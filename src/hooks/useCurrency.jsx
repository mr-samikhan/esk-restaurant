import { useState, useEffect } from "react";
import { dbService } from "@/lib/db-service";

const currencyMap = {
  USD: "$",
  PKR: "Rs.",
  INR: "₹",
  SAR: "ر.س",
  AFN: "؋",
};

export function useCurrency() {
  const [currency, setCurrency] = useState({
    code: "PKR",
    symbol: "Rs.",
  });

  useEffect(() => {
    dbService.getSettings().then((s) => {
      if (s?.currency) {
        setCurrency({
          code: s.currency,
          symbol: currencyMap[s.currency] || "Rs.",
        });
      }
    });
  }, []);

  // Return both the code and the symbol for flexibility
  return currency;
}
