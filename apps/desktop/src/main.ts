/**
 * Virelle Studios — Electron Main Process
 *
 * Architecture:
 * - Loads the Virelle web app (virellestudios.com) in a BrowserWindow
 * - Falls back to local dev server (localhost:5173) when in development
 * - Handles deep-link callbacks for Stripe checkout returns
 * - Auto-updater via GitHub Releases
 * - System tray with quick actions
 */
import {
  app,
  BrowserWindow,
  BrowserView,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
  dialog,
  session,
  protocol,
} from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";
import * as fs from "fs";

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_NAME = "Virelle Studios";
const PRODUCTION_URL = "https://virellestudios.com";
const DEV_URL = "http://localhost:5173";
const PROTOCOL = "virelle";

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ─── Deep-link protocol registration ─────────────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// ─── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    // Handle deep link on Windows/Linux (second instance)
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (url) handleDeepLink(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Auto-updater setup ───────────────────────────────────────────────────────
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("update-available", (info) => {
  sendToRenderer("update-status", { status: "available", version: info.version });
  if (mainWindow) {
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `Virelle Studios v${info.version} is available.`,
        detail: "Would you like to download and install it now?",
        buttons: ["Download Now", "Later"],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.downloadUpdate();
      });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  sendToRenderer("update-status", { status: "downloaded", version: info.version });
  if (mainWindow) {
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message: `Virelle Studios v${info.version} has been downloaded.`,
        detail: "Restart now to apply the update.",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          isQuitting = true;
          autoUpdater.quitAndInstall(false, true);
        }
      });
  }
});

autoUpdater.on("error", (err) => {
  console.error("[Updater] Error:", err.message);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendToRenderer(channel: string, data: unknown) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function handleDeepLink(url: string) {
  console.log("[DeepLink] Received:", url);
  // Forward the deep link to the renderer so it can handle Stripe return, OAuth, etc.
  sendToRenderer("deep-link", { url });
  // Also navigate the main window to the appropriate page
  if (mainWindow && !mainWindow.isDestroyed()) {
    const parsed = new URL(url);
    const path = parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    const query = parsed.search;
    const appUrl = app.isPackaged ? PRODUCTION_URL : DEV_URL;
    mainWindow.loadURL(`${appUrl}/${path}${query}`);
    mainWindow.focus();
  }
}

// ─── Splash window ────────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, "../public/splash.html"));
}

// ─── Main window ──────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0a0a0f",
    icon: path.join(__dirname, "../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Allow the web app to use all its features
      allowRunningInsecureContent: false,
    },
  });

  const appUrl = app.isPackaged ? PRODUCTION_URL : DEV_URL;
  mainWindow.loadURL(appUrl);

  // Show main window once content is loaded (hide splash)
  mainWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // Check for updates after window is shown
        if (app.isPackaged) {
          setTimeout(() => autoUpdater.checkForUpdates(), 3000);
        }
      }
    }, 800);
  });

  // Handle external links — open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Stripe checkout to open in system browser
    if (
      url.startsWith("https://checkout.stripe.com") ||
      url.startsWith("https://billing.stripe.com") ||
      url.startsWith("https://buy.stripe.com")
    ) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    // Allow Virelle pages to open within the app
    if (url.startsWith(PRODUCTION_URL) || url.startsWith(DEV_URL)) {
      return { action: "allow" };
    }
    // All other external links open in browser
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle navigation within the app
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(PRODUCTION_URL) && !url.startsWith(DEV_URL) && !url.startsWith("http://localhost")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Prevent closing — hide to tray instead
  mainWindow.on("close", (event) => {
    if (!isQuitting && process.platform === "darwin") {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── System tray ─────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Virelle Studios",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "My Projects",
      click: () => {
        const url = (app.isPackaged ? PRODUCTION_URL : DEV_URL) + "/projects";
        if (mainWindow) {
          mainWindow.loadURL(url);
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "New Project",
      click: () => {
        const url = (app.isPackaged ? PRODUCTION_URL : DEV_URL) + "/projects/new";
        if (mainWindow) {
          mainWindow.loadURL(url);
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Billing & Credits",
      click: () => {
        const url = (app.isPackaged ? PRODUCTION_URL : DEV_URL) + "/billing";
        if (mainWindow) {
          mainWindow.loadURL(url);
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => {
        if (app.isPackaged) {
          autoUpdater.checkForUpdates();
        } else {
          dialog.showMessageBox({ message: "Auto-updater only works in production builds." });
        }
      },
    },
    { type: "separator" },
    {
      label: `Quit ${APP_NAME}`,
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:platform", () => process.platform);
ipcMain.handle("app:open-external", (_event, url: string) => shell.openExternal(url));
ipcMain.handle("app:check-updates", () => {
  if (app.isPackaged) autoUpdater.checkForUpdates();
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
  createTray();

  // macOS: handle deep links
  app.on("open-url", (_event, url) => {
    handleDeepLink(url);
  });

  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
