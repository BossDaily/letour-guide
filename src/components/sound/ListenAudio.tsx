import React, { useEffect, useRef, useState } from "react";

// This is the base url of the page
const BASE_URL = import.meta.env.BASE_URL || "/";
// This is the url of the broadcast server
const WS_URL = `${location.origin}${BASE_URL.replace('client', 'server')}/api/server`; // Update if your server runs elsewhere

export default function ListenAudio() {
  const [channel, setChannel] = useState("1");
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  //useEffect to set up websocket connection when channel changes
  useEffect(() => {
    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", channel }));
    };

    ws.onmessage = (msg) => {
      try {
        const { type, data, sampleRate } = JSON.parse(msg.data);
        if (type === "audio" && Array.isArray(data)) {
          const ctx = audioCtxRef.current!;
          let buffer;
          if (sampleRate && sampleRate !== ctx.sampleRate) {
            // Resample if needed
            buffer = ctx.createBuffer(1, data.length, sampleRate);
            buffer.getChannelData(0).set(data);
            // Use OfflineAudioContext to resample
            const offlineCtx = new OfflineAudioContext(1, data.length * ctx.sampleRate / sampleRate, ctx.sampleRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineCtx.destination);
            source.start();
            offlineCtx.startRendering().then(renderedBuffer => {
              const playSource = ctx.createBufferSource();
              playSource.buffer = renderedBuffer;
              playSource.connect(ctx.destination);
              playSource.start();
            });
          } else {
            // No resampling needed
            buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
            buffer.getChannelData(0).set(data);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
          }
        } 
      } catch (error) {
      console.error("Error processing audio data:", error);
    }
  };

    return () => {
      ws.close();
    };
  }, [channel]);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="channel" className="mr-2">Listen to:</label>
        <select
          id="channel"
          name="channel"
          className="bg-blue-950 p-2 rounded"
          value={channel}
          onChange={e => setChannel(e.target.value)}
        >
          <option value="1">one</option>
          <option value="2">two</option>
          <option value="3">three</option>
        </select>
      </div>
      {/* <div className="text-white mb-2">Listening on channel {channel}</div> */}
    </div>
  );
}