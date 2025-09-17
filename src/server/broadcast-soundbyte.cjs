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
      const chunk = Array.from(samples.slice(i, i + chunkSize));
      ws.send(JSON.stringify({ type: 'audio', channel: CHANNEL, data: chunk }));
      i += chunkSize;
    }, 50); // 50ms per chunk
  });
}

streamSoundbyte();