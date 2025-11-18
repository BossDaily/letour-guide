
const WebSocket = require('ws');
//port
const port = 3001;
const wss = new WebSocket.Server({ port: port });

const channels = {}; // { channelId: Set of sockets }

// Heartbeat settings
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
function noop() {}
function heartbeat() { this.isAlive = true; }

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  console.log("Websocket server is connected to!")
  ws.on('message', (msg) => {
    console.log('received audio');
    // Expect JSON: { type, channel, data }
    let parsed;
    try {
      // Ensure message is not too large (buffer size management)
      if (typeof msg === 'string' && msg.length > 1024 * 1024) { // 1MB limit
        console.warn('Message too large, ignoring');
        return;
      }
      parsed = JSON.parse(msg);
    } catch (err) {
      console.error('Failed to parse message:', err);
      return;
    }
    const { type, channel, data } = parsed;

    if (type === 'join') {
      ws.channel = channel;
      channels[channel] = channels[channel] || new Set();
      channels[channel].add(ws);
    }
    if (type === 'audio' && ws.channel) {
      // Relay audio to all listeners except sender, include all properties
      if (channels[ws.channel]) {
        channels[ws.channel].forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
              // Send as Buffer for binary encoding optimization
              const audioMsg = JSON.stringify({
                type: 'audio',
                data,
                sampleRate: parsed.sampleRate // forward sampleRate
              });
              client.send(Buffer.from(audioMsg), { binary: true });
            } catch (err) {
              console.error('Error sending audio to client:', err);
            }
          }
        });
      }
    }
  }); // End ws.on('message')

  ws.on('close', () => {
    if (ws.channel) {
      if (channels[ws.channel]) {
        channels[ws.channel].delete(ws);
      }
    }
  });
}); // End wss.on('connection')

// Heartbeat interval to detect dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', function close() {
  clearInterval(interval);
});