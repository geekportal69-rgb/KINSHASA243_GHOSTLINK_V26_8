// Adaptateur de sauvegarde persistante : le jeu détecte window.GHOSTLINK_STORE { get(key), set(key, value) }
const { contextBridge, ipcRenderer } = require('electron');
let cache = {};
try { cache = JSON.parse(ipcRenderer.sendSync('store:load') || '{}'); } catch { cache = {}; }
contextBridge.exposeInMainWorld('GHOSTLINK_STORE', {
  get: (k) => (k in cache ? JSON.parse(JSON.stringify(cache[k])) : null),
  set: (k, v) => { cache[k] = v; ipcRenderer.send('store:save', JSON.stringify(cache)); }
});
