/**
 * @type {import('astro').APIRoute}
 */
export const GET = (ctx) => {
  // Check if this is a WebSocket upgrade request
  if (!ctx.locals.isUpgradeRequest) {
    return new Response("Upgrade Required", { status: 426 });
  }

  // Upgrade the connection to WebSocket
  const { response, socket } = ctx.locals.upgradeWebSocket();

  // Initialize channels storage (you may want to move this to a global/shared location)
  if (!globalThis.wsChannels) {
    globalThis.wsChannels = {}; // { channelId: Set of sockets }
  }
  const channels = globalThis.wsChannels;

  // Handle incoming messages
  socket.onmessage = (event) => {
    console.log('received message');
    
    let parsed;
    try {
      parsed = JSON.parse(event.data);
    } catch {
      return;
    }

    const { type, channel, data } = parsed;

    if (type === 'join') {
      socket.channel = channel;
      channels[channel] = channels[channel] || new Set();
      channels[channel].add(socket);
      console.log(`Client joined channel: ${channel}`);
    }

    if (type === 'audio' && socket.channel) {
      console.log('received audio');
      // Relay audio to all listeners except sender, include all properties
      if (channels[socket.channel]) {
        channels[socket.channel].forEach(client => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'audio',
              data,
              sampleRate: parsed.sampleRate // forward sampleRate
            }));
          }
        });
      }
    }
  };

  // Handle connection close
  socket.onclose = () => {
    console.log('Client disconnected');
    if (socket.channel) {
      if (channels[socket.channel]) {
        channels[socket.channel].delete(socket);
        console.log(`Client left channel: ${socket.channel}`);
      }
    }
  };

  // Handle errors
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return response;
};