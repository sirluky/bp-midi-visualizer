import { useEffect, useRef, useState } from "react";
import { nanoevents } from "./utils";
import { LyricsWithIndex } from "~/lib/MidiParser";
import { cn } from "~/lib/utils";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

interface LyricsDisplayProps {
  lyrics: LyricsWithIndex[];
  midiIndex: number;
}
export function LyricsDisplayKaraoke({ lyrics, midiIndex }: LyricsDisplayProps) {
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
    const currentIndex = lyrics.findIndex(lyric => lyric.index === midiIndex);

    let startIndex = 0;
    let endIndex = 0;
    let lineCount = 0;

    if (currentIndex !== -1) {
      startIndex = currentIndex;
      endIndex = currentIndex;

      while (startIndex > 0 && lineCount < 2) {
        if (lyrics[startIndex - 1].text === "\n") {
          lineCount++;
        }
        startIndex--;
      }

      lineCount = 0;

      while (endIndex < lyrics.length - 1 && lineCount < 3) {
        if (lyrics[endIndex + 1].text === "\n") {
          lineCount++;
        }
        endIndex++;
      }
    } else {
      // If midiIndex is -1, show the first 4 lines
      while (endIndex < lyrics.length - 1 && lineCount < 4) {
        if (lyrics[endIndex + 1].text === "\n") {
          lineCount++;
        }
        endIndex++;
      }
    }

    const visibleLyrics = lyrics.slice(startIndex, endIndex + 1);

    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <pre className="whitespace-pre-wrap text-[4vw]">
          {visibleLyrics.map((lyric, index) => (
            <span key={index} className={cn(lyric.index <= midiIndex && "text-red-500", lyric.index === midiIndex && "font-bold")}>
              {lyric.text}
            </span>
          ))}
        </pre>
        <button
          className="absolute top-4 right-4 px-4 py-2  text-white rounded"
          onClick={() => {
            handle.exit();
          }}
        >
          <ExitIcon />
        </button>
      </div>
    );
  };

  return (
    <>
      {lyrics?.length > 10 && (
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => handle.enter()}>
          {handle.active ? "Zavřít" : "Přepnout na celou obrazovku"}
        </button>
      )}

      <FullScreen handle={handle}>{handle.active ? renderKaraokeMode() : renderNormalMode()}</FullScreen>
    </>
  );
}

function ExitIcon({ className = "" }: { className?: string; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={cn("h-8 w-8", className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
