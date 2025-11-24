import React, { useEffect, useRef, useState } from "react";

// This is the base url of the page
const BASE_URL = import.meta.env.BASE_URL || "/";
// This is the url of the broadcast server
const WS_URL = `${location.origin}${BASE_URL.replace('client', 'server')}api/server`; // Update if your server runs elsewhere

export default function ListenAudio() {
  const [channel, setChannel] = useState("1");
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  //useEffect to set up websocket connection when channel changes
  useEffect(() => {
    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Create a gain node for volume control
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = 1; // Ensure unmuted on init
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // tell server we are a listener for this channel
      ws.send(JSON.stringify({ type: "join", channel, role: 'listener' }));
    };

    ws.onmessage = (msg) => {
      try {
        let parsed;
        if (msg.data instanceof ArrayBuffer) {
          // Binary message: decode to string then parse JSON
          const text = new TextDecoder().decode(msg.data);
          parsed = JSON.parse(text);
        } else if (typeof msg.data === 'string') {
          // Text message: parse JSON directly
          parsed = JSON.parse(msg.data);
        } else {
          // Unknown format
          console.warn('Unknown WebSocket message format', msg.data);
          return;
        }
        const { type, data, sampleRate } = parsed;
        if (type === "audio" && Array.isArray(data)) {
          const ctx = audioCtxRef.current!;
          const gainNode = gainNodeRef.current!;
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
              playSource.connect(gainNode); // Connect to gain node instead
              playSource.start();
            });
          } else {
            // No resampling needed
            buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
            buffer.getChannelData(0).set(data);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect to gain node instead
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

  // Expose mute function globally
  useEffect(() => {
    (window as any).muteAudio = (mute: boolean) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = mute ? 0 : 1;
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="channel" className="text-3xl font-bold text-gray-200 mb-6">Listen to: </label>
        <select
          id="channel"
          name="channel"
          className="text-3xl font-bold text-gray-200 mb-6"
          value={channel}
          onChange={e => setChannel(e.target.value)}
        >
          <option className="text-base font-bold text-gray-600" value="1">one</option>
          <option className="text-base font-bold text-gray-600" value="2">two</option>
          <option className="text-base font-bold text-gray-600" value="3">three</option>
          <option className="text-base font-bold text-gray-600" value="4">four</option>
          <option className="text-base font-bold text-gray-600" value="5">five</option> 
          <option className="text-base font-bold text-gray-600" value="6">six</option>
          <option className="text-base font-bold text-gray-600" value="7">seven</option>
          <option className="text-base font-bold text-gray-600" value="8">eight</option>
          <option className="text-base font-bold text-gray-600" value="9">nine</option>
          <option className="text-base font-bold text-gray-600" value="10">ten</option>
        </select>
      </div>
    </div>
  );
}