/**
 * electronService.js
 * 
 * Safely wraps Electron IPC calls so the frontend can function both in Electron
 * and standard browser environments without throwing undefined errors.
 */

const isElectron = () => typeof window !== 'undefined' && window.electronAPI;

export const electronService = {
  isAvailable: isElectron(),

  /**
   * Opens a native file dialog to select files or folders
   * @param {Object} options Electron dialog.showOpenDialog options
   */
  showOpenDialog: async (options = { properties: ['openFile', 'openDirectory'] }) => {
    if (!isElectron() || !window.electronAPI.showOpenDialog) {
      console.warn('Electron showOpenDialog is not available in browser mode.');
      return { canceled: true, filePaths: [] };
    }
    return await window.electronAPI.showOpenDialog(options);
  },

  /**
   * Opens a local file or directory using the OS default application
   * @param {string} fullPath The absolute path to open
   */
  openPath: async (fullPath) => {
    if (!isElectron() || !window.electronAPI.openPath) {
      console.warn(`Cannot open local path natively in browser mode: ${fullPath}`);
      return false;
    }
    return await window.electronAPI.openPath(fullPath);
  },

  /**
   * Opens a URL in the OS default web browser
   * @param {string} url The URL to open
   */
  openExternal: async (url) => {
    if (!isElectron() || !window.electronAPI.openExternal) {
      // Fallback for normal browser
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    return await window.electronAPI.openExternal(url);
  },

  /**
   * Window Controls
   */
  minimize: () => {
    if (isElectron()) window.electronAPI.minimize();
  },
  maximize: () => {
    if (isElectron()) window.electronAPI.maximize();
  },
  close: () => {
    if (isElectron()) window.electronAPI.close();
  }
};
