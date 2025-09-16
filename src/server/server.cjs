const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

const channels = {}; // { channelId: Set of sockets }

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    // Expect JSON: { type, channel, data }
    let parsed;
    try { parsed = JSON.parse(msg); } catch { return; }
    const { type, channel, data } = parsed;

    if (type === 'join') {
      ws.channel = channel;
      channels[channel] = channels[channel] || new Set();
      channels[channel].add(ws);
    }
    if (type === 'audio' && ws.channel) {
      // Relay audio to all listeners except sender
      channels[ws.channel]?.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'audio', data }));
        }
      });
    }
  });

  ws.on('close', () => {
    if (ws.channel) channels[ws.channel]?.delete(ws);
  });
});