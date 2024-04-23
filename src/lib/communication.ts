import { Spectoda } from "./spectoda-js/Spectoda";

let spectoda = new Spectoda("default", 0);

// Matty key
if (typeof window !== "undefined") {
  const url = new URL(location.href);
  const params = new URLSearchParams(url.search);

  spectoda.assignOwnerKey("00000000000000000000000000000000");
  spectoda.assignOwnerSignature("00000000000000000000000000000000");

  if (params.get("demo")) {
    setTimeout(() => {
      spectoda.assignConnector("dummy");
    }, 300);
  }

  // if url contains query=remotedebug=1 then do X
  if (location.href.includes("?remotedebug=1")) {
    (function () {
      const script = document.createElement("script");
      script.src = "https://chii.host.spectoda.com/target.js";
      document.body.append(script);

      // on script loaded
      script.addEventListener("load", () => {
        setTimeout(() => {
          spectoda.setDebugLevel(4);
        }, 2000);
      });
    })();
  }
}

if (typeof window !== "undefined") {
  window.spectoda = spectoda;
}

export { spectoda };
