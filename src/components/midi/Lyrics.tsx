import { useEffect, useState } from "react";
import { nanoevents } from "./utils";
import { LyricsWithIndex } from "~/lib/MidiParser";
import { cn } from "~/lib/utils";

interface LyricsDisplayProps {
  lyrics: LyricsWithIndex[];
  midiIndex: number;
}

export function LyricsDisplayKaraoke({ lyrics, midiIndex }: LyricsDisplayProps) {
  return (
    <>
      <h2 className="mt-5 text-xl font-bold">Text:</h2>
      <pre className="whitespace-pre-wrap">
        {lyrics.map((lyric, index) => (
          <span
            key={index}
            className={cn(lyric.index <= midiIndex && 'text-red-500', lyric.index === midiIndex && 'font-bold')}
          >
            {lyric.text}
          </span>
        ))}
      </pre>
    </>
  );
}