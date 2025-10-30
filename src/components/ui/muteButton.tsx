import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MuteButton() {
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    console.log("Toggling mute. Current state:", muted);
    setMuted(!muted);
    const audioElement = document.querySelector("audio");
    if (audioElement) {
      audioElement.muted = !muted;
    }
  };

  return (
    <Button 
        onClick={toggleMute}
        variant="letu"
        className="mt-[1vw] text-[28px] font-bold w-full max-w-[500px] h-14 px-6 py-2"
    >
      {muted ? "Unmute" : "Mute"}
    </Button>
  );
};