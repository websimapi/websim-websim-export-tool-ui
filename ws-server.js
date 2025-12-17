/*
Simple Node server that:
- Serves index.html and static assets (for local UI testing)
- Exposes REST endpoints to trigger start/stop/export
- Runs a WebSocket server on port 8081 to push logs/status to UI
- Orchestrates platform-specific export commands (minimal placeholders)
*/

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, port: 8081 });

let wsClients = new Set();
let exporterProcess = null;
let serverState = 'stopped';

function broadcast(obj){
  const payload = JSON.stringify(obj);
  for(const ws of wsClients) if(ws.readyState === WebSocket.OPEN) ws.send(payload);
}

wss.on('connection', socket => {
  wsClients.add(socket);
  socket.send(JSON.stringify({type:'server-state', payload: serverState}));
  socket.on('close', ()=> wsClients.delete(socket));
});

// REST endpoints
app.post('/start-server', (req,res)=>{
  serverState = 'running';
  broadcast({type:'server-state', payload:serverState});
  broadcast({type:'log', payload:'Local export server started.'});
  res.json({ok:true});
});

app.post('/stop-server', (req,res)=>{
  serverState = 'stopped';
  if(exporterProcess){
    exporterProcess.kill();
    exporterProcess = null;
  }
  broadcast({type:'server-state', payload:serverState});
  broadcast({type:'log', payload:'Local export server stopped.'});
  res.json({ok:true});
});

app.post('/export', (req,res)=>{
  const { target, path: projPath, mode, flags } = req.body || {};
  const absPath = path.resolve(projPath || '.');
  broadcast({type:'log', payload:`Queued export -> target=${target} path=${absPath} mode=${mode} flags=${flags||''}`});
  startExport({target, absPath, mode, flags});
  res.json({ok:true});
});

function startExport(opts){
  if(serverState !== 'running'){
    broadcast({type:'log', payload:'Server is not running. Start server first.'});
    return;
  }
  if(exporterProcess){
    broadcast({type:'log', payload:'An export is already running.'});
    return;
  }

  // Based on target select toolchain and run commands.
  if(opts.target === 'electron'){
    // Example: run electron-forge make in project dir (placeholder)
    runChild('npx', ['electron-forge', 'make', '--config', './forge.config.js', opts.mode === 'production' ? '--publish=never' : ''], {cwd: opts.absPath});
  } else if(opts.target === 'android'){
    // Example Capacitor: build web, run npx cap copy android & npx cap open android
    broadcast({type:'log', payload:'Starting Capacitor export (placeholder commands).'});
    runChild('npx', ['cap', 'sync', 'android'], {cwd: opts.absPath});
  } else if(opts.target === 'reddit'){
    // Example Devvit packaging (placeholder)
    broadcast({type:'log', payload:'Starting Devvit export (placeholder commands).'});
    runChild('npx', ['@devvit/sdk', 'pack'], {cwd: opts.absPath});
  } else {
    broadcast({type:'log', payload:'Unknown target: ' + opts.target});
  }
}

function runChild(cmd, args, opts){
  args = args.filter(Boolean);
  broadcast({type:'log', payload:`Spawning: ${cmd} ${args.join(' ')}`});
  exporterProcess = spawn(cmd, args, Object.assign({shell: true}, opts));
  exporterProcess.stdout.on('data', d => broadcast({type:'log', payload: d.toString()}));
  exporterProcess.stderr.on('data', d => broadcast({type:'log', payload: d.toString()}));
  exporterProcess.on('close', code => {
    broadcast({type:'log', payload:`Export process exited with code ${code}`});
    exporterProcess = null;
  });
  exporterProcess.on('error', err => {
    broadcast({type:'log', payload:`Export spawn error: ${err.message}`});
    exporterProcess = null;
  });
}

// Start HTTP server for UI + REST control
const HTTP_PORT = 8080;
server.listen(HTTP_PORT, ()=>{
  console.log(`HTTP UI server listening on http://localhost:${HTTP_PORT}`);
  console.log(`WebSocket server listening on ws://localhost:8081`);
});

