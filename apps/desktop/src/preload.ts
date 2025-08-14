/**
 * Preload script (T-011)
 * Exposes safe, minimal API surface to renderer.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('budgetDesktop', {
  getTheme: async () => ipcRenderer.invoke('app:theme') as Promise<{ dark: boolean }>,
});
