/**
 * Game audio: Web Audio SFX + looped music from assets/music.mp3
 *
 * Music volume is routed through Web Audio GainNode so it works on iOS
 * (HTMLAudioElement.volume is ignored there).
 *
 * To change background music: replace assets/music.mp3
 */
(function (global) {
    const STORAGE_KEY = 'connectfourai-audio-v1';
    const MUSIC_SRC = 'assets/music.mp3';

    const DEFAULTS = {
        masterEnabled: true,
        sfxEnabled: true,
        musicEnabled: true,
        dropEnabled: true,
        resultEnabled: true,
        sfxVolume: 0.7,
        musicVolume: 0.35
    };

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULTS };
            return { ...DEFAULTS, ...JSON.parse(raw) };
        } catch (_) {
            return { ...DEFAULTS };
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (_) { /* ignore */ }
    }

    class GameAudio {
        constructor() {
            this.settings = loadSettings();
            this.ctx = null;
            this.masterGain = null;
            this.sfxGain = null;
            this.musicGain = null;
            this.musicEl = null;
            this.musicSource = null;
            this.musicReady = false;
            this.musicFailed = false;
            this.startedOnGamePage = false;
            this.proceduralMusicNodes = null;
        }

        ensureContext() {
            if (this.ctx) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            this.applyGains();
        }

        async resume() {
            this.ensureContext();
            if (this.ctx && this.ctx.state === 'suspended') {
                try { await this.ctx.resume(); } catch (_) { /* ignore */ }
            }
        }

        musicTargetGain() {
            if (!this.settings.masterEnabled || !this.settings.musicEnabled) return 0;
            return Math.max(0, Math.min(1, this.settings.musicVolume));
        }

        applyGains() {
            if (this.masterGain) {
                this.masterGain.gain.value = this.settings.masterEnabled ? 1 : 0;
            }
            if (this.sfxGain) {
                this.sfxGain.gain.value = this.settings.sfxEnabled
                    ? Math.max(0, Math.min(1, this.settings.sfxVolume))
                    : 0;
            }
            const musicVol = this.musicTargetGain();
            if (this.musicGain) {
                this.musicGain.gain.value = musicVol;
            }
            // Keep element volume at 1; real level comes from musicGain (iOS-safe)
            if (this.musicEl) {
                try { this.musicEl.volume = 1; } catch (_) { /* ignore */ }
            }
            if (this.proceduralMusicNodes && this.proceduralMusicNodes.gain) {
                this.proceduralMusicNodes.gain.gain.value = musicVol * 0.22;
            }
        }

        updateSettings(partial) {
            const prevWantMusic = this.settings.masterEnabled && this.settings.musicEnabled;
            this.settings = { ...this.settings, ...partial };
            saveSettings(this.settings);
            this.applyGains();

            if (!this.startedOnGamePage) return;
            const wantMusic = this.settings.masterEnabled && this.settings.musicEnabled;
            if (wantMusic && !prevWantMusic) {
                this.playMusic();
            } else if (!wantMusic && prevWantMusic) {
                this.pauseMusic();
            }
            // Volume-only changes: applyGains already handled it
        }

        getSettings() {
            return { ...this.settings };
        }

        tone(freq, duration, type, gainValue, when) {
            if (!this.ctx || !this.sfxGain) return;
            const t0 = when || this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.015);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
            osc.connect(env);
            env.connect(this.sfxGain);
            osc.start(t0);
            osc.stop(t0 + duration + 0.02);
        }

        async playDrop() {
            if (!this.settings.masterEnabled || !this.settings.sfxEnabled || !this.settings.dropEnabled) return;
            await this.resume();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            this.tone(520, 0.08, 'triangle', 0.18, t);
            this.tone(180, 0.12, 'sine', 0.28, t + 0.07);
            this.tone(90, 0.16, 'sine', 0.16, t + 0.1);
        }

        async playWin() {
            if (!this.settings.masterEnabled || !this.settings.sfxEnabled || !this.settings.resultEnabled) return;
            await this.resume();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                this.tone(f, 0.28, 'triangle', 0.22, t + i * 0.1);
            });
        }

        async playLose() {
            if (!this.settings.masterEnabled || !this.settings.sfxEnabled || !this.settings.resultEnabled) return;
            await this.resume();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            this.tone(320, 0.25, 'sawtooth', 0.12, t);
            this.tone(240, 0.32, 'triangle', 0.16, t + 0.12);
            this.tone(160, 0.4, 'sine', 0.2, t + 0.24);
        }

        async playDraw() {
            if (!this.settings.masterEnabled || !this.settings.sfxEnabled || !this.settings.resultEnabled) return;
            await this.resume();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            this.tone(392, 0.2, 'triangle', 0.16, t);
            this.tone(349.23, 0.25, 'triangle', 0.16, t + 0.16);
            this.tone(392, 0.28, 'sine', 0.14, t + 0.34);
        }

        ensureMusicElement() {
            if (this.musicEl || this.musicFailed) return;
            const audio = new Audio(MUSIC_SRC);
            audio.loop = true;
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous';
            audio.volume = 1;
            audio.addEventListener('canplaythrough', () => {
                this.musicReady = true;
            }, { once: true });
            audio.addEventListener('error', () => {
                this.musicFailed = true;
                this.musicReady = false;
                this.musicEl = null;
                this.musicSource = null;
            }, { once: true });
            this.musicEl = audio;
        }

        ensureMusicGraph() {
            this.ensureContext();
            this.ensureMusicElement();
            if (!this.ctx || !this.musicEl || this.musicFailed || this.musicSource) return;
            try {
                if (!this.musicGain) {
                    this.musicGain = this.ctx.createGain();
                    this.musicGain.connect(this.masterGain);
                }
                this.musicSource = this.ctx.createMediaElementSource(this.musicEl);
                this.musicSource.connect(this.musicGain);
                this.applyGains();
            } catch (_) {
                // Some browsers block MediaElementSource; fall back to element volume
                this.musicSource = null;
            }
        }

        startProceduralMusic() {
            this.ensureContext();
            if (!this.ctx || this.proceduralMusicNodes) return;
            const gain = this.ctx.createGain();
            gain.gain.value = this.musicTargetGain() * 0.22;
            gain.connect(this.masterGain);

            const freqs = [110, 164.81, 220];
            const oscs = freqs.map((f, i) => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = i === 0 ? 'sine' : 'triangle';
                osc.frequency.value = f;
                g.gain.value = i === 0 ? 0.35 : 0.12;
                osc.connect(g);
                g.connect(gain);
                osc.start();
                return osc;
            });
            this.proceduralMusicNodes = { gain, oscs };
        }

        stopProceduralMusic() {
            if (!this.proceduralMusicNodes) return;
            this.proceduralMusicNodes.oscs.forEach((o) => {
                try { o.stop(); } catch (_) { /* ignore */ }
            });
            try { this.proceduralMusicNodes.gain.disconnect(); } catch (_) { /* ignore */ }
            this.proceduralMusicNodes = null;
        }

        async playMusic() {
            if (!this.settings.masterEnabled || !this.settings.musicEnabled) {
                this.pauseMusic();
                return;
            }
            await this.resume();
            this.ensureMusicElement();
            this.ensureMusicGraph();

            if (this.musicEl && !this.musicFailed) {
                this.stopProceduralMusic();
                this.applyGains();
                // If Web Audio graph isn't available, use element volume as fallback
                if (!this.musicSource) {
                    try {
                        this.musicEl.volume = this.musicTargetGain();
                    } catch (_) { /* ignore */ }
                }
                try {
                    await this.musicEl.play();
                    return;
                } catch (_) {
                    // Autoplay or missing file - fall through to procedural
                }
            }

            this.startProceduralMusic();
            this.applyGains();
        }

        pauseMusic() {
            if (this.musicEl) {
                try { this.musicEl.pause(); } catch (_) { /* ignore */ }
            }
            this.stopProceduralMusic();
        }

        async enterGamePage() {
            this.startedOnGamePage = true;
            await this.resume();
            await this.playMusic();
        }

        leaveGamePage() {
            this.startedOnGamePage = false;
            this.pauseMusic();
        }
    }

    global.GameAudio = GameAudio;
    global.GAME_AUDIO_MUSIC_SRC = MUSIC_SRC;
})(window);
