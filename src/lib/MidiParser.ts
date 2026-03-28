import { read } from "@/lib/midifile-ts/src/index";
import { AnyEvent, MidiFile } from "@/lib/midifile-ts";

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

function calculateTotalTime(midi: MidiFile): number {
  let totalTime = 0;
  let tempoMicroseconds = 500000;

  midi.tracks.forEach(track => {
    let currentTime = 0;
    let currentTick = 0;

    track.forEach(event => {
      currentTick += event.deltaTime;

      if (event.type === "meta" && event.subtype === "setTempo") {
        tempoMicroseconds = event.microsecondsPerBeat;
      }

      const deltaMicroseconds = (currentTick * tempoMicroseconds) / midi.header.ticksPerBeat;
      currentTime = deltaMicroseconds / 1000000;
    });

    if (currentTime > totalTime) {
      totalTime = currentTime;
    }
  });

  return totalTime;
}

export class MidiParser {
  static parse(midiData: Uint8Array) {
    try {
      const lyrics: LyricsWithIndex[] = [];
      const introText: string[] = [];
      const instruments: InstrumentWithIndex[] = [];
      let endEvent = null;
      let lyricsCounter = 0;

      const parsedMidi = read(midiData, "windows-1250");

      const addIndexToEvents = (midi: MidiFile) => {
        midi.tracks.forEach((track, trackIndex) => {
          // @ts-expect-error - Property 'index' does not exist on type 'AnyEvent'.
          track.forEach((event: AnyEvent & WithIndex, eventIndex) => {
            event.index = eventIndex;
            event.trackIndex = trackIndex;

            if (event.type === "meta") {
              switch (event.subtype) {
                case "lyrics":
                  {
                    const text = event.text.replace("\r", "\n");
                    lyrics.push({ text, index: lyricsCounter, trackIndex });
                    lyricsCounter++;
                  }
                  break;
                case "text":
                  {
                    const text = event.text.replace("@T", "\n\n").replace("@", "\n").replace("\\", "\n\n").replace("/", "\n");
                    const splitText = text.split("\n");
                    splitText.forEach((part) => {
                      if (part) {
                        lyrics.push({ text: part, index: lyricsCounter, trackIndex });
                      } else {
                        lyrics.push({ text: "\n", index: lyricsCounter, trackIndex });
                      }
                    });
                    lyricsCounter++;
                  }
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

      console.log({ lyrics });
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
