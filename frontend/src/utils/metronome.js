export class Metronome {
    constructor(bpm = 120) {
        this.bpm = bpm;
        this.subdivision = "quarter";
        this.audioCtx = null;

        this.nextNoteTime = 0;
        this.currentBeat = 0;
        this.subdivisionStep = 0;

        this.lookAhead = 25.0;      
        this.scheduleAheadTime = 0.1; // seconds

        this.timerID = null;
        this.listeners = [];
    }

    async init() {
        this.audioCtx = new AudioContext();
    }

    setSubdivision(subdivision) {
        this.subdivision = subdivision;
    }


    secondsPerBeat() {
        return (60.0 / this.bpm) / this.getSubdivisionMultiplier();
    }

    start() {
        this.currentBeat = 0;
        this.subdivisionStep = 0;
        this.nextNoteTime = this.audioCtx.currentTime;
        this.scheduler();
    }

    stop() {
        clearTimeout(this.timerID);
    }

    scheduler() {
        while (
            this.nextNoteTime <
            this.audioCtx.currentTime + this.scheduleAheadTime
        ) {
            this.scheduleClick(this.nextNoteTime);
            this.advanceBeat();
        }

        this.timerID = setTimeout(
            () => this.scheduler(),
            this.lookAhead
        );
    }

    advanceBeat() {
        this.nextNoteTime += this.secondsPerBeat();

        this.subdivisionStep++;

        if (this.subdivisionStep >= this.getSubdivisionMultiplier()) {
            this.subdivisionStep = 0;
            this.currentBeat++;
        }
    }

    scheduleClick(time) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        const isDownbeat =
            this.subdivisionStep === 0 && this.currentBeat % 4 === 0;

        const isBeat = this.subdivisionStep === 0;

        osc.frequency.value = isDownbeat
            ? 1000  
            : isBeat
                ? 800       
                : 600;      

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(time);
        osc.stop(time + 0.03);

        this.listeners.forEach(cb =>
            cb(this.currentBeat, time)
        );
    }

    getSubdivisionMultiplier() {
        switch (this.subdivision) {
            case "eighth":
                return 2;
            case "triplet":
                return 3;
            case "sixteenth":
                return 4;
            default:
                return 1; // quarter notes
        }
    }


    onBeat(callback) {
        this.listeners.push(callback);
    }

    
}
