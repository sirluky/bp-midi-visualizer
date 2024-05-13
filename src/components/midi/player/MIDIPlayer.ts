import { SynthEvent } from "@ryohey/wavelet";
import { AnyEvent, EndOfTrackEvent, MIDIControlEvents, MidiFile } from "@/lib/midifile-ts";
import { useMidiStore } from "../midiSettings/midiSettingsStore";
import { nanoevents } from "../utils";
import EventScheduler from "./EventScheduler";
import { AnyEventWithIndex } from "~/lib/MidiParser";

export interface Tick {
  tick: number;
  track: number;
}

function addTick(events: AnyEvent[], track: number): (AnyEvent & Tick)[] {
  let tick = 0;

  return events.map(e => {
    tick += e.deltaTime;
    return { ...e, tick, track };
  });
}

export const isEndOfTrackEvent = (e: AnyEvent): e is EndOfTrackEvent => "subtype" in e && e.subtype === "endOfTrack";

const TIMER_INTERVAL = 100;
const LOOK_AHEAD_TIME = 50;

export class MIDIPlayer {
  private output: (e: SynthEvent) => void;
  private tempo = 120;
  private interval: number | undefined;
  private midi: MidiFile;
  private sampleRate: number;
  private tickedEvents: (AnyEventWithIndex & Tick)[];
  private scheduler: EventScheduler<AnyEventWithIndex & Tick>;
  private endOfSong: number;
  onProgress?: (progress: number) => void;

  constructor(midi: MidiFile, sampleRate: number, output: (e: SynthEvent) => void) {
    this.midi = midi;
    this.sampleRate = sampleRate;
    this.output = output;
    console.log({ midilll: midi });
    // @ts-expect-error - Property 'tracks' does not exist on type 'MidiFile'.
    this.tickedEvents = midi.tracks.flatMap(addTick).sort((a, b) => a.tick - b.tick);
    this.scheduler = new EventScheduler(this.tickedEvents, 0, this.midi.header.ticksPerBeat, TIMER_INTERVAL + LOOK_AHEAD_TIME);
    this.endOfSong = Math.max(...this.tickedEvents.filter(isEndOfTrackEvent).map(e => e.tick));
    this.resetControllers();
  }

  resume() {
    if (this.interval === undefined) {
      this.interval = window.setInterval(() => this.onTimer(), TIMER_INTERVAL);
    }
  }

  pause() {
    clearInterval(this.interval);
    this.interval = undefined;
    this.allSoundsOff();
  }

  stop() {
    this.pause();
    this.resetControllers();
    this.scheduler.seek(0);
    this.onProgress?.(0);
  }

  // 0: start, 1: end
  seek(position: number) {
    this.allSoundsOff();
    this.scheduler.seek(position * this.endOfSong);
  }

  private allSoundsOff() {
    for (let i = 0; i < 16; i++) {
      this.output({
        type: "midi",
        midi: {
          type: "channel",
          subtype: "controller",
          controllerType: MIDIControlEvents.ALL_SOUNDS_OFF,
          channel: i,
          value: 0,
        },
        delayTime: 0,
      });
    }
  }

  private resetControllers() {
    for (let i = 0; i < 16; i++) {
      this.output({
        type: "midi",
        midi: {
          type: "channel",
          subtype: "controller",
          controllerType: MIDIControlEvents.RESET_CONTROLLERS,
          channel: i,
          value: 0,
        },
        delayTime: 0,
      });
    }
  }

  private onTimer() {
    const now = performance.now();
    const events = this.scheduler.readNextEvents(this.tempo, now);

    events.forEach(({ event, timestamp }) => {
      const delayTime = ((timestamp - now) / 1000) * this.sampleRate;
      // @ts-ignore - TODO FIX Property 'enabled' does not exist on type 'AnyEventWithIndex & Tick'.
      const synthEvent = this.handleEvent(event, delayTime);
      if (synthEvent !== null) {
        this.output(synthEvent);
      }
    });

    if (this.scheduler.currentTick >= this.endOfSong) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    this.onProgress?.(this.scheduler.currentTick / this.endOfSong);
  }

  private handleEvent(e: AnyEventWithIndex & Tick & { enabled: Boolean }, delayTime: number): SynthEvent | null {
    nanoevents.emit("midievent", e);

    switch (e.type) {
      case "channel":
        e.enabled = useMidiStore.getState().checkChannelEnabledById(e.channel);

        if (e.subtype === "controller" && e.controllerType === 32) {
          return null;
        }

        if (["noteOn", "noteOff"].includes(e.subtype)) {
          nanoevents.emit("midichannelevent", e);
        }

        return {
          type: "midi",
          midi: e,
          delayTime,
        };

      case "meta":
        switch (e.subtype) {
          case "setTempo":
            this.tempo = (60 * 1000000) / e.microsecondsPerBeat;

            // convert to bpm
            nanoevents.emit("bpm-change", this.tempo);
            break;
          // we could update index always but it's not necessary and more performant
          case "lyrics":
            nanoevents.emit("midi-index-change", e.index);
          case "text":
            nanoevents.emit("midi-index-change", e.index);
            break;
          default:
            console.warn(`not supported meta event`, e);
            break;
        }
    }
    return null;
  }
}

export function calculateTotalTime(midi: MidiFile): number {
  let totalTime = 0;
  let tempoMicroseconds = 500000; // Default tempo is 120 BPM (500000 microseconds per beat)

  midi.tracks.forEach(track => {
    let currentTime = 0;
    let currentTick = 0;

    track.forEach(event => {
      currentTick += event.deltaTime;

      if (event.type === "meta" && event.subtype === "setTempo") {
        tempoMicroseconds = event.microsecondsPerBeat;
      }

      const deltaMicroseconds = (currentTick * tempoMicroseconds) / midi.header.ticksPerBeat;
      currentTime = deltaMicroseconds / 1000000; // Convert microseconds to seconds
    });

    if (currentTime > totalTime) {
      totalTime = currentTime;
    }
  });

  return totalTime;
}
