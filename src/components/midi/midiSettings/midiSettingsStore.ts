import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Channel {
  channel: number;
  instrumentId: number;
  enabled: boolean;
  solo: boolean;
}

enableMapSet();

export interface MidiStoreState {
  channels: Map<number, Channel>;
  clearChannels: () => void;
  isAnySoloChannelEnabled: () => boolean;
  setChannels: (key: number, value: Channel) => void;
  setChannelEnabled: (channel: number, enabled: boolean) => void;
  setChannelSolo: (channel: number, solo: boolean) => void;
  getChannelById: (channelId: number) => Channel | undefined;
  checkChannelEnabledById: (channelId: number) => boolean;
}

export const useMidiStore = create<MidiStoreState>()(
  immer((set, get) => ({
    channels: new Map(),
    clearChannels: () => set({ channels: new Map() }),
    isAnySoloChannelEnabled: () => {
      for (const channel of get().channels.values()) {
        if (channel.solo) {
          return true;
        }
      }
      return false;
    },
    setChannels: (key, value) => set({ channels: new Map([...get().channels, [key, value]]) }),
    setChannelEnabled: (channel, enabled) =>
      set(state => {
        const channelData = state.channels.get(channel);
        if (channelData) {
          state.channels.set(channel, { ...channelData, enabled });
        }
      }),
    setChannelSolo: (channel, solo) =>
      set(state => {
        const channelData = state.channels.get(channel);
        if (channelData) {
          state.channels.set(channel, { ...channelData, solo });
        }
      }),
    getChannelById: channelId => get().channels.get(channelId),
    checkChannelEnabledById: channelId => {
      const channel = get().channels.get(channelId);

      const isSoloEnabled = get().isAnySoloChannelEnabled();

      if (isSoloEnabled) {
        return channel ? channel.solo : false;
      }

      return channel ? channel.enabled : false;
    },
  })),
);

if (typeof window !== "undefined") {
  (window as any).useMidiStore = useMidiStore;
}
