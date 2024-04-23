import { trpc } from "~/utils/api";
import { FormEvent, useState } from "react";
import { useToast } from "../ui/use-toast";
import { cn } from "~/lib/utils";

export default function UpdateMidiName({ midiId, currentName }: { midiId: number; currentName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const trpcUtils = trpc.useUtils();
  const { mutateAsync, isLoading } = trpc.midi.updateName.useMutation();
  const [name, setName] = useState(currentName);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await mutateAsync({ id: midiId, name });
      trpcUtils.midi.invalidate();
      setIsEditing(false); // Hide the form after successful update
      toast({
        title: "Název MIDI úspěšně aktualizován",
        type: "background",
      });
    } catch (error) {
      toast({
        title: "Aktualizace názvu selnala",
        type: "background",
      });
      console.error(error);
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <div className="mx-auto max-w-[400px] items-center">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <label htmlFor="name" className="mb-2 font-bold">
            Přejmenovat MIDI
          </label>
          <input type="text" id="name" name="name" value={name} onChange={handleNameChange} required className="mb-4  rounded border border-gray-300 bg-transparent px-4 py-2" />
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? "Ukládání..." : "Uložit"}
          </button>
        </form>
      ) : (
        <>
          <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-gray-700">
            <EditPencilIcon />
          </button>
        </>
      )}
    </div>
  );
}

function EditPencilIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cn("h-6 w-6", className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}
