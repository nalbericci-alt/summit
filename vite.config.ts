/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

// Builds are reproducible per commit: the stamp is the commit's own date, never the wall clock,
// so two builds of one commit produce identical asset names and the service worker precache
// always matches the index the CDN serves.
const gitCommit = git("rev-parse --short HEAD") ?? "local";
const gitCommitDate = git("log -1 --format=%cI") ?? "1970-01-01T00:00:00Z";

export default defineConfig({
  base: "/summit/",
  define: {
    __SUMMIT_COMMIT__: JSON.stringify(gitCommit),
    __SUMMIT_BUILT_AT__: JSON.stringify(gitCommitDate),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Summit",
        short_name: "Summit",
        description: "Strength, engine, and trail training, built for the phone.",
        start_url: "/summit/",
        scope: "/summit/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b0f14",
        theme_color: "#0b0f14",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "/summit/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
