import { useState } from "react";
import ListenAudio from "./ListenAudio";
import MuteButton from "@/components/ui/muteButton";
import { Button } from "@/components/ui/button";

export default function ListenPanel() {
  const [muted, setMuted] = useState(false);

  return (
    <>
      {/* Audio and logo section */}
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full flex justify-center">
          <ListenAudio muted={muted} />
        </div>
        <div className="relative flex flex-col items-center pb-6">
          <img
            src={"images/gridPaper4K - Copy.jpg"}
            className="w-full max-w-[400px] h-[300px] object-cover"
            alt="Background"
          />
          <img
            src={"images/letu-logo.png"}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[250px] mx-auto h-[250px] object-cover"
            alt="LETU Logo"
          />
          <div className="mt-[270px] flex flex-col items-center w-full">
            <MuteButton muted={muted} setMuted={setMuted} />
          </div>
        </div>
      </div>
    </>
  );
}
