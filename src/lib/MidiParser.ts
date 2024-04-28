import { read } from "@/lib/midifile-ts/src/index";
import { AnyEvent, MidiFile } from "midifile-ts";
import { calculateTotalTime } from "~/components/midi/player/MIDIPlayer";

interface Instrument {
  channel: number;
  deltaTime: number;
  subtype: "programChange";
  type: "channel";
  value: number;
}

interface Lyric {
  text: string;
}

interface WithIndex {
  index: number;
  trackIndex?: number;
}

export type InstrumentWithIndex = Instrument & WithIndex;
export type AnyEventWithIndex = AnyEvent & WithIndex;
export type LyricsWithIndex = Lyric & WithIndex;
export class MidiParser {
  static parse(midiData: Uint8Array) {
    try {
      const lyrics: LyricsWithIndex[] = [];
      const introText: string[] = [];
      const instruments: InstrumentWithIndex[] = [];
      let endEvent = null;

      const parsedMidi = read(midiData);

      const addIndexToEvents = (midi: MidiFile) => {
        midi.tracks.forEach((track, trackIndex) => {
          // @ts-expect-error - Property 'index' does not exist on type 'AnyEvent'.
          track.forEach((event: AnyEvent & WithIndex, eventIndex) => {
            event.index = eventIndex;
            event.trackIndex = trackIndex;

            if (event.type === "meta") {
              switch (event.subtype) {
                case "lyrics":
                  const text = event.text.replace("\r", "\n");
                  lyrics.push({ text, index: eventIndex, trackIndex });
                  break;
                case "text":
                  introText.push(event.text);
                  break;
                default:
                  break;
              }
            }

            if (event.type === "channel" && event.subtype === "programChange") {
              instruments.push(event);
            }
          });
        });
      };

      addIndexToEvents(parsedMidi!);

      const data = {
        introText: introText,
        lyrics: lyrics,
        endEvent,
        instruments: instruments,
        data: parsedMidi,
        totalTime: calculateTotalTime(parsedMidi),
      };

      return data;
    } catch (err) {
      console.log(err);
    }
  }
}
