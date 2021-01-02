import * as building from 'building'
import * as tower from 'tower'

import { roleBuilder } from 'role/builder'
import Harvester from 'role/harvester'
import { roleUpgrader } from 'role/upgrader'
import maintainer from 'role/maintainer'
import { Role } from './types/enum'

export const loop = function (): void {
  building.run(Game.spawns.Spawn1)

  const towers = Game.spawns.Spawn1.room.find<StructureTower>(FIND_STRUCTURES, {
    filter: { structureType: STRUCTURE_TOWER, my: true }
  })
  towers.forEach(tower.run)

  // 根据 screep 的角色分配不同的任务
  for (const name in Game.creeps) {
    const creep = Game.creeps[name]
    if (creep.memory.role === Role.Harvester) {
      Harvester.run(creep)
    }
    if (creep.memory.role === Role.Upgrader) {
      roleUpgrader.run(creep)
    }
    if (creep.memory.role === Role.Builder) {
      roleBuilder.run(creep)
    }
    if (creep.memory.role === Role.Maintainer) {
      maintainer.run(creep)
    }
    if (creep.memory.role === Role.Guard) {
      roleUpgrader.run(creep)
      const hostility = Game.spawns.Spawn1.pos.findInRange(FIND_HOSTILE_CREEPS, 20000)
      if (hostility && hostility.length > 0) {
        creep.attack(hostility[0])
      }
    }
  }

  // 删除 Memory 中已经死亡的 creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name]
      console.log('Clearing non-existing creep memory:', name)
    }
  }
}
