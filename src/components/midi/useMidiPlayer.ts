import { MidiFile } from "@/lib/midifile-ts";
import { useEffect, useRef, useState } from "react";
import { MIDIPlayer } from "./player/MIDIPlayer";
import { nanoevents } from "./utils";
import { useMidiStore } from "./midiSettings/midiSettingsStore";
import { MIDIOutputProcessor } from "./webMidiOutput";
import { atomWithLocalStorage } from "~/lib/utils";
import { useAtom } from "jotai";
import { WorkletSynthesizer } from "spessasynth_lib";
import { ScheduledSynthEvent } from "./player/ScheduledSynthEvent";

let context: AudioContext | undefined;
let synth: WorkletSynthesizer | undefined;
let soundFontData: ArrayBuffer | null = null;
const defaultSoundFont = "A320U.sf2";
const defaultSoundBankId = "main";
let currentSoundBankId = defaultSoundBankId;

const webMidiOutput = typeof window !== "undefined" ? new MIDIOutputProcessor() : undefined;

export const isWebMidiEnabledAtom = atomWithLocalStorage("isWebMidiEnabled", false);

export let currentBpm = 120;

export const useMidiPlayer = () => {
  const [synthSetupDone, setSynthSetupDone] = useState(false);
  const [soundFontLoaded, setSoundFontLoaded] = useState(false);
  const midiPlayerRef = useRef<MIDIPlayer | null>(null);
  const setupRunIdRef = useRef(0);

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

  const disposeSynth = async () => {
    setSynthSetupDone(false);

    if (synth) {
      synth.destroy();
      synth = undefined;
    }

    if (context) {
      await context.close();
      context = undefined;
    }
  };

  const isValidSoundFontData = (buffer: ArrayBuffer) => {
    if (buffer.byteLength < 12) {
      return false;
    }

    const view = new Uint8Array(buffer);
    const header = String.fromCharCode(...view.slice(0, 4)).toLowerCase();
    const format = String.fromCharCode(...view.slice(8, 12)).toLowerCase();
    return header === "riff" && (format === "sfbk" || format === "sfpk" || format === "dls ");
  };

  const isGitLfsPointer = (buffer: ArrayBuffer) => {
    const head = new TextDecoder().decode(buffer.slice(0, 80));
    return head.startsWith("version https://git-lfs.github.com/spec/v1");
  };

  const setupSynth = async (runId = setupRunIdRef.current) => {
    midiPlayerRef?.current?.stop();
    await disposeSynth();
    setSoundFontLoaded(false);

    try {
      if (typeof window !== "undefined") {
        const localContext = new AudioContext();

        if (runId !== setupRunIdRef.current) {
          await localContext.close();
          return false;
        }

        // Cache-bust to avoid stale/broken worklet script in dev.
        const workletUrl = `/js/spessasynth_processor.min.js?v=${Date.now()}`;
        await localContext.audioWorklet.addModule(workletUrl);

        if (runId !== setupRunIdRef.current) {
          await localContext.close();
          return false;
        }

        const localSynth = new WorkletSynthesizer(localContext);
        localSynth.connect(localContext.destination);
        await localSynth.isReady;

        if (runId !== setupRunIdRef.current) {
          localSynth.destroy();
          await localContext.close();
          return false;
        }

        context = localContext;
        synth = localSynth;
        setSynthSetupDone(true);
        return true;
      }
    } catch (e) {
      console.error("Failed to initialize SpessaSynth AudioWorklet", e);
      await disposeSynth();
    }

    return false;
  };

  const loadSoundFont = async (soundfonturl: string, runId = setupRunIdRef.current) => {
    if (!synth || runId !== setupRunIdRef.current) {
      return;
    }

    setLoadProgress(10);
    setIsPlaying(false);
    setIsStopped(true);
    setSoundFontLoaded(false);

    // Check if the soundfont is already cached
    const cacheKey = `soundfont-${soundfonturl}`;
    const cachedData = await getCachedSoundfont(cacheKey);

    if (cachedData && isValidSoundFontData(cachedData)) {
      console.log("Loading soundfont from cache");
      soundFontData = cachedData;
    } else {
      if (cachedData) {
        await deleteCachedSoundfont(cacheKey);
      }

      console.log("Loading soundfont from network");
      try {
        const sourceUrl = /^https?:\/\//i.test(soundfonturl) ? soundfonturl : `/soundfonts/${soundfonturl}`;
        const sfdata = await fetch(sourceUrl);

        if (!sfdata.ok) {
          throw new Error(`Unable to fetch soundfont ${soundfonturl}: HTTP ${sfdata.status}`);
        }

        const loadedBuffer = await sfdata.arrayBuffer();
        if (!isValidSoundFontData(loadedBuffer)) {
          if (isGitLfsPointer(loadedBuffer)) {
            throw new Error(`Soundfont ${soundfonturl} is a Git LFS pointer, not real SF2 data. Run 'git lfs pull' or replace the file in public/soundfonts.`);
          }
          throw new Error("Downloaded file is not a valid SF2/SF3/DLS soundfont");
        }

        soundFontData = loadedBuffer;
        await cacheSoundfont(cacheKey, loadedBuffer);
      } catch (err) {
        console.error("Failed to load soundfont", err);
        soundFontData = null;
      }
    }

    if (!soundFontData || runId !== setupRunIdRef.current || !synth) {
      setLoadProgress(0);
      return;
    }

    setLoadProgress(90);

    try {
      const newSoundBankId = `${defaultSoundBankId}-${Date.now()}`;
      await synth.soundBankManager.addSoundBank(soundFontData, newSoundBankId);

      if (currentSoundBankId !== newSoundBankId) {
        const bankCount = synth.soundBankManager.soundBankList.length;
        if (bankCount > 1) {
          try {
            await synth.soundBankManager.deleteSoundBank(currentSoundBankId);
          } catch {
            // Ignore if the old bank is already missing.
          }
        }
      }

      currentSoundBankId = newSoundBankId;
      setSoundFontLoaded(true);
    } catch (error) {
      console.error("Failed to apply soundfont to SpessaSynth", error);
      setSoundFontLoaded(false);
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

  const deleteCachedSoundfont = async (cacheKey: string): Promise<void> => {
    try {
      const cache = await caches.open("soundfont-cache");
      await cache.delete(cacheKey);
    } catch (err) {
      console.error("Failed to delete cached soundfont", err);
    }
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

  const postSynthMessage = (e: ScheduledSynthEvent) => {
    if (e.midi.subtype === "noteOn" && checkChannelEnabledById(e.midi.channel) === false) {
      return;
    }

    if (isWebMidiEnabled) {
      webMidiOutput?.processMIDIEvent(e);
      return;
    }

    if (!synth || !context) {
      return;
    }

    const eventTime = Math.max(context.currentTime, context.currentTime + e.delayTime / context.sampleRate);
    const eventOptions = { time: eventTime };

    switch (e.midi.subtype) {
      case "noteOn":
        if (e.midi.velocity === 0) {
          synth.noteOff(e.midi.channel, e.midi.noteNumber, eventOptions);
          return;
        }
        synth.noteOn(e.midi.channel, e.midi.noteNumber, e.midi.velocity, eventOptions);
        return;
      case "noteOff":
        synth.noteOff(e.midi.channel, e.midi.noteNumber, eventOptions);
        return;
      case "controller":
        if (e.midi.controllerType === 0 || e.midi.controllerType === 32) {
          console.log(`[MIDI] ch${e.midi.channel} bank CC${e.midi.controllerType}=${e.midi.value}`);
        }
        synth.controllerChange(e.midi.channel, e.midi.controllerType as never, e.midi.value, eventOptions);
        return;
      case "programChange":
        console.log(`[MIDI] ch${e.midi.channel} programChange: program=${e.midi.value}`);
        synth.programChange(e.midi.channel, e.midi.value, eventOptions);
        return;
      case "channelAftertouch":
        synth.channelPressure(e.midi.channel, e.midi.amount, eventOptions);
        return;
      case "noteAftertouch":
        synth.polyPressure(e.midi.channel, e.midi.noteNumber, e.midi.amount, eventOptions);
        return;
      case "pitchBend":
        synth.pitchWheel(e.midi.channel, e.midi.value, eventOptions);
        return;
      default:
        return;
    }
  };

  const setup = async (soundfonturl = defaultSoundFont) => {
    const runId = ++setupRunIdRef.current;
    const isReady = await setupSynth(runId);
    if (!isReady || runId !== setupRunIdRef.current) {
      return;
    }

    await loadSoundFont(soundfonturl, runId);
  };

  function cleanMIDIPlayer() {
    if (midiPlayerRef?.current) {
      stopMIDI();
      midiPlayerRef.current = null;
    }
  }

  const playMIDI = (midi: MidiFile) => {
    if (synthSetupDone && soundFontLoaded && context) {
      if (isStopped) {
        cleanMIDIPlayer();
        void context.resume();
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

    if (!isWebMidiEnabled) {
      synth?.stopAll(true);
    }
  };

  useEffect(() => {
    void setup();

    return () => {
      setupRunIdRef.current += 1;
      cleanMIDIPlayer();
      void disposeSynth();
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
