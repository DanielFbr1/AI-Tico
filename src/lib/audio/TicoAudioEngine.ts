export class TicoAudioEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isPlaying: boolean = false;
    private nextNoteTime: number = 0.0;
    private currentNoteIndex: number = 0;
    private scheduleAheadTime: number = 0.1;
    private lookahead: number = 25.0; // ms
    private timerID: any = null;
    private tempo: number = 80;

    private notes: { [key: string]: number } = {
        "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
        "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
        "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99, "A5": 880.00, "B5": 987.77,
        "C6": 1046.50, "D6": 1174.66, "E6": 1318.51, "G6": 1567.98
    };

    public async init() {
        if (this.audioContext && this.audioContext.state !== 'closed' && this.masterGain) {
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    console.log("AudioContext reanudado con éxito.");
                } catch (e) {
                    console.warn("No se pudo reanudar el AudioContext directamente:", e);
                }
            }
            return;
        }

        try {
            if (!this.audioContext || this.audioContext.state === 'closed') {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (!this.masterGain) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
            }

            // Valor inicial de volumen (0 para evitar ruidos al arrancar, luego subirá)
            this.masterGain.gain.setValueAtTime(this.isPlaying ? 0.5 : 0, this.audioContext.currentTime);

            if (this.audioContext.state === 'suspended') {
                console.log("AudioContext inicializado en estado suspendido. Esperando gesto.");
                this.audioContext.resume().catch(e => {
                    console.warn("Fallo al reanudar AudioContext en init. Esperando interacción del usuario.", e);
                });
            }
        } catch (e) {
            console.error("Error al inicializar el Motor de Audio Tico:", e);
        }
    }

    public play() {
        if (this.isPlaying) return;
        if (!this.audioContext) {
            this.init().then(() => this.play());
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.startPlayback();
            }).catch(err => {
                console.warn("Playback failed: AudioContext still suspended.", err);
            });
        } else {
            this.startPlayback();
        }
    }

    private startPlayback() {
        if (!this.audioContext || this.isPlaying) return;
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.scheduler();
        this.masterGain?.gain.setTargetAtTime(0.5, this.audioContext.currentTime, 1.5);
    }

    public stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        this.masterGain?.gain.setTargetAtTime(0, this.audioContext?.currentTime || 0, 0.5);
    }

    public setVolume(val: number) {
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setTargetAtTime(val, this.audioContext.currentTime, 0.2);
        }
    }

    // --- SFX METHODS (UPDATED: SOFTER, HAPPIER, LONGER) ---

    public playUnlockSFX() {
        if (!this.audioContext || !this.masterGain) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const now = this.audioContext.currentTime;

        // Softer Happy Arpeggio: Pentatonic Run up and down (Double Length)
        const melody = ["C4", "E4", "G4", "A4", "C5", "E5", "G5", "C6"];
        melody.forEach((note, i) => {
            const time = now + (i * 0.12); // Slightly slower for "happiness/calm"
            const osc = this.audioContext!.createOscillator();
            const g = this.audioContext!.createGain();

            osc.type = 'sine'; // Sine is softer than triangle
            osc.frequency.setValueAtTime(this.notes[note], time);

            osc.connect(g);
            g.connect(this.masterGain!);

            // Soft Envelope
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(0.15, time + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.8); // Longer decay

            osc.start(time);
            osc.stop(time + 1.0);
        });
    }

    public playStickerSFX() {
        if (!this.audioContext || !this.masterGain) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const now = this.audioContext.currentTime;

        // "Sweet Shimmer Bubble" Cascade
        const steps = 12; // More steps for longer duration
        for (let i = 0; i < steps; i++) {
            const time = now + (i * 0.08); // Slower, more rhythmic cascade
            // Harmonious pentatonic frequencies (G major feel)
            const baseFreq = 440; // A4
            const multiplier = [1, 1.25, 1.5, 1.875, 2, 2.5, 3, 3.75, 4, 1.5, 2];
            const freq = baseFreq * (multiplier[i % multiplier.length]);

            const osc = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            osc.connect(g);
            g.connect(this.masterGain!);

            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(0.08, time + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // Softer decay

            osc.start(time);
            osc.stop(time + 0.4);
        }
    }

    public playClickSFX() {
        if (!this.audioContext || !this.masterGain) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();

        osc.type = 'sine';
        // Tiny high-pitched crystal blip
        osc.frequency.setValueAtTime(1200, now);

        osc.connect(g);
        g.connect(this.masterGain!);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08); // Very fast decay

        osc.start(now);
        osc.stop(now + 0.1);
    }

    public playCuriositySFX() {
        if (!this.audioContext || !this.masterGain) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const now = this.audioContext.currentTime;

        // Friendly "Double-Chirp" for Tico's voice
        const notes = ["D5", "G5"];
        notes.forEach((note, i) => {
            const time = now + (i * 0.08);
            const osc = this.audioContext!.createOscillator();
            const g = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(this.notes[note], time);

            osc.connect(g);
            g.connect(this.masterGain!);

            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(0.1, time + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.25);
        });
    }

    private scheduler() {
        if (!this.audioContext || !this.isPlaying) return;
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNoteIndex, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.currentNoteIndex++;
        if (this.currentNoteIndex >= 128) {
            this.currentNoteIndex = 0;
        }
    }

    private scheduleNote(beatNumber: number, time: number) {
        if (!this.audioContext || !this.masterGain) return;

        if (beatNumber % 16 === 0 || beatNumber % 16 === 10) {
            this.playWoodblock(time, 800);
        }

        if (beatNumber % 8 === 4) {
            this.playClick(time);
        }

        const melodyPattern = [
            "C5", null, "E5", "G5", null, "A5", null, "G5", "E5", "D5", "C5", null, "G4", null, null, null,
            "A4", "C5", "D5", "E5", null, "G5", "E5", "D5", "C5", null, null, null, null, null, null, null,
            "G5", null, "E5", "D5", "C5", null, "A4", "G4", "C5", "C5", "D5", "E5", "G5", null, null, null,
            "E5", "G5", "A5", "C6", null, "A5", "G5", "E5", "D5", "E5", "D5", "C5", null, null, null, null,
            "A4", null, "G4", null, "C5", "E5", "G5", "E5", "C5", null, "A4", "G4", "C5", null, null, null,
            "E5", null, "G5", "E5", "D5", "C5", "A4", "C5", "D5", null, "E5", "D5", "C5", null, null, null,
            "G4", "A4", "C5", null, "E5", null, "G5", null, "A5", "G5", "E5", "D5", "C5", null, null, null,
            "E5", "G5", "E5", "D5", "C5", "A4", "G4", "C5", "C5", null, null, null, null, null, null, null
        ];

        const note = melodyPattern[beatNumber % 128];
        if (note && this.notes[note]) {
            this.playMarimbaNote(this.notes[note], time);
            if (beatNumber % 4 === 0) this.playMarimbaNote(this.notes[note], time + 0.15, 0.02);
        }

        if (beatNumber % 32 === 0) {
            const chord = [this.notes["C4"], this.notes["E4"], this.notes["G4"]];
            chord.forEach(freq => this.playPad(freq, time));
        }

        const bassSeq = ["C3", "G3", "F3", "G3"];
        const currentBass = bassSeq[Math.floor(beatNumber / 32) % 4];
        if (beatNumber % 16 === 0 && currentBass && this.notes[currentBass]) {
            this.playBass(this.notes[currentBass], time);
        }
    }

    private playWoodblock(time: number, freq: number) {
        const osc = this.audioContext!.createOscillator();
        const g = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, time + 0.05);
        osc.connect(g);
        g.connect(this.masterGain!);
        g.gain.setValueAtTime(0.05, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.start(time);
        osc.stop(time + 0.05);
    }

    private playClick(time: number) {
        const osc = this.audioContext!.createOscillator();
        const g = this.audioContext!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, time);
        osc.connect(g);
        g.connect(this.masterGain!);
        g.gain.setValueAtTime(0.01, time);
        g.gain.linearRampToValueAtTime(0, time + 0.01);
        osc.start(time);
        osc.stop(time + 0.01);
    }

    private playMarimbaNote(freq: number, time: number, volume = 0.07) {
        const osc = this.audioContext!.createOscillator();
        const g = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(g);
        g.connect(this.masterGain!);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(volume, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    private playPad(freq: number, time: number) {
        const osc = this.audioContext!.createOscillator();
        const g = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(this.masterGain!);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.02, time + 1.5);
        g.gain.linearRampToValueAtTime(0, time + 3.0);
        osc.start(time);
        osc.stop(time + 3.0);
    }

    private playBass(freq: number, time: number) {
        const osc = this.audioContext!.createOscillator();
        const g = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(this.masterGain!);
        g.gain.setValueAtTime(0.03, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        osc.start(time);
        osc.stop(time + 0.8);
    }
}

export const ticoAudio = new TicoAudioEngine();
