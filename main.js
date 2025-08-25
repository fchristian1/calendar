import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default DATA_FILE: keep the existing Windows path as a fallback, but
// prefer the platform-appropriate userData location once the app is ready.
let DATA_FILE = 'C:\\Users\\%USERNAME%\\Seafile\\Seafile\\Dateiablage\\247calender_data.json'

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
    const p = path.join(DATA_FILE)
    // C:\Users\<User>\AppData\Roaming\247calendar
    // /home/<user>/.config/247calendar/247calender_data.json
    console.log(`Loading data from ${p}`)
    if (!fs.existsSync(p)) {
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(p), { recursive: true })
      // Create default data file
      const defaultData = { events: [], createdAt: new Date().toISOString() }
      await fs.promises.writeFile(p, JSON.stringify(defaultData, null, 2), 'utf-8')
      return defaultData
    }
    const raw = await fs.promises.readFile(p, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { __error: e.message }
  }
})

ipcMain.handle('save-data', async (event, data) => {
  try {
    const p = path.join(DATA_FILE)
    // C:\Users\<User>\AppData\Roaming\247calendar
    // /home/<user>/.config/247calendar/247calender_data.json
    console.log(`Saving data to ${p}`)
    await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})
ipcMain.handle('get-data-file-path', async () => {
  return DATA_FILE
})
ipcMain.handle('set-data-file-path', async (event, newPath) => {
  DATA_FILE = newPath
  return { ok: true }
})
ipcMain.handle('show-open-dialog-api', async (event, options) => {
  // Allow the renderer to pass options (matches preload.cjs usage).
  // Provide a sensible default if none supplied.
  const opts = options || { properties: ['openFile'] }
  const result = await dialog.showOpenDialog(opts)
  // Return the first selected path or null
  return (result && result.filePaths && result.filePaths[0]) || null
})

app.whenReady().then(() => {
  // If we're not on Windows and the developer left the Windows example path,
  // switch to the platform user data folder so data is stored in a sensible place.
  try {
    if (process.platform !== 'win32') {
      const defaultPath = path.join(app.getPath('userData'), '247calender_data.json')
      // Only override the hardcoded Windows example path
      if (DATA_FILE && DATA_FILE.includes('C:\\Users\\%USERNAME%')) {
        DATA_FILE = defaultPath
      }
    }
  } catch (e) {
    // ignore; keep existing DATA_FILE
    console.warn('Could not set platform default DATA_FILE:', e?.message || e)
  }

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