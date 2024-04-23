(function () {
    'use strict';

    const audioDataToAudioBuffer = (audioData) => {
        const audioBuffer = new AudioBuffer({
            length: audioData.length,
            sampleRate: audioData.sampleRate,
            numberOfChannels: 2,
        });
        audioBuffer.copyToChannel(new Float32Array(audioData.leftData), 0);
        audioBuffer.copyToChannel(new Float32Array(audioData.rightData), 1);
        return audioBuffer;
    };

    class Logger {
        enabled = true;
        log(...args) {
            if (this.enabled) {
                console.log(...args);
            }
        }
        warn(...args) {
            if (this.enabled) {
                console.warn(...args);
            }
        }
        error(...args) {
            if (this.enabled) {
                console.error(...args);
            }
        }
    }
    const logger = new Logger();
    logger.enabled = false;

    class SampleTable {
        samples = {};
        addSample(sample, bank, instrument, keyRange, velRange) {
            for (let i = keyRange[0]; i <= keyRange[1]; i++) {
                if (this.samples[bank] === undefined) {
                    this.samples[bank] = {};
                }
                if (this.samples[bank][instrument] === undefined) {
                    this.samples[bank][instrument] = {};
                }
                if (this.samples[bank][instrument][i] === undefined) {
                    this.samples[bank][instrument][i] = [];
                }
                this.samples[bank][instrument][i].push({ ...sample, velRange });
            }
        }
        getSamples(bank, instrument, pitch, velocity) {
            const samples = this.samples?.[bank]?.[instrument]?.[pitch];
            return (samples?.filter((s) => velocity >= s.velRange[0] && velocity <= s.velRange[1]) ?? []);
        }
    }

    var MIDIControlEvents$1 = {
        MSB_BANK: 0x00,
        MSB_MODWHEEL: 0x01,
        MSB_BREATH: 0x02,
        MSB_FOOT: 0x04,
        MSB_PORTAMENTO_TIME: 0x05,
        MSB_DATA_ENTRY: 0x06,
        MSB_MAIN_VOLUME: 0x07,
        MSB_BALANCE: 0x08,
        MSB_PAN: 0x0a,
        MSB_EXPRESSION: 0x0b,
        MSB_EFFECT1: 0x0c,
        MSB_EFFECT2: 0x0d,
        MSB_GENERAL_PURPOSE1: 0x10,
        MSB_GENERAL_PURPOSE2: 0x11,
        MSB_GENERAL_PURPOSE3: 0x12,
        MSB_GENERAL_PURPOSE4: 0x13,
        LSB_BANK: 0x20,
        LSB_MODWHEEL: 0x21,
        LSB_BREATH: 0x22,
        LSB_FOOT: 0x24,
        LSB_PORTAMENTO_TIME: 0x25,
        LSB_DATA_ENTRY: 0x26,
        LSB_MAIN_VOLUME: 0x27,
        LSB_BALANCE: 0x28,
        LSB_PAN: 0x2a,
        LSB_EXPRESSION: 0x2b,
        LSB_EFFECT1: 0x2c,
        LSB_EFFECT2: 0x2d,
        LSB_GENERAL_PURPOSE1: 0x30,
        LSB_GENERAL_PURPOSE2: 0x31,
        LSB_GENERAL_PURPOSE3: 0x32,
        LSB_GENERAL_PURPOSE4: 0x33,
        SUSTAIN: 0x40,
        PORTAMENTO: 0x41,
        SOSTENUTO: 0x42,
        SUSTENUTO: 0x42,
        SOFT_PEDAL: 0x43,
        LEGATO_FOOTSWITCH: 0x44,
        HOLD2: 0x45,
        SC1_SOUND_VARIATION: 0x46,
        SC2_TIMBRE: 0x47,
        SC3_RELEASE_TIME: 0x48,
        SC4_ATTACK_TIME: 0x49,
        SC5_BRIGHTNESS: 0x4a,
        SC6: 0x4b,
        SC7: 0x4c,
        SC8: 0x4d,
        SC9: 0x4e,
        SC10: 0x4f,
        GENERAL_PURPOSE5: 0x50,
        GENERAL_PURPOSE6: 0x51,
        GENERAL_PURPOSE7: 0x52,
        GENERAL_PURPOSE8: 0x53,
        PORTAMENTO_CONTROL: 0x54,
        E1_REVERB_DEPTH: 0x5b,
        E2_TREMOLO_DEPTH: 0x5c,
        E3_CHORUS_DEPTH: 0x5d,
        E4_DETUNE_DEPTH: 0x5e,
        E5_PHASER_DEPTH: 0x5f,
        DATA_INCREMENT: 0x60,
        DATA_DECREMENT: 0x61,
        NONREG_PARM_NUM_LSB: 0x62,
        NONREG_PARM_NUM_MSB: 0x63,
        REGIST_PARM_NUM_LSB: 0x64,
        REGIST_PARM_NUM_MSB: 0x65,
        ALL_SOUNDS_OFF: 0x78,
        RESET_CONTROLLERS: 0x79,
        LOCAL_CONTROL_SWITCH: 0x7a,
        ALL_NOTES_OFF: 0x7b,
        OMNI_OFF: 0x7c,
        OMNI_ON: 0x7d,
        MONO1: 0x7e,
        MONO2: 0x7f,
    };

    function toCharCodes$1(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        return bytes;
    }

    /** @class */ ((function () {
        function Buffer() {
            this.data = [];
            this.position = 0;
        }
        Object.defineProperty(Buffer.prototype, "length", {
            get: function () {
                return this.data.length;
            },
            enumerable: false,
            configurable: true
        });
        Buffer.prototype.writeByte = function (v) {
            this.data.push(v);
            this.position++;
        };
        Buffer.prototype.writeStr = function (str) {
            this.writeBytes(toCharCodes$1(str));
        };
        Buffer.prototype.writeInt32 = function (v) {
            this.writeByte((v >> 24) & 0xff);
            this.writeByte((v >> 16) & 0xff);
            this.writeByte((v >> 8) & 0xff);
            this.writeByte(v & 0xff);
        };
        Buffer.prototype.writeInt16 = function (v) {
            this.writeByte((v >> 8) & 0xff);
            this.writeByte(v & 0xff);
        };
        Buffer.prototype.writeBytes = function (arr) {
            var _this = this;
            arr.forEach(function (v) { return _this.writeByte(v); });
        };
        Buffer.prototype.writeChunk = function (id, func) {
            this.writeStr(id);
            var chunkBuf = new Buffer();
            func(chunkBuf);
            this.writeInt32(chunkBuf.length);
            this.writeBytes(chunkBuf.data);
        };
        Buffer.prototype.toBytes = function () {
            return new Uint8Array(this.data);
        };
        return Buffer;
    })());

    // https://gist.github.com/fmal/763d9c953c5a5f8b8f9099dbc58da55e
    function insertSorted(arr, item, prop) {
        let low = 0;
        let high = arr.length;
        let mid;
        while (low < high) {
            mid = (low + high) >>> 1; // like (num / 2) but faster
            if (arr[mid][prop] < item[prop]) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        arr.splice(low, 0, item);
    }

    class SynthEventHandler {
        processor;
        scheduledEvents = [];
        currentEvents = [];
        rpnEvents = {};
        bankSelectMSB = {};
        constructor(processor) {
            this.processor = processor;
        }
        get currentFrame() {
            return this.processor.currentFrame;
        }
        addEvent(e) {
            logger.log(e);
            if ("delayTime" in e) {
                // handle in process
                insertSorted(this.scheduledEvents, {
                    ...e,
                    scheduledFrame: this.currentFrame + e.delayTime,
                }, "scheduledFrame");
            }
            else {
                this.handleImmediateEvent(e);
            }
        }
        processScheduledEvents() {
            if (this.scheduledEvents.length === 0) {
                return;
            }
            while (true) {
                const e = this.scheduledEvents[0];
                if (e === undefined || e.scheduledFrame > this.currentFrame) {
                    // scheduledEvents are sorted by scheduledFrame,
                    // so we can break early instead of iterating through all scheduledEvents,
                    break;
                }
                this.scheduledEvents.shift();
                this.currentEvents.push(e);
            }
            while (true) {
                const e = this.currentEvents.pop();
                if (e === undefined) {
                    break;
                }
                this.handleDelayableEvent(e.midi);
            }
        }
        handleImmediateEvent(e) {
            switch (e.type) {
                case "loadSample":
                    this.processor.loadSample(e.sample, e.bank, e.instrument, e.keyRange, e.velRange);
                    break;
            }
        }
        handleDelayableEvent(e) {
            logger.log("handle delayable event", e);
            switch (e.type) {
                case "channel": {
                    switch (e.subtype) {
                        case "noteOn":
                            this.processor.noteOn(e.channel, e.noteNumber, e.velocity);
                            break;
                        case "noteOff":
                            this.processor.noteOff(e.channel, e.noteNumber);
                            break;
                        case "pitchBend":
                            this.processor.pitchBend(e.channel, e.value);
                            break;
                        case "programChange":
                            this.processor.programChange(e.channel, e.value);
                            break;
                        case "controller": {
                            switch (e.controllerType) {
                                case MIDIControlEvents$1.NONREG_PARM_NUM_MSB:
                                case MIDIControlEvents$1.NONREG_PARM_NUM_LSB: // NRPN LSB
                                    // Delete the rpn for do not send NRPN data events
                                    delete this.rpnEvents[e.channel];
                                    break;
                                case MIDIControlEvents$1.REGIST_PARM_NUM_MSB: {
                                    if (e.value === 127) {
                                        delete this.rpnEvents[e.channel];
                                    }
                                    else {
                                        this.rpnEvents[e.channel] = {
                                            ...this.rpnEvents[e.channel],
                                            rpnMSB: e,
                                        };
                                    }
                                    break;
                                }
                                case MIDIControlEvents$1.REGIST_PARM_NUM_LSB: {
                                    if (e.value === 127) {
                                        delete this.rpnEvents[e.channel];
                                    }
                                    else {
                                        this.rpnEvents[e.channel] = {
                                            ...this.rpnEvents[e.channel],
                                            rpnLSB: e,
                                        };
                                    }
                                    break;
                                }
                                case MIDIControlEvents$1.MSB_DATA_ENTRY: {
                                    const rpn = {
                                        ...this.rpnEvents[e.channel],
                                        dataMSB: e,
                                    };
                                    this.rpnEvents[e.channel] = rpn;
                                    // In case of pitch bend sensitivity,
                                    // send without waiting for Data LSB event
                                    if (rpn.rpnLSB?.value === 0) {
                                        this.processor.setPitchBendSensitivity(e.channel, rpn.dataMSB.value);
                                    }
                                    break;
                                }
                                case MIDIControlEvents$1.LSB_DATA_ENTRY: {
                                    this.rpnEvents[e.channel] = {
                                        ...this.rpnEvents[e.channel],
                                        dataLSB: e,
                                    };
                                    // TODO: Send other RPN events
                                    break;
                                }
                                case MIDIControlEvents$1.MSB_MAIN_VOLUME:
                                    this.processor.setMainVolume(e.channel, e.value);
                                    break;
                                case MIDIControlEvents$1.MSB_EXPRESSION:
                                    this.processor.expression(e.channel, e.value);
                                    break;
                                case MIDIControlEvents$1.ALL_SOUNDS_OFF:
                                    this.removeScheduledEvents(e.channel);
                                    this.processor.allSoundsOff(e.channel);
                                    break;
                                case MIDIControlEvents$1.ALL_NOTES_OFF:
                                    this.processor.allNotesOff(e.channel);
                                    break;
                                case MIDIControlEvents$1.SUSTAIN:
                                    this.processor.hold(e.channel, e.value);
                                    break;
                                case MIDIControlEvents$1.MSB_PAN:
                                    this.processor.setPan(e.channel, e.value);
                                    break;
                                case MIDIControlEvents$1.MSB_MODWHEEL:
                                    this.processor.modulation(e.channel, e.value);
                                    break;
                                case MIDIControlEvents$1.MSB_BANK:
                                    this.bankSelectMSB[e.channel] = e.value;
                                    break;
                                case MIDIControlEvents$1.LSB_BANK: {
                                    const msb = this.bankSelectMSB[e.channel];
                                    if (msb !== undefined) {
                                        const bank = (msb << 7) + e.value;
                                        this.processor.bankSelect(e.channel, bank);
                                    }
                                    break;
                                }
                                case MIDIControlEvents$1.RESET_CONTROLLERS:
                                    this.processor.resetChannel(e.channel);
                                    break;
                            }
                            break;
                        }
                    }
                    break;
                }
            }
        }
        removeScheduledEvents(channel) {
            this.scheduledEvents = this.scheduledEvents.filter((e) => e.midi.channel !== channel);
            this.currentEvents = this.currentEvents.filter((e) => e.midi.channel !== channel);
        }
    }

    var EnvelopePhase;
    (function (EnvelopePhase) {
        EnvelopePhase[EnvelopePhase["attack"] = 0] = "attack";
        EnvelopePhase[EnvelopePhase["decay"] = 1] = "decay";
        EnvelopePhase[EnvelopePhase["sustain"] = 2] = "sustain";
        EnvelopePhase[EnvelopePhase["release"] = 3] = "release";
        EnvelopePhase[EnvelopePhase["forceStop"] = 4] = "forceStop";
        EnvelopePhase[EnvelopePhase["stopped"] = 5] = "stopped";
    })(EnvelopePhase || (EnvelopePhase = {}));
    const forceStopReleaseTime = 0.1;
    class AmplitudeEnvelope {
        parameter;
        phase = EnvelopePhase.attack;
        lastAmplitude = 0;
        sampleRate;
        constructor(parameter, sampleRate) {
            this.parameter = parameter;
            this.sampleRate = sampleRate;
        }
        noteOn() {
            this.phase = EnvelopePhase.attack;
        }
        noteOff() {
            if (this.phase !== EnvelopePhase.forceStop) {
                this.phase = EnvelopePhase.release;
            }
        }
        // Rapidly decrease the volume. This method ignores release time parameter
        forceStop() {
            this.phase = EnvelopePhase.forceStop;
        }
        getAmplitude(bufferSize) {
            const { attackTime, decayTime, sustainLevel, releaseTime } = this.parameter;
            const { sampleRate } = this;
            // Attack
            switch (this.phase) {
                case EnvelopePhase.attack: {
                    const amplificationPerFrame = (1 / (attackTime * sampleRate)) * bufferSize;
                    const value = this.lastAmplitude + amplificationPerFrame;
                    if (value >= 1) {
                        this.phase = EnvelopePhase.decay;
                        this.lastAmplitude = 1;
                        return 1;
                    }
                    this.lastAmplitude = value;
                    return value;
                }
                case EnvelopePhase.decay: {
                    const attenuationPerFrame = (1 / (decayTime * sampleRate)) * bufferSize;
                    const value = this.lastAmplitude - attenuationPerFrame;
                    if (value <= sustainLevel) {
                        if (sustainLevel <= 0) {
                            this.phase = EnvelopePhase.stopped;
                            this.lastAmplitude = 0;
                            return 0;
                        }
                        else {
                            this.phase = EnvelopePhase.sustain;
                            this.lastAmplitude = sustainLevel;
                            return sustainLevel;
                        }
                    }
                    this.lastAmplitude = value;
                    return value;
                }
                case EnvelopePhase.sustain: {
                    return sustainLevel;
                }
                case EnvelopePhase.release: {
                    const attenuationPerFrame = (1 / (releaseTime * sampleRate)) * bufferSize;
                    const value = this.lastAmplitude - attenuationPerFrame;
                    if (value <= 0) {
                        this.phase = EnvelopePhase.stopped;
                        this.lastAmplitude = 0;
                        return 0;
                    }
                    this.lastAmplitude = value;
                    return value;
                }
                case EnvelopePhase.forceStop: {
                    const attenuationPerFrame = (1 / (forceStopReleaseTime * sampleRate)) * bufferSize;
                    const value = this.lastAmplitude - attenuationPerFrame;
                    if (value <= 0) {
                        this.phase = EnvelopePhase.stopped;
                        this.lastAmplitude = 0;
                        return 0;
                    }
                    this.lastAmplitude = value;
                    return value;
                }
                case EnvelopePhase.stopped: {
                    return 0;
                }
            }
        }
        get isPlaying() {
            return this.phase !== EnvelopePhase.stopped;
        }
    }

    class LFO {
        // Hz
        frequency = 5;
        phase = 0;
        sampleRate;
        constructor(sampleRate) {
            this.sampleRate = sampleRate;
        }
        getValue(bufferSize) {
            const phase = this.phase;
            this.phase +=
                ((Math.PI * 2 * this.frequency) / this.sampleRate) * bufferSize;
            return Math.sin(phase);
        }
    }

    class WavetableOscillator {
        sample;
        sampleIndex = 0;
        _isPlaying = false;
        _isNoteOff = false;
        baseSpeed = 1;
        envelope;
        pitchLFO;
        sampleRate;
        speed = 1;
        // 0 to 1
        velocity = 1;
        // 0 to 1
        volume = 1;
        modulation = 0;
        // cent
        modulationDepthRange = 50;
        // -1 to 1
        pan = 0;
        // This oscillator should be note off when hold pedal off
        isHold = false;
        constructor(sample, sampleRate) {
            this.sample = sample;
            this.sampleRate = sampleRate;
            this.envelope = new AmplitudeEnvelope(sample.amplitudeEnvelope, sampleRate);
            this.pitchLFO = new LFO(sampleRate);
        }
        noteOn(pitch, velocity) {
            this.velocity = velocity;
            this._isPlaying = true;
            this.sampleIndex = this.sample.sampleStart;
            this.baseSpeed = Math.pow(2, ((pitch - this.sample.pitch) / 12) * this.sample.scaleTuning);
            this.pitchLFO.frequency = 5;
            this.envelope.noteOn();
        }
        noteOff() {
            this.envelope.noteOff();
            this._isNoteOff = true;
        }
        forceStop() {
            this.envelope.forceStop();
        }
        process(outputs) {
            if (!this._isPlaying) {
                return;
            }
            const speed = (this.baseSpeed * this.speed * this.sample.sampleRate) / this.sampleRate;
            const volume = this.velocity * this.volume * this.sample.volume;
            // zero to pi/2
            const panTheta = ((Math.min(1, Math.max(-1, this.pan + this.sample.pan)) + 1) * Math.PI) /
                4;
            const leftPanVolume = Math.cos(panTheta);
            const rightPanVolume = Math.sin(panTheta);
            const gain = this.envelope.getAmplitude(outputs[0].length);
            const leftGain = gain * volume * leftPanVolume;
            const rightGain = gain * volume * rightPanVolume;
            const pitchLFOValue = this.pitchLFO.getValue(outputs[0].length);
            const pitchModulation = pitchLFOValue * this.modulation * (this.modulationDepthRange / 1200);
            const modulatedSpeed = speed * (1 + pitchModulation);
            for (let i = 0; i < outputs[0].length; ++i) {
                const index = Math.floor(this.sampleIndex);
                const advancedIndex = this.sampleIndex + modulatedSpeed;
                let loopIndex = null;
                if (this.sample.loop !== null && advancedIndex >= this.sample.loop.end) {
                    loopIndex =
                        this.sample.loop.start + (advancedIndex - Math.floor(advancedIndex));
                }
                const nextIndex = loopIndex !== null
                    ? Math.floor(loopIndex)
                    : Math.min(index + 1, this.sample.sampleEnd - 1);
                // linear interpolation
                const current = this.sample.buffer[index];
                const next = this.sample.buffer[nextIndex];
                const level = current + (next - current) * (this.sampleIndex - index);
                outputs[0][i] += level * leftGain;
                outputs[1][i] += level * rightGain;
                this.sampleIndex = loopIndex ?? advancedIndex;
                if (this.sampleIndex >= this.sample.sampleEnd) {
                    this._isPlaying = false;
                    break;
                }
            }
        }
        get isPlaying() {
            return this._isPlaying && this.envelope.isPlaying;
        }
        get isNoteOff() {
            return this._isNoteOff;
        }
        get exclusiveClass() {
            return this.sample.exclusiveClass;
        }
    }

    const initialChannelState = () => ({
        volume: 1,
        bank: 0,
        instrument: 0,
        pitchBend: 0,
        pitchBendSensitivity: 2,
        oscillators: {},
        expression: 1,
        pan: 0,
        modulation: 0,
        hold: false,
    });
    const RHYTHM_CHANNEL = 9;
    const RHYTHM_BANK = 128;
    class SynthProcessorCore {
        sampleTable = new SampleTable();
        channels = {};
        eventHandler;
        sampleRate;
        getCurrentFrame;
        constructor(sampleRate, getCurrentFrame) {
            this.eventHandler = new SynthEventHandler(this);
            this.sampleRate = sampleRate;
            this.getCurrentFrame = getCurrentFrame;
        }
        get currentFrame() {
            return this.getCurrentFrame();
        }
        getSamples(channel, pitch, velocity) {
            const state = this.getChannelState(channel);
            // Play drums for CH.10
            const bank = channel === RHYTHM_CHANNEL ? RHYTHM_BANK : state.bank;
            return this.sampleTable.getSamples(bank, state.instrument, pitch, velocity);
        }
        loadSample(sample, bank, instrument, keyRange, velRange) {
            const _sample = {
                ...sample,
                buffer: new Float32Array(sample.buffer),
            };
            this.sampleTable.addSample(_sample, bank, instrument, keyRange, velRange);
        }
        addEvent(e) {
            this.eventHandler.addEvent(e);
        }
        noteOn(channel, pitch, velocity) {
            const state = this.getChannelState(channel);
            const samples = this.getSamples(channel, pitch, velocity);
            if (samples.length === 0) {
                logger.warn(`There is no sample for noteNumber ${pitch} in instrument ${state.instrument} in bank ${state.bank}`);
                return;
            }
            for (const sample of samples) {
                const oscillator = new WavetableOscillator(sample, this.sampleRate);
                const volume = velocity / 0x80;
                oscillator.noteOn(pitch, volume);
                if (state.oscillators[pitch] === undefined) {
                    state.oscillators[pitch] = [];
                }
                if (sample.exclusiveClass !== undefined) {
                    for (const key in state.oscillators) {
                        for (const osc of state.oscillators[key]) {
                            if (osc.exclusiveClass === sample.exclusiveClass) {
                                osc.forceStop();
                            }
                        }
                    }
                }
                state.oscillators[pitch].push(oscillator);
            }
        }
        noteOff(channel, pitch) {
            const state = this.getChannelState(channel);
            if (state.oscillators[pitch] === undefined) {
                return;
            }
            for (const osc of state.oscillators[pitch]) {
                if (!osc.isNoteOff) {
                    if (state.hold) {
                        osc.isHold = true;
                    }
                    else {
                        osc.noteOff();
                    }
                }
            }
        }
        pitchBend(channel, value) {
            const state = this.getChannelState(channel);
            state.pitchBend = (value / 0x2000 - 1) * state.pitchBendSensitivity;
        }
        programChange(channel, value) {
            const state = this.getChannelState(channel);
            state.instrument = value;
        }
        setPitchBendSensitivity(channel, value) {
            const state = this.getChannelState(channel);
            state.pitchBendSensitivity = value;
        }
        setMainVolume(channel, value) {
            const state = this.getChannelState(channel);
            state.volume = value / 0x80;
        }
        expression(channel, value) {
            const state = this.getChannelState(channel);
            state.expression = value / 0x80;
        }
        allSoundsOff(channel) {
            const state = this.getChannelState(channel);
            for (const key in state.oscillators) {
                for (const osc of state.oscillators[key]) {
                    osc.forceStop();
                }
            }
        }
        allNotesOff(channel) {
            const state = this.getChannelState(channel);
            for (const key in state.oscillators) {
                for (const osc of state.oscillators[key]) {
                    osc.noteOff();
                }
            }
        }
        hold(channel, value) {
            const hold = value >= 64;
            const state = this.getChannelState(channel);
            state.hold = hold;
            if (hold) {
                return;
            }
            for (const key in state.oscillators) {
                for (const osc of state.oscillators[key]) {
                    if (osc.isHold) {
                        osc.noteOff();
                    }
                }
            }
        }
        setPan(channel, value) {
            const state = this.getChannelState(channel);
            state.pan = (value / 127 - 0.5) * 2;
        }
        bankSelect(channel, value) {
            const state = this.getChannelState(channel);
            state.bank = value;
        }
        modulation(channel, value) {
            const state = this.getChannelState(channel);
            state.modulation = value / 0x80;
        }
        resetChannel(channel) {
            delete this.channels[channel];
        }
        getChannelState(channel) {
            const state = this.channels[channel];
            if (state !== undefined) {
                return state;
            }
            const newState = initialChannelState();
            this.channels[channel] = newState;
            return newState;
        }
        process(outputs) {
            this.eventHandler.processScheduledEvents();
            for (const channel in this.channels) {
                const state = this.channels[channel];
                for (let key in state.oscillators) {
                    state.oscillators[key] = state.oscillators[key].filter((oscillator) => {
                        oscillator.speed = Math.pow(2, state.pitchBend / 12);
                        oscillator.volume = state.volume * state.expression;
                        oscillator.pan = state.pan;
                        oscillator.modulation = state.modulation;
                        oscillator.process([outputs[0], outputs[1]]);
                        if (!oscillator.isPlaying) {
                            return false;
                        }
                        return true;
                    });
                }
            }
            // master volume
            const masterVolume = 0.3;
            for (let i = 0; i < outputs[0].length; ++i) {
                outputs[0][i] *= masterVolume;
                outputs[1][i] *= masterVolume;
            }
        }
    }

    // returns in frame unit
    const getSongLength = (events) => Math.max(...events.map((e) => (e.type === "midi" ? e.delayTime : 0)));
    // Maximum time to wait for the note release sound to become silent
    const silentTimeoutSec = 5;
    const isArrayZero = (arr) => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== 0) {
                return false;
            }
        }
        return true;
    };
    const renderAudio = async (samples, events, options) => {
        let currentFrame = 0;
        const sampleRate = options?.sampleRate ?? 44100;
        const bufSize = options?.bufferSize ?? 500;
        const synth = new SynthProcessorCore(sampleRate, () => currentFrame);
        samples.forEach((e) => synth.addEvent(e));
        events.forEach((e) => synth.addEvent(e));
        const songLengthFrame = getSongLength(events);
        const iterCount = Math.ceil(songLengthFrame / bufSize);
        const additionalIterCount = Math.ceil((silentTimeoutSec * sampleRate) / bufSize);
        const allIterCount = iterCount + additionalIterCount;
        const audioBufferSize = allIterCount * bufSize;
        const leftData = new Float32Array(audioBufferSize);
        const rightData = new Float32Array(audioBufferSize);
        const buffer = [new Float32Array(bufSize), new Float32Array(bufSize)];
        for (let i = 0; i < allIterCount; i++) {
            buffer[0].fill(0);
            buffer[1].fill(0);
            synth.process(buffer);
            const offset = i * bufSize;
            leftData.set(buffer[0], offset);
            rightData.set(buffer[1], offset);
            currentFrame += bufSize;
            // Wait for silence after playback is complete.
            if (i > iterCount && isArrayZero(buffer[0]) && isArrayZero(buffer[1])) {
                console.log(`early break ${i} in ${iterCount + additionalIterCount}`);
                break;
            }
            // give a chance to terminate the loop or update progress
            if (i % 1000 === 0) {
                await options?.waitForEventLoop?.();
                options?.onProgress?.(offset, audioBufferSize);
                if (options?.cancel?.()) {
                    throw new Error("renderAudio cancelled");
                }
            }
        }
        // slice() to delete silent parts
        const trimmedLeft = leftData.slice(0, currentFrame);
        const trimmedRight = rightData.slice(0, currentFrame);
        return {
            length: trimmedLeft.length,
            leftData: trimmedLeft.buffer,
            rightData: trimmedRight.buffer,
            sampleRate,
        };
    };

    var bin = {};

    Object.defineProperty(bin, '__esModule', { value: true });

    let Stream$1 = class Stream {
        constructor(data, offset) {
            this.data = data;
            this.ip = offset;
        }
        readString(size) {
            const str = String.fromCharCode.apply(null, this.data.subarray(this.ip, (this.ip += size)));
            const nullLocation = str.indexOf("\u0000");
            if (nullLocation > 0) {
                return str.substr(0, nullLocation);
            }
            return str;
        }
        readWORD() {
            return this.data[this.ip++] | (this.data[this.ip++] << 8);
        }
        readDWORD(bigEndian = false) {
            if (bigEndian) {
                return (((this.data[this.ip++] << 24) |
                    (this.data[this.ip++] << 16) |
                    (this.data[this.ip++] << 8) |
                    this.data[this.ip++]) >>>
                    0);
            }
            else {
                return ((this.data[this.ip++] |
                    (this.data[this.ip++] << 8) |
                    (this.data[this.ip++] << 16) |
                    (this.data[this.ip++] << 24)) >>>
                    0);
            }
        }
        readByte() {
            return this.data[this.ip++];
        }
        readAt(offset) {
            return this.data[this.ip + offset];
        }
        /* helper */
        readUInt8() {
            return this.readByte();
        }
        readInt8() {
            return (this.readByte() << 24) >> 24;
        }
        readUInt16() {
            return this.readWORD();
        }
        readInt16() {
            return (this.readWORD() << 16) >> 16;
        }
        readUInt32() {
            return this.readDWORD();
        }
    };

    function parseChunk$1(input, ip, bigEndian) {
        const stream = new Stream$1(input, ip);
        const type = stream.readString(4);
        const size = stream.readDWORD(bigEndian);
        return new Chunk(type, size, stream.ip);
    }
    function parseRiff(input, index = 0, length, { padding = true, bigEndian = false } = {}) {
        const chunkList = [];
        const end = length + index;
        let ip = index;
        while (ip < end) {
            const chunk = parseChunk$1(input, ip, bigEndian);
            ip = chunk.offset + chunk.size;
            // padding
            if (padding && ((ip - index) & 1) === 1) {
                ip++;
            }
            chunkList.push(chunk);
        }
        return chunkList;
    }
    class Chunk {
        constructor(type, size, offset) {
            this.type = type;
            this.size = size;
            this.offset = offset;
        }
    }

    const GeneratorEnumeratorTable = [
        "startAddrsOffset",
        "endAddrsOffset",
        "startloopAddrsOffset",
        "endloopAddrsOffset",
        "startAddrsCoarseOffset",
        "modLfoToPitch",
        "vibLfoToPitch",
        "modEnvToPitch",
        "initialFilterFc",
        "initialFilterQ",
        "modLfoToFilterFc",
        "modEnvToFilterFc",
        "endAddrsCoarseOffset",
        "modLfoToVolume",
        undefined,
        "chorusEffectsSend",
        "reverbEffectsSend",
        "pan",
        undefined,
        undefined,
        undefined,
        "delayModLFO",
        "freqModLFO",
        "delayVibLFO",
        "freqVibLFO",
        "delayModEnv",
        "attackModEnv",
        "holdModEnv",
        "decayModEnv",
        "sustainModEnv",
        "releaseModEnv",
        "keynumToModEnvHold",
        "keynumToModEnvDecay",
        "delayVolEnv",
        "attackVolEnv",
        "holdVolEnv",
        "decayVolEnv",
        "sustainVolEnv",
        "releaseVolEnv",
        "keynumToVolEnvHold",
        "keynumToVolEnvDecay",
        "instrument",
        undefined,
        "keyRange",
        "velRange",
        "startloopAddrsCoarseOffset",
        "keynum",
        "velocity",
        "initialAttenuation",
        undefined,
        "endloopAddrsCoarseOffset",
        "coarseTune",
        "fineTune",
        "sampleID",
        "sampleModes",
        undefined,
        "scaleTuning",
        "exclusiveClass",
        "overridingRootKey",
    ];

    class VersionTag {
        static parse(stream) {
            const v = new VersionTag();
            v.major = stream.readInt8();
            v.minor = stream.readInt8();
            return v;
        }
    }
    class Info {
        // LIST - INFO の全ての chunk
        static parse(data, chunks) {
            function getChunk(type) {
                return chunks.find((c) => c.type === type);
            }
            function toStream(chunk) {
                return new Stream$1(data, chunk.offset);
            }
            function readString(type) {
                const chunk = getChunk(type);
                if (!chunk) {
                    return null;
                }
                return toStream(chunk).readString(chunk.size);
            }
            function readVersionTag(type) {
                const chunk = getChunk(type);
                if (!chunk) {
                    return null;
                }
                return VersionTag.parse(toStream(chunk));
            }
            const info = new Info();
            info.comment = readString("ICMT");
            info.copyright = readString("ICOP");
            info.creationDate = readString("ICRD");
            info.engineer = readString("IENG");
            info.name = readString("INAM");
            info.product = readString("IPRD");
            info.software = readString("ISFT");
            info.version = readVersionTag("ifil");
            info.soundEngine = readString("isng");
            info.romName = readString("irom");
            info.romVersion = readVersionTag("iver");
            return info;
        }
    }
    class PresetHeader {
        get isEnd() {
            return this.presetName === "EOP";
        }
        static parse(stream) {
            const p = new PresetHeader();
            p.presetName = stream.readString(20);
            p.preset = stream.readWORD();
            p.bank = stream.readWORD();
            p.presetBagIndex = stream.readWORD();
            p.library = stream.readDWORD();
            p.genre = stream.readDWORD();
            p.morphology = stream.readDWORD();
            return p;
        }
    }
    class PresetBag {
        static parse(stream) {
            const p = new PresetBag();
            p.presetGeneratorIndex = stream.readWORD();
            p.presetModulatorIndex = stream.readWORD();
            return p;
        }
    }
    class RangeValue {
        constructor(lo, hi) {
            this.lo = lo;
            this.hi = hi;
        }
        static parse(stream) {
            return new RangeValue(stream.readByte(), stream.readByte());
        }
    }
    class ModulatorList {
        get type() {
            return GeneratorEnumeratorTable[this.destinationOper];
        }
        get isEnd() {
            return (this.sourceOper === 0 &&
                this.destinationOper === 0 &&
                this.value === 0 &&
                this.amountSourceOper === 0 &&
                this.transOper === 0);
        }
        static parse(stream) {
            const t = new ModulatorList();
            t.sourceOper = stream.readWORD();
            t.destinationOper = stream.readWORD();
            switch (t.type) {
                case "keyRange": /* FALLTHROUGH */
                case "velRange": /* FALLTHROUGH */
                case "keynum": /* FALLTHROUGH */
                case "velocity":
                    t.value = RangeValue.parse(stream);
                    break;
                default:
                    t.value = stream.readInt16();
                    break;
            }
            t.amountSourceOper = stream.readWORD();
            t.transOper = stream.readWORD();
            return t;
        }
    }
    class GeneratorList {
        get type() {
            return GeneratorEnumeratorTable[this.code];
        }
        get isEnd() {
            return this.code === 0 && this.value === 0;
        }
        static parse(stream) {
            const t = new GeneratorList();
            t.code = stream.readWORD();
            switch (t.type) {
                case "keynum": /* FALLTHROUGH */
                case "keyRange": /* FALLTHROUGH */
                case "velRange": /* FALLTHROUGH */
                case "velocity":
                    t.value = RangeValue.parse(stream);
                    break;
                default:
                    t.value = stream.readInt16();
                    break;
            }
            return t;
        }
    }
    class Instrument {
        get isEnd() {
            return this.instrumentName === "EOI";
        }
        static parse(stream) {
            const t = new Instrument();
            t.instrumentName = stream.readString(20);
            t.instrumentBagIndex = stream.readWORD();
            return t;
        }
    }
    class InstrumentBag {
        static parse(stream) {
            const t = new InstrumentBag();
            t.instrumentGeneratorIndex = stream.readWORD();
            t.instrumentModulatorIndex = stream.readWORD();
            return t;
        }
    }
    class SampleHeader {
        get isEnd() {
            return this.sampleName === "EOS";
        }
        static parse(stream) {
            const s = new SampleHeader();
            s.sampleName = stream.readString(20);
            s.start = stream.readDWORD();
            s.end = stream.readDWORD();
            s.loopStart = stream.readDWORD();
            s.loopEnd = stream.readDWORD();
            s.sampleRate = stream.readDWORD();
            s.originalPitch = stream.readByte();
            s.pitchCorrection = stream.readInt8();
            s.sampleLink = stream.readWORD();
            s.sampleType = stream.readWORD();
            s.loopStart -= s.start;
            s.loopEnd -= s.start;
            return s;
        }
    }

    function parse(input, option = {}) {
        // parse RIFF chunk
        const chunkList = parseRiff(input, 0, input.length, option);
        if (chunkList.length !== 1) {
            throw new Error("wrong chunk length");
        }
        const chunk = chunkList[0];
        if (chunk === null) {
            throw new Error("chunk not found");
        }
        function parseRiffChunk(chunk, data) {
            const chunkList = getChunkList(chunk, data, "RIFF", "sfbk");
            if (chunkList.length !== 3) {
                throw new Error("invalid sfbk structure");
            }
            return Object.assign({
                // INFO-list
                info: parseInfoList(chunkList[0], data),
                // sdta-list
                samplingData: parseSdtaList(chunkList[1], data)
            }, parsePdtaList(chunkList[2], data));
        }
        function parsePdtaList(chunk, data) {
            const chunkList = getChunkList(chunk, data, "LIST", "pdta");
            // check number of chunks
            if (chunkList.length !== 9) {
                throw new Error("invalid pdta chunk");
            }
            return {
                presetHeaders: parsePhdr(chunkList[0], data),
                presetZone: parsePbag(chunkList[1], data),
                presetModulators: parsePmod(chunkList[2], data),
                presetGenerators: parsePgen(chunkList[3], data),
                instruments: parseInst(chunkList[4], data),
                instrumentZone: parseIbag(chunkList[5], data),
                instrumentModulators: parseImod(chunkList[6], data),
                instrumentGenerators: parseIgen(chunkList[7], data),
                sampleHeaders: parseShdr(chunkList[8], data),
            };
        }
        const result = parseRiffChunk(chunk, input);
        return Object.assign(Object.assign({}, result), { samples: loadSample(result.sampleHeaders, result.samplingData.offset, input) });
    }
    function getChunkList(chunk, data, expectedType, expectedSignature) {
        // check parse target
        if (chunk.type !== expectedType) {
            throw new Error("invalid chunk type:" + chunk.type);
        }
        const stream = new Stream$1(data, chunk.offset);
        // check signature
        const signature = stream.readString(4);
        if (signature !== expectedSignature) {
            throw new Error("invalid signature:" + signature);
        }
        // read structure
        return parseRiff(data, stream.ip, chunk.size - 4);
    }
    function parseInfoList(chunk, data) {
        const chunkList = getChunkList(chunk, data, "LIST", "INFO");
        return Info.parse(data, chunkList);
    }
    function parseSdtaList(chunk, data) {
        const chunkList = getChunkList(chunk, data, "LIST", "sdta");
        if (chunkList.length !== 1) {
            throw new Error("TODO");
        }
        return chunkList[0];
    }
    function parseChunk(chunk, data, type, clazz, terminate) {
        const result = [];
        if (chunk.type !== type) {
            throw new Error("invalid chunk type:" + chunk.type);
        }
        const stream = new Stream$1(data, chunk.offset);
        const size = chunk.offset + chunk.size;
        while (stream.ip < size) {
            const obj = clazz.parse(stream);
            if (terminate && terminate(obj)) {
                break;
            }
            result.push(obj);
        }
        return result;
    }
    const parsePhdr = (chunk, data) => parseChunk(chunk, data, "phdr", PresetHeader, (p) => p.isEnd);
    const parsePbag = (chunk, data) => parseChunk(chunk, data, "pbag", PresetBag);
    const parseInst = (chunk, data) => parseChunk(chunk, data, "inst", Instrument, (i) => i.isEnd);
    const parseIbag = (chunk, data) => parseChunk(chunk, data, "ibag", InstrumentBag);
    const parsePmod = (chunk, data) => parseChunk(chunk, data, "pmod", ModulatorList, (m) => m.isEnd);
    const parseImod = (chunk, data) => parseChunk(chunk, data, "imod", ModulatorList, (m) => m.isEnd);
    const parsePgen = (chunk, data) => parseChunk(chunk, data, "pgen", GeneratorList, (g) => g.isEnd);
    const parseIgen = (chunk, data) => parseChunk(chunk, data, "igen", GeneratorList);
    const parseShdr = (chunk, data) => parseChunk(chunk, data, "shdr", SampleHeader, (s) => s.isEnd);
    function adjustSampleData(sample, sampleRate) {
        let multiply = 1;
        // buffer
        while (sampleRate < 22050) {
            const newSample = new Int16Array(sample.length * 2);
            for (let i = 0, j = 0, il = sample.length; i < il; ++i) {
                newSample[j++] = sample[i];
                newSample[j++] = sample[i];
            }
            sample = newSample;
            multiply *= 2;
            sampleRate *= 2;
        }
        return {
            sample,
            multiply,
        };
    }
    function loadSample(sampleHeader, samplingDataOffset, data) {
        return sampleHeader.map((header) => {
            let sample = new Int16Array(new Uint8Array(data.subarray(samplingDataOffset + header.start * 2, samplingDataOffset + header.end * 2)).buffer);
            if (header.sampleRate > 0) {
                const adjust = adjustSampleData(sample, header.sampleRate);
                sample = adjust.sample;
                header.sampleRate *= adjust.multiply;
                header.loopStart *= adjust.multiply;
                header.loopEnd *= adjust.multiply;
            }
            return sample;
        });
    }

    function createGeneraterObject(generators) {
        const result = {};
        for (const gen of generators) {
            const type = gen.type;
            if (type !== undefined) {
                result[type] = gen.value;
            }
        }
        return result;
    }
    const defaultInstrumentZone = {
        keynum: undefined,
        instrument: undefined,
        velocity: undefined,
        exclusiveClass: undefined,
        keyRange: new RangeValue(0, 127),
        velRange: new RangeValue(0, 127),
        sampleID: undefined,
        delayVolEnv: -12000,
        attackVolEnv: -12000,
        decayVolEnv: -12000,
        holdVolEnv: -12000,
        sustainVolEnv: 0,
        releaseVolEnv: -12000,
        delayModEnv: -12000,
        attackModEnv: -12000,
        decayModEnv: -12000,
        holdModEnv: -12000,
        sustainModEnv: 0,
        releaseModEnv: -12000,
        modEnvToPitch: 0,
        modEnvToFilterFc: 0,
        modLfoToFilterFc: 0,
        modLfoToPitch: 0,
        modLfoToVolume: 0,
        vibLfoToPitch: 0,
        chorusEffectsSend: 0,
        reverbEffectsSend: 0,
        delayModLFO: 0,
        freqModLFO: 0,
        delayVibLFO: 0,
        keynumToModEnvDecay: 0,
        keynumToModEnvHold: 0,
        keynumToVolEnvDecay: 0,
        keynumToVolEnvHold: 0,
        coarseTune: 0,
        fineTune: 0,
        scaleTuning: 100,
        freqVibLFO: 0,
        startAddrsOffset: 0,
        startAddrsCoarseOffset: 0,
        endAddrsOffset: 0,
        endAddrsCoarseOffset: 0,
        startloopAddrsOffset: 0,
        startloopAddrsCoarseOffset: 0,
        initialAttenuation: 0,
        endloopAddrsOffset: 0,
        endloopAddrsCoarseOffset: 0,
        overridingRootKey: undefined,
        initialFilterQ: 1,
        initialFilterFc: 13500,
        sampleModes: 0,
        pan: undefined,
    };

    function arrayRange(start, end) {
        return Array.from({ length: end - start }, (_, k) => k + start);
    }
    function getInstrumentZone(parsed, instrumentZoneIndex) {
        const instrumentBag = parsed.instrumentZone[instrumentZoneIndex];
        const nextInstrumentBag = parsed.instrumentZone[instrumentZoneIndex + 1];
        const generatorIndex = instrumentBag.instrumentGeneratorIndex;
        const nextGeneratorIndex = nextInstrumentBag
            ? nextInstrumentBag.instrumentGeneratorIndex
            : parsed.instrumentGenerators.length;
        return parsed.instrumentGenerators.slice(generatorIndex, nextGeneratorIndex);
    }
    function getInstrumentZoneIndexes(parsed, instrumentID) {
        const instrument = parsed.instruments[instrumentID];
        const nextInstrument = parsed.instruments[instrumentID + 1];
        return arrayRange(instrument.instrumentBagIndex, nextInstrument
            ? nextInstrument.instrumentBagIndex
            : parsed.instrumentZone.length);
    }
    function getInstrumentGenerators(parsed, instrumentID) {
        return getInstrumentZoneIndexes(parsed, instrumentID).map((i) => getInstrumentZone(parsed, i));
    }

    function getPresetGenerators(parsed, presetHeaderIndex) {
        let presetGenerators;
        const presetHeader = parsed.presetHeaders[presetHeaderIndex];
        const presetBag = parsed.presetZone[presetHeader.presetBagIndex];
        const nextPresetHeaderIndex = presetHeaderIndex + 1;
        if (nextPresetHeaderIndex < parsed.presetHeaders.length) {
            // 次の preset までのすべての generator を取得する
            const nextPresetHeader = parsed.presetHeaders[nextPresetHeaderIndex];
            const nextPresetBag = parsed.presetZone[nextPresetHeader.presetBagIndex];
            presetGenerators = parsed.presetGenerators.slice(presetBag.presetGeneratorIndex, nextPresetBag.presetGeneratorIndex);
        }
        else {
            // 最後の preset だった場合は最後まで取得する
            presetGenerators = parsed.presetGenerators.slice(presetBag.presetGeneratorIndex, parsed.presetGenerators.length);
        }
        return presetGenerators;
    }

    /**
     * Parser で読み込んだサウンドフォントのデータを
     * Synthesizer から利用しやすい形にするクラス
     */
    class SoundFont {
        constructor(parsed) {
            this.parsed = parsed;
        }
        getPresetZone(presetHeaderIndex) {
            return getPresetGenerators(this.parsed, presetHeaderIndex);
        }
        getInstrumentZone(instrumentZoneIndex) {
            return createGeneraterObject(getInstrumentZone(this.parsed, instrumentZoneIndex));
        }
        getInstrumentZoneIndexes(instrumentID) {
            return getInstrumentZoneIndexes(this.parsed, instrumentID);
        }
        getInstrumentKey(bankNumber, instrumentNumber, key, velocity = 100) {
            const presetHeaderIndex = this.parsed.presetHeaders.findIndex((p) => p.preset === instrumentNumber && p.bank === bankNumber);
            if (presetHeaderIndex < 0) {
                console.warn("preset not found: bank=%s instrument=%s", bankNumber, instrumentNumber);
                return null;
            }
            const presetGenerators = getPresetGenerators(this.parsed, presetHeaderIndex);
            // Last Preset Generator must be instrument
            const lastPresetGenertor = presetGenerators[presetGenerators.length - 1];
            if (lastPresetGenertor.type !== "instrument" ||
                isNaN(Number(lastPresetGenertor.value))) {
                throw new Error("Invalid SoundFont: invalid preset generator: expect instrument");
            }
            const instrumentID = lastPresetGenertor.value;
            const instrumentZones = getInstrumentGenerators(this.parsed, instrumentID).map(createGeneraterObject);
            // 最初のゾーンがsampleID を持たなければ global instrument zone
            let globalInstrumentZone;
            const firstInstrumentZone = instrumentZones[0];
            if (firstInstrumentZone.sampleID === undefined) {
                globalInstrumentZone = instrumentZones[0];
            }
            // keyRange と velRange がマッチしている Generator を探す
            const instrumentZone = instrumentZones.find((i) => {
                if (i === globalInstrumentZone) {
                    return false; // global zone を除外
                }
                let isInKeyRange = false;
                if (i.keyRange) {
                    isInKeyRange = key >= i.keyRange.lo && key <= i.keyRange.hi;
                }
                let isInVelRange = true;
                if (i.velRange) {
                    isInVelRange = velocity >= i.velRange.lo && velocity <= i.velRange.hi;
                }
                return isInKeyRange && isInVelRange;
            });
            if (!instrumentZone) {
                console.warn("instrument not found: bank=%s instrument=%s", bankNumber, instrumentNumber);
                return null;
            }
            if (instrumentZone.sampleID === undefined) {
                throw new Error("Invalid SoundFont: sampleID not found");
            }
            const gen = Object.assign(Object.assign(Object.assign({}, defaultInstrumentZone), removeUndefined$1(globalInstrumentZone || {})), removeUndefined$1(instrumentZone));
            const sample = this.parsed.samples[gen.sampleID];
            const sampleHeader = this.parsed.sampleHeaders[gen.sampleID];
            const tune = gen.coarseTune + gen.fineTune / 100;
            const basePitch = tune +
                sampleHeader.pitchCorrection / 100 -
                (gen.overridingRootKey || sampleHeader.originalPitch);
            const scaleTuning = gen.scaleTuning / 100;
            return {
                sample,
                sampleRate: sampleHeader.sampleRate,
                sampleName: sampleHeader.sampleName,
                sampleModes: gen.sampleModes,
                playbackRate: (key) => Math.pow(Math.pow(2, 1 / 12), (key + basePitch) * scaleTuning),
                modEnvToPitch: gen.modEnvToPitch / 100,
                scaleTuning,
                start: gen.startAddrsCoarseOffset * 32768 + gen.startAddrsOffset,
                end: gen.endAddrsCoarseOffset * 32768 + gen.endAddrsOffset,
                loopStart: sampleHeader.loopStart +
                    gen.startloopAddrsCoarseOffset * 32768 +
                    gen.startloopAddrsOffset,
                loopEnd: sampleHeader.loopEnd +
                    gen.endloopAddrsCoarseOffset * 32768 +
                    gen.endloopAddrsOffset,
                volDelay: convertTime$1(gen.delayVolEnv),
                volAttack: convertTime$1(gen.attackVolEnv),
                volHold: convertTime$1(gen.holdVolEnv),
                volDecay: convertTime$1(gen.decayVolEnv),
                volSustain: gen.sustainVolEnv / 1000,
                volRelease: convertTime$1(gen.releaseVolEnv),
                modDelay: convertTime$1(gen.delayModEnv),
                modAttack: convertTime$1(gen.attackModEnv),
                modHold: convertTime$1(gen.holdModEnv),
                modDecay: convertTime$1(gen.decayModEnv),
                modSustain: gen.sustainModEnv / 1000,
                modRelease: convertTime$1(gen.releaseModEnv),
                keyRange: gen.keyRange,
                velRange: gen.velRange,
                initialFilterFc: gen.initialFilterFc,
                modEnvToFilterFc: gen.modEnvToFilterFc,
                initialFilterQ: gen.initialFilterQ,
                initialAttenuation: gen.initialAttenuation,
                freqVibLFO: gen.freqVibLFO
                    ? convertTime$1(gen.freqVibLFO) * 8.176
                    : undefined,
                pan: gen.pan,
            };
        }
        // presetNames[bankNumber][presetNumber] = presetName
        getPresetNames() {
            const bank = {};
            this.parsed.presetHeaders.forEach((preset) => {
                if (!bank[preset.bank]) {
                    bank[preset.bank] = {};
                }
                bank[preset.bank][preset.preset] = preset.presetName;
            });
            return bank;
        }
    }
    // value = 1200log2(sec) で表される時間を秒単位に変換する
    function convertTime$1(value) {
        return Math.pow(2, value / 1200);
    }
    function removeUndefined$1(obj) {
        const result = {};
        for (let key in obj) {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    bin.SoundFont = SoundFont;
    bin.convertTime = convertTime$1;
    var createGeneraterObject_1 = bin.createGeneraterObject = createGeneraterObject;
    var defaultInstrumentZone_1 = bin.defaultInstrumentZone = defaultInstrumentZone;
    var getInstrumentGenerators_1 = bin.getInstrumentGenerators = getInstrumentGenerators;
    bin.getInstrumentZone = getInstrumentZone;
    bin.getInstrumentZoneIndexes = getInstrumentZoneIndexes;
    var getPresetGenerators_1 = bin.getPresetGenerators = getPresetGenerators;
    var parse_1 = bin.parse = parse;

    const sampleToSynthEvent = (sample) => ({
        type: "loadSample",
        sample,
        bank: sample.bank,
        instrument: sample.instrument,
        keyRange: sample.keyRange,
        velRange: sample.velRange,
    });

    const getSamplesFromSoundFont = (data, ctx) => {
        const parsed = parse_1(data);
        const result = [];
        for (let i = 0; i < parsed.presetHeaders.length; i++) {
            const presetHeader = parsed.presetHeaders[i];
            const presetGenerators = getPresetGenerators_1(parsed, i);
            for (const lastPresetGenertor of presetGenerators.filter((gen) => gen.type === "instrument")) {
                const presetZone = createGeneraterObject_1(presetGenerators);
                const instrumentID = lastPresetGenertor.value;
                const instrumentZones = getInstrumentGenerators_1(parsed, instrumentID).map(createGeneraterObject_1);
                // 最初のゾーンがsampleID を持たなければ global instrument zone
                let globalInstrumentZone;
                const firstInstrumentZone = instrumentZones[0];
                if (firstInstrumentZone.sampleID === undefined) {
                    globalInstrumentZone = instrumentZones[0];
                }
                for (const zone of instrumentZones.filter((zone) => zone.sampleID !== undefined)) {
                    const sample = parsed.samples[zone.sampleID];
                    const sampleHeader = parsed.sampleHeaders[zone.sampleID];
                    const gen = {
                        ...defaultInstrumentZone_1,
                        ...removeUndefined(globalInstrumentZone ?? {}),
                        ...removeUndefined(zone),
                    };
                    // add presetGenerator value
                    for (const key of Object.keys(gen)) {
                        if (key in presetZone &&
                            typeof gen[key] === "number" &&
                            typeof presetZone[key] === "number") {
                            gen[key] += presetZone[key];
                        }
                    }
                    const tune = gen.coarseTune + gen.fineTune / 100;
                    const basePitch = tune +
                        sampleHeader.pitchCorrection / 100 -
                        (gen.overridingRootKey ?? sampleHeader.originalPitch);
                    const sampleStart = gen.startAddrsCoarseOffset * 32768 + gen.startAddrsOffset;
                    const sampleEnd = gen.endAddrsCoarseOffset * 32768 + gen.endAddrsOffset;
                    const loopStart = sampleHeader.loopStart +
                        gen.startloopAddrsCoarseOffset * 32768 +
                        gen.startloopAddrsOffset;
                    const loopEnd = sampleHeader.loopEnd +
                        gen.endloopAddrsCoarseOffset * 32768 +
                        gen.endloopAddrsOffset;
                    const sample2 = sample.subarray(0, sample.length + sampleEnd);
                    const audioBuffer = ctx.createBuffer(1, sample2.length, sampleHeader.sampleRate);
                    const audioData = audioBuffer.getChannelData(0);
                    sample2.forEach((v, i) => {
                        audioData[i] = v / 32767;
                    });
                    const amplitudeEnvelope = {
                        attackTime: timeCentToSec(gen.attackVolEnv),
                        decayTime: timeCentToSec(gen.decayVolEnv) / 4,
                        sustainLevel: 1 - gen.sustainVolEnv / 1000,
                        releaseTime: timeCentToSec(gen.releaseVolEnv) / 4,
                    };
                    result.push({
                        buffer: audioData.buffer,
                        pitch: -basePitch,
                        name: sampleHeader.sampleName,
                        sampleStart,
                        sampleEnd: sampleEnd === 0 ? audioData.length : sampleEnd,
                        loop: gen.sampleModes === 1 && loopEnd > 0
                            ? {
                                start: loopStart,
                                end: loopEnd,
                            }
                            : null,
                        instrument: presetHeader.preset,
                        bank: presetHeader.bank,
                        keyRange: [gen.keyRange.lo, gen.keyRange.hi],
                        velRange: [gen.velRange.lo, gen.velRange.hi],
                        sampleRate: sampleHeader.sampleRate,
                        amplitudeEnvelope,
                        scaleTuning: gen.scaleTuning / 100,
                        pan: (gen.pan ?? 0) / 500,
                        exclusiveClass: gen.exclusiveClass,
                        volume: 1 - gen.initialAttenuation / 1000,
                    });
                }
            }
        }
        return result.map(sampleToSynthEvent);
    };
    function convertTime(value) {
        return Math.pow(2, value / 1200);
    }
    function timeCentToSec(value) {
        if (value <= -32768) {
            return 0;
        }
        if (value < -12000) {
            value = -12000;
        }
        if (value > 8000) {
            value = 8000;
        }
        return convertTime(value);
    }
    function removeUndefined(obj) {
        const result = {};
        for (let key in obj) {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    var MIDIChannelEvents = {
        noteOff: 0x08,
        noteOn: 0x09,
        noteAftertouch: 0x0a,
        controller: 0x0b,
        programChange: 0x0c,
        channelAftertouch: 0x0d,
        pitchBend: 0x0e,
    };

    var MIDIControlEvents = {
        MSB_BANK: 0x00,
        MSB_MODWHEEL: 0x01,
        MSB_BREATH: 0x02,
        MSB_FOOT: 0x04,
        MSB_PORTAMENTO_TIME: 0x05,
        MSB_DATA_ENTRY: 0x06,
        MSB_MAIN_VOLUME: 0x07,
        MSB_BALANCE: 0x08,
        MSB_PAN: 0x0a,
        MSB_EXPRESSION: 0x0b,
        MSB_EFFECT1: 0x0c,
        MSB_EFFECT2: 0x0d,
        MSB_GENERAL_PURPOSE1: 0x10,
        MSB_GENERAL_PURPOSE2: 0x11,
        MSB_GENERAL_PURPOSE3: 0x12,
        MSB_GENERAL_PURPOSE4: 0x13,
        LSB_BANK: 0x20,
        LSB_MODWHEEL: 0x21,
        LSB_BREATH: 0x22,
        LSB_FOOT: 0x24,
        LSB_PORTAMENTO_TIME: 0x25,
        LSB_DATA_ENTRY: 0x26,
        LSB_MAIN_VOLUME: 0x27,
        LSB_BALANCE: 0x28,
        LSB_PAN: 0x2a,
        LSB_EXPRESSION: 0x2b,
        LSB_EFFECT1: 0x2c,
        LSB_EFFECT2: 0x2d,
        LSB_GENERAL_PURPOSE1: 0x30,
        LSB_GENERAL_PURPOSE2: 0x31,
        LSB_GENERAL_PURPOSE3: 0x32,
        LSB_GENERAL_PURPOSE4: 0x33,
        SUSTAIN: 0x40,
        PORTAMENTO: 0x41,
        SOSTENUTO: 0x42,
        SUSTENUTO: 0x42,
        SOFT_PEDAL: 0x43,
        LEGATO_FOOTSWITCH: 0x44,
        HOLD2: 0x45,
        SC1_SOUND_VARIATION: 0x46,
        SC2_TIMBRE: 0x47,
        SC3_RELEASE_TIME: 0x48,
        SC4_ATTACK_TIME: 0x49,
        SC5_BRIGHTNESS: 0x4a,
        SC6: 0x4b,
        SC7: 0x4c,
        SC8: 0x4d,
        SC9: 0x4e,
        SC10: 0x4f,
        GENERAL_PURPOSE5: 0x50,
        GENERAL_PURPOSE6: 0x51,
        GENERAL_PURPOSE7: 0x52,
        GENERAL_PURPOSE8: 0x53,
        PORTAMENTO_CONTROL: 0x54,
        E1_REVERB_DEPTH: 0x5b,
        E2_TREMOLO_DEPTH: 0x5c,
        E3_CHORUS_DEPTH: 0x5d,
        E4_DETUNE_DEPTH: 0x5e,
        E5_PHASER_DEPTH: 0x5f,
        DATA_INCREMENT: 0x60,
        DATA_DECREMENT: 0x61,
        NONREG_PARM_NUM_LSB: 0x62,
        NONREG_PARM_NUM_MSB: 0x63,
        REGIST_PARM_NUM_LSB: 0x64,
        REGIST_PARM_NUM_MSB: 0x65,
        ALL_SOUNDS_OFF: 0x78,
        RESET_CONTROLLERS: 0x79,
        LOCAL_CONTROL_SWITCH: 0x7a,
        ALL_NOTES_OFF: 0x7b,
        OMNI_OFF: 0x7c,
        OMNI_ON: 0x7d,
        MONO1: 0x7e,
        MONO2: 0x7f,
    };

    var MIDIMetaEvents = {
        sequenceNumber: 0x00,
        text: 0x01,
        copyrightNotice: 0x02,
        trackName: 0x03,
        instrumentName: 0x04,
        lyrics: 0x05,
        marker: 0x06,
        cuePoint: 0x07,
        midiChannelPrefix: 0x20,
        portPrefix: 0x21,
        endOfTrack: 0x2f,
        setTempo: 0x51,
        smpteOffset: 0x54,
        timeSignature: 0x58,
        keySignature: 0x59,
        sequencerSpecific: 0x7f,
    };

    function deserialize(stream, lastEventTypeByte, setLastEventTypeByte) {
        if (lastEventTypeByte === void 0) { lastEventTypeByte = 0; }
        var deltaTime = stream.readVarInt();
        return deserializeSingleEvent(stream, deltaTime, lastEventTypeByte, setLastEventTypeByte);
    }
    function deserializeSingleEvent(stream, deltaTime, lastEventTypeByte, setLastEventTypeByte) {
        if (deltaTime === void 0) { deltaTime = 0; }
        if (lastEventTypeByte === void 0) { lastEventTypeByte = 0; }
        var eventTypeByte = stream.readInt8();
        if ((eventTypeByte & 0xf0) === 0xf0) {
            /* system / meta event */
            if (eventTypeByte === 0xff) {
                /* meta event */
                var type = "meta";
                var subtypeByte = stream.readInt8();
                var length = stream.readVarInt();
                switch (subtypeByte) {
                    case MIDIMetaEvents.sequenceNumber:
                        if (length !== 2)
                            throw new Error("Expected length for sequenceNumber event is 2, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "sequenceNumber",
                            number: stream.readInt16(),
                        };
                    case MIDIMetaEvents.text:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "text",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.copyrightNotice:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "copyrightNotice",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.trackName:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "trackName",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.instrumentName:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "instrumentName",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.lyrics:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "lyrics",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.marker:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "marker",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.cuePoint:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "cuePoint",
                            text: stream.readStr(length),
                        };
                    case MIDIMetaEvents.midiChannelPrefix:
                        if (length !== 1)
                            throw new Error("Expected length for midiChannelPrefix event is 1, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "midiChannelPrefix",
                            value: stream.readInt8(),
                        };
                    case MIDIMetaEvents.portPrefix:
                        if (length !== 1)
                            throw new Error("Expected length for midiChannelPrefix event is 1, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "portPrefix",
                            port: stream.readInt8(),
                        };
                    case MIDIMetaEvents.endOfTrack:
                        if (length !== 0)
                            throw new Error("Expected length for endOfTrack event is 0, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "endOfTrack",
                        };
                    case MIDIMetaEvents.setTempo:
                        if (length !== 3)
                            throw new Error("Expected length for setTempo event is 3, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "setTempo",
                            microsecondsPerBeat: (stream.readInt8() << 16) +
                                (stream.readInt8() << 8) +
                                stream.readInt8(),
                        };
                    case MIDIMetaEvents.smpteOffset: {
                        if (length !== 5)
                            throw new Error("Expected length for smpteOffset event is 5, got " + length);
                        var hourByte = stream.readInt8();
                        var table = {
                            0x00: 24,
                            0x20: 25,
                            0x40: 29,
                            0x60: 30,
                        };
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "smpteOffset",
                            frameRate: table[hourByte & 0x60],
                            hour: hourByte & 0x1f,
                            min: stream.readInt8(),
                            sec: stream.readInt8(),
                            frame: stream.readInt8(),
                            subframe: stream.readInt8(),
                        };
                    }
                    case MIDIMetaEvents.timeSignature:
                        if (length !== 4)
                            throw new Error("Expected length for timeSignature event is 4, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "timeSignature",
                            numerator: stream.readInt8(),
                            denominator: Math.pow(2, stream.readInt8()),
                            metronome: stream.readInt8(),
                            thirtyseconds: stream.readInt8(),
                        };
                    case MIDIMetaEvents.keySignature:
                        if (length !== 2)
                            throw new Error("Expected length for keySignature event is 2, got " + length);
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "keySignature",
                            key: stream.readInt8(true),
                            scale: stream.readInt8(),
                        };
                    case MIDIMetaEvents.sequencerSpecific:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "sequencerSpecific",
                            data: stream.read(length),
                        };
                    default:
                        return {
                            deltaTime: deltaTime,
                            type: type,
                            subtype: "unknown",
                            data: stream.read(length),
                        };
                }
            }
            else if (eventTypeByte === 0xf0) {
                var length = stream.readVarInt();
                return {
                    deltaTime: deltaTime,
                    type: "sysEx",
                    data: stream.read(length),
                };
            }
            else if (eventTypeByte === 0xf7) {
                var length = stream.readVarInt();
                return {
                    deltaTime: deltaTime,
                    type: "dividedSysEx",
                    data: stream.read(length),
                };
            }
            else {
                throw new Error("Unrecognised MIDI event type byte: " + eventTypeByte);
            }
        }
        else {
            /* channel event */
            var param1 = void 0;
            if ((eventTypeByte & 0x80) === 0) {
                /* running status - reuse lastEventTypeByte as the event type.
                  eventTypeByte is actually the first parameter
                */
                param1 = eventTypeByte;
                eventTypeByte = lastEventTypeByte;
            }
            else {
                param1 = stream.readInt8();
                setLastEventTypeByte === null || setLastEventTypeByte === void 0 ? void 0 : setLastEventTypeByte(eventTypeByte);
            }
            var eventType = eventTypeByte >> 4;
            var channel = eventTypeByte & 0x0f;
            var type = "channel";
            switch (eventType) {
                case MIDIChannelEvents.noteOff:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "noteOff",
                        noteNumber: param1,
                        velocity: stream.readInt8(),
                    };
                case MIDIChannelEvents.noteOn: {
                    var velocity = stream.readInt8();
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: velocity === 0 ? "noteOff" : "noteOn",
                        noteNumber: param1,
                        velocity: velocity,
                    };
                }
                case MIDIChannelEvents.noteAftertouch:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "noteAftertouch",
                        noteNumber: param1,
                        amount: stream.readInt8(),
                    };
                case MIDIChannelEvents.controller:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "controller",
                        controllerType: param1,
                        value: stream.readInt8(),
                    };
                case MIDIChannelEvents.programChange:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "programChange",
                        value: param1,
                    };
                case MIDIChannelEvents.channelAftertouch:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "channelAftertouch",
                        amount: param1,
                    };
                case MIDIChannelEvents.pitchBend:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "pitchBend",
                        value: param1 + (stream.readInt8() << 7),
                    };
                default:
                    return {
                        deltaTime: deltaTime,
                        type: type,
                        channel: channel,
                        subtype: "unknown",
                        data: stream.readInt8(),
                    };
            }
        }
    }

    /* Wrapper for accessing strings through sequential reads */
    var Stream = /** @class */ (function () {
        function Stream(buf) {
            this.position = 0;
            if (buf instanceof DataView) {
                this.buf = buf;
            }
            else if (buf instanceof ArrayBuffer) {
                this.buf = new DataView(buf);
            }
            else if (buf instanceof Array) {
                this.buf = new DataView(new Uint8Array(buf).buffer);
            }
            else if (buf instanceof Uint8Array) {
                this.buf = new DataView(buf.buffer);
            }
            else {
                throw new Error("not supported type: " + typeof buf);
            }
        }
        Stream.prototype.readByte = function () {
            return this.buf.getUint8(this.position++);
        };
        Stream.prototype.readStr = function (length) {
            return this.read(length)
                .map(function (e) { return String.fromCharCode(e); })
                .join("");
        };
        Stream.prototype.read = function (length) {
            var result = [];
            for (var index = 0; index < length; index++) {
                result.push(this.readByte());
            }
            return result;
        };
        /* read a big-endian 32-bit integer */
        Stream.prototype.readInt32 = function () {
            var result = this.buf.getInt32(this.position, false);
            this.position += 4;
            return result;
        };
        /* read a big-endian 16-bit integer */
        Stream.prototype.readInt16 = function () {
            var result = this.buf.getInt16(this.position, false);
            this.position += 2;
            return result;
        };
        /* read an 8-bit integer */
        Stream.prototype.readInt8 = function (signed) {
            if (signed === void 0) { signed = false; }
            if (signed) {
                return this.buf.getInt8(this.position++);
            }
            else {
                return this.readByte();
            }
        };
        Stream.prototype.eof = function () {
            return this.position >= this.buf.byteLength;
        };
        /* read a MIDI-style variable-length integer
          (big-endian value in groups of 7 bits,
          with top bit set to signify that another byte follows)
        */
        Stream.prototype.readVarInt = function () {
            var result = 0;
            for (; ;) {
                var b = this.readInt8();
                if (b & 0x80) {
                    result += b & 0x7f;
                    result <<= 7;
                }
                else {
                    /* b is the last byte */
                    return result + b;
                }
            }
        };
        return Stream;
    }());

    /*
    class to parse the .mid file format
    (depends on stream.js)
    */
    function read(data) {
        function readChunk(stream) {
            var id = stream.readStr(4);
            var length = stream.readInt32();
            return {
                id: id,
                length: length,
                data: stream.read(length),
            };
        }
        var stream = new Stream(data);
        var headerChunk = readChunk(stream);
        if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
            throw new Error("Bad .mid file - header not found");
        }
        var headerStream = new Stream(headerChunk.data);
        var formatType = headerStream.readInt16();
        var trackCount = headerStream.readInt16();
        var timeDivision = headerStream.readInt16();
        var ticksPerBeat;
        if (timeDivision & 0x8000) {
            throw new Error("Expressing time division in SMTPE frames is not supported yet");
        }
        else {
            ticksPerBeat = timeDivision;
        }
        var header = {
            formatType: formatType,
            trackCount: trackCount,
            ticksPerBeat: ticksPerBeat,
        };
        var lastEventTypeByte;
        function readEvent(stream) {
            return deserialize(stream, lastEventTypeByte, function (byte) { return (lastEventTypeByte = byte); });
        }
        var tracks = [];
        for (var i = 0; i < header.trackCount; i++) {
            tracks[i] = [];
            var trackChunk = readChunk(stream);
            if (trackChunk.id !== "MTrk") {
                throw new Error("Unexpected chunk - expected MTrk, got " + trackChunk.id);
            }
            var trackStream = new Stream(trackChunk.data);
            while (!trackStream.eof()) {
                var event = readEvent(trackStream);
                tracks[i].push(event);
            }
        }
        return {
            header: header,
            tracks: tracks,
        };
    }

    function toCharCodes(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        return bytes;
    }

    /** @class */ ((function () {
        function Buffer() {
            this.data = [];
            this.position = 0;
        }
        Object.defineProperty(Buffer.prototype, "length", {
            get: function () {
                return this.data.length;
            },
            enumerable: false,
            configurable: true
        });
        Buffer.prototype.writeByte = function (v) {
            this.data.push(v);
            this.position++;
        };
        Buffer.prototype.writeStr = function (str) {
            this.writeBytes(toCharCodes(str));
        };
        Buffer.prototype.writeInt32 = function (v) {
            this.writeByte((v >> 24) & 0xff);
            this.writeByte((v >> 16) & 0xff);
            this.writeByte((v >> 8) & 0xff);
            this.writeByte(v & 0xff);
        };
        Buffer.prototype.writeInt16 = function (v) {
            this.writeByte((v >> 8) & 0xff);
            this.writeByte(v & 0xff);
        };
        Buffer.prototype.writeBytes = function (arr) {
            var _this = this;
            arr.forEach(function (v) { return _this.writeByte(v); });
        };
        Buffer.prototype.writeChunk = function (id, func) {
            this.writeStr(id);
            var chunkBuf = new Buffer();
            func(chunkBuf);
            this.writeInt32(chunkBuf.length);
            this.writeBytes(chunkBuf.data);
        };
        Buffer.prototype.toBytes = function () {
            return new Uint8Array(this.data);
        };
        return Buffer;
    })());

    var wavEncoderExports = {};
    var wavEncoder = {
        get exports() { return wavEncoderExports; },
        set exports(v) { wavEncoderExports = v; },
    };

    (function (module) {

        function encodeSync(audioData, opts) {
            opts = opts || {};

            audioData = toAudioData(audioData);

            if (audioData === null) {
                throw new TypeError("Invalid AudioData");
            }

            var floatingPoint = !!(opts.floatingPoint || opts.float);
            var bitDepth = floatingPoint ? 32 : ((opts.bitDepth | 0) || 16);
            var bytes = bitDepth >> 3;
            var length = audioData.length * audioData.numberOfChannels * bytes;
            var dataView = new DataView(new Uint8Array(44 + length).buffer);
            var writer = createWriter(dataView);

            var format = {
                formatId: floatingPoint ? 0x0003 : 0x0001,
                floatingPoint: floatingPoint,
                numberOfChannels: audioData.numberOfChannels,
                sampleRate: audioData.sampleRate,
                bitDepth: bitDepth
            };

            writeHeader(writer, format, dataView.buffer.byteLength - 8);

            var err = writeData(writer, format, length, audioData, opts);

            if (err instanceof Error) {
                throw err;
            }

            return dataView.buffer;
        }

        function encode(audioData, opts) {
            return new Promise(function (resolve) {
                resolve(encodeSync(audioData, opts));
            });
        }

        function toAudioData(data) {
            var audioData = {};

            if (typeof data.sampleRate !== "number") {
                return null;
            }
            if (!Array.isArray(data.channelData)) {
                return null;
            }
            if (!(data.channelData[0] instanceof Float32Array)) {
                return null;
            }

            audioData.numberOfChannels = data.channelData.length;
            audioData.length = data.channelData[0].length | 0;
            audioData.sampleRate = data.sampleRate | 0;
            audioData.channelData = data.channelData;

            return audioData;
        }

        function writeHeader(writer, format, length) {
            var bytes = format.bitDepth >> 3;

            writer.string("RIFF");
            writer.uint32(length);
            writer.string("WAVE");

            writer.string("fmt ");
            writer.uint32(16);
            writer.uint16(format.floatingPoint ? 0x0003 : 0x0001);
            writer.uint16(format.numberOfChannels);
            writer.uint32(format.sampleRate);
            writer.uint32(format.sampleRate * format.numberOfChannels * bytes);
            writer.uint16(format.numberOfChannels * bytes);
            writer.uint16(format.bitDepth);
        }

        function writeData(writer, format, length, audioData, opts) {
            var bitDepth = format.bitDepth;
            var encoderOption = format.floatingPoint ? "f" : opts.symmetric ? "s" : "";
            var methodName = "pcm" + bitDepth + encoderOption;

            if (!writer[methodName]) {
                return new TypeError("Not supported bit depth: " + bitDepth);
            }

            var write = writer[methodName].bind(writer);
            var numberOfChannels = format.numberOfChannels;
            var channelData = audioData.channelData;

            writer.string("data");
            writer.uint32(length);

            for (var i = 0, imax = audioData.length; i < imax; i++) {
                for (var ch = 0; ch < numberOfChannels; ch++) {
                    write(channelData[ch][i]);
                }
            }
        }

        function createWriter(dataView) {
            var pos = 0;

            return {
                int16: function (value) {
                    dataView.setInt16(pos, value, true);
                    pos += 2;
                },
                uint16: function (value) {
                    dataView.setUint16(pos, value, true);
                    pos += 2;
                },
                uint32: function (value) {
                    dataView.setUint32(pos, value, true);
                    pos += 4;
                },
                string: function (value) {
                    for (var i = 0, imax = value.length; i < imax; i++) {
                        dataView.setUint8(pos++, value.charCodeAt(i));
                    }
                },
                pcm8: function (value) {
                    value = Math.max(-1, Math.min(value, +1));
                    value = (value * 0.5 + 0.5) * 255;
                    value = Math.round(value) | 0;
                    dataView.setUint8(pos, value, true);
                    pos += 1;
                },
                pcm8s: function (value) {
                    value = Math.round(value * 128) + 128;
                    value = Math.max(0, Math.min(value, 255));
                    dataView.setUint8(pos, value, true);
                    pos += 1;
                },
                pcm16: function (value) {
                    value = Math.max(-1, Math.min(value, +1));
                    value = value < 0 ? value * 32768 : value * 32767;
                    value = Math.round(value) | 0;
                    dataView.setInt16(pos, value, true);
                    pos += 2;
                },
                pcm16s: function (value) {
                    value = Math.round(value * 32768);
                    value = Math.max(-32768, Math.min(value, 32767));
                    dataView.setInt16(pos, value, true);
                    pos += 2;
                },
                pcm24: function (value) {
                    value = Math.max(-1, Math.min(value, +1));
                    value = value < 0 ? 0x1000000 + value * 8388608 : value * 8388607;
                    value = Math.round(value) | 0;

                    var x0 = (value >> 0) & 0xFF;
                    var x1 = (value >> 8) & 0xFF;
                    var x2 = (value >> 16) & 0xFF;

                    dataView.setUint8(pos + 0, x0);
                    dataView.setUint8(pos + 1, x1);
                    dataView.setUint8(pos + 2, x2);
                    pos += 3;
                },
                pcm24s: function (value) {
                    value = Math.round(value * 8388608);
                    value = Math.max(-8388608, Math.min(value, 8388607));

                    var x0 = (value >> 0) & 0xFF;
                    var x1 = (value >> 8) & 0xFF;
                    var x2 = (value >> 16) & 0xFF;

                    dataView.setUint8(pos + 0, x0);
                    dataView.setUint8(pos + 1, x1);
                    dataView.setUint8(pos + 2, x2);
                    pos += 3;
                },
                pcm32: function (value) {
                    value = Math.max(-1, Math.min(value, +1));
                    value = value < 0 ? value * 2147483648 : value * 2147483647;
                    value = Math.round(value) | 0;
                    dataView.setInt32(pos, value, true);
                    pos += 4;
                },
                pcm32s: function (value) {
                    value = Math.round(value * 2147483648);
                    value = Math.max(-2147483648, Math.min(value, +2147483647));
                    dataView.setInt32(pos, value, true);
                    pos += 4;
                },
                pcm32f: function (value) {
                    dataView.setFloat32(pos, value, true);
                    pos += 4;
                }
            };
        }

        module.exports.encode = encode;
        module.exports.encode.sync = encodeSync;
    }(wavEncoder));

    /**
     * Player でイベントを随時読み取るためのクラス
     * 精確にスケジューリングするために先読みを行う
     * https://www.html5rocks.com/ja/tutorials/audio/scheduling/
     */
    /**
     * Player Classes for reading events at any time
     * Perform prefetching for accurate scheduling
     * https://www.html5rocks.com/ja/tutorials/audio/scheduling/
     */
    class EventScheduler {
        // 先読み時間 (ms)
        // Leading time (MS)
        lookAheadTime = 100;
        // 1/4 拍子ごとの tick 数
        // 1/4 TICK number for each beat
        timebase = 480;
        _currentTick = 0;
        _scheduledTick = 0;
        _prevTime = undefined;
        _events;
        constructor(events = [], tick = 0, timebase = 480, lookAheadTime = 100) {
            this._events = events;
            this._currentTick = tick;
            this._scheduledTick = tick;
            this.timebase = timebase;
            this.lookAheadTime = lookAheadTime;
        }
        get currentTick() {
            return this._currentTick;
        }
        millisecToTick(ms, bpm) {
            return (((ms / 1000) * bpm) / 60) * this.timebase;
        }
        tickToMillisec(tick, bpm) {
            return (tick / (this.timebase / 60) / bpm) * 1000;
        }
        seek(tick) {
            this._currentTick = this._scheduledTick = Math.max(0, tick);
        }
        readNextEvents(bpm, timestamp) {
            if (this._prevTime === undefined) {
                this._prevTime = timestamp;
            }
            const delta = timestamp - this._prevTime;
            const nowTick = Math.floor(this._currentTick + Math.max(0, this.millisecToTick(delta, bpm)));
            // 先読み時間
            // Leading time
            const lookAheadTick = Math.floor(this.millisecToTick(this.lookAheadTime, bpm));
            // 前回スケジュール済みの時点から、
            // From the previous scheduled point,
            // 先読み時間までを処理の対象とする
            // Target of processing up to read time
            const startTick = this._scheduledTick;
            const endTick = nowTick + lookAheadTick;
            this._prevTime = timestamp;
            this._currentTick = nowTick;
            this._scheduledTick = endTick;
            return this._events
                .filter((e) => e && e.tick >= startTick && e.tick < endTick)
                .map((e) => {
                    const waitTick = e.tick - nowTick;
                    const delayedTime = timestamp + Math.max(0, this.tickToMillisec(waitTick, bpm));
                    return { event: e, timestamp: delayedTime };
                });
        }
    }

    function addTick$1(events, track) {
        let tick = 0;
        return events.map((e) => {
            tick += e.deltaTime;
            return { ...e, tick, track };
        });
    }
    const isEndOfTrackEvent = (e) => "subtype" in e && e.subtype === "endOfTrack";
    const TIMER_INTERVAL = 100;
    const LOOK_AHEAD_TIME = 50;
    class MIDIPlayer {
        output;
        tempo = 120;
        interval;
        midi;
        sampleRate;
        tickedEvents;
        scheduler;
        endOfSong;
        onProgress;
        constructor(midi, sampleRate, output) {
            this.midi = midi;
            this.sampleRate = sampleRate;
            this.output = output;
            this.tickedEvents = midi.tracks
                .flatMap(addTick$1)
                .sort((a, b) => a.tick - b.tick);
            this.scheduler = new EventScheduler(this.tickedEvents, 0, this.midi.header.ticksPerBeat, TIMER_INTERVAL + LOOK_AHEAD_TIME);
            this.endOfSong = Math.max(...this.tickedEvents.filter(isEndOfTrackEvent).map((e) => e.tick));
            this.resetControllers();
        }
        resume() {
            if (this.interval === undefined) {
                this.interval = window.setInterval(() => this.onTimer(), TIMER_INTERVAL);
            }
        }
        pause() {
            clearInterval(this.interval);
            this.interval = undefined;
            this.allSoundsOff();
        }
        stop() {
            this.pause();
            this.resetControllers();
            this.scheduler.seek(0);
            this.onProgress?.(0);
        }
        // 0: start, 1: end
        seek(position) {
            this.allSoundsOff();
            this.scheduler.seek(position * this.endOfSong);
        }
        allSoundsOff() {
            for (let i = 0; i < 16; i++) {
                this.output({
                    type: "midi",
                    midi: {
                        type: "channel",
                        subtype: "controller",
                        controllerType: MIDIControlEvents.ALL_SOUNDS_OFF,
                        channel: i,
                        value: 0,
                    },
                    delayTime: 0,
                });
            }
        }
        resetControllers() {
            for (let i = 0; i < 16; i++) {
                this.output({
                    type: "midi",
                    midi: {
                        type: "channel",
                        subtype: "controller",
                        controllerType: MIDIControlEvents.RESET_CONTROLLERS,
                        channel: i,
                        value: 0,
                    },
                    delayTime: 0,
                });
            }
        }
        onTimer() {
            const now = performance.now();
            const events = this.scheduler.readNextEvents(this.tempo, now);
            // channel イベントを MIDI Output に送信
            // Send Channel Event to MIDI OUTPUT
            events.forEach(({ event, timestamp }) => {
                const delayTime = ((timestamp - now) / 1000) * this.sampleRate;
                const synthEvent = this.handleEvent(event, delayTime);
                if (synthEvent !== null) {
                    this.output(synthEvent);
                }
            });
            if (this.scheduler.currentTick >= this.endOfSong) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
            this.onProgress?.(this.scheduler.currentTick / this.endOfSong);
        }
        handleEvent(e, delayTime) {
            switch (e.type) {
                case "channel":
                    return {
                        type: "midi",
                        midi: e,
                        delayTime,
                    };
                case "meta":
                    switch (e.subtype) {
                        case "setTempo":
                            this.tempo = (60 * 1000000) / e.microsecondsPerBeat;
                            break;
                        // case "lyrics":
                        // console.log
                        default:
                            console.warn(`not supported meta event`, e);
                            break;
                    }
            }
            return null;
        }
    }

    function addTick(events, track) {
        let tick = 0;
        return events.map((e) => {
            tick += e.deltaTime;
            return { ...e, tick, track };
        });
    }
    const tickToMillisec = (tick, bpm, timebase) => (tick / (timebase / 60) / bpm) * 1000;
    const midiToSynthEvents = (midi, sampleRate) => {
        const events = midi.tracks.flatMap(addTick).sort((a, b) => a.tick - b.tick);
        let keyframe = {
            tick: 0,
            bpm: 120,
            timestamp: 0,
        };
        const synthEvents = [];
        // channel イベントを MIDI Output に送信
        // Send Channel Event to MIDI OUTPUT
        for (const e of events) {
            const timestamp = tickToMillisec(e.tick - keyframe.tick, keyframe.bpm, midi.header.ticksPerBeat) + keyframe.timestamp;
            const delayTime = (timestamp * sampleRate) / 1000;
            switch (e.type) {
                case "channel":
                    synthEvents.push({
                        type: "midi",
                        midi: e,
                        delayTime,
                    });
                case "meta":
                    switch (e.subtype) {
                        case "setTempo":
                            keyframe = {
                                tick: e.tick,
                                bpm: (60 * 1000000) / e.microsecondsPerBeat,
                                timestamp,
                            };
                            break;
                    }
            }
        }
        return synthEvents;
    };

    const soundFontUrl = "soundfonts/TimGM6mb.sf2";
    const waitForAnimationFrame = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    const main = async () => {
        const context = new AudioContext();
        let synth;
        let soundFontData = null;
        const setup = async () => {
            try {
                await context.audioWorklet.addModule("/js/processor.js");
            }
            catch (e) {
                console.error("Failed to add AudioWorklet module", e);
            }
            synth = new AudioWorkletNode(context, "synth-processor", {
                numberOfInputs: 0,
                outputChannelCount: [2],
            });
            synth.connect(context.destination);
        };
        const postSynthMessage = (e, transfer) => {
            synth.port.postMessage(e, transfer ?? []);
        };
        const loadSoundFont = async () => {
            soundFontData = await (await fetch(soundFontUrl)).arrayBuffer();
            const parsed = getSamplesFromSoundFont(new Uint8Array(soundFontData), context);
            for (const sample of parsed) {
                postSynthMessage(sample, [sample.sample.buffer]);
            }
        };
        const setupMIDIInput = async () => {
            const midiAccess = await navigator.requestMIDIAccess({
                sysex: false,
            });
            midiAccess.inputs.forEach((entry) => {
                entry.onmidimessage = (event) => {
                    const e = deserialize(new Stream(event.data), 0, () => { });
                    if ("channel" in e) {
                        postSynthMessage({ type: "midi", midi: e, delayTime: 0 });
                    }
                };
            });
        };
        await setup();
        loadSoundFont().catch((e) => console.error(e));
        setupMIDIInput().catch((e) => console.error(e));
        const fileInput = document.getElementById("open");
        const playButton = document.getElementById("button-play");
        const pauseButton = document.getElementById("button-pause");
        const stopButton = document.getElementById("button-stop");
        const exportButton = document.getElementById("button-export");
        const exportPanel = document.getElementById("export-panel");
        const benchmarkButton = document.getElementById("button-benchmark");
        const workerBenchmarkButton = document.getElementById("button-benchmark-worker");
        const seekbar = document.getElementById("seekbar");
        seekbar.setAttribute("max", "1");
        seekbar.setAttribute("step", "0.0001");
        seekbar.addEventListener("change", (e) => {
            midiPlayer?.seek(seekbar.valueAsNumber);
        });
        let isSeekbarDragging = false;
        seekbar.addEventListener("mousedown", () => {
            isSeekbarDragging = true;
        });
        seekbar.addEventListener("mouseup", () => {
            isSeekbarDragging = false;
        });
        let midiPlayer = null;
        let midi = null;
        const playMIDI = (midi) => {
            midiPlayer?.pause();
            context.resume();
            midiPlayer = new MIDIPlayer(midi, context.sampleRate, postSynthMessage);
            midiPlayer.onProgress = (progress) => {
                if (!isSeekbarDragging) {
                    seekbar.valueAsNumber = progress;
                }
            };
            midiPlayer?.resume();
        };
        fileInput.addEventListener("change", (e) => {
            context.resume();
            const reader = new FileReader();
            reader.onload = async () => {
                midi = read(reader.result);
                playMIDI(midi);
            };
            const input = e.currentTarget;
            const file = input.files?.[0];
            reader.readAsArrayBuffer(file);
        });
        playButton.addEventListener("click", () => {
            context.resume();
            midiPlayer?.resume();
        });
        pauseButton.addEventListener("click", () => {
            midiPlayer?.pause();
        });
        stopButton.addEventListener("click", () => {
            midiPlayer?.stop();
        });
        const exportAudio = async (midi, type) => {
            if (soundFontData === null) {
                return;
            }
            const samples = getSamplesFromSoundFont(new Uint8Array(soundFontData), context);
            const sampleRate = 44100;
            const events = midiToSynthEvents(midi, sampleRate);
            const progress = document.createElement("progress");
            progress.value = 0;
            exportPanel.appendChild(progress);
            const exportOnMainThread = async () => {
                const cancelButton = document.createElement("button");
                cancelButton.textContent = "cancel";
                let cancel = false;
                cancelButton.onclick = () => (cancel = true);
                exportPanel.appendChild(cancelButton);
                const result = await renderAudio(samples, events, {
                    sampleRate,
                    bufferSize: 256,
                    cancel: () => cancel,
                    waitForEventLoop: waitForAnimationFrame,
                    onProgress: (numFrames, totalFrames) => (progress.value = numFrames / totalFrames),
                });
                cancelButton.remove();
                return result;
            };
            const exportOnWorker = () => new Promise((resolve) => {
                if (soundFontData === null) {
                    return;
                }
                const worker = new Worker("/js/rendererWorker.js");
                const samples = getSamplesFromSoundFont(new Uint8Array(soundFontData), context);
                const sampleRate = 44100;
                const events = midiToSynthEvents(midi, sampleRate);
                const message = {
                    type: "start",
                    samples,
                    events,
                    sampleRate,
                    bufferSize: 128,
                };
                worker.postMessage(message);
                const cancelButton = document.createElement("button");
                cancelButton.textContent = "cancel";
                cancelButton.onclick = () => {
                    const message = {
                        type: "cancel",
                    };
                    worker.postMessage(message);
                };
                exportPanel.appendChild(cancelButton);
                worker.onmessage = async (e) => {
                    switch (e.data.type) {
                        case "progress": {
                            progress.value = e.data.numBytes / e.data.totalBytes;
                            break;
                        }
                        case "complete": {
                            progress.remove();
                            cancelButton.remove();
                            resolve(e.data.audioData);
                            break;
                        }
                    }
                };
            });
            let audioData;
            switch (type) {
                case "mainthread":
                    audioData = await exportOnMainThread();
                    break;
                case "worker":
                    audioData = await exportOnWorker();
                    break;
            }
            progress.remove();
            const audioBuffer = audioDataToAudioBuffer(audioData);
            const wavData = await wavEncoderExports.encode({
                sampleRate: audioBuffer.sampleRate,
                channelData: [
                    audioBuffer.getChannelData(0),
                    audioBuffer.getChannelData(1),
                ],
            });
            const blob = new Blob([wavData], { type: "audio/wav" });
            const audio = new Audio();
            const url = window.URL.createObjectURL(blob);
            audio.src = url;
            audio.controls = true;
            exportPanel.appendChild(audio);
            return audioData;
        };
        exportButton.addEventListener("click", async () => {
            if (midi === null || soundFontData === null) {
                return;
            }
            await exportAudio(midi, "worker");
        });
        const benchmark = async (type) => {
            if (soundFontData === null) {
                console.error("SoundFont is not loaded");
                return;
            }
            const midiData = await (await fetch("/midi/song.mid")).arrayBuffer();
            const midi = read(midiData);
            exportPanel.innerHTML += "<p>Benchmark test started.</p>";
            const startTime = performance.now();
            const result = await exportAudio(midi, type);
            if (result === undefined) {
                return;
            }
            const endTime = performance.now();
            const songLength = result.length / result.sampleRate;
            const processTime = endTime - startTime;
            exportPanel.innerHTML += `
      <p>Benchmark test completed.</p>
      <ul>
        <li>${result.rightData.byteLength + result.leftData.byteLength} bytes</li>
        <li>${result.length} frames</li>
        <li>${songLength} seconds</li>
        <li>Take ${processTime} milliseconds</li>
        <li>x${songLength / (processTime / 1000)} speed</li>
      </ul>
    `;
        };
        benchmarkButton.addEventListener("click", async () => {
            benchmark("mainthread");
        });
        workerBenchmarkButton.addEventListener("click", async () => {
            benchmark("worker");
        });
    };
    main().catch((e) => {
        console.error(e);
    });

})();
//# sourceMappingURL=index.js.map
