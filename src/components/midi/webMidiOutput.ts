import { SynthEvent } from "@ryohey/wavelet";
import { AnyEvent, serialize } from "@/lib/midifile-ts";
import { TIMER_INTERVAL } from "~/lib/wavelet/example/src/MIDIPlayer";

export class MIDIOutputProcessor {
  private midiAccess: WebMidi.MIDIAccess | null = null;
  private midiOutput: WebMidi.MIDIOutput | null = null;
  private midiOutputBuffer: number[] = [];

  constructor() {
    this.initializeMIDI();
    setInterval(this.flushMIDIOutputBuffer.bind(this), TIMER_INTERVAL / 3);
  }

  private async initializeMIDI() {
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      // @ts-ignore
      this.midiAccess.onstatechange = this.handleMIDIStateChange.bind(this);
      this.connectToMIDIOutput();
    } catch (error) {
      console.error("Failed to initialize Web MIDI:", error);
    }
  }

  private handleMIDIStateChange(event: MIDIConnectionEvent) {
    // @ts-ignore
    if (event.port.type === "output" && event.port.state === "connected") {
      this.connectToMIDIOutput();
    }
  }

  private connectToMIDIOutput() {
    if (this.midiAccess) {
      const outputs = Array.from(this.midiAccess.outputs.values());
      if (outputs.length > 0) {
        // @ts-ignore
        this.midiOutput = outputs[0];
        // @ts-ignore
        console.log("Connected to MIDI output:", this.midiOutput.name);
      }
    }
  }

  public processMIDIEvent(event: SynthEvent) {
    const ev = { ...event.midi, deltaTime: 0 } as AnyEvent;
    const midi = serialize(ev, false);

    if (this.midiOutput && event.type !== "loadSample" && midi.length > 1) {
      this.midiOutput.send(midi);
    }
  }

  private flushMIDIOutputBuffer() {
    if (this.midiOutput && this.midiOutputBuffer.length > 0) {
      this.midiOutput.send(this.midiOutputBuffer);
      this.midiOutputBuffer = [];
    }
  }
}
