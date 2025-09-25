import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// This is the url of the server
const WS_URL = "ws://localhost:3001"; // Update if your server runs elsewhere
// This is the location of the soundbyte
const FILE = 'sounds/lego-yoda-death-sound-effect.wav';

// Accept base url as a prop (default to '/')
export default function BroadcastSoundbyte({ base = "/" }: { base?: string }) {
  const [channel, setChannel] = useState("1");
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Clean up previous connection and set up new one when channel is changed
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
    ws.onmessage = (msg) => { /* no-op */ };

    return () => {
      ws.close();
    };
  }, [channel]);

  function sendAudioInChunks(ws: WebSocket, channel: string, audioBuffer: AudioBuffer) {
    // Flatten the audio data
    const samples = audioBuffer.getChannelData(0);
    // Set chunk size and send in chunks with delay
    const chunkSize = 4096;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= samples.length) {
        clearInterval(interval);
        //ws.close(); //closing makes it only happen once
        return;
      }
      const chunk = Array.from(samples.slice(i, i + chunkSize));
      ws.send(JSON.stringify({ type: 'audio', channel: channel, data: chunk }));
      i += chunkSize;
    }, 50); // 50ms per chunk
  }

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="channel" className="mr-2">Broadcast to:</label>
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
      <div>
        <Button variant="letu" onClick={async () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Ensure base ends with a slash
            let basePath = base;
            if (!basePath.endsWith("/")) basePath += "/";
            const response = await fetch(basePath + FILE);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
            const samples = audioBuffer.getChannelData(0);
            wsRef.current.send(JSON.stringify({ type: 'audio', channel: channel, data: Array.from(samples) }));
            //sendAudioInChunks(wsRef.current, channel, audioBuffer);
          }
        }}>
          Play!
        </Button>
      </div>
      {/* <div className="text-white mb-2">Listening on channel {channel}</div> */}
    </div>
  );
}