import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var rootDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(rootDir, "./src"),
            "@shared": path.resolve(rootDir, "./shared"),
        },
        dedupe: ["react", "react-dom"],
    },
    server: {
        port: 5173,
        proxy: {
            "/api/trpc": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
});
