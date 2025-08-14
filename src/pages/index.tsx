import { type ChangeEventHandler, useRef, useState } from "react";
import { trpc } from "~/utils/api";
import { read } from "@/lib/midifile-ts/src/index";
import { MidiParser } from "~/lib/MidiParser";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useAtom } from "jotai";
import { atomWithLocalStorage } from "~/lib/utils";

type UploadStatus = Record<string, "nahrávání souboru" | "úspěšně nahráno" | "chyba při nahrávání" | "poškozený soubor">;

const onlyWithLyricsAtom = atomWithLocalStorage("only-with-lyrics-filter", false);

export default function MidiList() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const uploadMidi = trpc.midi.upload.useMutation();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [onlyWithLyrics, setOnlyWithLyrics] = useAtom(onlyWithLyricsAtom);

  const midiList = trpc.midi.list.useQuery({
    query: searchQuery,
    onlyWithLyrics: onlyWithLyrics,
  });

  const trpcUtils = trpc.useUtils();
  const removeMidi = trpc.midi.remove.useMutation({
    onSuccess: () => {
      void trpcUtils.midi.invalidate();
    },
  });

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(false);
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    for await (const file of files) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const midiData = new Uint8Array(arrayBuffer);
          let parsedMidi;
          try {
            parsedMidi = MidiParser.parse(midiData);
          } catch (error) {
            console.log("Error in parsing file, skipping", file.name);
            setUploadStatus(prevStatus => ({
              ...prevStatus,
              [file.name]: "poškozený soubor",
            }));
            return;
          }

          const { introText, lyrics } = parsedMidi ?? {
            introText: [],
            lyrics: [],
          };
          const headerText = introText.join("").trim();
          const plainLyrics = lyrics
            .map(v => v.text)
            .join("")
            .trim();

          const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
          await upload();

          async function upload() {
            try {
              setUploadStatus(prevStatus => ({
                ...prevStatus,
                [file.name]: "nahrávání souboru",
              }));
              const result = await uploadMidi.mutateAsync({
                name: file.name,
                description: headerText,
                midi: base64,
                text: plainLyrics,
              });
              setUploadStatus(prevStatus => ({
                ...prevStatus,
                [file.name]: "úspěšně nahráno",
              }));
              console.log(result.message);

              void trpcUtils.midi.invalidate();
            } catch (error) {
              console.error(error);
              setUploadStatus(prevStatus => ({
                ...prevStatus,
                [file.name]: "chyba při nahrávání",
              }));
            }
          }
        } catch {
          console.log("Error in reading file, skipping", file.name);
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            [file.name]: "poškozený soubor",
          }));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleOnlyWithLyricsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOnlyWithLyrics(event.target.checked);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <Link href="/play/local" className=" link link-warning mt-4">
          Přehrát lokální soubor
        </Link>
        <Link href="/play/demo" className=" link link-warning mt-4">
          Otevřít demo přehrávač
        </Link>
        <button className="btn btn-primary" onClick={() => setIsUploadOpen(!isUploadOpen)}>
          {isUploadOpen ? "Zavřít nahrávací menu" : "Nahrát MIDI soubory"}
        </button>
      </div>
      {isUploadOpen && (
        <div className="rounded-lg border p-4">
          <FileUploadButton onChange={handleFileChange} />
          <ul>
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between">
                <span>{file.name}</span>
                <span>{uploadStatus[file.name] ?? "Připraveno k nahrání"}</span>{" "}
              </li>
            ))}
          </ul>

          {files.length > 0 && !isUploading && (
            <button className="btn btn-success mt-4" onClick={handleUpload}>
              Nahrát
            </button>
          )}
        </div>
      )}

      <h2 className="mb-4 text-2xl font-bold">Vyhledávání</h2>
      <label>
        <input type="checkbox" checked={onlyWithLyrics} onChange={handleOnlyWithLyricsChange} /> Pouze s titulky
      </label>
      <input
        className="mx-auto block w-full max-w-lg rounded-lg border px-4 py-2 leading-tight text-black focus:outline-none focus:ring"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Zadejte část názvu/obsahu skladby.."
      />

      {midiList.data && midiList.data.length === 0 && <div className="mt-4 text-center mb-4">Žádné MIDI nenalezeno. Přidejte je skrze "Nahrát MIDI soubory" nebo si spusťte ukázku skrze "Otevřít demo přehrávač"</div>}

      {midiList.isLoading && <div className="mt-4 text-center">Filtrování...</div>}
      {midiList.error && <div className="mt-4 text-center">Načítání seznamu MIDI selhalo. Zkuste to prosím znovu.</div>}

      {midiList.data?.length > 0 && (
        <table className="mx-auto ">
          <thead>
            <tr>
              <th>Název</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody className="text-left">
            {midiList.data?.map(midi => (
              <tr key={midi.id}>
                <td>
                  <Link href={`/play/${midi.id}`}>{midi.name}</Link>
                </td>
                <td>
                  <button
                    onClick={async () => {
                      // vyžaduj potvrezní
                      if (confirm("Opravdu chcete smazat soubor?")) {
                        try {
                          await removeMidi.mutateAsync({ id: midi.id });
                          toast({
                            title: "MIDI soubor byl úspěšně smazán",
                            type: "background",
                          });
                        } catch (error) {
                          toast({
                            title: "Chyba při mazání souboru",
                            description: error?.message as string,
                            type: "background",
                          });
                        }
                      }
                    }}
                    className="btn btn-error btn-sm"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface FileUploadButtonProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
}

function FileUploadButton({ onChange }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input type="file" multiple accept=".mid,.midi,.kar" ref={fileInputRef} onChange={onChange} className="hidden" />
      <p>Zde vyberte MIDI soubory ze svého disku, které si chcete přidat do účtu.</p>
      <button onClick={handleClick} className="btn btn-primary mt-3">
        Vybrat Soubory
      </button>
    </div>
  );
}
