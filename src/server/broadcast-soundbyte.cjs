// NO LONGER USED FOR TESTING

const fs = require('fs');
const WebSocket = require('ws');
const wav = require('wav-decoder');

const WS_URL = 'ws://localhost:3001';
const CHANNEL = '1';
const FILE = '/sounds/lego-yoda-death-sound-effect.wav';

// Read and decode the WAV file
async function streamSoundbyte() {
  const buffer = fs.readFileSync(FILE);
  const audioData = await wav.decode(buffer);

  // Flatten the channel data (mono)
  const samples = audioData.channelData[0];

  // Connect to WebSocket server
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));

    // Stream in chunks (simulate real-time)
    const chunkSize = 4096;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= samples.length) {
        clearInterval(interval);
        ws.close();
        return;
      }
      const chunkArr = samples.slice(i, i + chunkSize);
      // Build binary: 4 bytes sampleRate + Float32 samples
      const floatSamples = Float32Array.from(chunkArr);
      const headerBytes = 4;
      const payload = Buffer.alloc(headerBytes + floatSamples.byteLength);
      payload.writeUInt32LE(audioData.sampleRate || 44100, 0);
      Buffer.from(floatSamples.buffer).copy(payload, headerBytes);
      ws.send(payload);
      i += chunkSize;
    }, 50); // 50ms per chunk
  });
}

streamSoundbyte();