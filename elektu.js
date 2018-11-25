class Elektu {
    constructor(canvas) {
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

        this.setStartingHandlers();
    }
    add(x, y, id) {
        let colour = this.feature == 'teams' ? this.colours.getNoTeamColour():this.colours.getRandomColour();
        this.touches.push(new PlayerTouch(this.ctx, x, y, id, colour));
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
            if (!this.touches[i].isBeingDeleted) {
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
    update() {
        for (let i=0; i < this.touches.length; ++i) {
            this.touches[i].update();
        }
        for (let i=0; i < this.touches.length; ++i) {
            if (this.touches[i].isObsolete) {
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
    shuffleArray (array) {
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
    }
    selectPlayers(numberToSelect) {
        const playerList = [...this.touches].map(t => t.id);
        const shuffledList = this.shuffleArray(playerList);

        for (let i=0; i < shuffledList.length; ++i) {
            if (i < numberToSelect) {
                const selectedTouch = this.getTouch(shuffledList[i]);
                if (selectedTouch) {
                    selectedTouch.isSelected = true;
                    if(numberToSelect == 1) {
                        selectedTouch.isOnlySelected = true;
                    }
                    console.log(`selecting ${selectedTouch.id}`);
                }
            }
            else {
                this.remove(shuffledList[i]);
            }
        }
    }
    selectTeams(numberOfTeams) {
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
        const splitTeams = splitIntoTeams(this.shuffleArray(playerList), numberOfTeams);
        for (let i=0; i < splitTeams.length; ++i) {
            const teamColour = this.colours.getRandomColour();
            for (let j=0; j < splitTeams[i].length; ++j) {
                const e = this.getTouch(splitTeams[i][j]);
                if (e) {
                    e.colour = teamColour;
                }
            }
        }
    }
    selectNumbers() {
        const playerList = [...this.touches].map(t => t.id);
        const randomisedTouches = this.shuffleArray(playerList);
        for (let i = 0; i < randomisedTouches.length; ++i) {
            const touch = this.getTouch(randomisedTouches[i]);
            if (touch) {
                touch.number = i + 1;
            }
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

    resetTimerTrigger() {
        const feature = this.getFeature();
        clearTimeout(this.timerTrigger);
        if (
            (feature == 'select' && this.touchesLength() > this.selectedNumber) ||
            (feature == 'teams' && this.touchesLength() >= this.selectedNumber) ||
            feature == 'ordinate'
        ) {
            this.timerTrigger = setTimeout(this.triggerSelection.bind(this), this.triggerTimeout);
        }
    }

    triggerSelection() {
        clearTimeout(this.timerTrigger);
        switch (this.getFeature()) {
            case 'select' :
                this.selectPlayers(this.selectedNumber);
                break;
            case 'teams' :
                this.selectTeams(this.selectedNumber);
                break;
            case 'ordinate' :
                this.selectNumbers();
                break;
            default:
                throw new Error("Unrecognised feature type.");
        }

        if (this.vibrate) {
            window.navigator.vibrate([50, 10, 50]);
        }

        this.setSelectionDoneHandlers();
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
    setSelectionDoneHandlers() {
        this.canvas.removeEventListener("touchstart", this.newTouch);
        this.canvas.addEventListener("touchstart", this.ignoreEvent);
        this.canvas.removeEventListener("touchend", this.touchEnd);
        this.canvas.addEventListener("touchend", this.finishTouchEnd);
    }
    setStartingHandlers() {
        this.canvas.addEventListener("touchstart", this.newTouch);
        this.canvas.addEventListener("touchend", this.touchEnd);
        this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    }
}

class PlayerTouch {
    constructor(ctx, x, y, id, colour) {
        this.radius = 20;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.id = id;
        this.colour = colour;
        this.isBeingDeleted = false;
        this.isBeingCreated = true;
        this.isObsolete = false;
        this.isLocked = false;
        this.number = -1;
        this.startAngle = 0;
        this.endAngle = 0;
        this.isSelected = false;
        this.isOnlySelected = false;
        this.outerCircleRadius = 1020;
    }
    moveTo(x, y) {
        if (this.isLocked) return;
        this.x = x;
        this.y = y;        
    }
    update() {
        if (this.isBeingCreated) {
            this.radius += 5;
            if (this.radius >= 40) {
                this.isBeingCreated = false;
            }
        }
        else if (this.isBeingDeleted) {
            this.radius -= 5;
            if (this.radius <= 0) {
                this.radius = 0;
                this.isObsolete = true;
            }
        }
        else if (this.endAngle - this.startAngle <= 2*Math.PI) {
            this.startAngle += 0.08;
            this.endAngle += 0.24;
        }
        else if (this.isOnlySelected) {
            if (this.outerCircleRadius > this.radius + 60) {
                this.outerCircleRadius -= 50;
            }
        }
    }
    draw() {
        this.ctx.fillStyle = this.colour;
        this.ctx.strokeStyle = this.colour;
        if (this.isOnlySelected) {
            this.ctx.rect(0, 0, this.ctx.canvas.clientWidth, this.ctx.canvas.clientHeight);
            this.ctx.fill();

            this.ctx.globalCompositeOperation = 'xor';

            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.outerCircleRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();
        }
        this.ctx.beginPath();

        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius + 12, this.startAngle, this.endAngle);
        this.ctx.lineWidth = 10;
        this.ctx.stroke();
        this.ctx.closePath();

        if (this.number != -1) {
            this.ctx.font = '50px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.number, this.x, this.y - 50);
        }
    }
    flagForDelete() {
        this.isBeingDeleted = true;
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