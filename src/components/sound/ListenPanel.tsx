import { useState } from "react";
import ListenAudio from "./ListenAudio";
import MuteButton from "@/components/ui/muteButton";
import { Button } from "@/components/ui/button";

export default function ListenPanel() {
  const [muted, setMuted] = useState(false);

  return (
    <>
      <div className="mt-2 mx-auto flex justify-center font-bold border-yellow-400 border-10 w-full h-[16vw] md:border-10 md:w-[70vw] md:h-[16vw]">
        <ListenAudio muted={muted} />
      </div>
      <div className="flex flex-col items-center space-y-4">
        <MuteButton muted={muted} setMuted={setMuted} />
        <Button
          variant="letu"
          className="mt-[1vw] text-[28px] font-bold w-50 h-50 rounded-full px-6 py-2"
        >Ask A<br />Question</Button>
      </div>
    </>
  );
}
