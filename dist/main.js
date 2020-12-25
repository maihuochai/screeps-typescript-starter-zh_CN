'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getRandomFreePos(startPos, distance) {
    let x;
    let y;
    do {
        x = startPos.x + Math.floor(Math.random() * (distance * 2 + 1)) - distance;
        y = startPos.y + Math.floor(Math.random() * (distance * 2 + 1)) - distance;
    } while ((x + y) % 2 !== (startPos.x + startPos.y) % 2 ||
        Game.map.getRoomTerrain(startPos.roomName).get(x, y) === TERRAIN_MASK_WALL);
    return new RoomPosition(x, y, startPos.roomName);
}
function build(spawn, structureType) {
    const structures = spawn.room.find(FIND_STRUCTURES, { filter: { structureType, my: true } });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (let i = 0; i < CONTROLLER_STRUCTURES[structureType][spawn.room.controller.level] - structures.length; i++) {
        getRandomFreePos(spawn.pos, 5).createConstructionSite(structureType);
    }
}
function calcBodyCost(body) {
    return _.reduce(body, (sum, part) => sum + BODYPART_COST[part], 0);
}
function run(spawn) {
    build(spawn, STRUCTURE_EXTENSION);
    build(spawn, STRUCTURE_TOWER);
    let workerBody = [];
    const bodyIteration = [MOVE, MOVE, WORK, CARRY];
    while (calcBodyCost(workerBody) + calcBodyCost(bodyIteration) <= Game.spawns.Spawn1.room.energyAvailable &&
        workerBody.length + bodyIteration.length <= MAX_CREEP_SIZE) {
        workerBody = workerBody.concat(bodyIteration);
    }
    spawn.spawnCreep(workerBody, `u1`, { memory: { role: "upgrader" } });
    spawn.spawnCreep(workerBody, `u2`, { memory: { role: "upgrader" } });
    if (spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
        spawn.spawnCreep(workerBody, `b1`, { memory: { role: "builder" } });
    }
    spawn.spawnCreep(workerBody, `h1`, { memory: { role: "harvester" } });
    spawn.spawnCreep(workerBody, `h2`, { memory: { role: "harvester" } });
}

function run$1(tower) {
    const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure => structure.hits < structure.hitsMax
    });
    if (closestDamagedStructure) {
        tower.repair(closestDamagedStructure);
    }
    const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
        tower.attack(closestHostile);
    }
}

/**
 * 建筑工。
 *
 * 当把 creep 的 `role` 设置为 `"builder"` 时，creep 在每个 tick 会执行 `roleBuilder.run` 代码。
 *
 * ```ts
 * Game.creeps['name'].memory.role = 'builder';
 * ```
 *
 * creep 会找到建造点 (construction site) 并进行建造。当 creep 在携带的能量（energy）变为 0 时去采集能量，并在采集到足够能量之后回到建造场地。
 */
const roleBuilder = {
    run(creep) {
        // 如果当前 creep 正在建造但是没有能量了，则让此 creep 去采集能量
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say("🔄 采集");
        }
        // 如果当前 creep 不处于建造模式，并且能量已经存满，则让此 creep 去建造
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say("🚧 建造");
        }
        if (creep.memory.building) {
            // 在 creep 所在房间中找到所有的建筑工地
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
                }
            }
        }
        else {
            const sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
            }
        }
    }
};

/**
 * 采集者。
 *
 * 当把 creep 的 `role` 设置为 `"harvester"` 时，creep 在每个 tick 会执行 `roleHarvester.run` 代码。
 *
 * ```ts
 * Game.creeps['name'].memory.role = 'harvester';
 * ```
 *
 * creep 会移动到能量点（source）并采集能量。creep 携带能量达到上限时，让它返回出生点（spawn）。
 */
const roleHarvester = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            const sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
            }
        }
        else {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
                }
            }
        }
    }
};

/**
 * 升级者。
 *
 * 当把 creep 的 `role` 设置为 `"upgrader"` 时，creep 在每个 tick 会执行 `roleUpgrader.run` 代码。
 *
 * ```ts
 * Game.creeps['name'].memory.role = 'upgrader';
 * ```
 *
 * creep 会找到控制器 (room controller) 并进行升级。当 creep 在携带的能量（energy）变为 0 时去采集能量，并在采集到足够能量之后回到控制器附近继续升级。
 */
const roleUpgrader = {
    run(creep) {
        // 如果当前 creep 正在升级但是没有能量了，则让此 creep 去采集能量
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say("🔄 采集");
        }
        // 如果当前 creep 不处于升级模式，并且能量已经存满，则让此 creep 去升级
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            creep.say("⚡ 升级");
        }
        if (creep.memory.upgrading) {
            if (creep.room.controller == null) {
                console.log("房间 %s 中没有控制器", creep.room.name);
            }
            else if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
        else {
            const sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
            }
        }
    }
};

const loop = function () {
    run(Game.spawns.Spawn1);
    const towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER, my: true }
    });
    towers.forEach(run$1);
    // 根据 screep 的角色分配不同的任务
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === "harvester") {
            roleHarvester.run(creep);
        }
        if (creep.memory.role === "upgrader") {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role === "builder") {
            roleBuilder.run(creep);
        }
    }
    // 删除 Memory 中已经死亡的 creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    }
};

exports.loop = loop;
