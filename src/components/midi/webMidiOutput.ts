import { SynthEvent } from "@ryohey/wavelet";
import { serialize } from "~/lib/midifile-ts/src";
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
    if (this.midiOutput && event.type === "midi") {
      const midi = event.midi;

      switch (midi.subtype) {
        case "noteOn":
          this.midiOutputBuffer.push(
            0x90 + midi.channel,
            midi.noteNumber,
            midi.velocity,
          );
          break;
        case "noteOff":
          this.midiOutputBuffer.push(
            0x80 + midi.channel,
            midi.noteNumber,
            midi.velocity,
          );
          break;
        case "controller":
          this.midiOutputBuffer.push(
            0xb0 + midi.channel,
            midi.controllerType,
            midi.value,
          );
          break;
        case "programChange":
          this.midiOutputBuffer.push(0xc0 + midi.channel, midi.value);
          break;
        case "pitchBend":
          const pitchBendValue = (midi.value + 8192) & 0x7f;
          const pitchBendLSB = pitchBendValue & 0x7f;
          const pitchBendMSB = (pitchBendValue >> 7) & 0x7f;
          this.midiOutputBuffer.push(
            0xe0 + midi.channel,
            pitchBendLSB,
            pitchBendMSB,
          );
          break;
        case "channelAftertouch":
          this.midiOutputBuffer.push(0xd0 + midi.channel, midi.amount);
          break;
        case "noteAftertouch":
          this.midiOutputBuffer.push(
            0xa0 + midi.channel,
            midi.noteNumber,
            midi.amount,
          );
          break;
        // Add more cases for other MIDI event types as needed
      }
    }
  }

  private flushMIDIOutputBuffer() {
    if (this.midiOutput && this.midiOutputBuffer.length > 0) {
      this.midiOutput.send(this.midiOutputBuffer);
      this.midiOutputBuffer = [];
    }
  }
}
