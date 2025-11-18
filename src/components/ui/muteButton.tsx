import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume, Volume2, VolumeX } from "lucide-react";

export default function MuteButton() {
  const [muted, setMuted] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const handlePlaybackChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;

      const detail = event.detail;
      const playing =
        typeof detail === "boolean"
          ? detail
          : typeof detail?.playing === "boolean"
          ? detail.playing
          : false;

      setIsAudioPlaying(playing);
      if (playing && muted) {
        setMuted(false);
      }
    };

    window.addEventListener("audio:playing-change", handlePlaybackChange);
    return () =>
      window.removeEventListener("audio:playing-change", handlePlaybackChange);
  }, [muted]);

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);

    if (newMutedState) setIsAudioPlaying(false);

    if (typeof (window as any).muteAudio === "function") {
      (window as any).muteAudio(newMutedState);
    }
  };

  const Icon = muted ? VolumeX : isAudioPlaying ? Volume2 : Volume;

  return (
    <Button
      onClick={toggleMute}
      variant="letu"
      size="icon"
      className="mt-[1vw] text-[28px] font-bold w-full max-w-[500px] h-14 px-6 py-2"
    >
      {/* className="h-18 w-18" */}
      <Icon  aria-hidden />
      {muted ? "Undeafen" : "Deafen"}
    </Button>
  );
}
