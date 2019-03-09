/*var PlayerClass = require("./users/player.js")
var Gangwar = require("./users/gangwar.js")
var Weapons = require("./users/weapons.js")
var getDeathReason = require("./libs/death_reasons.js")

Gangwar.getTurfs()
var players = [];
mp.events.add("ServerAccount:Ready", function(player) {
    player.setVariable("loggedIn", false);
    players[player.id] = new PlayerClass(player);
    player.call("Server:RequestLogin");
    player.position.x = 9000;
    player.position.y = 9000;
});
mp.events.add("playerQuit", function(player, exitType, reason) {
    console.log("disconnect")
    if (players[player.id]) {
        let player_id = player.id;
        console.log("Data Saving")
        players[player_id].save().then(function() {
            console.log("Data Saved")
            players[player_id].logout();
            players[player_id] = null;
            delete players[player_id];
        }).catch(function(err) {
            console.log("Data Error", err)
            players[player_id].logout();
            players[player_id] = null;
            delete players[player_id];
        })
    }
});
mp.events.add("ServerAccount:Login", function(player, username, password) {
    if (players[player.id]) {
        players[player.id].login(username, password)
    }
});
mp.events.add("ServerAccount:Register", function(player, username, hash_password, salt) {
    if (players[player.id]) {
        players[player.id].register(username, hash_password, salt)
    }
});
mp.events.add("Combat:FireWeapon", function(player, weapon, ammo) {
    if (players[player.id]) {
        players[player.id].fireWeapon(weapon, ammo)
    }
});
mp.events.add("Combat:HitEntity", function(player, entity, weapon, bone) {
    if ((entity) && (weapon)) {
        if (entity.type == "player") {
            if (players[player.id]) {
                if (players[entity.id]) {
                    players[entity.id].hit(players[player.id], weapon, bone)
                }
            }
        }
    }
});
mp.events.add("Combat:Kill", function(killer, victim, weapon) {
    console.error("Account:Kill", "Kill player", killer.name)
    console.error("Account:Kill", "Kill victim", victim.name)
    if ((players[killer.id]) && (players[victim.id])) {
        if (players[killer.id].team == players[victim.id].team) {
            players[killer.id].killed(victim, weapon, true);
        } else {
            players[killer.id].killed(victim, weapon, false);
        }
    }
});
mp.events.add("Combat:Killed", function(victim, killer, weapon) {
    console.error("Account:Error", "Killed by player")
});
mp.events.add("Combat:Rewards", function(damage_table) {
    mp.players.forEach(function(player) {
        if (players[player.id]) {
            if (damage_table[players[player.id].id]) {
                players[player.id].reward(damage_table[players[player.id].id])
            }
        }
    })
});
mp.events.add("Teams:Set", function(player, team, skin) {
    if (players[player.id]) {
        players[player.id].setTeam(team, skin)
    }
});
mp.events.add("WeaponShop:toggle", function(player, state) {
    if (players[player.id]) {
        if (players[player.id].loggedIn == true) {
            if (state == false) {
                let av_weapon = players[player.id].getAvailableWeapons().unlocked_weapons;
                av_weapon = av_weapon.map(function(weapon) {
                    return {
                        hash: "weapon_" + weapon,
                        name: Weapons.getName(weapon).fullname,
                        price: 1000
                    }
                })
                player.call("WeaponShop:show", [av_weapon]);
            } else {
                player.call("WeaponShop:show");
            }
        }
    }
});
mp.events.add("Player:Loaded", function(player) {
    let turfs = Gangwar.getTurfs();
    console.log("Player Loaded " + player.name)
    player.call("GangAreas:Create", [turfs]);
});
mp.events.add('playerChat', (player, message) => {
    if (players[player.id]) {
        let color = player.getVariable("team_rgb_color");
        color = "!{" + color[0] + ", " + color[1] + ", " + color[2] + ", 1}";
        mp.players.broadcast(`${color}${player.name}!{#FFF}: ${message}`);
    }
});
mp.events.add("Player:Crouch", (player) => {
    if (player.data.isCrouched === undefined) {
        player.data.isCrouched = true;
    } else {
        player.data.isCrouched = !player.data.isCrouched;
    }
});
mp.events.add("WeaponShop:Buy", function(player, weapon) {
    console.log("Buy Weapon", weapon)
    if (players[player.id]) {
        players[player.id].buy(weapon);
    }
});
mp.events.add("VehicleShop:Buy", function(player, vehicle) {
    if (players[player.id]) {
        players[player.id].buyVehicle(vehicle);
    }
});
mp.events.add("VehicleShop:Show", function(player, vehicle) {
    if (players[player.id]) {
        players[player.id].showVehicles();
    }
});
mp.events.add("LevelView:toggle", function(player, state) {
    if (players[player.id]) {
        if (players[player.id].loggedIn == true) {
            if (state == false) {
                let levels = players[player.id].getLevelData();
                console.log("level data", levels)
                player.call("LevelView:Show", [{
                    max: levels.nexp,
                    min: levels.level_base,
                    current: levels.exp,
                    level: levels.level
                }]);
            } else {
                player.call("LevelView:Show");
            }
        }
    }
});
mp.events.add("playerDeath", function(player, reason, killer) {
    player.data.isCrouched = false;
    reason = getDeathReason(reason);
    if (players[player.id]) {
        if (players[player.id].isDead() == 0) {
            if ((reason == "flatten") || (reason == "rotor")) {
                if ((players[player.id]) && (players[killer.id])) {
                    players[player.id].death(players[killer.id], killer.weapon, reason);
                } else {
                    players[player.id].death(false);
                }
            } else {
                players[player.id]._health = 0;
                players[player.id]._armor = 0
                if (killer == undefined) {
                    killer = player;
                }
                players[player.id].hit(players[killer.id], killer.weapon, undefined)
                this.cancel = true;
            }
        }
    }
});
mp.events.add("playerEnterColshape", function(player, shape) {
    if (players[player.id]) {
        let team = players[player.id].getTeam();
        if (team.isVehicleSphere(shape)) {
            players[player.id]._teamColshape = shape;
            player.setVariable("teamColshape", true);
            player.call("Notifications:New", [{
                title: "Gang Vehicles",
                titleSize: "16px",
                message: "Press 'E' to open the Vehicle Spawner",
                messageColor: 'rgba(0,0,0,.8)',
                position: "bottomCenter",
                close: false
            }])
            console.log(player.name, "entered veh spawn marker")
        }
    }
})
mp.events.add("playerExitColshape", function(player, shape) {
    if (players[player.id]) {
        if (players[player.id]._teamColshape == shape) {
            players[player.id]._teamColshape = null;
            player.setVariable("teamColshape", false);
        }
    }
})
mp.events.addCommand("steam", (player, f) => {
    if (players[player.id]) {
        players[player.id].askTeam()
    }
});
mp.events.addCommand("suicide", (player, f) => {
    if (players[player.id]) {
        players[player.id].death(false)
    }
});
mp.events.addCommand("kick", (player, f) => {
    player.kick("lol")
});
mp.events.addCommand("save", (player, f) => {
    if (players[player.id]) {
        players[player.id].save().then(function() {
            console.log("Data Saved")
        }).catch(function(err) {
            console.log("Data Error", err)
        })
    }
});
mp.events.addCommand("rt", (player, f) => {
    Gangwar.loadTurfs().then(function(turfs) {
        player.call("GangAreas:Create", [turfs]);
    })
});
mp.events.addCommand("pos", (player, f) => {
    let pos = player.position;
    player.outputChatBox(`${pos.x}, ${pos.y}, ${pos.z}`);
});
var fs = require("fs");
var saveFile = "savedpos.txt";
mp.events.addCommand("savepos", (player, name = "No name") => {
    let pos = (player.vehicle) ? player.vehicle.position : player.position;
    let rot = (player.vehicle) ? player.vehicle.rotation : player.heading;
    rot = (player.vehicle) ? `${rot.x}, ${rot.y}, ${rot.z}` : player.heading
    fs.appendFile(saveFile, `${pos.x}, ${pos.y}, ${pos.z}, ${rot}\r\n`, (err) => {
        if (err) {
            player.notify(`~r~SavePos Error: ~w~${err.message}`);
        } else {
            player.notify(`~g~Position saved. ~w~(${name})`);
        }
    });
});
// Whitelist
/*var whitelist = [];
whitelist["D8903A045BF42390639CC9E0E2BA87B0751831481AC087C818500A1C43C49B406BAC51A0D2425FB8ED383938CAC01F905810DA342B9413F073BCD960C2209240"] = true;
whitelist["D8903A045B1277887AAA8FC4D9B6B3B0EC8415882F0A6DA80CF018C8DD225D20519453D4478EFB88E3386674322AA110571808A056B6E9A8C91AAEFC194E1880"] = true;
whitelist["E3C485E0B5B25B08FCAE97042F30B2A0CB322FBC8A7A4898BB521B10DF563560281CBECC755E95506FB07BC4492E24101566912086DCCDB88D6E166418463FC0"] = true;
whitelist["D8903A045B8E3F00F3C279887E2EFFB075D057485D528AF018500A1C43C617007BFA81988EC697B8ED908F3835DA1AE05810DA342BFEEF00033289A89EB48A40"] = true;
mp.events.add('playerJoin', player => {
    console.log(`${player.name} ${player.serial}`)
    if (!whitelist[player.serial]) {
        player.kick("");
    }
});*/