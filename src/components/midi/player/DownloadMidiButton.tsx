import React from "react";
import { write, MidiFile } from "midifile-ts";
import { MidiParser } from "~/lib/MidiParser";
import { useToast } from "~/components/ui/use-toast";
import { GetMidiOutput } from "~/server/api/routers/midi";

interface DownloadMidiProps {
  midiData: NonNullable<ReturnType<typeof MidiParser.parse>>;
  midiMeta: GetMidiOutput;
}

export default function DownloadMidiButton({ midiData, midiMeta }: DownloadMidiProps) {
  function download() {
    const midiFileData = write(midiData?.data.tracks, midiData.data.header.ticksPerBeat);
    const blob = new Blob([midiFileData], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = midiMeta?.name.replace(/\.mid$/, "") + ".mid";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button className="bg-green-600  px-4 py-2 rounded-lg mt-3 " onClick={() => download()}>
        Stáhnout MIDI
      </button>
    </div>
  );
}
