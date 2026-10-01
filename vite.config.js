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
