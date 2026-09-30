// import base44 from "@base44/vite-plugin";
// import react from "@vitejs/plugin-react";
// import { defineConfig } from "vite";

// // https://vite.dev/config/
// export default defineConfig({
//   logLevel: "error", // Suppress warnings, only show errors
//   plugins: [
//     base44({
//       // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
//       // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
//       legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
//       hmrNotifier: true,
//       navigationNotifier: true,
//       visualEditAgent: true,
//     }),
//     react(),
//   ],
// });

// import react from "@vitejs/plugin-react";
// import { defineConfig } from "vite";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   base: "./",

//   resolve: {
//     alias: {
//       // Base44 uses @/ for the src directory
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     port: 3000,
//     proxy: {
//       "/api": {
//         target: "https://api.base44.app", // Or the specific URL for your app's backend
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, "/api"),
//       },
//     },
//   },
// });

// import react from "@vitejs/plugin-react";
// import { defineConfig } from "vite";
// import path from "path";
// import { fileURLToPath } from "url";

// // Add these two lines to fix the __dirname issue in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export default defineConfig({
//   plugins: [react()],
//   base: "./",
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     port: 3000,
//     proxy: {
//       "/api": {
//         target: "https://api.base44.app", // Or the specific URL for your app's backend
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, "/api"),
//       },
//     },
//   },
// });

//  npx electron-builder --mac dir

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import obfuscator from "rollup-plugin-javascript-obfuscator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      // Only scramble the code when running 'vite build'
      command === "build" &&
        obfuscator({
          compact: true,
          controlFlowFlattening: true, // Swaps logic paths to confuse tools
          deadCodeInjection: true, // Adds fake code to mislead hackers
          debugProtection: true, // Disables devtools if someone tries to inspect
          disableConsoleOutput: true, // Removes console logs in production
          identifierNamesGenerator: "hexadecimal",
          stringArray: true, // Encrypts your strings (like your IV and Keys)
          stringArrayThreshold: 0.75,
        }),
    ],
    base: "./",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "https://api.base44.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
      },
    },
    build: {
      // Optional: Increase chunk size warning if obfuscation makes files large
      chunkSizeWarningLimit: 1000,
    },
  };
});
