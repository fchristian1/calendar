import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default DATA_FILE: keep the existing Windows path as a fallback, but
// prefer the platform-appropriate userData location once the app is ready.
// DATA_FILE may be explicitly set via IPC. If not, resolve to a sensible per-user
// location: prefer Electron's userData folder when available, otherwise fall back
// to the user's home directory.
let DATA_FILE = null

function resolveDataFile() {
  if (DATA_FILE) return DATA_FILE
  try {
    // On Windows prefer the user's Seafile 'Dateiablage' folder (uses homedir -> C:\Users\<User>)
    if (process.platform === 'win32') {
      return path.join(os.homedir(), 'Seafile', 'Seafile', 'Dateiablage', '247calender_data.json')
    }
    if (app && app.isReady()) {
      return path.join(app.getPath('userData'), '247calender_data.json')
    }
  } catch (e) {
    // ignore
  }
  // fallback
  return path.join(os.homedir(), '247calender_data.json')
}

async function readPersistedConfig() {
  try {
    if (!app || !app.isReady()) return null
    const cfgPath = path.join(app.getPath('userData'), '247calendar-config.json')
    if (!fs.existsSync(cfgPath)) return null
    const raw = await fs.promises.readFile(cfgPath, 'utf-8')
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  } catch (e) {
    return null
  }
}

async function writePersistedConfig(cfg) {
  try {
    const cfgDir = app && app.isReady() ? app.getPath('userData') : os.homedir()
    const cfgPath = path.join(cfgDir, '247calendar-config.json')
    await fs.promises.mkdir(path.dirname(cfgPath), { recursive: true })
    await fs.promises.writeFile(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.warn('Failed to write config:', e?.message || e)
    return false
  }
}

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
    const p = resolveDataFile()
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
    const p = resolveDataFile()
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
  return resolveDataFile()
})
ipcMain.handle('set-data-file-path', async (event, newPath) => {
  DATA_FILE = newPath
  try {
    await writePersistedConfig({ DATA_FILE: newPath })
  } catch (e) {
    console.warn('Failed to persist DATA_FILE choice:', e?.message || e)
  }
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

app.whenReady().then(async () => {

  // Ensure DATA_FILE is resolved now that app is ready.
  try {
    // Try to load persisted config first
    const persisted = await readPersistedConfig().catch(() => null)
    if (persisted && persisted.DATA_FILE) {
      DATA_FILE = persisted.DATA_FILE
    } else {
      DATA_FILE = resolveDataFile()
    }
  } catch (e) {
    console.warn('Could not initialize DATA_FILE:', e?.message || e)
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