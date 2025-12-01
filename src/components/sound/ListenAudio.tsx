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
    // ensure binary messages arrive as ArrayBuffer for easy decoding
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      // tell server we are a listener for this channel
      ws.send(JSON.stringify({ type: "join", channel, role: 'listener' }));
      // start a lightweight application-level heartbeat so server can detect and close
      // truly inactive pages. Heartbeat interval only for listeners.
      const HEARTBEAT_MS = 10000; // send heartbeat every 10s
      const hb = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ type: 'heartbeat' })); } catch (e) { /* ignore */ }
        }
      }, HEARTBEAT_MS);
      // store on websocket so it can be cleared on disconnect
      (ws as any)._heartbeatInterval = hb;
    };

    ws.onmessage = (msg) => {
      try {
        // Binary messages are audio frames: 4 bytes sampleRate (Uint32 LE) + Float32 samples
        if (msg.data instanceof ArrayBuffer) {
          const buf = msg.data;
          const view = new DataView(buf);
          const sampleRate = view.getUint32(0, true);
          const audioBufferBytes = buf.slice(4);
          const samples = new Float32Array(audioBufferBytes);

          const ctx = audioCtxRef.current!;
          const gainNode = gainNodeRef.current!;

          if (sampleRate && sampleRate !== ctx.sampleRate) {
            // Resample using OfflineAudioContext
            const tmpBuffer = ctx.createBuffer(1, samples.length, sampleRate);
            tmpBuffer.getChannelData(0).set(samples);
            const offline = new OfflineAudioContext(1, Math.ceil(samples.length * ctx.sampleRate / sampleRate), ctx.sampleRate);
            const source = offline.createBufferSource();
            source.buffer = tmpBuffer;
            source.connect(offline.destination);
            source.start();
            offline.startRendering().then(rendered => {
              const playSource = ctx.createBufferSource();
              playSource.buffer = rendered;
              playSource.connect(gainNode);
              playSource.start();
            });
          } else {
            // No resampling needed
            const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
            buffer.getChannelData(0).set(samples);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);
            source.start();
          }
          return;
        }

        // Text messages are control messages (join/lock state)
        if (typeof msg.data === 'string') {
          const parsed = JSON.parse(msg.data);
          // if needed in future, we can handle more control messages here
          return;
        }

        // Unknown message format
        console.warn('Unknown WebSocket message format', msg.data);
      } catch (error) {
        console.error("Error processing audio data:", error);
      }
    };

    return () => {
      // clear heartbeat interval if present and close
      try { clearInterval((ws as any)._heartbeatInterval); } catch (e) {}
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