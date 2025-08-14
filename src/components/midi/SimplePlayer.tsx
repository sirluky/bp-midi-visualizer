import type { PlayerElement } from "html-midi-player";
import { useEffect, useMemo, useRef } from "react";
import { type GetMidiOutput } from "~/server/api/routers/midi";

interface PlayerProps {
  midi: GetMidiOutput;
}

function SimplePlayer({ midi }: PlayerProps) {
  const midiUrl = useMemo(() => {
    const blob = new Blob([midi.midi], { type: "audio/midi" });
    return URL.createObjectURL(blob);
  }, [midi]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* <h1 className="mb-3 text-4xl font-bold">Midi Karaoke přehrávač</h1> */}
      {/* Song name */}
      <h2 className="mt-4 text-3xl font-bold">
        {midi.name}
        <span className="invisible">č</span>
      </h2>
      <div className="text-black">
        {midiUrl && <PlayerMagenta midiUrl={midiUrl} />}
      </div>
      {/* <Lyrics /> */}
      <details className="mt-10 cursor-pointer">
        <summary className="font-bold ">Informace o přehrávači</summary>
        <p className="">
          Tento přehrávač se snaží napodobit starý, ale stále velmi populární{" "}
          <a href="http://www.vanbasco.com/">Vanbasco Karaoke Player</a> .
        </p>
      </details>
    </div>
  );
}

const playerElementRef = {
  current: null as PlayerElement | null,
};

function PlayerMagenta({ midiUrl }: { midiUrl: string }) {
  const playerRef = useRef<HTMLDivElement>(null);

  function switchSong(midiUrl: string) {
    const player = playerElementRef.current;
    if (!player) {
      return;
    }

    player.setAttribute("src", midiUrl);
  }

  useEffect(() => {
    const cleanup = () => {
      console.log("cleanup player", playerElementRef.current);
      if (playerElementRef.current) {
        console.log("cleanup", playerElementRef.current);
        playerElementRef.current.stop();
        playerElementRef.current.remove();
      }
      if (playerRef.current) {
        playerRef.current.innerHTML = "";
      }
    };

    const loadPlayerElement = async () => {
      try {
        const { PlayerElement } = await import("html-midi-player");
        console.log("player midi", PlayerElement);
        if (PlayerElement && playerRef.current) {
          cleanup();
          const playerContainer = playerRef.current;
          const player = new PlayerElement();
          player.soundFont =
            "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus";
          playerContainer.appendChild(player);
          playerElementRef.current = player; // Save the PlayerElement reference

          switchSong(midiUrl);
        }
      } catch (error) {
        console.error("Error loading PlayerElement:", error);
      }
    };

    void loadPlayerElement();

    return () => cleanup();
  }, [midiUrl]);

  return (
    <div>
      <div ref={playerRef}></div>
    </div>
  );
}
export default SimplePlayer;
