const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximized-change', handler);
    return () => {
      ipcRenderer.removeListener('window-maximized-change', handler);
    };
  }
});

// Apply desktop styling marker as soon as DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('desktop-app');
  document.body.classList.add('desktop-app');
});
