class Colours {
    constructor() {
        this.reset();
    }
    reset() {
        this.colour = ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"];
    }
    getNoTeamColour() {
        return "#C0C0C0"; // you go Glenn
    }
    getRandomColour() {
        return this.colour.splice(Math.floor(Math.random() * this.colour.length), 1)[0];
    }
    add(colour) {
        this.colour.push(colour);
    }
}

class PlayerTouch {
    constructor(x, y, id, colour, timeoutDuration) {
        this.radius = 20;
        this.outerCircleStrokeWidth = 10;
        this.x = x;
        this.y = y;
        this.id = id;
        this.colour = colour;
        this.isLocked = false;
        this.state = this.touchState.creation;
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
        this.ordinateNumberAngle = (Math.random() * 2) * Math.PI;
        this.timeoutDuration = timeoutDuration;
        this.timeoutColor = colour + "7F";
    }
    touchState = {
        creation: 0,
        selected: 1,
        onlySelected: 2,
        normal: 3,
        obsolete: 4
    };
    moveTo(x, y) {
        if (this.isLocked) {
            return;
        }
        this.x = x;
        this.y = y;
    }
    computeOuterCircle() {
        if ((this.outerCircleEndAngle - this.outerCircleStartAngle >= 2 * Math.PI) || this.state === this.touchState.onlySelected || this.state === this.touchState.selected) {
            this.outerCircleStartAngle = 0;
            this.outerCircleEndAngle = 2 * Math.PI;
        }
        else {
            this.outerCircleStartAngle += 0.08;
            this.outerCircleEndAngle += 0.24;
        }
    }
    update(timestamp) {
        switch (this.state) {
            case this.touchState.creation:
                if (this.radius >= 40) {
                    this.state = this.touchState.normal;
                }
                else {
                    this.radius += 5;
                }
                break;
            case this.touchState.deletion:
                this.radius -= 5;
                if (this.radius <= 0) {
                    this.radius = 0;
                    this.state = this.touchState.obsolete;
                }
                this.timeoutStarted = -1;
                break;
            case this.touchState.onlySelected:
                if (this.surroundingCircleRadius > this.radius + 60) {
                    this.surroundingCircleRadius -= 50;
                }
                this.timeoutStarted = -1;
                break;
            case this.touchState.selected:
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
                if (this.timeoutStarted !== -1 && timestamp > this.timeoutStarted) {
                    const totalAngle = ((timestamp - this.timeoutStarted) / (this.timeoutDuration)) * Math.PI * 2;
                    this.timeoutCircleStartAngle += 0.04;
                    this.timeoutCircleEndAngle = this.timeoutCircleStartAngle + totalAngle;
                }
            break;
        }
        this.computeOuterCircle();
    }
    startTimer(timestamp) {
        this.timeoutStarted = timestamp;
    }
    drawTouch(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 12, this.outerCircleStartAngle, this.outerCircleEndAngle);
        ctx.lineWidth = this.outerCircleStrokeWidth;
        ctx.stroke();
        ctx.closePath();
    }
    draw(ctx) {
        if (this.state === this.touchState.obsolete) {
            return;
        }
        ctx.fillStyle = this.colour;
        ctx.strokeStyle = this.colour;
        if (this.state === this.touchState.onlySelected) {
            ctx.rect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
            ctx.fill();

            ctx.globalCompositeOperation = "xor";

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.surroundingCircleRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        }
        this.drawTouch(ctx);

        if (this.number !== -1) {
            this.ordinateNumberAngle += 0.02

            this.drawOrdinateNumber(0.00);
            this.drawOrdinateNumber(2.09);
            this.drawOrdinateNumber(4.09);

        }
        if (this.timeoutStarted !== -1) {
            ctx.strokeStyle = this.timeoutColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, this.timeoutCircleStartAngle, this.timeoutCircleEndAngle);
            ctx.lineWidth = 9;
            ctx.stroke();
            ctx.closePath();
        }
    }
    drawOrdinateNumber(angle) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.ordinateNumberAngle + angle);
        ctx.textAlign = "center";
        ctx.fillText(this.number, 0, -65);
        ctx.restore();
    }
    flagForDelete() {
        this.state = this.touchState.deletion;
        this.id = -1;
    }
}

class Feature {
    constructor() {
        this.featureType = {
            select: 0,
            teams: 1,
            ordinate: 2
        };
        this.type = this.featureType.select;
    }

    set(feature) {
        switch(feature) {
            case "select":
                this.type = this.featureType.select;
                break;
            case "teams":
                this.type = this.featureType.teams;
                break;
            case "ordinate":
                this.type = this.featureType.ordinate;
                break;
        }
    }

    shouldTimerStart(numberOfTouches, selectedNumber) {
        switch(this.type) {
            case this.featureType.select:
                return numberOfTouches > selectedNumber;
            case this.featureType.teams:
                return numberOfTouches >= selectedNumber;
            case this.featureType.ordinate:
                return numberOfTouches > 1;
        }
    }
}

class Elektu {
    constructor(canvas) {
        const setStartingHandlers = () => {
            this.canvas.addEventListener("touchstart", this.newTouch);
            this.canvas.addEventListener("touchend", this.touchEnd);
            this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
            this.canvas.addEventListener("touchcancel", this.touchEnd);
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
        this.selectedNumber = 1;
        this.vibrate = false;
        this.lastUpdateTimestamp = 0;
        this.feature = new Feature();
        setStartingHandlers();
    }
    add(x, y, id) {
        let colour = this.feature.type === this.feature.featureType.teams ? this.colours.getNoTeamColour() : this.colours.getRandomColour();
        this.touches.push(new PlayerTouch(x, y, id, colour, this.triggerTimeout));
    }
    remove(id) {
        this.getTouch(id)?.flagForDelete();
    }
    touchesLength() {
        let touchCount = 0;
        for (const touch of this.touches) {
            if (touch.state !== touch.touchState.deletion && touch.state !== touch.touchState.obsolete) {
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
    areAllTouchesLocked() {
        for (const touch of this.touches) {
            if (!touch.isLocked) {
                return false;
            }
        }
        return true;
    }
    update(timestamp) {
        this.lastUpdateTimestamp = timestamp;
        for (const touch of this.touches) {
            touch.update(timestamp);
        }
        this.touches.forEach((touch, i) => {
            if (touch.state === touch.touchState.obsolete) {
                if (this.feature.type !== this.feature.featureType.teams) {
                    this.colours.add(touch.colour);
                }
                this.touches.splice(i, 1);
            }
        });
    }
    move(id, x, y) {
        this.getTouch(id)?.moveTo(x, y);
    }
    reset() {
        this.touches = [];
        this.colours.reset();

        this.ctx.globalCompositeOperation = "source-over";

        clearTimeout(this.timerTrigger);
        clearTimeout(this.resetAllTimeout);

        this.canvas.removeEventListener("touchstart", this.ignoreEvent);
        this.canvas.removeEventListener("touchmove", this.ignoreEvent);
        this.canvas.removeEventListener("touchend", this.ignoreEvent);
        this.canvas.removeEventListener("touchend", this.finishTouchEnd);
        this.canvas.removeEventListener("touchcancel", this.ignoreEvent);
        this.canvas.removeEventListener("touchcancel", this.finishTouchEnd);

        this.canvas.addEventListener("touchstart", this.newTouch);
        this.canvas.addEventListener("touchend", this.touchEnd);
        this.canvas.addEventListener("touchcancel", this.touchEnd);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const touch of this.touches) {
            touch.draw(this.ctx);
        }
    }
    getTouch(identifier) {
        for (const touch of this.touches) {
            if (identifier === touch.id) {
                return touch;
            }
        }
        return null;
    }

    resetTimerTrigger() {
        clearTimeout(this.timerTrigger);
        if (this.feature.shouldTimerStart(this.touchesLength(), this.selectedNumber)) {
            this.timerTrigger = setTimeout(this.triggerSelection.bind(this), this.triggerTimeout);
            for(const touch of this.touches) {
                touch.startTimer(this.lastUpdateTimestamp);
            }
        }
        else {
            for(const touch of this.touches) {
                touch.startTimer(-1);
            }
        }
    }

    triggerSelection() {
        const setSelectionDoneHandlers = () => {
            this.canvas.removeEventListener("touchstart", this.newTouch);
            this.canvas.addEventListener("touchstart", this.ignoreEvent);
            this.canvas.removeEventListener("touchend", this.touchEnd);
            this.canvas.addEventListener("touchend", this.finishTouchEnd);
            this.canvas.removeEventListener("touchcancel", this.touchEnd);
            this.canvas.addEventListener("touchcancel", this.finishTouchEnd);
        };
        const shuffleArray = (array) => {
            let currentIndex = array.length, randomIndex, temporaryValue;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        };
        const shuffleTouchList = () => {
            const playerList = [...this.touches].map((t) => t.id);
            return shuffleArray(playerList);
        };
        const selectPlayers = (numberToSelect) => {
            const shuffledList = shuffleTouchList();

            shuffledList.forEach((player, i) => {
                if (i < numberToSelect) {
                    const selectedTouch = this.getTouch(player);
                    if (selectedTouch) {
                        selectedTouch.isSelected = true;
                        if(numberToSelect === 1) {
                            selectedTouch.state = selectedTouch.touchState.onlySelected;
                        }
                        else {
                            selectedTouch.state = selectedTouch.touchState.selected;
                        }
                    }
                }
                else {
                    this.remove(player);
                }
            });
        };
        const selectTeams = (numberOfTeams) => {
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
            const playerList = [...this.touches].map((t) => t.id);
            if (numberOfTeams > playerList.length) {
                throw new RangeError("selectTeams: more elements taken than available");
            }
            const splitTeams = splitIntoTeams(shuffleArray(playerList), numberOfTeams);
            for (const team of splitTeams) {
                const teamColour = this.colours.getRandomColour();
                for (const teamMember of team) {
                    const touch = this.getTouch(teamMember);
                    if (touch) {
                        touch.colour = teamColour;
                        touch.state = touch.touchState.selected;
                    }
                }
            }
        };
        const selectNumbers = () => {
            const randomisedTouches = shuffleTouchList();
            randomisedTouches.forEach((randomTouch, index) => {
                const touch = this.getTouch(randomTouch);
                if (touch) {
                    touch.number = index + 1;
                    touch.state = touch.touchState.selected;
                }
            });
        };
        clearTimeout(this.timerTrigger);
        switch (this.feature.type) {
            case this.feature.featureType.select :
                selectPlayers(this.selectedNumber);
                break;
            case this.feature.featureType.teams :
                selectTeams(this.selectedNumber);
                break;
            case this.feature.featureType.ordinate :
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
        for(const changedTouch of ev.changedTouches) {
            this.add(changedTouch.clientX, changedTouch.clientY, changedTouch.identifier);
        }
        this.resetTimerTrigger();
    }
    handleTouchMove(ev) {
        ev.preventDefault();
        for(const changedTouch of ev.changedTouches) {
            this.move(changedTouch.identifier, changedTouch.clientX, changedTouch.clientY);
        }
    }
    handleTouchEnd(ev) {
        ev.preventDefault();
        for(const changedTouch of ev.changedTouches) {
            this.remove(changedTouch.identifier);
        }
        this.resetTimerTrigger();
    }
    handleFinishTouchEnd(ev) {
        ev.preventDefault();
        for(const changedTouch of ev.changedTouches) {
            let touch = this.getTouch(changedTouch.identifier);
            if (touch) {
                touch.isLocked = true;
            }
        }

        if (this.areAllTouchesLocked()) {
            setTimeout(this.reset.bind(this), this.displayTimeout);
        }
    }
}
