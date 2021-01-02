import { Role } from './types/enum'

function getRandomFreePos(startPos: RoomPosition, distance: number) {
  let x: number
  let y: number

  do {
    x = startPos.x + Math.floor(Math.random() * (distance * 2 + 1)) - distance
    y = startPos.y + Math.floor(Math.random() * (distance * 2 + 1)) - distance
  } while (
    (x + y) % 2 !== (startPos.x + startPos.y) % 2 ||
    Game.map.getRoomTerrain(startPos.roomName).get(x, y) === TERRAIN_MASK_WALL
  )
  return new RoomPosition(x, y, startPos.roomName)
}

function build(spawn: StructureSpawn, structureType: BuildableStructureConstant) {
  const structures = spawn.room.find(FIND_STRUCTURES, { filter: { structureType, my: true } })
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  for (let i = 0; i < CONTROLLER_STRUCTURES[structureType][spawn.room.controller!.level] - structures.length; i++) {
    getRandomFreePos(spawn.pos, 5).createConstructionSite(structureType)
  }
}

function calcBodyCost(body: BodyPartConstant[]): number {
  return _.reduce(body, (sum, part) => sum + BODYPART_COST[part], 0)
}

function run(spawn: StructureSpawn): void {
  build(spawn, STRUCTURE_EXTENSION)
  build(spawn, STRUCTURE_TOWER)

  let workerBody: BodyPartConstant[] = []
  const bodyIteration = [MOVE, MOVE, WORK, CARRY]
  const creepNum = Object.keys(Game.creeps).length
  while (
    calcBodyCost(workerBody) + calcBodyCost(bodyIteration) <=
      (creepNum > 5 ? spawn.room.energyCapacityAvailable : spawn.room.energyAvailable) &&
    workerBody.length + bodyIteration.length <= MAX_CREEP_SIZE
  ) {
    workerBody = workerBody.concat(bodyIteration)
    console.log(workerBody)
  }

  spawn.spawnCreep(workerBody, `u2`, { memory: { role: Role.Upgrader } })
  spawn.spawnCreep(workerBody, `h2`, { memory: { role: Role.Harvester } })
  spawn.spawnCreep(workerBody, `ma1`, { memory: { role: Role.Maintainer } })
  spawn.spawnCreep(workerBody, `ma2`, { memory: { role: Role.Maintainer } })
  spawn.spawnCreep(workerBody, `ma3`, { memory: { role: Role.Maintainer } })
  spawn.spawnCreep(workerBody, `u1`, { memory: { role: Role.Upgrader } })
  if (spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
    spawn.spawnCreep(workerBody, `b1`, { memory: { role: Role.Builder } })
  }
  spawn.spawnCreep(workerBody, `h1`, { memory: { role: Role.Harvester } })
}

export { run }
