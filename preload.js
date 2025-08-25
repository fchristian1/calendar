import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  loadData: async () => {
    return await ipcRenderer.invoke('load-data')
  },
  saveData: async (data) => {
    return await ipcRenderer.invoke('save-data', data)
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
  }
})
