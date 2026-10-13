// KINSHASA 243 : GHOSTLINK — enveloppe bureau (Windows / Linux AppImage)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const saveFile = () => path.join(app.getPath('userData'), 'ghostlink-v12-save.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 360, minHeight: 360,
    backgroundColor: '#0b0710', autoHideMenuBar: true,
    title: 'KINSHASA 243 : GHOSTLINK — V12 Les 24 communes',
    icon: path.join(__dirname, '..', 'assets', 'icon-512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

const { ipcMain } = require('electron');
ipcMain.on('store:load', (e) => { try { e.returnValue = fs.readFileSync(saveFile(), 'utf8'); } catch { e.returnValue = null; } });
ipcMain.on('store:save', (_e, data) => { try { fs.writeFileSync(saveFile(), data); } catch {} });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
