import React from "react";

export default function Footer() {
  return (
    <div className="mt-8 pb-8 text-center">
      {/* <p className="mt-1">
        Zvuky nejsou produkovány skrze midi rozhraní, ale pomocí tzv. Soundfontů
        (mapování Midi tónů na zvuky pomocí
        <a href="https://cs.wikipedia.org/wiki/SoundFont" target="_blank">
          {"zvukové mapy"}
        </a>
        ).
      </p> */}
      <footer className="mt-4 block ">
        Vytvořil{" "}
        <a href="https://lukaskovar.com" target="_blank">
          Lukáš Kovář
        </a>{" "}
        2024 ©
      </footer>
    </div>
  );
}
