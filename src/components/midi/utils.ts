import { createNanoEvents } from "nanoevents";
import { atom } from "jotai";
import { AnyEventWithIndex } from "~/lib/MidiParser";
import { TimeTrack } from "~/lib/spectoda-js/TimeTrack";
import { Tick } from "./player/MIDIPlayer";
import { AnyChannelEvent } from "~/lib/midifile-ts/dist";

// TODO add typescript types (you can read this in docs)
interface Events {
  "midi-index-change": (index: number) => void;
  midichannelevent: (event: AnyChannelEvent & Tick & { enabled: Boolean }) => void;
  "bpm-change": (bpm: number) => void;
  midievent: (event: AnyEventWithIndex & Tick) => void;
}

export const nanoevents = createNanoEvents<Events>();

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(Math.floor(remainingSeconds)).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}
