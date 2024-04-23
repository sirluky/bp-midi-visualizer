import { spectoda } from "~/lib/communication";
import { nanoevents } from "./utils";
import { useEffect, useState } from "react";
import { atomWithLocalStorage, cn } from "~/lib/utils";
import { useSpectodaConnection } from "~/lib/useSpectodaConnection";
import { useAtom } from "jotai";
import { colorForNoteArray } from "./midiSettings/MIDI_COLOR_PALLETTE";
import { currentBpm } from "./useMidiPlayer";

const tnglList = [
  {
    name: "Vypnuto",
    code: ``,
    listener: () => {
      return () => {};
    },
    extraFunction: () => {},
  },
  {
    name: "Testovací bílá",
    code: `    var color = genSmoothOut(genLastEventParam($color), 0.3s);
    addDrawing(0s, Infinity, animFill(Infinity, &color));
    `,
    method: () => {
      spectoda.emitColorEvent("color", "#ffffff", 255);
    },
  },
  {
    name: "Jednoduché výstřely",
    code: `
    defDevice($con1, 0x00, 0xff, 150px, $seg1, 0x00, 150px, $seg2, 0x01, 150px, $seg3, 0x02, 150px, $seg4, 0x03, 150px, $seg5, 0x04, 150px, $seg6, 0x05, 150px, $seg7, 0x06, 150px, $seg8, 0x07, {
    });
    
    defCanvas($cvs1, {
      segment($seg1);
      segment($seg2);
      segment($seg3);
      segment($seg4);
      segment($seg5);
      segment($seg6);
      segment($seg7);
      segment($seg8);
    });
    
    var color = genSmoothOut(genLastEventParam($color), 0.3s);
    addDrawing(0s, Infinity, animFill(Infinity, &color));
    
    var shoot_time = 1s;
    
    addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #ffffff, 5%));

interactive<0x10>(0s, Infinity, $shoot, {
  addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #ffffff, 5%));
});
interactive<0x10>(0s, Infinity, $shoot, {
  addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #ffffff, 5%));
});
  `,
    method: () => {
      spectoda.emitColorEvent("color", "#010101", 255);
    },
    listener: () => {
      console.log("Subscribed to listener");

      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          spectoda.emitPercentageEvent("shoot", (event.velocity / 127) * 20, event.channel);
        }
      });

      return channelEventUnsub;
    },
  },
  {
    name: "Pulzujici nástroje",
    code: `
    defDevice($con1, 0x00, 0xff, 150px, $seg1, 0x00, 150px, $seg2, 0x01, 150px, $seg3, 0x02, 150px, $seg4, 0x03, 150px, $seg5, 0x04, 150px, $seg6, 0x05, 150px, $seg7, 0x06, 150px, $seg8, 0x07, {
    });
    
    var color = genLastEventParam($color);
    var toggl = genSmoothOut(genLastEventParam($toggl), 0.3s);
    catchEvent($color).setValue(100%).emitAs($toggl);
    addLayer(0s, Infinity, {
      addDrawing(0s, Infinity, animFill(Infinity, &color));
    }).modifyBrightness(&toggl);
    
    
    var shoot_time = 5s;
    var barva_vystrelu = genLastEventParam($shoot);
    interactive<0x10>(0s, Infinity, $shoot, {
      addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, &barva_vystrelu, 5%));
    });
    
    `,
    method: () => {
      spectoda.emitPercentageEvent("toggl", 0, 255);
    },
    listener: () => {
      console.log("Subscribed to listener");

      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          const note = colorForNoteArray[Math.floor((event.noteNumber / 127) * colorForNoteArray.length)];

          spectoda.emitColorEvent("color", note, event.channel);
        } else {
          spectoda.emitPercentageEvent("toggl", 0, event.channel);
        }
      });

      return channelEventUnsub;
    },
  },
  {
    name: "Piano Styl",
    code: `
    defDevice($con1, 0x00, 0xff, 150px, $seg1, 0x00, 150px, $seg2, 0x01, 150px, $seg3, 0x02, 150px, $seg4, 0x03, 150px, $seg5, 0x04, 150px, $seg6, 0x05, 150px, $seg7, 0x06, 150px, $seg8, 0x07, {
    });
    
    var color = genLastEventParam($color);
    var toggl = genLastEventParam($toggl);
    catchEvent($color).setValue(100%).emitAs($toggl);
    addLayer(0s, Infinity, {
      addDrawing(0s, Infinity, animFill(Infinity, &color));
    }).modifyBrightness(&toggl);
    `,
    method: () => {
      spectoda.emitPercentageEvent("toggl", 0, 255);
    },
    listener: () => {
      console.log("Subscribed to listener");
      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          const octave = event.noteNumber % 8;
          const note = colorForNoteArray[event.noteNumber];

          spectoda.emitColorEvent("color", note, octave);
        } else if ("noteOff" == event.subtype) {
          const octave = event.noteNumber % 8;

          spectoda.emitPercentageEvent("toggl", 0, octave);
        }
      });

      return channelEventUnsub;
    },
  },
  {
    name: "Nastroje na 1 pasku",
    code: `
    defDevice($con1, 0x00, 0xff, 96px, $seg1, 0x00, 96px, $seg2, 0x01, 96px, $seg3, 0x02, 96px, $seg4, 0x03, 96px, $seg5, 0x04, 96px, $seg6, 0x05, 96px, $seg7, 0x06, 96px, $seg8, 0x07, { });

    defSegment($s1, 0x01, { slice($seg1, 0px, 6px, 1px); });
    defSegment($s2, 0x02, { slice($seg1, 6px, 6px, 1px); });
    defSegment($s3, 0x03, { slice($seg1, 12px, 6px, 1px); });
    defSegment($s4, 0x04, { slice($seg1, 18px, 6px, 1px); });
    defSegment($s5, 0x05, { slice($seg1, 24px, 6px, 1px); });
    defSegment($s6, 0x06, { slice($seg1, 30px, 6px, 1px); });
    defSegment($s7, 0x07, { slice($seg1, 36px, 6px, 1px); });
    defSegment($s8, 0x08, { slice($seg1, 42px, 6px, 1px); });
    defSegment($s9, 0x09, { slice($seg1, 48px, 6px, 1px); });
    defSegment($s10, 0x0a, { slice($seg1, 54px, 6px, 1px); });
    defSegment($s11, 0x0b, { slice($seg1, 60px, 6px, 1px); });
    defSegment($s12, 0x0c, { slice($seg1, 66px, 6px, 1px); });
    defSegment($s13, 0x0d, { slice($seg1, 72px, 6px, 1px); });
    defSegment($s14, 0x0e, { slice($seg1, 78px, 6px, 1px); });
    defSegment($s15, 0x0f, { slice($seg1, 84px, 6px, 1px); });
    defSegment($s16, 0x10, { slice($seg1, 90px, 6px, 1px); });
    
    var barva = genLastEventParam($color);
    
    siftSegments({
        segment($s1); segment($s2); segment($s3); segment($s4);
        segment($s5); segment($s6); segment($s7); segment($s8);
        segment($s9); segment($s10); segment($s11); segment($s12);
        segment($s13); segment($s14); segment($s15); segment($s16);
    }, {
        addLayer(0s, Infinity, {
            addDrawing(0s, Infinity, animFill(Infinity, &barva));
        });
    });`,
    method: () => {
      spectoda.emitColorEvent("color", "#000000", 255);
    },
    // write listener that takes notes and plays them on segment ids 0-30
    listener: () => {
      console.log("Subscribed to listener");

      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        // use channel instead of note
        const diodeIndex = Math.floor(event?.channel);

        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          const note = colorForNoteArray[event.noteNumber];

          spectoda.emitColorEvent("color", note, diodeIndex);
        } else if ("noteOff" == event.subtype) {
          spectoda.emitColorEvent("color", "#000000", diodeIndex);
        }
      });

      return channelEventUnsub;
    },
  },
  {
    name: "Noty na 1 pasku",
    code: `
    
    defDevice($con1, 0x00, 0xff, 90px, $seg1, 0x00, 90px, $seg2, 0x01, 90px, $seg3, 0x02, 90px, $seg4, 0x03, 90px, $seg5, 0x04, 90px, $seg6, 0x05, 90px, $seg7, 0x06, 90px, $seg8, 0x07, { });

    defSegment($s1, 0x01, { slice($seg1, 0px, 3px, 1px); });
    defSegment($s2, 0x02, { slice($seg1, 3px, 3px, 1px); });
    defSegment($s3, 0x03, { slice($seg1, 6px, 3px, 1px); });
    defSegment($s4, 0x04, { slice($seg1, 9px, 3px, 1px); });
    defSegment($s5, 0x05, { slice($seg1, 12px, 3px, 1px); });
    defSegment($s6, 0x06, { slice($seg1, 15px, 3px, 1px); });
    defSegment($s7, 0x07, { slice($seg1, 18px, 3px, 1px); });
    defSegment($s8, 0x08, { slice($seg1, 21px, 3px, 1px); });
    defSegment($s9, 0x09, { slice($seg1, 24px, 3px, 1px); });
    defSegment($s10, 0x0a, { slice($seg1, 27px, 3px, 1px); });
    defSegment($s11, 0x0b, { slice($seg1, 30px, 3px, 1px); });
    defSegment($s12, 0x0c, { slice($seg1, 33px, 3px, 1px); });
    defSegment($s13, 0x0d, { slice($seg1, 36px, 3px, 1px); });
    defSegment($s14, 0x0e, { slice($seg1, 39px, 3px, 1px); });
    defSegment($s15, 0x0f, { slice($seg1, 42px, 3px, 1px); });
    defSegment($s16, 0x10, { slice($seg1, 45px, 3px, 1px); });
    defSegment($s17, 0x11, { slice($seg1, 48px, 3px, 1px); });
    defSegment($s18, 0x12, { slice($seg1, 51px, 3px, 1px); });
    defSegment($s19, 0x13, { slice($seg1, 54px, 3px, 1px); });
    defSegment($s20, 0x14, { slice($seg1, 57px, 3px, 1px); });
    defSegment($s21, 0x15, { slice($seg1, 60px, 3px, 1px); });
    defSegment($s22, 0x16, { slice($seg1, 63px, 3px, 1px); });
    defSegment($s23, 0x17, { slice($seg1, 66px, 3px, 1px); });
    defSegment($s24, 0x18, { slice($seg1, 69px, 3px, 1px); });
    defSegment($s25, 0x19, { slice($seg1, 72px, 3px, 1px); });
    defSegment($s26, 0x1a, { slice($seg1, 75px, 3px, 1px); });
    defSegment($s27, 0x1b, { slice($seg1, 78px, 3px, 1px); });
    defSegment($s28, 0x1c, { slice($seg1, 81px, 3px, 1px); });
    defSegment($s29, 0x1d, { slice($seg1, 84px, 3px, 1px); });
    defSegment($s30, 0x1e, { slice($seg1, 87px, 3px, 1px); });
    
    var barva = genLastEventParam($color);
    
siftSegments({
  segment($s1); segment($s2); segment($s3); segment($s4); segment($s5);
  segment($s6); segment($s7); segment($s8); segment($s9); segment($s10);
  segment($s11); segment($s12); segment($s13); segment($s14); segment($s15);
  segment($s16); segment($s17); segment($s18); segment($s19); segment($s20);
  segment($s21); segment($s22); segment($s23); segment($s24); segment($s25);
  segment($s26); segment($s27); segment($s28); segment($s29); segment($s30);
}, {
      addLayer(0s, Infinity, {
        addDrawing(0s, Infinity, animFill(Infinity, &barva));
      });
    });
    `,
    method: () => {
      spectoda.emitColorEvent("color", "#000000", 255);
    },
    listener: () => {
      console.log("Subscribed to listener");

      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        /// Return if the event type is not "noteOn" or "noteOff"
        if (event.type !== "channel" || (event.subtype !== "noteOn" && event.subtype !== "noteOff")) {
          return;
        }

        // Calculate the diode index based on the note number
        const diodeIndex = Math.floor((event.noteNumber / 128) * 30);

        if (event.subtype === "noteOn" && event.enabled) {
          // Get the color from the colorForNoteArray based on the note number
          const note = colorForNoteArray[event.noteNumber];
          // Emit the color event with the note color and diode index
          spectoda.emitColorEvent("color", note, diodeIndex);
        } else if (event.subtype === "noteOff") {
          // Emit the color event with black color (#000000) and diode index
          spectoda.emitColorEvent("color", "#000000", diodeIndex);
        }
      });

      return channelEventUnsub;
    },
  },
  {
    name: "Piano + BPM",
    code: `
    defDevice($con1, 0x00, 0xff, 150px, $seg1, 0x00, 150px, $seg2, 0x01, 150px, $seg3, 0x02, 150px, $seg4, 0x03, 150px, $seg5, 0x04, 150px, $seg6, 0x05, 150px, $seg7, 0x06, 150px, $seg8, 0x07, {
    });

    // Hodnota v procentech, posilat bpm / 480
    var bpm = genLastEventParam($bpm);
    addLayer(0s, Infinity, {
      addDrawing(0s, Infinity, animPlasmaShot(0.25s, #ffffff, 5%).animPlasmaShot(-0.25s, #ffffff, 5%));
    }).modifyTimeScale(&bpm);

    
    var color = genLastEventParam($color);
    var toggl = genLastEventParam($toggl);
    catchEvent($color).setValue(100%).emitAs($toggl);
    addLayer(0s, Infinity, {
      addDrawing(0s, Infinity, animFill(Infinity, &color));
    }).modifyBrightness(&toggl);
    `,
    method: () => {
      spectoda.emitPercentageEvent("toggl", 0, 255);
      spectoda.emitPercentageEvent("bpm", (currentBpm / 240) * 100, 255);
    },
    listener: () => {
      console.log("Subscribed to listener");
      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          const octave = event.noteNumber % 8;
          const note = colorForNoteArray[event.noteNumber];

          spectoda.emitColorEvent("color", note, octave);
        } else if ("noteOff" == event.subtype) {
          const octave = event.noteNumber % 8;

          spectoda.emitPercentageEvent("toggl", 0, octave);
        }
      });

      const bpmEventUnsub = nanoevents.on("bpm-change", bpm => {
        console.log("BPM", bpm);
        spectoda.emitPercentageEvent("bpm", (bpm / 240) * 100, 255);
      });

      return () => [channelEventUnsub, bpmEventUnsub].forEach(unsub => unsub());
    },
  },
  {
    name: "Barevne vystrely s intenzitou",
    code: `
    defDevice($con1, 0x00, 0xff, 150px, $seg1, 0x00, 150px, $seg2, 0x01, 150px, $seg3, 0x02, 150px, $seg4, 0x03, 150px, $seg5, 0x04, 150px, $seg6, 0x05, 150px, $seg7, 0x06, 150px, $seg8, 0x07, {
    });
    
    defCanvas($cvs1, {
      segment($seg1);
      segment($seg2);
      segment($seg3);
      segment($seg4);
      segment($seg5);
      segment($seg6);
      segment($seg7);
      segment($seg8);
    });

    
    var color = genSmoothOut(genLastEventParam($color), 0.3s);
    // addDrawing(0s, Infinity, animFill(Infinity, &color));
    
    siftCanvases({ canvas($cvs1, $__L2R, 1s); }, {
    });
    
    var shoot_time = 0.5s;
    var barva_vystrelu = genLastEventParam($shoot);
    interactive<0x10>(0s, Infinity, $shoot, {
      addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, &barva_vystrelu, 5%));
    });
    
    interactive<0x10>(0s, Infinity, $s0i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 2%));}
    interactive<0x10>(0s, Infinity, $s0i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 5%));}
    interactive<0x10>(0s, Infinity, $s0i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 8%));}
    interactive<0x10>(0s, Infinity, $s0i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 11%));}
    interactive<0x10>(0s, Infinity, $s0i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 14%));}
    interactive<0x10>(0s, Infinity, $s0i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 17%));}
    interactive<0x10>(0s, Infinity, $s0i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 20%));}
    interactive<0x10>(0s, Infinity, $s0i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 22%));}
    interactive<0x10>(0s, Infinity, $s0i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 25%));}
    interactive<0x10>(0s, Infinity, $s0i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #000000, 28%));}
    interactive<0x10>(0s, Infinity, $s1i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 2%));}
    interactive<0x10>(0s, Infinity, $s1i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 5%));}
    interactive<0x10>(0s, Infinity, $s1i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 8%));}
    interactive<0x10>(0s, Infinity, $s1i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 11%));}
    interactive<0x10>(0s, Infinity, $s1i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 14%));}
    interactive<0x10>(0s, Infinity, $s1i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 17%));}
    interactive<0x10>(0s, Infinity, $s1i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 20%));}
    interactive<0x10>(0s, Infinity, $s1i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 22%));}
    interactive<0x10>(0s, Infinity, $s1i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 25%));}
    interactive<0x10>(0s, Infinity, $s1i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF4400, 28%));}
    interactive<0x10>(0s, Infinity, $s2i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 2%));}
    interactive<0x10>(0s, Infinity, $s2i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 5%));}
    interactive<0x10>(0s, Infinity, $s2i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 8%));}
    interactive<0x10>(0s, Infinity, $s2i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 11%));}
    interactive<0x10>(0s, Infinity, $s2i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 14%));}
    interactive<0x10>(0s, Infinity, $s2i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 17%));}
    interactive<0x10>(0s, Infinity, $s2i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 20%));}
    interactive<0x10>(0s, Infinity, $s2i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 22%));}
    interactive<0x10>(0s, Infinity, $s2i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 25%));}
    interactive<0x10>(0s, Infinity, $s2i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FF9900, 28%));}
    interactive<0x10>(0s, Infinity, $s3i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 2%));}
    interactive<0x10>(0s, Infinity, $s3i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 5%));}
    interactive<0x10>(0s, Infinity, $s3i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 8%));}
    interactive<0x10>(0s, Infinity, $s3i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 11%));}
    interactive<0x10>(0s, Infinity, $s3i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 14%));}
    interactive<0x10>(0s, Infinity, $s3i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 17%));}
    interactive<0x10>(0s, Infinity, $s3i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 20%));}
    interactive<0x10>(0s, Infinity, $s3i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 22%));}
    interactive<0x10>(0s, Infinity, $s3i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 25%));}
    interactive<0x10>(0s, Infinity, $s3i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #FFEE00, 28%));}
    interactive<0x10>(0s, Infinity, $s4i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 2%));}
    interactive<0x10>(0s, Infinity, $s4i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 5%));}
    interactive<0x10>(0s, Infinity, $s4i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 8%));}
    interactive<0x10>(0s, Infinity, $s4i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 11%));}
    interactive<0x10>(0s, Infinity, $s4i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 14%));}
    interactive<0x10>(0s, Infinity, $s4i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 17%));}
    interactive<0x10>(0s, Infinity, $s4i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 20%));}
    interactive<0x10>(0s, Infinity, $s4i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 22%));}
    interactive<0x10>(0s, Infinity, $s4i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 25%));}
    interactive<0x10>(0s, Infinity, $s4i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #BBFF00, 28%));}
    interactive<0x10>(0s, Infinity, $s5i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 2%));}
    interactive<0x10>(0s, Infinity, $s5i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 5%));}
    interactive<0x10>(0s, Infinity, $s5i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 8%));}
    interactive<0x10>(0s, Infinity, $s5i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 11%));}
    interactive<0x10>(0s, Infinity, $s5i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 14%));}
    interactive<0x10>(0s, Infinity, $s5i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 17%));}
    interactive<0x10>(0s, Infinity, $s5i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 20%));}
    interactive<0x10>(0s, Infinity, $s5i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 22%));}
    interactive<0x10>(0s, Infinity, $s5i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 25%));}
    interactive<0x10>(0s, Infinity, $s5i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #66FF00, 28%));}
    interactive<0x10>(0s, Infinity, $s6i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 2%));}
    interactive<0x10>(0s, Infinity, $s6i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 5%));}
    interactive<0x10>(0s, Infinity, $s6i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 8%));}
    interactive<0x10>(0s, Infinity, $s6i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 11%));}
    interactive<0x10>(0s, Infinity, $s6i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 14%));}
    interactive<0x10>(0s, Infinity, $s6i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 17%));}
    interactive<0x10>(0s, Infinity, $s6i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 20%));}
    interactive<0x10>(0s, Infinity, $s6i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 22%));}
    interactive<0x10>(0s, Infinity, $s6i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 25%));}
    interactive<0x10>(0s, Infinity, $s6i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #11FF00, 28%));}
    interactive<0x10>(0s, Infinity, $s7i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 2%));}
    interactive<0x10>(0s, Infinity, $s7i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 5%));}
    interactive<0x10>(0s, Infinity, $s7i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 8%));}
    interactive<0x10>(0s, Infinity, $s7i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 11%));}
    interactive<0x10>(0s, Infinity, $s7i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 14%));}
    interactive<0x10>(0s, Infinity, $s7i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 17%));}
    interactive<0x10>(0s, Infinity, $s7i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 20%));}
    interactive<0x10>(0s, Infinity, $s7i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 22%));}
    interactive<0x10>(0s, Infinity, $s7i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 25%));}
    interactive<0x10>(0s, Infinity, $s7i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF44, 28%));}
    interactive<0x10>(0s, Infinity, $s8i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 2%));}
    interactive<0x10>(0s, Infinity, $s8i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 5%));}
    interactive<0x10>(0s, Infinity, $s8i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 8%));}
    interactive<0x10>(0s, Infinity, $s8i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 11%));}
    interactive<0x10>(0s, Infinity, $s8i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 14%));}
    interactive<0x10>(0s, Infinity, $s8i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 17%));}
    interactive<0x10>(0s, Infinity, $s8i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 20%));}
    interactive<0x10>(0s, Infinity, $s8i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 22%));}
    interactive<0x10>(0s, Infinity, $s8i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 25%));}
    interactive<0x10>(0s, Infinity, $s8i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FF99, 28%));}
    interactive<0x10>(0s, Infinity, $s9i0, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 2%));}
    interactive<0x10>(0s, Infinity, $s9i1, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 5%));}
    interactive<0x10>(0s, Infinity, $s9i2, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 8%));}
    interactive<0x10>(0s, Infinity, $s9i3, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 11%));}
    interactive<0x10>(0s, Infinity, $s9i4, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 14%));}
    interactive<0x10>(0s, Infinity, $s9i5, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 17%));}
    interactive<0x10>(0s, Infinity, $s9i6, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 20%));}
    interactive<0x10>(0s, Infinity, $s9i7, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 22%));}
    interactive<0x10>(0s, Infinity, $s9i8, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 25%));}
    interactive<0x10>(0s, Infinity, $s9i9, {addDrawing(0s, &shoot_time, animPlasmaShot(&shoot_time, #00FFEE, 28%));}
    `,
    listener: () => {
      console.log("Subscribed to listener");

      const channelEventUnsub = nanoevents.on("midichannelevent", event => {
        if (event.type === "channel" && event.subtype === "noteOn" && event.enabled) {
          const octave = event.noteNumber % 12;
          // const note = colorForNoteArray[octave * 8];
          // for label use convention s0-9 i0-9
          const label = `s${(octave + 1) % 10}i${Math.floor((event.velocity / 128) * 10)}`;

          spectoda.emitEvent(label, event.channel);
        }
      });

      return channelEventUnsub;
    },
  },
];

const activeTnglIndexAtom = atomWithLocalStorage<number>("activeTnglIndex", 0);

export function UploadTnglButtons() {
  const { isConnected, upload } = useSpectodaConnection();
  const [activeTnglIndex, setActiveTnglIndex] = useAtom(activeTnglIndexAtom);

  useEffect(() => {
    (async () => {
      await upload(tnglList[activeTnglIndex]?.code as string);
      await tnglList[activeTnglIndex]?.method?.();

      // ! Hacky way of uploading tngl after load (this iframe do not have methods handle by the main window yet)
      setTimeout(async () => {
        await upload(tnglList[activeTnglIndex]?.code as string);
        await tnglList[activeTnglIndex]?.method?.();
      }, 3000);
    })();

    if (typeof tnglList[activeTnglIndex]?.listener === "function" && isConnected && activeTnglIndex > 0) {
      const unsub = tnglList[activeTnglIndex]?.listener?.();

      console.log("Subscribed to listener");

      return () => {
        unsub?.();
      };
    }
  }, [activeTnglIndex, isConnected]);

  return (
    <div className="mt-4">
      <h3 className="text-md mb-1 font-bold">Módy</h3>
      <div className="flex flex-wrap">
        {tnglList.map(({ code, method, name }, index) => (
          <button
            key={index}
            className={cn("btn  m-1", activeTnglIndex === index ? "btn-primary" : "btn-ghost border  border-white")}
            onClick={async () => {
              // await spectoda.timeline?.setState(0, false);
              // await spectoda.syncTimeline();
              setActiveTnglIndex(index);
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
