import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Config keys and filenames
const CONFIG_FILENAME = '247calendar_config.json'
const DEFAULT_DATA_BASENAME = '247calender_data.json'

// Helper: path to config file inside app userData
function getConfigPath() {
  // app.getPath('userData') is available after app.whenReady, but calling here is safe
  const userData = app.getPath ? app.getPath('userData') : path.join(process.env.HOME || '.', '.config', '247calendar')
  return path.join(userData, CONFIG_FILENAME)
}

// Read config (if present) and return the configured data file path, or default under userData
async function getDataFilePath() {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const txt = await fs.promises.readFile(configPath, 'utf-8')
      const cfg = JSON.parse(txt || '{}')
      if (cfg && cfg.dataFile) return path.resolve(cfg.dataFile)
    }
  } catch (e) {
    console.error('Failed to read config:', e.message)
  }

  // Default location in app userData
  const userData = app.getPath ? app.getPath('userData') : path.join(process.env.HOME || '.', '.config', '247calendar')
  // Ensure directory exists on-demand when writing
  return path.join(userData, DEFAULT_DATA_BASENAME)
}

// Persist config with a given dataFile path
async function setDataFilePath(newPath) {
  const configPath = getConfigPath()
  const cfg = { dataFile: path.resolve(newPath) }
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true })
  await fs.promises.writeFile(configPath, JSON.stringify(cfg, null, 2), 'utf-8')
  return cfg.dataFile
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
    const p = await getDataFilePath()
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

// Expose current data file path to renderer
ipcMain.handle('get-data-file', async () => {
  try {
    return { path: await getDataFilePath() }
  } catch (e) {
    return { error: e.message }
  }
})

// Allow changing the data file path (persisted in config)
ipcMain.handle('set-data-file', async (event, newPath) => {
  try {
    if (!newPath || typeof newPath !== 'string') throw new Error('invalid path')
    const saved = await setDataFilePath(newPath)
    return { ok: true, path: saved }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('save-data', async (event, data) => {
  try {
    const p = await getDataFilePath()
    // C:\Users\<User>\AppData\Roaming\247calendar
    // /home/<user>/.config/247calendar/247calender_data.json
    console.log(`Saving data to ${p}`)
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