export class TimerEngine {
    constructor(initialElapsed = 0){
        this.startTime = null;
        this.baseElapsed = initialElapsed * 1000;
        this.running = false;
    }

    start() {
        if (this.running) return; // if already running no need to start
        this.startTime = Date.now();
        this.running = true;
    }

    pause() {
        if (!this.running) return; // its not running then no need to pause
        this.baseElapsed += Date.now() - this.startTime; // time gap btw start and current time
        this.startTime = null;
        this.running = false;
    }

    reset() {
        this.startTime = null;
        this.baseElapsed = 0;
        this.running = false;
    }

    getElapsed() {
        if (!this.running) return Math.floor(this.baseElapsed / 1000);
        return Math.floor((this.baseElapsed + (Date.now() - this.startTime)) / 1000);
    }
}