#!/usr/bin/env node
/**
 * Quick test harness for the per-channel lock behavior.
 * Usage: node tools/test-lock.js [wsUrl]
 * Default wsUrl: ws://localhost:3000/api/server
 */
import WebSocket from 'ws';

const url = process.argv[2] || 'ws://localhost:3000/api/server';

function makeClient(name) {
  const ws = new WebSocket(url);
  ws.on('open', () => console.log(`${name} open`));
  ws.on('close', () => console.log(`${name} closed`));
  ws.on('error', err => console.error(`${name} error:`, err.message));
  ws.on('message', (data) => {
    let parsed;
    try { parsed = JSON.parse(data.toString()); } catch { parsed = data.toString(); }
    console.log(`${name} recv:`, parsed);
  });
  return ws;
}

(async function run() {
  console.log('Connecting two clients to', url);
  const a = makeClient('A');
  const b = makeClient('B');

  await new Promise(r => setTimeout(r, 500));

  // A tries to become broadcaster and should get the lock
  a.send(JSON.stringify({ type: 'join', channel: '1', role: 'broadcaster' }));

  await new Promise(r => setTimeout(r, 250));

  // B tries to become broadcaster for same channel and should be denied
  b.send(JSON.stringify({ type: 'join', channel: '1', role: 'broadcaster' }));

  await new Promise(r => setTimeout(r, 500));

  // A sends audio (owner) - should appear to the channel
  a.send(JSON.stringify({ type: 'audio', channel: '1', data: [0,0,0] }));

  // B attempts to send audio (not owner) - server will ignore
  b.send(JSON.stringify({ type: 'audio', channel: '1', data: [1,1,1] }));

  // Wait a bit to observe inactivity-based release
  console.log('Waiting to observe inactivity auto-release (>=7s)');
  await new Promise(r => setTimeout(r, 9000));

  // Now B tries again and should be able to acquire lock after A inactive
  b.send(JSON.stringify({ type: 'join', channel: '1', role: 'broadcaster' }));

  await new Promise(r => setTimeout(r, 500));

  // Clean up
  a.close();
  b.close();
})();
