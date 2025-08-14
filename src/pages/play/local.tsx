import React, { useRef, useState } from "react";
import { MidiParser } from "~/lib/MidiParser";
import { type GetMidiOutput } from "~/server/api/routers/midi";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { Player } from "~/components/midi/Player";
import Link from "next/link";

export default function LocalFile() {
  const [midiData, setMidiData] = useState<GetMidiOutput | null>(null);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      void handleLoadFile(file);
    } else {
      toast({
        title: "Nevybrán žádný soubor",
        description: "Prosím vyberte MIDI soubor pro načtení",
        type: "background",
      });
    }
  };

  const handleLoadFile = async (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const midiData = new Uint8Array(arrayBuffer);

      setMidiData(prepareMidiFromFile(midiData, file));
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      {
        !file && <div className="my-3 mb-5">
          Nemáte MIDI soubor? Vyzkoušejte: <Link href="/play/demo" className=" link link-warning mt-4">Ukázkové MIDI</Link>
        </div>
      }

      <div>
        <input type="file" accept=".mid,.midi" onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} id="fileInput" />
        <label htmlFor="fileInput" className={cn("cursor-pointer text-nowrap  rounded px-4 py-2 text-sm font-bold dark:text-white", !file ? "bg-blue-500" : "bg-blue-700")}>
          {file ? "Načteno: " + file.name : "Načíst lokální MIDI soubor"}
        </label>
      </div>
      {midiData && (
        <div>
          <Player midi={midiData} />
        </div>
      )}
    </div>
  );
}

function prepareMidiFromFile(midi: Uint8Array, file: File): GetMidiOutput {
  const parsedMidi = MidiParser.parse(midi);

  const { introText, lyrics } = parsedMidi ?? {
    introText: [],
    lyrics: [],
  };
  const headerText = introText.join("").trim();
  const plainLyrics = lyrics
    .map(v => v.text)
    .join("")
    .trim();

  return {
    midi: midi,
    description: headerText,
    text: plainLyrics,
    name: file.name,
    id: 0,
    userId: "local",
  };
}
