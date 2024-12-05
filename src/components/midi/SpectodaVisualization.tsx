import { useSpectodaConnection } from "~/lib/useSpectodaConnection";
import { nanoevents } from "./utils";
import { useEffect } from "react";
import { spectoda } from "~/lib/communication";

export function SpectodaVisualization() {
  const { connect, isConnected, connector, assignConnector, disconnect } = useSpectodaConnection();

  useEffect(() => {
    if (!isConnected) return;

    const t = nanoevents.on("midichannelevent", event => {
      // if (event.type === "channel" && event.subtype === "noteOn") {
      //   spectoda.emitPercentageEvent("blik", 100, event.channel);
      // }
    });

    return t;
  }, [isConnected]);

  const isConnectedAndNotDummy = isConnected && connector !== "dummy";

  return (
    <div className="flex items-center justify-end my-4">
      <div className="text-sm font-semibold mr-3">Máte zařízení Spectoda?</div>
      <button
        className={`btn ${isConnectedAndNotDummy ? "btn-error" : "btn-primary"} px-4 py-2 rounded-md`}
        onClick={() => {
          if (isConnectedAndNotDummy) {
            assignConnector("dummy").then(v => {
              connect();
            });
          } else {
            assignConnector("default");
            connect({
              connectAny: false,
              ownerSignature: "e145d41524d1a57cd15551970fc62206",
              ownerKey: "b2cd0cbb56bd80934644ccfbc771707e",
            }).catch(err => {
              console.error(err);
              assignConnector("dummy").then(v => {
                connect();
              });
            });
          }
        }}
      >
        {isConnected && connector !== "dummy" ? "Odpojit" : "Připojit"}
      </button>
    </div>
  );
}
