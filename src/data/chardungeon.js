import { BY_RARITY, CHARACTERS } from './characters'

// ─────────────────────────────────────────────────────────────
// ดันเจี้ยนหาตัวละคร
//
// หกด่านต่อรอบ แต่ละด่านมีตัวละครหนึ่งตัวเป็นบอส ชนะแล้วมีโอกาสได้ตัวนั้น
// รอบเปลี่ยนทุกชั่วโมง และผู้เล่นดูตารางล่วงหน้าได้สามชั่วโมง
//
// การสุ่มว่าชั่วโมงไหนมีใครไม่ได้เก็บไว้ที่ไหนเลย
// แต่คำนวณจากหมายเลขชั่วโมงด้วยสูตรเดิมทุกครั้ง ทุกคนจึงเห็นตารางตรงกันเสมอ
// โดยไม่ต้องมีเซิร์ฟเวอร์คอยสุ่มและประกาศ และดูล่วงหน้าได้ไกลเท่าไหร่ก็ได้
// ─────────────────────────────────────────────────────────────

const HOUR_MS = 60 * 60 * 1000

export const SLOTS_PER_ROUND = { R: 3, SR: 2, SSR: 1 }
export const RUNS_PER_SLOT = 5

export const DROP_RATE = { R: 0.6, SR: 0.1, SSR: 0.01 }

/** ตัวคูณเลือดของบอส ชดเชยที่เป็นตัวเดียวสู้กับทีมห้าคน */
export const HP_SCALE = { R: 5, SR: 9, SSR: 16 }

export function hourIndex(date = new Date()) {
  return Math.floor(date.getTime() / HOUR_MS)
}

export function hourStartsAt(hour) {
  return new Date(hour * HOUR_MS)
}

export function minutesLeft(hour = hourIndex()) {
  return Math.max(0, Math.ceil((hourStartsAt(hour + 1).getTime() - Date.now()) / 60000))
}

/**
 * ตัวสุ่มที่ให้ผลเดิมทุกครั้งเมื่อป้อนเลขเดิม
 * ใช้แทนการสุ่มจริง เพื่อให้ทุกเครื่องคำนวณตารางออกมาตรงกัน
 */
function seeded(n) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

function pickFrom(list, seed) {
  return list[Math.floor(seeded(seed) * list.length) % list.length]
}

/** ตัวละครหกตัวของชั่วโมงนั้น เรียงตามระดับหายาก */
export function roundFor(hour = hourIndex()) {
  const slots = []
  let seed = hour * 977

  Object.entries(SLOTS_PER_ROUND).forEach(([rarity, count]) => {
    const pool = BY_RARITY[rarity]
    const used = new Set()
    for (let i = 0; i < count; i++) {
      let id = pickFrom(pool, seed++)
      let guard = 0
      while (used.has(id) && guard++ < pool.length) id = pickFrom(pool, seed++)
      used.add(id)
      slots.push({ slot: slots.length, rarity, charId: id, char: CHARACTERS[id] })
    }
  })

  return { hour, slots }
}

/** ตารางล่วงหน้า ใช้วางแผนว่าจะเข้ามาเล่นตอนไหน */
export function schedule(hours = 3, from = hourIndex()) {
  return Array.from({ length: hours + 1 }, (_, i) => roundFor(from + i))
}

/** ศัตรูของด่าน คือตัวละครตัวนั้นเอง ยิ่งหายากยิ่งแข็ง */
export function slotStage(entry, hour) {
  const level = entry.rarity === 'SSR' ? 70 : entry.rarity === 'SR' ? 45 : 25
  const star = entry.rarity === 'SSR' ? 4 : entry.rarity === 'SR' ? 3 : 2

  return {
    id: `c-${hour}-${entry.slot}`,
    charDungeon: true,
    hour,
    slotIndex: entry.slot,
    charId: entry.charId,
    rarity: entry.rarity,
    name: `รอยอดีตของ${entry.char.name}`,
    intro: `เงาของ${entry.char.name}ยืนรออยู่ตรงนั้น และมันสู้เหมือนตัวจริงทุกอย่าง`,
    exp: 0,
    // คูณเลือดเพราะเป็นตัวเดียวสู้กับทีมห้าคน ยิ่งหายากยิ่งอึด
    enemies: [{ id: `hero:${entry.charId}`, level, star, hpScale: HP_SCALE[entry.rarity] }],
  }
}

export function dropRateFor(rarity) {
  return DROP_RATE[rarity] ?? 0
}
