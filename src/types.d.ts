/// <reference types="@screepscn/types" />


interface CreepMemory {
  /** creep 的角色 */
  role?: string;
  room?: string;
  /** 是否正在建造 */
  building?: boolean;
  /** 是否正在升级 */
  upgrading?: boolean;
  /** 是否正在升级 */
  maintain?: boolean;
}

interface Memory {
  uuid: number;
  log: any;
}

// 扩展全局对象
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
