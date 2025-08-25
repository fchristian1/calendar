import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  loadData: async () => {
    return await ipcRenderer.invoke('load-data')
  },
  saveData: async (data) => {
    return await ipcRenderer.invoke('save-data', data)
  }
})
