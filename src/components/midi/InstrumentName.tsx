import { type FC } from "react";

export const InstrumentName: FC<{ programNumber: number | undefined }> = ({ programNumber }) => {
  switch (programNumber) {
    case 0:
      return <Localized default="Acoustic Grand Piano">Akustický klavír</Localized>;
    case 1:
      return <Localized default="Bright Acoustic Piano">Jasný akustický klavír</Localized>;
    case 2:
      return <Localized default="Electric Grand Piano">Elektrický klavír</Localized>;
    case 3:
      return <Localized default="Honky-tonk Piano">Honky-tonk piáno</Localized>;
    case 4:
      return <Localized default="Electric Piano 1">Elektrické piano 1</Localized>;
    case 5:
      return <Localized default="Electric Piano 2">Elektrické piano 2</Localized>;
    case 6:
      return <Localized default="Harpsichord">Cembalo</Localized>;
    case 7:
      return <Localized default="Clavinet">Clavinet</Localized>;
    case 8:
      return <Localized default="Celesta">Celesta</Localized>;
    case 9:
      return <Localized default="Glockenspiel">Zvonkohra</Localized>;
    case 10:
      return <Localized default="Music Box">Hudební skříňka</Localized>;
    case 11:
      return <Localized default="Vibraphone">Vibrafon</Localized>;
    case 12:
      return <Localized default="Marimba">Marimba</Localized>;
    case 13:
      return <Localized default="Xylophone">Xylofon</Localized>;
    case 14:
      return <Localized default="Tubular Bells">Trubkové zvony</Localized>;
    case 15:
      return <Localized default="Dulcimer">Cimbal</Localized>;
    case 16:
      return <Localized default="Drawbar Organ">Varhanní rejstřík</Localized>;
    case 17:
      return <Localized default="Percussive Organ">Perkusivní varhany</Localized>;
    case 18:
      return <Localized default="Rock Organ">Rockové varhany</Localized>;
    case 19:
      return <Localized default="Church Organ">Církevní varhany</Localized>;
    case 20:
      return <Localized default="Reed Organ">Jazyková harmonika</Localized>;
    case 21:
      return <Localized default="Accordion">Akordeon</Localized>;
    case 22:
      return <Localized default="Harmonica">Foukací harmonika</Localized>;
    case 23:
      return <Localized default="Tango Accordion">Tango akordeon</Localized>;
    case 24:
      return <Localized default="Acoustic Guitar (nylon)">Akustická kytara (nylonová)</Localized>;
    case 25:
      return <Localized default="Acoustic Guitar (steel)">Akustická kytara (ocelová)</Localized>;
    case 26:
      return <Localized default="Electric Guitar (jazz)">Elektrická kytara (jazzová)</Localized>;
    case 27:
      return <Localized default="Electric Guitar (clean)">Elektrická kytara (čistá)</Localized>;
    case 28:
      return <Localized default="Electric Guitar (muted)">Elektrická kytara (ztlumená)</Localized>;
    case 29:
      return <Localized default="Overdriven Guitar">Překrytá kytara</Localized>;
    case 30:
      return <Localized default="Distortion Guitar">Zkreslená kytara</Localized>;
    case 31:
      return <Localized default="Guitar Harmonics">Kytarové harmonie</Localized>;
    case 32:
      return <Localized default="Acoustic Bass">Akustická baskytara</Localized>;
    case 33:
      return <Localized default="Electric Bass (finger)">Elektrická baskytara (prsty)</Localized>;
    case 34:
      return <Localized default="Electric Bass (pick)">Elektrická baskytara (trsátko)</Localized>;
    case 35:
      return <Localized default="Fretless Bass">Bezpražcová baskytara</Localized>;
    case 36:
      return <Localized default="Slap Bass 1">Slap baskytara 1</Localized>;
    case 37:
      return <Localized default="Slap Bass 2">Slap baskytara 2</Localized>;
    case 38:
      return <Localized default="Synth Bass 1">Syntezátorová baskytara 1</Localized>;
    case 39:
      return <Localized default="Synth Bass 2">Syntezátorová baskytara 2</Localized>;
    case 40:
      return <Localized default="Violin">Housle</Localized>;
    case 41:
      return <Localized default="Viola">Viola</Localized>;
    case 42:
      return <Localized default="Cello">Violoncello</Localized>;
    case 43:
      return <Localized default="Contrabass">Kontrabas</Localized>;
    case 44:
      return <Localized default="Tremolo Strings">Tremolové smyčce</Localized>;
    case 45:
      return <Localized default="Pizzicato Strings">Pizzicato smyčce</Localized>;
    case 46:
      return <Localized default="Orchestral Harp">Orchestrální harfa</Localized>;
    case 47:
      return <Localized default="Timpani">Tympány</Localized>;
    case 48:
      return <Localized default="String Ensemble 1">Smyčcový soubor 1</Localized>;
    case 49:
      return <Localized default="String Ensemble 2">Smyčcový soubor 2</Localized>;
    case 50:
      return <Localized default="Synth Strings 1">Syntetické smyčce 1</Localized>;
    case 51:
      return <Localized default="Synth Strings 2">Syntetické smyčce 2</Localized>;
    case 52:
      return <Localized default="Choir Aahs">Sbor Ááá</Localized>;
    case 53:
      return <Localized default="Voice Oohs">Hlasy Óóó</Localized>;
    case 54:
      return <Localized default="Synth Choir">Syntetický sbor</Localized>;
    case 55:
      return <Localized default="Orchestra Hit">Orchestrální úder</Localized>;
    case 56:
      return <Localized default="Trumpet">Trubka</Localized>;
    case 57:
      return <Localized default="Trombone">Trombon</Localized>;
    case 58:
      return <Localized default="Tuba">Tuba</Localized>;
    case 59:
      return <Localized default="Muted Trumpet">Ztlumená trubka</Localized>;
    case 60:
      return <Localized default="French Horn">Lesní roh</Localized>;
    case 61:
      return <Localized default="Brass Section">Žesťová sekce</Localized>;
    case 62:
      return <Localized default="Synth Brass 1">Syntetické žestě 1</Localized>;
    case 63:
      return <Localized default="Synth Brass 2">Syntetické žestě 2</Localized>;
    case 64:
      return <Localized default="Soprano Sax">Sopránový saxofon</Localized>;
    case 65:
      return <Localized default="Alto Sax">Altový saxofon</Localized>;
    case 66:
      return <Localized default="Tenor Sax">Tenorový saxofon</Localized>;
    case 67:
      return <Localized default="Baritone Sax">Barytonový saxofon</Localized>;
    case 68:
      return <Localized default="Oboe">Hoboj</Localized>;
    case 69:
      return <Localized default="English Horn">Anglický roh</Localized>;
    case 70:
      return <Localized default="Bassoon">Fagot</Localized>;
    case 71:
      return <Localized default="Clarinet">Klarinet</Localized>;
    case 72:
      return <Localized default="Piccolo">Pikola</Localized>;
    case 73:
      return <Localized default="Flute">Flétna</Localized>;
    case 74:
      return <Localized default="Recorder">Zobcová flétna</Localized>;
    case 75:
      return <Localized default="Pan Flute">Pánevní flétna</Localized>;
    case 76:
      return <Localized default="Blown Bottle">Foukaná lahev</Localized>;
    case 77:
      return <Localized default="Shakuhachi">Šakuháči</Localized>;
    case 78:
      return <Localized default="Whistle">Pískání</Localized>;
    case 79:
      return <Localized default="Ocarina">Okarina</Localized>;
    case 80:
      return <Localized default="Lead 1 (square)">Lead 1 (čtverec)</Localized>;
    case 81:
      return <Localized default="Lead 2 (sawtooth)">Lead 2 (pilovitý)</Localized>;
    case 82:
      return <Localized default="Lead 3 (calliope)">Lead 3 (calliope)</Localized>;
    case 83:
      return <Localized default="Lead 4 (chiff)">Lead 4 (chiff)</Localized>;
    case 84:
      return <Localized default="Lead 5 (charang)">Lead 5 (charang)</Localized>;
    case 85:
      return <Localized default="Lead 6 (voice)">Lead 6 (hlas)</Localized>;
    case 86:
      return <Localized default="Lead 7 (fifths)">Lead 7 (kvinty)</Localized>;
    case 87:
      return <Localized default="Lead 8 (bass + lead)">Lead 8 (baskytara + lead)</Localized>;
    case 88:
      return <Localized default="Pad 1 (new age)">Pad 1 (nová éra)</Localized>;
    case 89:
      return <Localized default="Pad 2 (warm)">Pad 2 (teplý)</Localized>;
    case 90:
      return <Localized default="Pad 3 (polysynth)">Pad 3 (polysyntetizátor)</Localized>;
    case 91:
      return <Localized default="Pad 4 (choir)">Pad 4 (sbor)</Localized>;
    case 92:
      return <Localized default="Pad 5 (bowed)">Pad 5 (smyčcový)</Localized>;
    case 93:
      return <Localized default="Pad 6 (metallic)">Pad 6 (kovový)</Localized>;
    case 94:
      return <Localized default="Pad 7 (halo)">Pad 7 (svatozář)</Localized>;
    case 95:
      return <Localized default="Pad 8 (sweep)">Pad 8 (přesmyk)</Localized>;
    case 96:
      return <Localized default="FX 1 (rain)">FX 1 (déšť)</Localized>;
    case 97:
      return <Localized default="FX 2 (soundtrack)">FX 2 (soundtrack)</Localized>;
    case 98:
      return <Localized default="FX 3 (crystal)">FX 3 (křišťál)</Localized>;
    case 99:
      return <Localized default="FX 4 (atmosphere)">FX 4 (atmosféra)</Localized>;
    case 100:
      return <Localized default="FX 5 (brightness)">FX 5 (jas)</Localized>;
    case 101:
      return <Localized default="FX 6 (goblins)">FX 6 (skřítci)</Localized>;
    case 102:
      return <Localized default="FX 7 (echoes)">FX 7 (echa)</Localized>;
    case 103:
      return <Localized default="FX 8 (sci-fi)">FX 8 (sci-fi)</Localized>;
    case 104:
      return <Localized default="Sitar">Sitar</Localized>;
    case 105:
      return <Localized default="Banjo">Banjo</Localized>;
    case 106:
      return <Localized default="Shamisen">Šamisen</Localized>;
    case 107:
      return <Localized default="Koto">Koto</Localized>;
    case 108:
      return <Localized default="Kalimba">Kalimba</Localized>;
    case 109:
      return <Localized default="Bagpipe">Dudy</Localized>;
    case 110:
      return <Localized default="Fiddle">Housle (lidové)</Localized>;
    case 111:
      return <Localized default="Shanai">Šanái</Localized>;
    case 112:
      return <Localized default="Tinkle Bell">Cinkací zvon</Localized>;
    case 113:
      return <Localized default="Agogo">Agogo</Localized>;
    case 114:
      return <Localized default="Steel Drums">Ocelové bubny</Localized>;
    case 115:
      return <Localized default="Woodblock">Dřevěný blok</Localized>;
    case 116:
      return <Localized default="Taiko Drum">Taiko buben</Localized>;
    case 117:
      return <Localized default="Melodic Tom">Melodický tom</Localized>;
    case 118:
      return <Localized default="Synth Drum">Syntetický buben</Localized>;
    case 119:
      return <Localized default="Reverse Cymbal">Obrácený činel</Localized>;
    case 120:
      return <Localized default="Guitar Fret Noise">Šum kytarových pražců</Localized>;
    case 121:
      return <Localized default="Breath Noise">Dechový šum</Localized>;
    case 122:
      return <Localized default="Seashore">Přímořská scenérie</Localized>;
    case 123:
      return <Localized default="Bird Tweet">Ptačí cvrlikání</Localized>;
    case 124:
      return <Localized default="Telephone Ring">Zvonění telefonu</Localized>;
    case 125:
      return <Localized default="Helicopter">Vrtulník</Localized>;
    case 126:
      return <Localized default="Applause">Potlesk</Localized>;
    case 127:
      return <Localized default="Gunshot">Výstřel</Localized>;
  }
  return <></>;
};

function Localized({ children, default: defaultValue }: { children: string; default: string }) {
  return <>{children}</>;
}


