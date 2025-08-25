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
  },
  getDataFilePath: async () => {
    try {
      return await ipcRenderer.invoke('get-data-file-path')
    } catch (e) {
      return { __error: e?.message || String(e) }
    }
  },
  setDataFilePath: async (newPath) => {
    try {
      return await ipcRenderer.invoke('set-data-file-path', newPath)
    } catch (e) {
      return { __error: e?.message || String(e) }
    }
  },
  showOpenDialogApi: async (options) => {
    try {
      return await ipcRenderer.invoke('show-open-dialog-api', options)
    } catch (e) {
      return { __error: e?.message || String(e) }
    }
  }
})

// Helpful for debugging from the renderer devtools
console.log('[preload] api exposed')
