import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// This is the base url of the page
const BASE_URL = import.meta.env.BASE_URL || "/";
// This is the url of the server
const WS_URL = `${location.origin}${BASE_URL.replace('client', 'server')}api/server`; // Update if your server runs elsewhere

// This is the location of the soundbyte
const FILE1 = 'sounds/lego-yoda-death-sound-effect.wav';
const FILE2 = 'sounds/wilhelm-scream.wav';
const FILE = FILE1; //change file to test different sounds

// Accept base url as a prop (default to '/')
export default function BroadcastSoundbyte() {
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

  return (
    <div>
      <div className="">
        <label htmlFor="channel" className="r-2 text-3xl font-bold text-gray-200">Broadcast to: </label>
        <select
          id="channel"
          name="channel"
          className="text-3xl font-bold text-gray-200"
          value={channel}
          onChange={e => setChannel(e.target.value)}
        >
          <option className="text-base font-bold text-gray-600" value="1">one</option>
          <option className="text-base font-bold text-gray-600" value="2">two</option>
          <option className="text-base font-bold text-gray-600" value="3">three</option>
        </select>
      </div>
      <div>
        <Button className="mb-4 mt-2 text-[28px] font-bold w-full max-w-[80vw] h-12 px-6 py-2" variant="letu" onClick={async () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Ensure base ends with a slash
            const response = await fetch(BASE_URL + FILE);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
            const samples = audioBuffer.getChannelData(0);
            wsRef.current.send(JSON.stringify({ type: 'audio', channel: channel, data: Array.from(samples) }));
          }
        }}>
          Play!
        </Button>
      </div>
    </div>
  );
}