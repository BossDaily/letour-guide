import React, { useEffect, useRef, useState } from "react";

// This is the url of the broadcast server
const WS_URL = "ws://localhost:3001"; // Update if your server runs elsewhere

export default function ListenAudio() {
  const [channel, setChannel] = useState("1");
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
        const { type, data } = JSON.parse(msg.data);
        if (type === "audio" && Array.isArray(data)) {
          const ctx = audioCtxRef.current!;
          const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
          buffer.getChannelData(0).set(data);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start();
        }
      } catch {}
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