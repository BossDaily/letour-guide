
import { Button } from "@/components/ui/button";

type MuteButtonProps = {
  muted: boolean;
  setMuted: (value: boolean) => void;
};

export default function MuteButton({ muted, setMuted }: MuteButtonProps) {
  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);

    // Call the global mute function
    if (typeof (window as any).muteAudio === 'function') {
      (window as any).muteAudio(newMutedState);
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
}