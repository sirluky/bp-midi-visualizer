import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { uint8ArrayToHexString } from "./spectoda-js";
import { spectoda } from "./communication";
import { cn } from "./utils";
import Dialog, { DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { DialogPortal, themeAtom } from "~/pages/_app";
import { UploadTnglButtons } from "~/components/midi/UploadTnglButtons";
import { SpectodaVisualization } from "~/components/midi/SpectodaVisualization";
import { useSpectodaConnection } from "./useSpectodaConnection";

export let wasmIframe: React.RefObject<HTMLIFrameElement> | null = null;

let executeUnlistenFunction: any = null;
let requestUnlistenFunction: any = null;
let clockUnlistenFunction: any = null;

let currentIframe: HTMLIFrameElement | null = null;

export default function PreviewButton() {
  const [theme] = useAtom(themeAtom);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isConnected, connect, assignConnector } = useSpectodaConnection();
  wasmIframe = iframeRef;

  function emitToIframe(iframe: HTMLIFrameElement | null, data: any) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify(data), "*");
    }
  }

  // useEffect(() => {
  //   (async () => {
  //     assignConnector("dummy");
  //     setTimeout(() => {
  //       connect({
  //         connectAny: true,
  //         ownerKey: "00000000000000000000000000000001",
  //         ownerSignature: "00000000000000000000000000000001",
  //       });
  //     }, 1000);
  //   })();
  // }, []);

  function iframeOnloadHandler() {
    currentIframe = iframeRef.current;

    if (!currentIframe) return;

    emitToIframe(currentIframe, {
      js_eval: `
      document.querySelector('#wasm-gui').style.display = "none"
      document.querySelector('body').style.background = "${theme === "dark" ? "rgb(31 41 55 )" : "rgb(255 255 255)"}";
      document.querySelector('body').style.color = "${theme !== "dark" ? "rgb(31 41 55 )" : "rgb(255 255 255)"}";
      document.querySelector('body').style.margin = 0;
    `,
    });

    executeUnlistenFunction =
      executeUnlistenFunction ??
      spectoda.on("wasm_execute", (command: Uint8Array) => {
        emitToIframe(currentIframe, {
          execute_bytecode: uint8ArrayToHexString(command),
        });
      });

    requestUnlistenFunction =
      requestUnlistenFunction ??
      spectoda.on("wasm_request", (command: Uint8Array) => {
        emitToIframe(currentIframe, {
          request_bytecode: uint8ArrayToHexString(command),
        });
      });

    clockUnlistenFunction =
      clockUnlistenFunction ??
      spectoda.on("wasm_clock", (timestamp: Uint8Array) => {
        emitToIframe(currentIframe, {
          clock_timestamp: timestamp,
        });
      });

    setTimeout(() => {
      spectoda.syncClock();
      spectoda.timeline?.unpause();
      spectoda.syncTimeline();
    }, 1000);
  }

  const env = process.env.NODE_ENV;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2">
      <Dialog open={isOpen} modal={false}>
        <DialogContent
          closeHandler={() => { }}
          useOverlay={false}
          centered={false}
          animate={false}
          className={cn("fixed bottom-16 max-w-[462px] right-4 h-auto w-auto rounded-md dark:bg-gray-800 text-black dark:text-white bg-white p-4 shadow-lg")}
        >
          <SpectodaVisualization />

          <div className="">
            <UploadTnglButtons />
          </div>
          <div className="text-fg-secondary  mb-3 text-sm mt-4">
            Náhled pro virtuální controller <div className="inline font-mono font-semibold">$con1</div>
          </div>
          <iframe onLoad={iframeOnloadHandler} ref={iframeRef} id="wasm-iframe" height="330px" width="428px" className="overflow-auto rounded-lg" src={"/wasm/index.html"} />
          {/* <div className="text-right mt-1 font-extralight">Náhled pásků prohlížeči je poháněn Spectoda WASM</div> */}
        </DialogContent>
      </Dialog>
      <button className={cn("btn  btn-sm", isOpen ? "btn-error" : "btn-primary")} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Zavřít" : "Otevřít"} náhled
      </button>
    </div>
  );
}
