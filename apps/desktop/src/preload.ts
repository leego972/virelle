/**
 * Virelle Studios — Electron Preload Script
 *
 * Exposes a safe, minimal API to the renderer (web app) via contextBridge.
 * This allows the web app to detect it's running inside Electron and use
 * desktop-specific features (deep link handling, update notifications, etc.)
 * without compromising security.
 */
import { contextBridge, ipcRenderer } from "electron";

// ─── Electron API exposed to the web app ─────────────────────────────────────
contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getVersion: () => ipcRenderer.invoke("app:version"),
  getPlatform: () => ipcRenderer.invoke("app:platform"),

  // Open external URLs in the system browser (e.g. Stripe checkout)
  openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url),

  // Check for app updates
  checkForUpdates: () => ipcRenderer.invoke("app:check-updates"),

  // Listen for deep-link events (Stripe return, OAuth callback, etc.)
  onDeepLink: (callback: (data: { url: string }) => void) => {
    ipcRenderer.on("deep-link", (_event, data) => callback(data));
    // Return cleanup function
    return () => ipcRenderer.removeAllListeners("deep-link");
  },

  // Listen for auto-updater status events
  onUpdateStatus: (
    callback: (data: {
      status: "checking" | "available" | "downloading" | "downloaded" | "up-to-date" | "error";
      version?: string;
      percent?: number;
      message?: string;
    }) => void
  ) => {
    ipcRenderer.on("update-status", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("update-status");
  },

  // Flag so the web app knows it's running in Electron
  isElectron: true,
});

// ─── TypeScript declaration augmentation ─────────────────────────────────────
// This is referenced by the web app's TypeScript config
declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      checkForUpdates: () => Promise<void>;
      onDeepLink: (callback: (data: { url: string }) => void) => () => void;
      onUpdateStatus: (
        callback: (data: {
          status: string;
          version?: string;
          percent?: number;
          message?: string;
        }) => void
      ) => () => void;
      isElectron: boolean;
    };
  }
}
