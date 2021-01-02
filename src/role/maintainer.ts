import harvester from './harvester'

export default {
  run(creep: Creep) {
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure: AnyStructure) => {
        if (structure.structureType === STRUCTURE_WALL) {
          return structure.hits < 3000000
        }
        return (
          (structure.structureType === STRUCTURE_ROAD ||
            structure.structureType === STRUCTURE_CONTAINER ||
            structure.structureType === STRUCTURE_RAMPART) &&
          structure.hits < structure.hitsMax
        )
      }
    })
    if (targets.length > 0) {
      // 如果当前 creep 正在建造但是没有能量了，则让此 creep 去采集能量
      if (creep.memory.maintain && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.maintain = false
        creep.say('🔄 采集')
      }

      // 如果当前 creep 不处于建造模式，并且能量已经存满，则让此 creep 去建造
      if (!creep.memory.maintain && creep.store.getFreeCapacity() === 0) {
        creep.memory.maintain = true
        creep.say('🚧 维护')
      }

      if (creep.memory.maintain) {
        if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ce1616' } })
        }
      } else {
        const sources = creep.room.find(FIND_SOURCES)
        if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } })
        }
      }
    } else {
      harvester.run(creep)
    }
  }
}
