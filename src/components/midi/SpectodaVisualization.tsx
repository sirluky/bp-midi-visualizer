import { useSpectodaConnection } from "~/lib/useSpectodaConnection";
import { nanoevents } from "./utils";
import { useEffect } from "react";

export function SpectodaVisualization() {
  const { connect, isConnected, connector, assignConnector } = useSpectodaConnection();

  useEffect(() => {
    if (!isConnected) return;

    const t = nanoevents.on("midichannelevent", _event => {
      // if (event.type === "channel" && event.subtype === "noteOn") {
      //   spectoda.emitPercentageEvent("blik", 100, event.channel);
      // }
    });

    return t;
  }, [isConnected]);

  const isConnectedAndNotDummy = isConnected && connector !== "dummy";

  return (
    <div className="flex items-center justify-end my-4">
      <div className="text-sm font-semibold mr-3">
        <a target="_blank" className="link link-warning" href="https://www.youtube.com/watch?v=XKk45uFF5Ko&list=PL7Gxu53zUlh-qLVrsfN4_oXuzPAwIRywM&index=1">
          Video ukázky zde
        </a>
        <br />
        Máte Spectoda zařízení?
      </div>
      <button
        className={`btn ${isConnectedAndNotDummy ? "btn-error" : "btn-primary"} px-4 py-2 rounded-md`}
        onClick={() => {
          if (isConnectedAndNotDummy) {
            void assignConnector("dummy").then(_v => {
              void connect();
            });
          } else {
            void assignConnector("default");
            void connect({
              connectAny: false,
              ownerSignature: "e145d41524d1a57cd15551970fc62206",
              ownerKey: "b2cd0cbb56bd80934644ccfbc771707e",
            }).catch(err => {
              console.error(err);
              void assignConnector("dummy").then(_v => {
                void connect();
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
