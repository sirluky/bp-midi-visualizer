// @ts-nocheck
// ! some types are missing but it's not made to be solved in this bachelor project

import { spectoda } from "./communication";
import { atom, useAtom } from "jotai";
import { atomWithLocalStorage } from "./utils";
import { createContext, useEffect, useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import useConnectionStatus from "./useConnectionStatus";
import { detectSpectodaConnect } from "./spectoda-js";

export const CONNECTION = {
  CONNECTED: "connected",
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
  DISCONNECTING: "disconnecting",
} as const;

export type ConnectionStatus = (typeof CONNECTION)[keyof typeof CONNECTION];

export const CONNECTORS = [
  { key: "default", name: "Automatic", hidden: false },
  { key: "webbluetooth", name: "Bluetooth", hidden: false },
  { key: "webserial", name: "Web Serial", hidden: false },
  { key: "dummy", name: "Simulated", hidden: false },
  { key: "websockets", name: "Remote", hidden: true },
  { key: "flutter", name: "Flutter", hidden: true },
  { key: "tangleconnect", name: "Tangle Connect", hidden: true },
  { key: "edummy", name: "Dummy With Errors", hidden: true },
  { key: "vdummy", name: "Dummy With Version", hidden: true },
] as const;

export type ConnectorType = (typeof CONNECTORS)[number]["key"];

export interface MacObject {
  mac: string;
}

export interface ConnectionContext extends SpectodaConnectionMethods, SpectodaConnectionState {}

interface SpectodaConnectionState {
  connectionStatus: ConnectionStatus;
  connectedMacs: MacObject[];
  directlyConnectedMac: string;
  lastDirectlyConnectedMac: string;
  disconnectedMacs: MacObject[];
  connector: ConnectorType;

  isConnecting: boolean;
  isUploading: boolean;
  isConnected: boolean;

  version: string;
  fullVersion: string;
  versionAvailable: boolean;
  isLimitedMode: boolean;
  connectedName: string | null;
  connectedController: any;
  connectedNetworkSignature: string;
  isUnknownNetwork: boolean;
  fakeConnection: boolean;
}

// todo be moved to Spectoda.ts once it exists
type ConnectOptions = {
  devices?: string[] | null;
  autoConnect?: boolean;
  ownerSignature?: string | null;
  ownerKey?: string | null;
  connectAny?: boolean;
  fwVersion?: string;
};

interface SpectodaConnectionMethods {
  connect: (params?: ConnectOptions) => Promise<unknown>;
  disconnect: () => Promise<void>;
  upload: (tngl: string) => Promise<void>;
  assignConnector: (mac: ConnectorType) => Promise<void>;
  activateFakeDevice: (mac: string[]) => void;
  isActiveMac: (mac: string | string[] | undefined) => boolean;
  getConnectedPeersInfo: () => Promise<unknown>;
  setIsUploading: (isUploading: boolean) => void;
  setFakeConnection: (fakeConnection: boolean) => void;
}

const defaultValues = {} as ConnectionContext;

const connectorAtom = atomWithLocalStorage<ConnectorType>("connector", "default");

export const fakeConnectionAtom = atom(false);

export const bluetoothDisabledAtom = atom(false);

const SpectodaConnection = createContext<ConnectionContext>(defaultValues);
function SpectodaConnectionProvider({ children }: React.PropsWithChildren) {
  const { toast } = useToast();
  const errorToast = e => {
    toast(e);
    console.error(e);
  };

  const [connectedMacs, setConnectedMacs] = useState<MacObject[]>([]);
  const [disconnectedMacs, setDisconnectedMacs] = useState<MacObject[]>([]);
  const [connector, setConnector] = useState("dummy");
  const [isUploading, setIsUploading] = useState(false);
  const { isConnected, isConnecting, connectionStatus, directlyConnectedMac, connectedName, lastDirectlyConnectedMac, connectedNetworkSignature } = useConnectionStatus(setConnectedMacs, setDisconnectedMacs);
  const [connectedController, setConnectedController] = useState({});
  const [, setBluetoothDisabled] = useAtom(bluetoothDisabledAtom);
  const [fakeConnection, setFakeConnection] = useAtom(fakeConnectionAtom);

  useEffect(() => {
    const assignConnectorAndAutoConnectDummy = async () => {
      await methods.assignConnector(connector);
      if (connector === "dummy")
        await methods.connect({
          connectAny: true,
          ownerKey: "00000000000000000000000000000000",
          ownerSignature: "00000000000000000000000000000000",
        });
    };

    const connectSpectodaConnect = async () => {
      let storedNetwork = localStorage.getItem("current-network");

      try {
        if (storedNetwork && detectSpectodaConnect()) {
          storedNetwork = JSON.parse(storedNetwork);

          methods.connect({
            autoConnect: true,
            connectAny: false,
            ownerKey: "00000000000000000000000000000000",
            ownerSignature: "00000000000000000000000000000000",
          });
        }
      } catch (e) {
        // errorToast(e);
      }
    };

    void connectSpectodaConnect();
    void assignConnectorAndAutoConnectDummy();
  }, []);

  const state: SpectodaConnectionState = {
    isConnecting,
    connectedMacs,
    disconnectedMacs,
    connectedNetworkSignature,
    connector,
    connectionStatus,
    lastDirectlyConnectedMac,
    isUnknownNetwork: isConnected && connectedNetworkSignature === "unknown",
    isUploading,
    version: "unknown",
    directlyConnectedMac,
    isConnected,
    connectedName,
    connectedController,
    fakeConnection,
  };

  const methods: SpectodaConnectionMethods = {
    connect: async options => {
      const { devices = null, autoConnect = null, ownerSignature, ownerKey, connectAny = true, fwVersion = "" } = options || {};

      console.log("Connecting with options", options);

      try {
        const data = await spectoda.connect(autoConnect, ownerSignature, ownerKey, connectAny, fwVersion);

        setBluetoothDisabled(false);
        setConnectedController(data);
        return data;
      } catch (e) {
        // errorToast(e);
        if (e?.toString().includes("BluetoothOff")) {
          setBluetoothDisabled(true);
        } else {
          setBluetoothDisabled(false);
        }
        throw e;
      }
    },

    disconnect: async () => {
      try {
        await spectoda.disconnect();
      } catch (e) {
        // errorToast(e);
      }
    },

    upload: async (tngl: string) => {
      setIsUploading(true);
      await spectoda.writeTngl(tngl);
      setIsUploading(false);
    },

    assignConnector: async connector => {
      try {
        setConnector(connector);

        await spectoda.assignConnector(connector);
      } catch (e) {
        // errorToast(e);
      }
    },

    isActiveMac: mac => {
      if (!mac) return true;

      if (connector === "dummy" || fakeConnection) {
        return true;
      }

      if (typeof mac === "string") {
        mac = [mac];
      }

      return mac?.some(m => {
        return connectedMacs.find(p => p.mac == m);
      });
    },

    activateFakeDevice: macs => {
      const newmacs = macs.map(m => ({ mac: m }));
      if (connector === "dummy") {
        setConnectedMacs(macs => [...macs, ...newmacs]);
        return true;
      } else {
        return false;
      }
    },

    getConnectedPeersInfo: async () => {
      try {
        return await spectoda.getConnectedPeersInfo();
      } catch (e) {
        // errorToast(e);
      }
    },

    setIsUploading,
    setFakeConnection,
  };

  return (
    <SpectodaConnection.Provider
      value={{
        ...state,
        ...methods,
      }}
    >
      {children}
    </SpectodaConnection.Provider>
  );
}

export { SpectodaConnection, SpectodaConnectionProvider };
