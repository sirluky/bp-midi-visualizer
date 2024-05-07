import React, { useEffect, useMemo, useState } from "react";
import { MidiParser } from "~/lib/MidiParser";
import { GetMidiOutput } from "~/server/api/routers/midi";
import ReworkingPlayer from "./ReworkingPlayer";
import { nanoevents } from "./utils";
import { LyricsDisplayKaraoke } from "./Lyrics";
import { calculateTotalTime } from "./player/MIDIPlayer";
import { trpc } from "~/utils/api";
import { useMidiStore } from "./midiSettings/midiSettingsStore";
import { useAtom } from "jotai";
import { isWebMidiEnabledAtom } from "./useMidiPlayer";
import Head from "next/head";
import DownloadMidiButton from "./player/DownloadMidiButton";

interface PlayerProps {
  midi: GetMidiOutput;
}

export function Player({ midi }: PlayerProps) {
  const { data: midiConfig } = trpc.midi.getMidiConfig.useQuery({
    id: midi.id,
  });

  useEffect(() => {
    if (midiConfig) {
    }
  }, [midiConfig]);

  const midiData = useMemo(() => {
    const parsedMidi = MidiParser.parse(midi.midi);

    if (parsedMidi) {
      useMidiStore.getState().clearChannels();

      for (let instrument of parsedMidi.instruments) {
        let setChannels = useMidiStore.getState().setChannels;
        setChannels(instrument.channel, {
          channel: instrument.channel,
          enabled: true,
          solo: false,
          instrumentId: instrument.value,
        });
      }
    }

    return parsedMidi;
  }, [midi]);

  const [isWebMidiEnabled, setIsWebMidiEnabled] = useAtom(isWebMidiEnabledAtom);

  return (
    <div className="mx-auto max-w-4xl">
      <Head>
        <title>{midi.name} - Karaoke Midi přehrávač s vizualizací</title>
      </Head>

      <h2 className="mt-4 text-3xl font-bold">
        {midi.name}
        <span className="invisible">č</span>
      </h2>

      {midiData && <DownloadMidiButton midiData={midiData} midiMeta={midi} />}
      {midiData && <ReworkingPlayer config={midiConfig} parsedMidi={midiData?.data} totalTime={midiData?.totalTime} />}
      {midiData?.introText && midiData.introText.length > 0 && (
        <details className="text-gray-300">
          <summary className="text-xl font-bold mt-5 cursor-pointer">Úvodní text:</summary>
          <pre>{midiData?.introText}</pre>
        </details>
      )}
      {midiData?.lyrics && midiData?.lyrics.length > 0 ? (
        <LyricsIndexProvider>{midiIndex => <LyricsDisplayKaraoke midiIndex={midiIndex} lyrics={midiData.lyrics} />}</LyricsIndexProvider>
      ) : (
        <p className="text-gray-500">Tato skladba neobsahuje titulky.</p>
      )}
      <div className="mt-4">
        <input
          type="checkbox"
          id="webMidi"
          checked={isWebMidiEnabled}
          onChange={e => {
            if (!isWebMidiEnabled && !confirm("Chcete povolit WebMIDI? Zkontrolujte si zda máte v PC nainstalovaný synthetizer či připojené externí MIDI zařízení")) {
              return;
            }
            setIsWebMidiEnabled(e.target.checked);
            location.reload();
          }}
          className="mr-2"
        />
        <label htmlFor="webMidi" className="">
          Použití externího MIDI Synthetizéru - {isWebMidiEnabled ? "zapnuto (používá se WebMidi)" : "vypnuto (používá se simulovaný syntetizér)"}
        </label>
      </div>
    </div>
  );
}

function LyricsIndexProvider({ children }: { children: (index: number) => React.ReactNode }) {
  const [midiIndex, setMidiIndex] = useState(0);

  useEffect(() => {
    let ev = nanoevents.on("midi-index-change", (index: number) => {
      setMidiIndex(index);
    });

    return () => {
      ev();
    };
  }, []);

  return children(midiIndex);
}
