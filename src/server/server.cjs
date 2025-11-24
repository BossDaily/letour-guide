
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
    // msg can be a string (control) or Buffer/ArrayBuffer (binary audio)
    try {
      // Binary payload => forward directly to other clients
      if (typeof msg !== 'string') {
        if (ws.channel && channels[ws.channel]) {
          channels[ws.channel].forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(msg);
              } catch (err) {
                // ignore per-client send errors
              }
            }
          });
        }
        return;
      }

      // Otherwise, handle text-based control messages
      console.log('received text message');
      // Ensure message is not too large
      if (msg.length > 1024 * 1024) { // 1MB limit
        console.warn('Message too large, ignoring');
        return;
      }
      var parsed = JSON.parse(msg);
      const { type, channel, data } = parsed;

    if (type === 'join') {
      ws.channel = channel;
      channels[channel] = channels[channel] || new Set();
      channels[channel].add(ws);
    }
    // 'audio' text messages are deprecated — binary frames are used instead
    } catch (err) {
      console.error('Error handling message:', err);
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