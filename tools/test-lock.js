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

  // A sends a small audio frame (owner) - should appear to the channel
  const headerBytes = 4;
  const payloadA = Buffer.alloc(headerBytes + 3 * 4); // three floats -> 3*4 bytes
  payloadA.writeUInt32LE(48000, 0); // sampleRate
  Buffer.from(new Float32Array([0,0,0]).buffer).copy(payloadA, headerBytes);
  a.send(payloadA);

  // B attempts to send audio (not owner) - server will ignore
  const payloadB = Buffer.alloc(headerBytes + 3 * 4);
  payloadB.writeUInt32LE(48000, 0);
  Buffer.from(new Float32Array([1,1,1]).buffer).copy(payloadB, headerBytes);
  b.send(payloadB);

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
