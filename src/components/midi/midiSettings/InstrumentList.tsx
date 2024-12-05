import { useEffect, useState } from "react";
import { InstrumentName } from "../InstrumentName";
import { useMidiStore } from "./midiSettingsStore";
import { nanoevents } from "../utils";
import { colorForNoteArray } from "./MIDI_COLOR_PALLETTE";

export default function InstrumentList() {
  const { channels, setChannels, isAnySoloChannelEnabled } = useMidiStore();
  const isAnySoloChannelEnabledValue = isAnySoloChannelEnabled();
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => {
    setIsOpen(isOpen => !isOpen);
  };

  return (
    <div>
      <details className="mb-5" open={isOpen}>
        <summary className="mt-3 cursor-pointer text-center text-lg font-bold">Informace o kanálech</summary>
        {isOpen && <ChannelList channelStates={channels} setChannels={setChannels} isAnySoloChannelEnabledValue={isAnySoloChannelEnabledValue} />}
      </details>
    </div>
  );
}

interface ChannelProps {
  channelStates: Map<number, { channel: number; instrumentId: number; enabled: boolean; solo: boolean }>;
  setChannels: (
    channel: number,
    value: {
      channel: number;
      instrumentId: number;
      enabled: boolean;
      solo: boolean;
    },
  ) => void;
  isAnySoloChannelEnabledValue: boolean;
}

function ChannelList({ channelStates, setChannels, isAnySoloChannelEnabledValue }: ChannelProps) {
  return (
    <div className="text-left dark:text-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2">Kanál</th>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Nástroj</th>
            <th className="px-4 py-2">Zap/Vyp</th>
            <th className="px-4 py-2">Sólo</th>
            <th className="px-4 py-2">Aktivita</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(channelStates).sort((a,b)=> {
              // order by channel number
              return a[0] - b[0];
          }).map(([channel_id, channel], index) => (
              <tr key={index} className={channel.enabled ? "" : "bg-gray-800 text-gray-300"}>
                <td className="px-4 py-2 font-semibold">{channel.channel + 1}.</td>
                <td className="px-4 py-2">{channel.instrumentId}</td>
                <td className="px-4 py-2">
                  {channel.channel === 9 && channel.instrumentId === 0 ? (
                    <>Standardní bicí souprava</>
                  ) : (
                    <>
                      <InstrumentName programNumber={channel.instrumentId} />
                    </>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      setChannels(channel_id, {
                        ...channel,
                        enabled: !channel.enabled,
                      })
                    }
                    className={`rounded px-2 py-1 ${channel.enabled ? "bg-green-600 dark:text-white" : "bg-red-500 dark:text-white"} ${!isAnySoloChannelEnabledValue ? "" : !channel.solo ? "pointer-events-none !bg-gray-700" : ""}`}
                  >
                    {channel.enabled ? "Zap" : "Vyp"}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      setChannels(channel_id, {
                        ...channel,
                        solo: !channel.solo,
                      })
                    }
                    className={`rounded px-2 py-1 ${channel.solo ? "bg-blue-500 dark:text-white" : "bg-gray-500 dark:text-white"}`}
                  >
                    {channel.solo ? "O" : "X"}
                  </button>
                </td>
                <td className="flex items-center justify-center">
                  <InstrumentPulser channelId={channel.channel} enabled={isAnySoloChannelEnabledValue ? channel.solo : channel.enabled} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function InstrumentPulser({ channelId, enabled }: { channelId: number; enabled: boolean }) {
  const [pulsingValue, setPulsingValue] = useState<number>(0);

  useEffect(() => {
    let t: undefined | Function;
    t = nanoevents.on("midichannelevent", event => {
      if (event.type === "channel" && event.channel === channelId) {
        if (enabled) {
          if (event.subtype === "noteOn") {
            setPulsingValue(event.noteNumber + 1);
          }
        }

        if (event.subtype === "noteOff") {
          setPulsingValue(0);
        }
      }
    });

    return () => {
      t && t();
    };
  }, [channelId, enabled]);

  // cubic brick div
  return (
    <div
      className={`mt-3 h-5 w-5 rounded border will-change-auto`}
      style={{
        background: colorForNoteArray[pulsingValue],
      }}
    ></div>
  );
}
