/*
Minimal Electron Forge main file. Integrates the same UI (index.html) as the renderer.
This is a simple shell; packaging with electron-forge requires additional config which
is outlined in README below.
*/
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  // Load the local UI served by ws-server (or directly file if preferred)
  win.loadURL('http://localhost:8080/');
}

app.on('ready', createWindow);
app.on('window-all-closed', ()=> { if(process.platform !== 'darwin') app.quit(); });
app.on('activate', ()=> { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });

