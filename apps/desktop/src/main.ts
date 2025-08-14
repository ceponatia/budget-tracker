/**
 * Electron main process (T-011)
 * Loads local Vite dev server in development, and built web assets in production.
 */
import { app, BrowserWindow, ipcMain, shell, nativeTheme } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// NodeNext ESM: derive __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
// Fallback only if env var is nullish (keep empty string if explicitly set)
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'), // Emitted JS from preload.ts
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  win.webContents.once('did-finish-load', () => {
    // Structured log to stdout for smoke tests
    // Using console.log intentionally (main process instrumentation)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ event: 'desktop.didFinishLoad', url: win.webContents.getURL() }));
  });

  win.on('ready-to-show', () => {
    win.show();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ event: 'desktop.readyToShow' }));
  });

  if (isDev) {
    await win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In un-packaged production run, assets copied to dist/web
    const indexPath = join(__dirname, 'web', 'index.html');
    if (existsSync(indexPath)) {
      await win.loadFile(indexPath);
    } else {
      await win.loadURL('data:text/plain,Missing built web assets');
    }
  }
}

// Bootstrap (awaited) to satisfy no-floating-promises
void (async () => {
  await app.whenReady();
  await createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Basic IPC (placeholder) to fetch theme
ipcMain.handle('app:theme', () => ({ dark: nativeTheme.shouldUseDarkColors }));

// Security best practices: open external links in default browser
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
