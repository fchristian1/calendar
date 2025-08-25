const { contextBridge, ipcRenderer } = require('electron')

// Expose a small, safe API to the renderer
contextBridge.exposeInMainWorld('api', {
  loadData: async () => {
    try {
      return await ipcRenderer.invoke('load-data')
    } catch (e) {
      return { __error: e?.message || String(e) }
    }
  },
  saveData: async (payload) => {
    try {
      return await ipcRenderer.invoke('save-data', payload)
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }
})

// Helpful for debugging from the renderer devtools
console.log('[preload] api exposed')
