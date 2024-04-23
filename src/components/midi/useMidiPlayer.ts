import { SynthEvent, getSamplesFromSoundFont } from "@ryohey/wavelet";
import { MidiFile } from "midifile-ts";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { Stream, deserialize } from "@/lib/midifile-ts/src";
import { MIDIPlayer } from "./player/MIDIPlayer";
import { nanoevents } from "./utils";
import { useMidiStore } from "./midiSettings/midiSettingsStore";
import { MIDIOutputProcessor } from "./webMidiOutput";
import { atomWithLocalStorage } from "~/lib/utils";
import { useAtom } from "jotai";

let context: AudioContext | undefined;
let synth: AudioWorkletNode | undefined;
let soundFontData: ArrayBuffer | null = null;
const defaultSoundFont = "A320U.sf2";

const webMidiOutput = typeof window !== "undefined" ? new MIDIOutputProcessor() : undefined;

export const isWebMidiEnabledAtom = atomWithLocalStorage("isWebMidiEnabled", false);

export let currentBpm = 120;

export const useMidiPlayer = () => {
  const [synthSetupDone, setSynthSetupDone] = useState(false);
  const [soundFontLoaded, setSoundFontLoaded] = useState(false);
  const midiPlayerRef = useRef<MIDIPlayer | null>(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStopped, setIsStopped] = useState(true);
  const [bpm, setBPM] = useState(120);
  const { checkChannelEnabledById } = useMidiStore();
  const [isWebMidiEnabled] = useAtom(isWebMidiEnabledAtom);

  useEffect(() => {
    nanoevents.on("bpm-change", (bpm: number) => {
      console.log("BPM changed", bpm);
      setBPM(bpm);

      currentBpm = bpm;
    });
  }, []);

  const setupSynth = async () => {
    midiPlayerRef?.current?.stop();
    try {
      if (typeof window !== "undefined") {
        context = new AudioContext();
        await context.audioWorklet.addModule("/js/processor.js");
        synth = new AudioWorkletNode(context, "synth-processor", {
          numberOfInputs: 0,
          outputChannelCount: [2],
        } as any);
        synth.connect(context.destination);
        setSynthSetupDone(true);
      }
    } catch (e) {
      console.error("Failed to add AudioWorklet module", e);
    }
  };

  const loadSoundFont = async (soundfonturl: string) => {
    setLoadProgress(10);
    setIsPlaying(false);
    setIsStopped(true);

    // Check if the soundfont is already cached
    const cacheKey = `soundfont-${soundfonturl}`;
    const cachedData = await getCachedSoundfont(cacheKey);

    if (cachedData) {
      console.log("Loading soundfont from cache");
      soundFontData = cachedData;
    } else {
      console.log("Loading soundfont from network");
      let sfdata: Response | undefined;
      try {
        sfdata = await fetch(`/soundfonts/${soundfonturl}`);
        if (sfdata.status !== 200) {
          sfdata = await fetch(`/public/soundfonts/${soundfonturl}`, {
            cache: "force-cache",
          });
        }
        if (sfdata.status === 200) {
          soundFontData = await sfdata.arrayBuffer();
          await cacheSoundfont(cacheKey, soundFontData);
        }
      } catch (err) {
        console.error("Failed to load soundfont", err);
      }
    }

    setLoadProgress(90);
    if (soundFontData && context) {
      const parsed = getSamplesFromSoundFont(new Uint8Array(soundFontData), context);
      for (const sample of parsed) {
        postSynthMessage(sample, [sample.sample.buffer]);
      }
      setSoundFontLoaded(true);
    }
    setLoadProgress(100);
    setTimeout(() => {
      setLoadProgress(0);
    });
  };

  // Function to retrieve the soundfont from the cache
  const getCachedSoundfont = async (cacheKey: string): Promise<ArrayBuffer | null> => {
    try {
      const cache = await caches.open("soundfont-cache");
      const response = await cache.match(cacheKey);
      if (response) {
        return await response.arrayBuffer();
      }
    } catch (err) {
      console.error("Failed to retrieve soundfont from cache", err);
    }
    return null;
  };

  // Function to cache the soundfont
  const cacheSoundfont = async (cacheKey: string, data: ArrayBuffer): Promise<void> => {
    try {
      const cache = await caches.open("soundfont-cache");
      const response = new Response(data);
      await cache.put(cacheKey, response);
    } catch (err) {
      console.error("Failed to cache soundfont", err);
    }
  };

  const postSynthMessage = (e: SynthEvent, transfer?: Transferable[]) => {
    if (e.type === "midi" && e.midi.subtype === "noteOn" && checkChannelEnabledById(e.midi.channel) === false) {
      return;
    }

    if (isWebMidiEnabled) {
      webMidiOutput?.processMIDIEvent(e);
    } else if (synth) {
      synth.port.postMessage(e, transfer ?? []);
    }
  };

  // const setupMIDIInput = async () => {
  //   if (navigator.requestMIDIAccess) {
  //     const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
  //     midiAccess.inputs.forEach((entry: WebMidi.MIDIInput) => {
  //       entry.onmidimessage = (event: WebMidi.MIDIMessageEvent) => {
  //         const e = deserialize(new Stream(event.data), 0, () => {});
  //         if ("channel" in e) {
  //           postSynthMessage({ type: "midi", midi: e, delayTime: 0 });
  //         }
  //       };
  //     });
  //   }
  // };

  const setup = async (soundfonturl = defaultSoundFont) => {
    await setupSynth();
    loadSoundFont(soundfonturl);
  };

  function cleanMIDIPlayer() {
    if (midiPlayerRef?.current) {
      stopMIDI();
    }
  }

  useEffect(() => {
    setup();

    return cleanMIDIPlayer;
  }, []);

  const playMIDI = (midi: MidiFile) => {
    if (synthSetupDone && soundFontLoaded && context) {
      if (isStopped) {
        cleanMIDIPlayer();
        context.resume();
        console.log("Playing MIDI", midi, context.sampleRate, postSynthMessage);
        const midiPlayerNew = new MIDIPlayer(midi, context.sampleRate, postSynthMessage);

        midiPlayerRef.current = midiPlayerNew;
        midiPlayerNew.resume();
        setIsPlaying(true);
        setIsStopped(false);
        return midiPlayerNew;
      } else if (midiPlayerRef.current && !isPlaying) {
        midiPlayerRef.current.resume();
        setIsPlaying(true);
      }
    }
  };

  const pauseMIDI = () => {
    if (midiPlayerRef.current) {
      midiPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopMIDI = () => {
    if (midiPlayerRef.current) {
      midiPlayerRef.current.stop();
      setIsPlaying(false);
      setIsStopped(true);
      nanoevents.emit("midi-index-change", 0);
    }
  };

  useEffect(() => {
    setup();

    return () => {
      cleanMIDIPlayer();
    };
  }, []);

  return {
    playMIDI,
    pauseMIDI,
    stopMIDI,
    loadSoundFont,
    setup,
    midiPlayer: midiPlayerRef.current,
    loadProgress,
    isPlaying,
    isStopped,
  };
};
