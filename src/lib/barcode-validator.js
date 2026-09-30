// export const isValidBarcode = (barcode) => {
//   // 1. Basic Length Check (Standard retail is 8, 12, or 13)
//   if (!/^\d{8,14}$/.test(barcode)) return false;

//   // 2. GS1 Check Digit Algorithm (Modulo 10)
//   const digits = barcode.split("").map(Number);
//   const checkDigit = digits.pop();

//   const sum = digits.reverse().reduce((acc, digit, idx) => {
//     // Multiply odd positions by 3, even by 1
//     return acc + (idx % 2 === 0 ? digit * 3 : digit);
//   }, 0);

//   const calculatedCheck = (10 - (sum % 10)) % 10;
//   return checkDigit === calculatedCheck;
// };

export const isValidBarcode = () => {
  // 1. Start with a prefix (e.g., '200' for internal use) + 9 random digits
  let digits = "200" + Math.random().toString().slice(2, 11);

  // 2. Calculate the GS1 Check Digit
  const arr = digits.split("").map(Number);
  const sum = arr.reverse().reduce((acc, digit, idx) => {
    return acc + (idx % 2 === 0 ? digit * 3 : digit);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;

  // 3. Return the 12 digits + the calculated check digit
  return digits + checkDigit;
};
