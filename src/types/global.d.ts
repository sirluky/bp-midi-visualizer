import { MidiFile } from "~/lib/midifile-ts/src";
import { Spectoda } from "~/lib/spectoda-js/Spectoda";

declare global {
  interface Window {
    nanoevents: createNanoEvents;
    spectoda: Spectoda;
    midifile: MidiFile;
  }
}
