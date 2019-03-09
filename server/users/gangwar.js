var MongoDB = require("../libs/mongodb.js")
var GangTurfs = MongoDB.getTurfModel();
var Turfs = [];
var Turf = class {
    constructor(id, name, color, owner) {
        this._setup(id, name, color, owner);
    }
    _setup(id, name, color, owner) {
        var self = this;
        self._id = id;
        self._name = name;
        self._color = color;
        self._owner = owner;
        self._status = "normal";
        self._maxTicksAttack = 160 // 40 Min
        self._lastTick = {
            count: 0,
            duration: 0,
            time: 0
        };
        self._attackData = {
            attacker: null,
            score_attack: 100,
            score_defend: 100
        }
        self._playersInside = [];
        self._timer = null;
    }
    get id() {
        return this._id;
    }
    get score() {
        return this._attackData;
    }
    get name() {
        return this._name;
    }
    get owner() {
        return this._owner;
    }
    get color() {
        return this._color;
    }
    get status() {
        return this._status;
    }
    get attacker() {
        return this._attackData.attacker;
    }
    set owner(id) {
        this._owner = id;
    }
    set status(state) {
        this._status = state;
    }
    tick() {
        let self = this;
        if (self._status == "attack") {
            let cTick = Date.now();
            self.update();
            self._lastTick.count += 1;
            self._lastTick.duration = (Date.now() - cTick);
            self._lastTick.time = Date.now()
            console.log("self._lastTick", self._lastTick);
        }
    }
    update() {
        let self = this;
        let owner_count = self._playersInside.filter(function(player) {
            return player.data.team == self.owner;
        });
        let attacker_count = self._playersInside.filter(function(player) {
            return player.data.team == self.attacker;
        });
        console.log("Owner Count", owner_count);
        console.log("Attacker Count", attacker_count);
        self._attackData.score_attack += (attacker_count - owner_count);
        self._attackData.score_defend -= (attacker_count - owner_count);
        self._playersInside.forEach(playerInArea => {
            playerInArea.call("Gangarea:Update", [{
                id: self.id,
                attacking: self.status,
                owner: self.owner,
                color: self.color,
                attacker: self.attacker,
                scores: self.score
            }]);
        })
        if (self._attackData.score_attack > 200) {
            self.conquer(self.attacker);
        } else if (self._attackData.score_defend > 200) {
            self.conquer(self.owner);
        }
    }
    enter(player) {
        console.log("Turf Enter")
        if (this._playersInside.indexOf(player) == -1) {
            this._playersInside.push(player);
        }
    }
    leave(player) {
        console.log("Turf Leave")
        if (this._playersInside.indexOf(player) > -1) {
            this._playersInside.splice(this._playersInside.indexOf(player), 1);
        }
    }
    conquer() {
        let self = this;
        if (self._timer != null) {
            clearInterval(self._timer);
        }
    }
    attack(player) {
        let self = this;
        if (self.status == "normal") {
            console.log("attack")
            if (self._timer != null) {
                clearInterval(self._timer);
            }
            let attacker_gang = player.data.team;
            self._attackData = {
                attacker: attacker_gang,
                score_attack: 100,
                score_defend: 100
            }
            self.status = "attack";
            self._playersInside.forEach(playerInArea => {
                playerInArea.call("Gangarea:Update", [{
                    id: self.id,
                    attacking: self.status,
                    owner: self.owner,
                    color: self.color,
                    attacker: self.attacker
                }]);
            })
            self._timer = setInterval(function() {
                self.tick();
            }, 15000)
        }
    }
}


mp.events.add("Gangarea:Enter", function(player, turf_id) {
    console.log("Player Enter", turf_id);
    let turf_data;
    let turf = Turfs.filter(function(turf) {
        return turf.id === turf_id;
    })
    console.log("turf", JSON.stringify(turf));
    console.log("turfs", turf.length);
    if (turf.length == 1) {
        turf = turf[0];
        turf.enter(player);
        turf.attack(player);
    }
});
mp.events.add("Gangarea:Leave", function(player, turf_id) {
    console.log("Player Leave");
    let turf_data;
    let turf = Turfs.filter(function(turf) {
        return turf.id === turf_id;
    })
    if (turf.length == 1) {
        turf = turf[0];
        turf.leave(player);
    }
});
var Gangwars = new class {
    constructor() {
        this._setup();
    }
    _setup() {
        var self = this;
        self._loadedTurfs = [];
        self.loadTurfs();
    }
    createTurfs() {
        var self = this;
        self._loadedTurfs.forEach(function(turf) {
            Turfs[Turfs.length + 1] = new Turf(turf.turf_id, turf.name, turf.color, turf.owner)
        })
    }
    loadTurfs() {
        var self = this;
        return new Promise(function(fulfill, reject) {
            GangTurfs.find({}, async function(err, arr) {
                if (err) return reject(err);
                if ((arr)) {
                    let turfs = arr.map(function(turf) {
                        return {
                            name: turf.name,
                            turf_id: turf.turf_id,
                            position: {
                                x: turf.x,
                                y: turf.y
                            },
                            boundaries: turf.boundaries,
                            range: turf.range,
                            color: turf.color,
                            rotation: turf.rotation,
                            owner: turf.owner
                        }
                    })
                    self._loadedTurfs = turfs;
                    self.createTurfs();
                    return fulfill(self._loadedTurfs)
                }
            });
        })
    }
    getTurfs() {
        var self = this;
        return self._loadedTurfs;
    }
}
module.exports = Gangwars