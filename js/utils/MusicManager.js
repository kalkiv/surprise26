window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

window.App.Utils.MusicManager = class MusicManager {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.3;
        this.currentTrack = 'title';
        
        this.noteMap = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
        };

        this.melodies = {
            'title': [
                // Music Box Waltz
                {n:'F4', t:0}, {n:'A4', t:0.5}, {n:'C5', t:1.0}, {n:'E5', t:1.5},
                {n:'F4', t:2}, {n:'A4', t:2.5}, {n:'C5', t:3.0}, {n:'E5', t:3.5},
                {n:'E4', t:4}, {n:'G4', t:4.5}, {n:'B4', t:5.0}, {n:'D5', t:5.5},
                {n:'E4', t:6}, {n:'G4', t:6.5}, {n:'B4', t:7.0}, {n:'D5', t:7.5},
                {n:'D4', t:8}, {n:'F4', t:8.5}, {n:'A4', t:9.0}, {n:'C5', t:9.5},
                {n:'D4', t:10}, {n:'F4', t:10.5}, {n:'A4', t:11.0}, {n:'C5', t:11.5},
                {n:'C4', t:12}, {n:'E4', t:12.5}, {n:'G4', t:13.0}, {n:'B4', t:13.5},
                {n:'C4', t:14}, {n:'E4', t:14.5}, {n:'G4', t:15.0}, {n:'B4', t:15.5},
            ],
            'room': [
                // Slower, Romantic Piano Arpeggio (C Major -> A Minor -> F Major -> G Major)
                // C Major
                {n:'C3', t:0}, {n:'E3', t:0.5}, {n:'G3', t:1.0}, {n:'C4', t:1.5}, {n:'E4', t:2.0}, {n:'G4', t:2.5}, {n:'C5', t:3.0}, {n:'G4', t:3.5},
                // A Minor
                {n:'A3', t:4}, {n:'C3', t:4.5}, {n:'E3', t:5.0}, {n:'A4', t:5.5}, {n:'C4', t:6.0}, {n:'E4', t:6.5}, {n:'A4', t:7.0}, {n:'E4', t:7.5},
                // F Major
                {n:'F3', t:8}, {n:'A3', t:8.5}, {n:'C4', t:9.0}, {n:'F4', t:9.5}, {n:'A4', t:10.0}, {n:'C5', t:10.5}, {n:'F5', t:11.0}, {n:'C5', t:11.5},
                // G Major
                {n:'G3', t:12}, {n:'B3', t:12.5}, {n:'D4', t:13.0}, {n:'G4', t:13.5}, {n:'B4', t:14.0}, {n:'D5', t:14.5}, {n:'G5', t:15.0}, {n:'D5', t:15.5},
            ],
            'love': [
                // Can't Help Falling in Love style (C -> G -> Am -> F -> C -> G -> C)
                // C
                {n:'C4', t:0}, {n:'E4', t:0.5}, {n:'G4', t:1.0}, {n:'C5', t:1.5},
                // G
                {n:'B3', t:2}, {n:'D4', t:2.5}, {n:'G4', t:3.0}, {n:'B4', t:3.5},
                // Am
                {n:'A3', t:4}, {n:'C4', t:4.5}, {n:'E4', t:5.0}, {n:'A4', t:5.5},
                // F
                {n:'F3', t:6}, {n:'A3', t:6.5}, {n:'C4', t:7.0}, {n:'F4', t:7.5},
                // C
                {n:'C4', t:8}, {n:'E4', t:8.5}, {n:'G4', t:9.0}, {n:'C5', t:9.5},
                // G
                {n:'G3', t:10}, {n:'B3', t:10.5}, {n:'D4', t:11.0}, {n:'G4', t:11.5},
                // C
                {n:'C3', t:12}, {n:'E3', t:12.5}, {n:'G3', t:13.0}, {n:'C4', t:13.5},
                // Pause
                {n:'G3', t:14}, {n:'C4', t:14.5}, {n:'E4', t:15.0}, {n:'G4', t:15.5},
            ]
        };
        
        this.melody = this.melodies['title'];
        this.nextNoteTime = 0;
        this.melodyIndex = 0;
        
        this.loops = {};
        
        this.createUI();
    }
    
    init() {
        if(this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    }
    
    start() {
        if(!this.ctx) this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();
        if(this.isPlaying) return;
        
        this.isPlaying = true;
        this.melodyIndex = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
        
        if(this.btn) this.btn.textContent = '🔊';
    }
    
    stop() {
        this.isPlaying = false;
        if(this.timerID) clearTimeout(this.timerID);
        // Stop all loops
        Object.values(this.loops).forEach(loop => {
            if(loop && loop.stop) loop.stop();
        });
        this.loops = {};
        if(this.btn) this.btn.textContent = '🔇';
    }

    playTrack(trackName) {
        if(this.melodies[trackName]) {
            this.currentTrack = trackName;
            this.melody = this.melodies[trackName];
            this.melodyIndex = 0;
        }
    }
    
    scheduler() {
        if(!this.isPlaying) return;
        
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playNote(this.melody[this.melodyIndex]);
            this.advanceNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }
    
    advanceNote() {
        this.melodyIndex++;
        if(this.melodyIndex >= this.melody.length) {
            this.melodyIndex = 0;
        }
        if(this.currentTrack === 'room' || this.currentTrack === 'love') {
             this.nextNoteTime += 0.8; 
        } else {
             this.nextNoteTime += 0.5;
        }
    }
    
    playNote(noteData) {
        if(this.isMuted) return;
        const freq = this.noteMap[noteData.n];
        if(!freq) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.value = freq;
        osc.type = (this.currentTrack === 'room' || this.currentTrack === 'love') ? 'triangle' : 'sine'; 
        
        const t = this.nextNoteTime;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        gain.gain.setValueAtTime(0, t);
        
        if(this.currentTrack === 'room' || this.currentTrack === 'love') {
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, t + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 3.0);
            osc.start(t);
            osc.stop(t + 3.0);
        } else {
            gain.gain.linearRampToValueAtTime(this.volume, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
            osc.start(t);
            osc.stop(t + 1.5);
        }
    }
    
    startLoop(type) {
        if(!this.ctx || this.isMuted) return;
        if(this.loops[type]) return; // Already playing

        const t = this.ctx.currentTime;
        
        if(type === 'car_engine') {
             // Low rumble noise/oscillator
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             // Sawtooth + Lowpass filter simulation
             osc.type = 'sawtooth';
             osc.frequency.value = 80; // Low hum
             
             // AM Modulation to simulate engine chug
             const lfo = this.ctx.createOscillator();
             lfo.frequency.value = 15; // RPM ish
             const lfoGain = this.ctx.createGain();
             lfoGain.gain.value = 500;
             lfo.connect(lfoGain);
             // lfoGain.connect(osc.frequency); // FM
             
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.05, t);
             
             osc.start(t);
             lfo.start(t);
             
             this.loops[type] = { 
                 stop: () => { 
                     gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); 
                     setTimeout(() => { osc.stop(); lfo.stop(); }, 200);
                     delete this.loops[type];
                 },
                 setSpeed: (s) => {
                     // s is 0 to 1
                     osc.frequency.setTargetAtTime(80 + s*100, this.ctx.currentTime, 0.1);
                 }
             };
        } else if(type === 'phone_ring') {
             // Intermittent ring: Needs interval
             const playRing = () => {
                 const t = this.ctx.currentTime;
                 const osc = this.ctx.createOscillator();
                 const gain = this.ctx.createGain();
                 osc.frequency.value = 1400; // Classic phone ring freq (mixed 2 sine?)
                 
                 // Modulation for "Rrring" vibrato
                 const lfo = this.ctx.createOscillator();
                 lfo.frequency.value = 20;
                 const lfoGain = this.ctx.createGain();
                 lfoGain.gain.value = 100;
                 lfo.connect(lfoGain);
                 lfoGain.connect(osc.frequency);
                 
                 osc.connect(gain);
                 gain.connect(this.ctx.destination);
                 
                 // Pulse: Ring (2s) ... Pause (4s)
                 gain.gain.setValueAtTime(0.1, t);
                 gain.gain.setValueAtTime(0.1, t + 2.0);
                 gain.gain.linearRampToValueAtTime(0, t + 2.1);
                 
                 osc.start(t);
                 lfo.start(t);
                 osc.stop(t + 2.1);
                 lfo.stop(t + 2.1);
             };
             
             playRing();
             const interval = setInterval(playRing, 4000);
             
             this.loops[type] = {
                 stop: () => {
                     clearInterval(interval);
                     delete this.loops[type];
                 }
             };
        }
    }
    
    stopLoop(type) {
         if(this.loops[type]) this.loops[type].stop();
    }

    playSFX(type) {
        if(!this.ctx || this.isMuted) return;
        if(this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        
        const mkOsc = (freq, type, dur, vol=0.1) => {
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.frequency.value = freq;
             osc.type = type;
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(vol, t);
             gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
             osc.start(t);
             osc.stop(t + dur);
        };

        if(type === 'beep_high') {
            mkOsc(660, 'square', 0.2);
        } else if(type === 'beep_low') {
            mkOsc(440, 'square', 0.3);
        } else if(type === 'start') {
            mkOsc(880, 'square', 0.8);
            setTimeout(() => mkOsc(1320, 'square', 0.8), 50); 
        } else if(type === 'screw') {
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(150, t);
             osc.frequency.linearRampToValueAtTime(100, t + 0.3);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.15, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.3);
             osc.start(t);
             osc.stop(t + 0.3);
        } else if(type === 'tape') {
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(800, t);
             osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.05, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.2);
             osc.start(t);
             osc.stop(t + 0.2);
        } else if(type === 'keypad') {
             mkOsc(1200, 'sine', 0.1, 0.05);
        } else if(type === 'unlock') {
             mkOsc(300, 'square', 0.1, 0.1);
             setTimeout(() => mkOsc(450, 'square', 0.2, 0.1), 150);
        } else if(type === 'boost') {
             // Rocket whoosh
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.frequency.setValueAtTime(200, t);
             osc.frequency.exponentialRampToValueAtTime(800, t + 1.0);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.2, t);
             gain.gain.linearRampToValueAtTime(0, t + 1.0);
             osc.start(t);
             osc.stop(t + 1.0);
        } else if(type === 'jump') {
             // Mario jump style (Slide up)
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'square';
             osc.frequency.setValueAtTime(300, t);
             osc.frequency.linearRampToValueAtTime(600, t + 0.1);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.1, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.1);
             osc.start(t);
             osc.stop(t + 0.1);
        } else if(type === 'light_switch') {
             // Sharp click
             mkOsc(800, 'square', 0.05, 0.2);
        } else if(type === 'glass_break') {
             // High pitch noise burst
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'sawtooth'; // Rough approximation
             osc.frequency.setValueAtTime(2000, t);
             osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
             
             // Multiple OSCs for chaos?
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.3, t);
             gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
             osc.start(t);
             osc.stop(t + 0.3);
        } else if(type === 'cutter') {
             // Sharp slide
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(1200, t);
             osc.frequency.linearRampToValueAtTime(1000, t + 0.1);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.1, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.1);
             osc.start(t);
             osc.stop(t + 0.1);
        } else if(type === 'drawer') {
             // Low slide
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(100, t);
             osc.frequency.linearRampToValueAtTime(80, t + 0.5);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             gain.gain.setValueAtTime(0.1, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.5);
             osc.start(t);
             osc.stop(t + 0.5);
        }
    }
    
    createUI() {
        const btn = document.createElement('button');
        btn.textContent = '🔊'; 
        btn.style.cssText = 'position:fixed; bottom:20px; right:20px; font-size:24px; background:none; border:none; color:white; cursor:pointer; z-index:9999; text-shadow:0 0 5px pink;';
        btn.onclick = () => {
             this.init(); 
             this.isMuted = !this.isMuted;
             btn.textContent = this.isMuted ? '🔇' : '🔊';
             if(!this.isPlaying && !this.isMuted) this.start();
        };
        document.body.appendChild(btn);
        this.btn = btn;
    }
};