
// Servicio de voz (Reconstruido)
// Nota: El servicio original usaba ElevenLabs. Esta versión usa Web Speech API como fallback.

class VoiceService {
    private muted: boolean = true; // Por defecto muteado
    private synthesis: SpeechSynthesis;

    constructor() {
        this.synthesis = window.speechSynthesis;
    }

    isMuted() {
        return this.muted;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.synthesis.cancel();
        }
        return this.muted;
    }

    speak(text: string) {
        if (this.muted) return;
        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        this.synthesis.speak(utterance);
    }

    async prepareAudio(text: string): Promise<HTMLAudioElement | null> {
        // Simulación: En el futuro se puede reconectar con ElevenLabs
        return null;
    }

    playAudio(audio: HTMLAudioElement | null, text: string) {
        if (this.muted) return;
        if (audio) {
            audio.play().catch(e => console.error("Error reproduciendo audio", e));
        } else {
            this.speak(text);
        }
    }
}

export const voiceService = new VoiceService();
