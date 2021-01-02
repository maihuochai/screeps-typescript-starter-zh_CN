import { roleBuilder } from './builder'
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
export default {
  run(creep: Creep): void {
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure: AnyStructure) => {
        return (
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN ||
            structure.structureType === STRUCTURE_TOWER) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        )
      }
    })
    if (targets.length > 0) {
      if (creep.store.getFreeCapacity() > 0) {
        const sources = creep.room.find(FIND_SOURCES)
        const source = sources.length > 1 ? sources[1] : sources[0]
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } })
        }
      } else {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } })
        }
      }
    } else {
      roleBuilder.run(creep)
    }
  }
}
