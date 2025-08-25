import { app, BrowserWindow } from 'electron'

const createWindow = () => {
  const win = new BrowserWindow({
    show: false, // Fenster nicht sofort zeigen
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')
    }
  })
  win.maximize();  // 👉 Fenster maximieren
  win.show();      // 👉 danach anzeigen
  win.loadFile('./dist/index.html')
}

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