import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function MuteButton() {
  const [muted, setMuted] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const handlePlaybackChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const nextState = Boolean(event.detail);
      setIsAudioPlaying(nextState);
      if (nextState && muted) {
        setMuted(false);
      }
    };
  });
  
  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);

    // Call the global mute function
    if (typeof (window as any).muteAudio === "function") {
      (window as any).muteAudio(newMutedState);
    }
  };

  return (
    <Button
      onClick={toggleMute}
      variant="letu"
      className="mt-[1vw] text-[28px] font-bold w-full max-w-[500px] h-14 px-6 py-2"
    >
      {muted ? "Undeafen" : "Deafen"}
    </Button>
  );
}
