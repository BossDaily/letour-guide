
const WebSocket = require('ws');
//port
const port = 3001;
const wss = new WebSocket.Server({ port: port });

const channels = {}; // { channelId: Set of sockets }
const broadcasters = {};
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
      // Set as broadcaster if none exists for this channel
      if (!broadcasters[channel]) {
        broadcasters[channel] = ws;
        console.log(`Client set as broadcaster for channel ${channel}`);
        ws.send(JSON.stringify({ type: 'joined_as_broadcaster' }));
      } else {
        console.log(`Client joined as listener for channel ${channel}`);
        ws.send(JSON.stringify({ type: 'broadcaster_exists' }));
      }
    }
    if (type === 'audio' && ws.channel) {
      // Only allow audio from the broadcaster
      if (broadcasters[ws.channel] !== ws) {
        console.warn('Broadcaster already exists for this channel, ignoring audio');
        return;
      }
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
      // Remove from broadcasters if it was the broadcaster
      if (broadcasters[ws.channel] === ws) {
        delete broadcasters[ws.channel];
        console.log(`Broadcaster for channel ${ws.channel} disconnected`);
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