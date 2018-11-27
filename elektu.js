class Elektu {
    constructor(canvas) {
        const setStartingHandlers = () => {
            this.canvas.addEventListener("touchstart", this.newTouch);
            this.canvas.addEventListener("touchend", this.touchEnd);
            this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
        };
        this.colours = new Colours();
        this.touches = [];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.timerTrigger = -1;
        this.displayTimeout = 1500;
        this.triggerTimeout = 2500;
        this.finishTouchEnd = this.handleFinishTouchEnd.bind(this);
        this.touchEnd = this.handleTouchEnd.bind(this);
        this.newTouch = this.handleNewTouch.bind(this);
        this.feature = 'select';
        this.selectedNumber = 1;
        this.vibrate = false;
        this.lastUpdateTimestamp = 0;

        setStartingHandlers();
    }
    add(x, y, id) {
        let colour = this.feature == 'teams' ? this.colours.getNoTeamColour() : this.colours.getRandomColour();
        this.touches.push(new PlayerTouch(this.ctx, x, y, id, colour, this.triggerTimeout));
    }
    remove(id) {
        let touch = this.getTouch(id);
        if (touch) {
            touch.flagForDelete();
        }
    }
    touchesLength() {
        let touchCount = 0;
        for (let i=0; i < this.touches.length; ++i) {
            if (this.touches[i].state != "deletion" && this.touches[i].state != "obsolete") {
                ++touchCount;
            }
        }
        return touchCount;
    }
    setVibrate(vibrate) {
        this.vibrate = vibrate;
    }
    setSelectedNumber(number) {
        this.selectedNumber = number;
    }
    setFeature(feature) {
        this.feature = feature;
    }
    getFeature() {
        return this.feature;
    }
    areAllTouchesLocked() {
        for (let i=0; i < this.touches.length; ++i) {
            if (!this.touches[i].isLocked) {
                return false;
            }
        }
        return true;  
    }
    update(timestamp) {
        this.lastUpdateTimestamp = timestamp;
        for (let i=0; i < this.touches.length; ++i) {
            this.touches[i].update(timestamp);
        }
        for (let i=0; i < this.touches.length; ++i) {
            if (this.touches[i].state == "obsolete") {
                if (this.feature != 'teams') {
                    this.colours.add(this.touches[i].colour);
                }
                this.touches.splice(i, 1);
            }
        }
    }
    move(id, x, y) {
        let thisTouch = this.getTouch(id);
        if (thisTouch) {
            thisTouch.moveTo(x, y);
        }
    }
    reset() {
        this.touches = [];
        this.colours.reset();

        this.ctx.globalCompositeOperation = 'source-over';

        clearTimeout(this.timerTrigger);
        clearTimeout(this.resetAllTimeout);

        this.canvas.removeEventListener("touchstart", this.ignoreEvent);
        this.canvas.removeEventListener("touchmove", this.ignoreEvent);
        this.canvas.removeEventListener("touchend", this.ignoreEvent);
        this.canvas.removeEventListener("touchend", this.finishTouchEnd);

        this.canvas.addEventListener("touchstart", this.newTouch);
        this.canvas.addEventListener("touchend", this.touchEnd);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const touchesLength = this.touches.length;
        for (let i=0; i < touchesLength; ++i) {
            this.touches[i].draw();
        }
    }
    getTouch(identifier) {
        for (let i=0; i < this.touches.length; ++i) {
            if (identifier == this.touches[i].id) {
                return this.touches[i];
            }
        }
        return null;
    }

    resetTimerTrigger() {
        const feature = this.getFeature();
        clearTimeout(this.timerTrigger);
        if (
            (feature == 'select' && this.touchesLength() > this.selectedNumber) ||
            (feature == 'teams' && this.touchesLength() >= this.selectedNumber) ||
            feature == 'ordinate'
        ) {
            this.timerTrigger = setTimeout(this.triggerSelection.bind(this), this.triggerTimeout);
            for (let i=0; i < this.touches.length; ++i) {
                this.touches[i].startTimer(this.lastUpdateTimestamp);
            }
        }
        else {
            for (let i=0; i < this.touches.length; ++i) {
                this.touches[i].startTimer(-1);
            }
        }
    }

    triggerSelection() {
        const setSelectionDoneHandlers = () => {
            this.canvas.removeEventListener("touchstart", this.newTouch);
            this.canvas.addEventListener("touchstart", this.ignoreEvent);
            this.canvas.removeEventListener("touchend", this.touchEnd);
            this.canvas.addEventListener("touchend", this.finishTouchEnd);
        };
        const shuffleArray = array => {
            let currentIndex = array.length;
        
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                let randomIndex = Math.floor(Math.random() * currentIndex--);
        
                // And swap it with the current element.
                let temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        };
        const shuffleTouchList = () => {
            const playerList = [...this.touches].map(t => t.id);
            return shuffleArray(playerList);
        };
        const selectPlayers = numberToSelect => {
            const shuffledList = shuffleTouchList();
    
            for (let i=0; i < shuffledList.length; ++i) {
                if (i < numberToSelect) {
                    const selectedTouch = this.getTouch(shuffledList[i]);
                    if (selectedTouch) {
                        selectedTouch.isSelected = true;
                        if(numberToSelect == 1) {
                            selectedTouch.state = "onlySelected";
                        }
                        else {
                            selectedTouch.state = "selected";
                        }
                    }
                }
                else {
                    this.remove(shuffledList[i]);
                }
            }
        };
        const selectTeams = numberOfTeams => {
            const splitIntoTeams = (randomisedTouches, numberOfTeams) => {
                const touchCount = randomisedTouches.length;
                const teamArray = [];
                let i = 0;
                if (touchCount % numberOfTeams === 0) {
                    const size = Math.floor(touchCount / numberOfTeams);
                    while (i < touchCount) {
                        teamArray.push(randomisedTouches.slice(i, i += size));
                    }
                }
                else {
                    while (i < touchCount) {
                        const size = Math.ceil((touchCount - i) / numberOfTeams--);
                        teamArray.push(randomisedTouches.slice(i, i += size));
                    }
                }
                return teamArray;
            };
            const playerList = [...this.touches].map(t => t.id);
            if (numberOfTeams > playerList.length) {
                throw new RangeError("selectTeams: more elements taken than available");
            }
            const splitTeams = splitIntoTeams(shuffleArray(playerList), numberOfTeams);
            for (let i=0; i < splitTeams.length; ++i) {
                const teamColour = this.colours.getRandomColour();
                for (let j=0; j < splitTeams[i].length; ++j) {
                    const touch = this.getTouch(splitTeams[i][j]);
                    if (touch) {
                        touch.colour = teamColour;
                        touch.state = "selected";
                    }
                }
            }
        };
        const selectNumbers = () => {
            const randomisedTouches = shuffleTouchList();
            for (let i = 0; i < randomisedTouches.length; ++i) {
                const touch = this.getTouch(randomisedTouches[i]);
                if (touch) {
                    touch.number = i + 1;
                    touch.state = "selected";
                }
            }
        };
        clearTimeout(this.timerTrigger);
        switch (this.getFeature()) {
            case 'select' :
                selectPlayers(this.selectedNumber);
                break;
            case 'teams' :
                selectTeams(this.selectedNumber);
                break;
            case 'ordinate' :
                selectNumbers();
                break;
            default:
                throw new Error("Unrecognised feature type.");
        }

        if (this.vibrate) {
            window.navigator.vibrate([50, 10, 50]);
        }

        setSelectionDoneHandlers();
    }

    ignoreEvent(ev) {
        ev.preventDefault();
    }

    handleNewTouch(ev) {
        ev.preventDefault();
        const changedTouches = ev.changedTouches;
        for (let i=0; i < changedTouches.length; ++i) {
            this.add(changedTouches[i].clientX, changedTouches[i].clientY, changedTouches[i].identifier);
        }
        this.resetTimerTrigger();
    }
    handleTouchMove(ev) {
        ev.preventDefault();
        const changedTouches = ev.changedTouches;
        for (let i=0; i < changedTouches.length; ++i) {
            this.move(changedTouches[i].identifier, changedTouches[i].clientX, changedTouches[i].clientY);
        }
    }
    handleTouchEnd(ev) {
        ev.preventDefault();
        const changedTouches = ev.changedTouches;
        for (let i=0; i < changedTouches.length; ++i) {
            this.remove(changedTouches[i].identifier);
        }
        this.resetTimerTrigger();
    }
    handleFinishTouchEnd(ev) {
        ev.preventDefault();
        const changedTouches = ev.changedTouches;
        for (let i=0; i < changedTouches.length; ++i) {
            let touch = this.getTouch(changedTouches[i].identifier);
            if (touch) {
                touch.isLocked = true;
            }
        }
        
        if (this.areAllTouchesLocked()) {
            setTimeout(this.reset.bind(this), this.displayTimeout);
        }
    }
}

class PlayerTouch {
    constructor(ctx, x, y, id, colour, timeoutDuration) {
        this.radius = 20;
        this.outerCircleStrokeWidth = 10;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.id = id;
        this.colour = colour;
        this.isLocked = false;
        this.state = "creation";
        this.number = -1;
        this.grow = 1;
        this.outerCircleStartAngle = (Math.random() * 2) * Math.PI;
        this.outerCircleEndAngle = this.outerCircleStartAngle;
        this.isSelected = false;
        this.surroundingCircleRadius = 1020;
        this.step = 0;
        this.timeoutStarted = -1;
        this.timeoutCircleStartAngle = (Math.random() * 2) * Math.PI;
        this.timeoutCircleEndAngle = this.timeoutCircleStartAngle;
        this.timeoutDuration = timeoutDuration;
    }
    moveTo(x, y) {
        if (this.isLocked) return;
        this.x = x;
        this.y = y;        
    }
    update(timestamp) {
        switch (this.state) {
            case "creation":
                if (this.radius >= 40) {
                    this.state = "normal";
                }
                else {
                    this.radius += 5;
                }
                break;
            case "deletion":
                this.radius -= 5;
                if (this.radius <= 0) {
                    this.radius = 0;
                    this.state = "obsolete";
                }
                this.timeoutStarted = -1;
                break;
            case "onlySelected":
                if (this.surroundingCircleRadius > this.radius + 60) {
                    this.surroundingCircleRadius -= 50;
                }
                this.timeoutStarted = -1;
                break;
            case "selected":
                this.timeoutStarted = -1;
                break;
            default:
                this.step++;
                if (this.step >= 4) {
                    this.step = 0;
                    if (this.radius <= 37) {
                        this.grow = 0.5;
                    }
                    else if (this.radius >= 42) {
                        this.grow = -0.5;
                    }
                    this.radius += this.grow;
                }
                if (this.timeoutStarted != -1 && timestamp > this.timeoutStarted) {
                    const totalAngle = ((timestamp - this.timeoutStarted) / (this.timeoutDuration)) * Math.PI * 2;
                    this.timeoutCircleStartAngle += 0.04;
                    this.timeoutCircleEndAngle = this.timeoutCircleStartAngle + totalAngle;
                }
            break;
        }
        if ((this.outerCircleEndAngle - this.outerCircleStartAngle >= 2 * Math.PI) || this.state == "onlySelected" || this.state == "selected") {
            this.outerCircleStartAngle = 0;
            this.outerCircleEndAngle = 2 * Math.PI;
        }
        else {
            this.outerCircleStartAngle += 0.08;
            this.outerCircleEndAngle += 0.24;
        }
    }
    startTimer(timestamp) {
        this.timeoutStarted = timestamp;
    }
    draw() {
        if (this.state == "obsolete") return;
        this.ctx.fillStyle = this.colour;
        this.ctx.strokeStyle = this.colour;
        if (this.state == "onlySelected") {
            this.ctx.rect(0, 0, this.ctx.canvas.clientWidth, this.ctx.canvas.clientHeight);
            this.ctx.fill();

            this.ctx.globalCompositeOperation = 'xor';

            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.surroundingCircleRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();
        }
        this.ctx.beginPath();

        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius + 12, this.outerCircleStartAngle, this.outerCircleEndAngle);
        this.ctx.lineWidth = this.outerCircleStrokeWidth;
        this.ctx.stroke();
        this.ctx.closePath();

        if (this.number != -1) {
            this.ctx.font = '50px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.number, this.x, this.y - 65);
        }
        if (this.timeoutStarted != -1) {
            this.ctx.fillStyle = '#c9bccf';
            this.ctx.strokeStyle = '#c9bccf';
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius + 4, this.timeoutCircleStartAngle, this.timeoutCircleEndAngle);
            this.ctx.lineWidth = 9;
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    flagForDelete() {
        this.state = "deletion";
        this.id = -1;
    }
}

class Colours {
    constructor() {
        this.reset();
    }
    reset() {
        this.colour = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'];
    }
    getNoTeamColour() {
        return '#C0C0C0'; // you go Glenn
    }
    getRandomColour() {
        return this.colour.splice(Math.floor(Math.random() * this.colour.length), 1)[0];
    }
    add(colour) {
        this.colour.push(colour);
    }
}