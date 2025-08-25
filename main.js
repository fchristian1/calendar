import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_FILE = '247calender_data.json'

const createWindow = () => {
  const win = new BrowserWindow({
    show: false, // Fenster nicht sofort zeigen
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      enableRemoteModule: false
    }
  })
  win.maximize();  // 👉 Fenster maximieren
  win.show();      // 👉 danach anzeigen
  win.loadFile('./dist/index.html')
}

// IPC handlers to persist data in the user's app data folder
ipcMain.handle('load-data', async () => {
  try {
    const p = path.join(app.getPath('userData'), DATA_FILE)
    console.log(`Loading data from ${p}`)
    if (!fs.existsSync(p)) return null
    const raw = await fs.promises.readFile(p, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { __error: e.message }
  }
})

ipcMain.handle('save-data', async (event, data) => {
  try {
    const p = path.join(app.getPath('userData'), DATA_FILE)
    console.log(`Loading data from ${p}`)
    await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})