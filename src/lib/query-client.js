import { QueryClient } from "@tanstack/react-query";

// export const queryClientInstance = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//       retry: 1,
//     },
//   },
// });

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Stop the constant 404 spam in the console
    },
  },
});
