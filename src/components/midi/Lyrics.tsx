import { useEffect, useRef, useState } from "react";
import { nanoevents } from "./utils";
import { LyricsWithIndex } from "~/lib/MidiParser";
import { cn } from "~/lib/utils";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

interface LyricsDisplayProps {
  lyrics: LyricsWithIndex[];
  midiIndex: number;
  onToggleFullscreen: () => void;
}
export function LyricsDisplayKaraoke({ lyrics, midiIndex, onToggleFullscreen }: LyricsDisplayProps) {
  const handle = useFullScreenHandle();

  const renderNormalMode = () => (
    <>
      <h2 className="mt-5 text-xl font-bold">Text:</h2>
      <pre className="whitespace-pre-wrap">
        {lyrics.map((lyric, index) => (
          <span key={index} className={cn(lyric.index <= midiIndex && "text-red-500", lyric.index === midiIndex && "font-bold")}>
            {lyric.text}
          </span>
        ))}
      </pre>
    </>
  );
  const renderKaraokeMode = () => {
    // Find the current lyric index
    const currentIndex = lyrics.findIndex(lyric => lyric.index === midiIndex);

    // Look backward for the start of the line (\n)
    let startIndex = currentIndex;
    while (startIndex > 0 && lyrics[startIndex - 1].text !== "\n") {
      startIndex--;
    }

    // Find the next 4 lines and display them
    let endIndex = startIndex;
    let lineCount = 0;
    while (endIndex < lyrics.length && lineCount < 4) {
      if (lyrics[endIndex]?.text === "\n") {
        lineCount++;
      }
      endIndex++;
    }

    const visibleLyrics = lyrics.slice(startIndex, endIndex);

    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <pre className="whitespace-pre-wrap text-[5vw]">
          {visibleLyrics.map((lyric, index) => (
            <span key={index} className={cn(lyric.index <= midiIndex && "text-red-500", lyric.index === midiIndex && "font-bold")}>
              {lyric.text}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => handle.enter()}>
        {handle.active ? "Zavřít" : "Přepnout na celou obrazovku"}
      </button>
      <FullScreen handle={handle}>{handle.active ? renderKaraokeMode() : renderNormalMode()}</FullScreen>
    </>
  );
}
