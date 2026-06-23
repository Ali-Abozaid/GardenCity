const { app, BrowserWindow } = require('electron');
const path = require('path');

const DEV_SERVER_URL = 'http://localhost:4200';
const isDev = !app.isPackaged;

function getIndexHtmlPath() {
  return path.join(__dirname, '../dist/GardenCity-FrontEnd/browser/index.html');
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(getIndexHtmlPath());
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
