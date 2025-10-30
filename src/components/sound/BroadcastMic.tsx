import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// MIC WORKS, BUT NOT WELL
// This is the base url of the page
const BASE_URL = import.meta.env.BASE_URL || "/";
// This is the url of the server
const WS_URL = `${location.origin}${BASE_URL.replace('client', 'server')}api/server`; // Update if your server runs elsewhere


export default function BroadcastMic() {
  const [channel, setChannel] = useState("1");
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [micEnable, setMicEnable] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  //useEffect to set up websocket connection when channel changes
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

  //useEffect to start/stop mic when micEnable changes
  useEffect(() => {
    if (micEnable) {
      // Start mic
      navigator.mediaDevices.getUserMedia({ audio: true }).then(async stream => {
        setMicrophoneStream(stream);
        //get audio context using the mic-processor driver
        const audioCtx = audioCtxRef.current!;
        await audioCtx.audioWorklet.addModule(BASE_URL + 'drivers/mic-processor.js');
        const source = audioCtx.createMediaStreamSource(stream);
        //create a mic that we can listen to
        const micNode = new AudioWorkletNode(audioCtx, 'mic-processor');
        micNode.port.onmessage = (event) => {
          const inputDataArray = Array.from(event.data);
          // Send audio data to server
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ 
              type: 'audio', 
              channel: channel, 
              data: inputDataArray ,
              sampleRate: audioCtxRef.current!.sampleRate
            }));
          }
        };
        source.connect(micNode).connect(audioCtx.destination);
      }).catch(err => {
        console.error("Error accessing microphone:", err);
        setMicEnable(false);
      });
    } else {
      // Stop mic
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }
    } //end if micEnable
  }, [micEnable]);

  return (
    <div>
      <div className="">
        <label htmlFor="channel" className="mr-2 text-3xl font-bold text-gray-200">Broadcast to: </label>
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
      <div className="">
        <Button className="mb-4 mt-2 text-[28px] font-bold w-full max-w-[80vw] h-12 px-6 py-2" variant="letu" onClick={async () => {
          setMicEnable(!micEnable);
        }}>
          {micEnable ? "Stop Mic" : "Start Mic"}
        </Button>

      </div>
    </div>
  );
}