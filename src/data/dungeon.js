import { ENEMIES } from './stages'

// ─────────────────────────────────────────────────────────────
// ดันเจี้ยน หอคอย 30 ชั้น
//
// ต่างจากด่านเนื้อเรื่องตรงที่ขึ้นได้ทีละชั้นตามลำดับเท่านั้น
// และผ่านชั้นใหม่ครั้งแรกได้อุปกรณ์แน่นอนหนึ่งชิ้น ไม่ใช่สุ่มว่าจะดรอปไหม
//
// เป็นแหล่งเดียวที่ได้อุปกรณ์สีอมตะ จึงเป็นเป้าหมายระยะยาวของคนที่ปั้นทีมมาสุดทาง
// ─────────────────────────────────────────────────────────────

export const FLOORS = 30
export const RUNS_PER_DAY = 5

/** ศัตรูประจำชั้น เลือกจากตารางมอนสเตอร์เดิม แล้วดันเลเวลตามความสูง */
const ROSTER = [
  ['ratling', 'skeleton', 'frostwolf'],
  ['sprite', 'mandrake', 'direboar'],
  ['scorpion', 'mummy', 'efreet'],
  ['lavahound', 'ashmage', 'rocdrake'],
  ['wraith', 'darkknight', 'sentinel'],
]

const GUARDS = ['golem', 'treant', 'sandwyrm', 'emberlord', 'voidking']

/** ระดับไอเทมของที่ดรอป ชั้นยิ่งสูงยิ่งได้ของระดับสูง */
export function ilvlForFloor(floor) {
  return Math.max(1, Math.min(5, Math.ceil(floor / 6)))
}

export function isGuardFloor(floor) {
  return floor % 5 === 0
}

/**
 * ประกอบชั้นหนึ่งขึ้นมาจากหมายเลขชั้น
 *
 * ไม่ได้เขียนศัตรูของทั้ง 30 ชั้นไว้ทีละชั้น เพราะจะกลายเป็นข้อมูลหลายร้อยบรรทัด
 * ที่ปรับสมดุลทีเดียวพร้อมกันไม่ได้ ใช้สูตรแทนแล้วปรับที่สูตรจุดเดียว
 */
export function floorStage(floor) {
  const band = Math.min(ROSTER.length - 1, Math.floor((floor - 1) / 6))
  const level = Math.max(1, Math.round(1 + (floor - 1) * 0.55))
  const guard = isGuardFloor(floor)

  const enemies = guard
    ? [
        { id: GUARDS[band], level: Math.max(1, Math.round(level * 0.5)) },
        { id: ROSTER[band][0], level },
      ]
    : ROSTER[band].map((id, i) => ({ id, level: Math.max(1, level - i) }))

  return {
    id: `d-${floor}`,
    dungeon: true,
    floor,
    name: `ชั้นที่ ${floor}${guard ? ' · ผู้เฝ้าชั้น' : ''}`,
    intro: guard
      ? 'ผู้เฝ้าชั้นยืนขวางบันไดขึ้นอยู่'
      : 'อีกชั้นหนึ่งของหอคอยที่ไม่มีใครรู้ว่าสูงแค่ไหน',
    exp: Math.round(200 + floor * 180),
    coins: Math.round(80 + floor * 45),
    enemies: enemies.filter((e) => ENEMIES[e.id]),
  }
}

export function floorList(cleared = 0) {
  const top = Math.min(FLOORS, cleared + 1)
  return Array.from({ length: top }, (_, i) => floorStage(i + 1))
}
