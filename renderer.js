import ReconnectingWebSocket from 'reconnecting-websocket';

const statusEl = document.getElementById('status');
const logsEl = document.getElementById('logs');
const startBtn = document.getElementById('start-btn');
const openServerBtn = document.getElementById('open-server');
const stopServerBtn = document.getElementById('stop-server');
const exportTarget = document.getElementById('export-target');
const projectPath = document.getElementById('project-path');
const buildMode = document.getElementById('build-mode');
const extraFlags = document.getElementById('extra-flags');

let ws = null;

function log(...args){
  const line = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logsEl.textContent += line + '\n';
  logsEl.scrollTop = logsEl.scrollHeight;
}

function connect(){
  if(ws) ws.close();
  ws = new ReconnectingWebSocket(getWsUrl());
  ws.addEventListener('open', ()=> statusEl.textContent = 'yes');
  ws.addEventListener('close', ()=> statusEl.textContent = 'no');
  ws.addEventListener('message', ev => {
    try{
      const msg = JSON.parse(ev.data);
      if(msg.type === 'log') log(msg.payload);
      if(msg.type === 'status') statusEl.textContent = msg.payload;
      if(msg.type === 'server-state'){
        openServerBtn.disabled = msg.payload === 'running';
        stopServerBtn.disabled = msg.payload !== 'running';
      }
    }catch(e){ log(ev.data) }
  });
}

function getWsUrl(){
  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss' : 'ws';
  // default server port 8081 (backend ws server)
  return `${protocol}://${loc.hostname}:8081/`;
}

openServerBtn.addEventListener('click', ()=>{
  fetch('/start-server', {method:'POST'}).then(r=>r.json()).then(res=> log('start-server', res)).catch(e=> log('start-server error', e));
});

stopServerBtn.addEventListener('click', ()=>{
  fetch('/stop-server', {method:'POST'}).then(r=>r.json()).then(res=> log('stop-server', res)).catch(e=> log('stop-server error', e));
});

startBtn.addEventListener('click', ()=>{
  const payload = {
    target: exportTarget.value,
    path: projectPath.value || '.',
    mode: buildMode.value,
    flags: extraFlags.value || ''
  };
  fetch('/export', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  }).then(r=>r.json()).then(res=> log('export request queued', res)).catch(e=>log('export error', e));
});

connect();

