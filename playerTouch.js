class TouchList {
    constructor(canvas) {
        this.colours = new Colours();
        this.touches = [];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    add(x, y, id) {
        this.touches.push(new PlayerTouch(this.ctx, x, y, id, this.colours.getRandomColour()));
    }
    remove(id) {
        let touch = this.getTouch(id);
        if (touch) {
            touch.flagForDelete();
        }
    }
    touchesLength() {
        return this.touches.length;
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
            let touch = this.touches[i];
            if (touch.isBeingDeleted) {
                touch.radius -= 5;
                if (touch.radius <= 0) {
                    this.colours.add(touch.colour);
                    this.touches.splice(i, 1);
                }
            }
            else {
                if (touch.radius < 40) {
                    touch.radius += 5;
                }
            }
        }
    }
    move(id, x, y) {
        let thisTouch = this.getTouch(id);
        if (thisTouch) {
            thisTouch.moveTo(x, y);
        }
    }
    empty() {
        this.touches = [];
        this.colours.reset();
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
        this.isLocked = false;
        this.number = -1;
    }
    moveTo(x, y) {
        if (this.isLocked) return;
        this.x = x;
        this.y = y;        
    }
    draw() {
        this.ctx.fillStyle = this.colour;
        this.ctx.beginPath();

        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();

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
    getRandomColour() {
        return this.colour.splice(Math.floor(Math.random() * this.colour.length), 1)[0];
    }
    add(colour) {
        this.colour.push(colour);
    }
}