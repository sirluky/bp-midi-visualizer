import { MidiFile, read } from "@/lib/midifile-ts/src/index";
import { spectoda } from "@/lib/communication";

import { ChangeEventHandler, use, useEffect, useMemo, useState } from "react";
// import { midiIdAtom } from "../Search";
// import { downloadMidi, formatTime } from "../utils";
import InstrumentList from "./midiSettings/InstrumentList";
import { MIDIPlayer, Tick } from "./player/MIDIPlayer";
import { isWebMidiEnabledAtom, useMidiPlayer } from "./useMidiPlayer";
import { formatTime, nanoevents } from "./utils";
import { MIDIEvent, SynthEvent } from "@ryohey/wavelet";
import { NoteOffEvent } from "~/lib/midifile-ts/dist";
import { PlayPauseButton, StopButton } from "./player/Buttons";
import { AnyEventWithIndex } from "~/lib/MidiParser";
import { useSpectodaConnection } from "~/lib/useSpectodaConnection";
import { useAtom } from "jotai";
import { trpc } from "~/utils/api";
import { AnyChannelEvent, AnyEvent } from "midifile-ts";
import PreviewButton from "~/lib/SpectodaPreview";

let playMidi: (midi: MidiFile) => void;

const soundfontsArray = ["A320U.sf2", "TimGM6mb.sf2"];

function SoundFontPicker({ setup, loadProgress }: { setup: any; loadProgress: number }) {
  const [soundfonts, setSoundfonts] = useState<string[]>(soundfontsArray);
  const [selectedSoundfont, setSelectedSoundfont] = useState<string>("");

  function setSoundFont(value: string) {
    setSelectedSoundfont(value);
    setup(value);
  }

  return (
    <div className="mb-4 mt-3 flex flex-col items-center">
      <p className="font-bold dark:text-white">Výběr soundfontu</p>
      <select className="rounded-lg border bg-white px-4 py-2 leading-tight text-black focus:outline-none focus:ring dark:bg-gray-700 dark:text-white" value={selectedSoundfont} onChange={e => setSoundFont(e.target.value)}>
        {soundfonts.map(soundfont => (
          <option key={soundfont} value={soundfont}>
            {soundfont}
          </option>
        ))}
      </select>
      {loadProgress > 0 && (
        <div className="mt-2 flex w-full justify-center rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
          <div className="flex items-center space-x-2">
            <div className="max-w-sm w-full bg-gray-200 dark:bg-gray-500">
              <div className="h-2 rounded-lg bg-green-600" style={{ width: `${loadProgress}%` }}></div>
            </div>
            <span className="text-sm text-gray-700 dark:text-white">Načítání zvukového fontu</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReworkingPlayer({
  parsedMidi,
  totalTime,
  config,
}: {
  parsedMidi: MidiFile;
  totalTime: number;
  // config can be used to save default state for this midi song.
  config: unknown;
}) {
  const { playMIDI, pauseMIDI, stopMIDI, midiPlayer, setup, loadProgress, isPlaying, isStopped } = useMidiPlayer();
  const [isWebMidiEnabled, setIsWebMidiEnabled] = useAtom(isWebMidiEnabledAtom);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMIDI();
    } else {
      playMIDI(parsedMidi);
    }
  };

  const handleStop = () => {
    stopMIDI();
  };

  if (typeof window !== "undefined") {
    // kept, just for debugging purposes
    window.midifile = parsedMidi;
  }

  return (
    <div className="mt-2 flex flex-col items-center dark:text-white">
      {!isWebMidiEnabled && <SoundFontPicker setup={setup} loadProgress={loadProgress} />}

      <InstrumentList />
      <PreviewButton />
      <MidiEventsHistoryList />
      <div className="flex items-center">
        <PlayPauseButton isPlaying={isPlaying} onClick={handlePlayPause} />
        <div className="flex-grow">{midiPlayer && <Time midiPlayer={midiPlayer} totalTime={totalTime} />}</div>
        <StopButton onClick={handleStop} disabled={isStopped} />
      </div>
    </div>
  );
}

let timeobj = {
  time: 0,
};

let timeout: any;
function Time({ midiPlayer, totalTime }: { midiPlayer: MIDIPlayer; totalTime: number }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (midiPlayer) {
      midiPlayer.onProgress = progress => {
        setTime(progress);
        timeobj = { time: progress };
      };
    }
  }, [midiPlayer]);

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.valueAsNumber;

    console.log("Seeking to", newValue);

    midiPlayer.seek(newValue);
  }

  return (
    <div className="">
      {formatTime(time * totalTime)}
      <input className="mx-2" type="range" min="0" max="1" step="0.0001" value={time} onChange={seek} />
      {totalTime > 0 && formatTime(totalTime)}
    </div>
  );
}

function MidiEventsHistoryList() {
  const [events, setEvents] = useState<(AnyEvent & Tick)[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const clearEvents = () => setEvents([]);

    const ev = nanoevents.on("midichannelevent", event => {
      setEvents(prevEvents => [event, ...prevEvents].slice(0, 20));
    });

    return () => {
      ev();
      clearEvents();
    };
  }, []);

  return (
    <details className="relative max-h-[800px] overflow-y-auto rounded-lg p-4" open={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      <summary className="cursor-pointer text-lg font-semibold">Historie MIDI eventů</summary>
      {isOpen && (
        <ul>
          {events.map((event, index) => (
            <li key={index} className="border-b border-gray-300 p-2 text-left">
              Channel: {event.channel.toString().padStart(2, "0")} - {event.subtype}
              {(event.subtype === "noteOn" || event.subtype === "noteOff") && (
                <>
                  {" -> "} {event?.noteNumber}. Vel: {event?.velocity}
                </>
              )}
            </li>
          ))}
          {events && events.length === 0 && <p>Žádné eventy zatím</p>}
        </ul>
      )}
    </details>
  );
}
