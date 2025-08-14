import { useRouter } from "next/router";
import React from "react";
import { Player } from "~/components/midi/Player";
import UpdateMidiName from "~/components/midi/UpdateMidiName";
import { trpc } from "~/utils/api";

const QueryOnceParameters = {
  refetchInterval: 99999999,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchIntervalInBackground: false,
};

export default function PlayId() {
  const router = useRouter();

  const midi = trpc.midi.get.useQuery({ id: Number(router.query.id) }, { enabled: !!router.query.id, ...QueryOnceParameters });

  if (midi.error) {
    return <div>{midi.error.message}</div>;
  }

  if (midi.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <UpdateMidiName midiId={midi.data.id} currentName={midi.data.name} />

      <Player midi={midi.data} />
    </div>
  );
}

export function prepareMidiFromCloud(midi: string) {
  const decodedMidi = atob(midi);
  const buffer = new ArrayBuffer(decodedMidi.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < decodedMidi.length; i++) {
    view[i] = decodedMidi.charCodeAt(i);
  }

  return view;
}
