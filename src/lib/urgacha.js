import { PULL_COST, TEN_PULL_COST, saveRollResults } from './gacha'
import { SHARDS_PER_DUPE } from '../data/exchange'
import { MAX_STAR } from './leveling'
import { UR_RATES, urBannerPool } from '../data/urbanner'

// ─────────────────────────────────────────────────────────────
// ตู้ UR — ฝั่งตรรกะการสุ่ม
//
// มีการันตีสองชั้น ต่างจากตอนแรกที่ตั้งใจไม่ให้มีเลย:
//   1. การันตีรวม — สุ่มครบ 500 ครั้งโดยไม่เคยได้ UR เลยสักตัว ครั้งที่ 500 การันตี UR แน่นอน
//      (นับรวมทุกครั้งที่สุ่ม ไม่แยกตามตัวละคร รีเซ็ตทุกครั้งที่ได้ UR ไม่ว่าตัวไหน)
//   2. ตัวละคร UR แต่ละตัว "เก็บครบ" แล้วจะไม่ออกอีก — เก็บครบหมายถึงมีชิ้นส่วนพอหลอมเต็ม
//      5 ดาวแล้ว (ตัวซ้ำหนึ่งตัวเท่ากับหนึ่งดาวพอดี ดู lib/gacha.js starCostFor เดิม 4 ตัวซ้ำ
//      พอครบ 5 ดาว) หรือซ้ำถึง 6 ครั้งเป็นเพดานสำรองเผื่อกรณีอื่น กันไม่ให้ผู้เล่นสุ่มได้ตัวเดิม
//      ซ้ำเรื่อย ๆ ไม่รู้จบทั้งที่ปั้นสุดแล้ว ถ้าทุกตัวเก็บครบหมดพร้อมกัน ปล่อยให้สุ่มได้ตามปกติ
//      อีกครั้งกันพูล UR ว่างเปล่า
//
// ตัวซ้ำระดับ SR/SSR สะสมเศษวิญญาณกลาง (shardPool) แบบเดียวกับตู้เริ่มต้น/ตู้ทัพหน้า
// เพราะแปดตัวนี้ไม่ได้ผูกขาด ยังแลกเปลี่ยนได้ตามปกติ ส่วนตัวซ้ำระดับ UR ไม่มีกองกลางให้สะสม
// (ไม่มีที่ให้ใช้จ่าย เพราะ UR แลกเปลี่ยนไม่ได้) จึงได้แค่ชิ้นส่วนของตัวเองไว้หลอมดาวเท่านั้น
// ─────────────────────────────────────────────────────────────

export const UR_HARD_PITY = 500
export const UR_RETIRE_AT_DUPES = MAX_STAR - 1 // ซ้ำสี่ตัวพอดีหลอมได้ห้าดาว (เท่ากับ starCostFor รวม)
export const UR_RETIRE_HARD_CAP = 6

/** ตัวละคร UR ตัวนี้ "เก็บครบ" แล้วหรือยัง นับจากจำนวนครั้งที่เคยสุ่มได้ตัวนี้ (รวมครั้งแรกที่ได้) */
export function isURRetired(copyCount = 0) {
  const dupes = Math.max(0, copyCount - 1)
  return dupes >= UR_RETIRE_AT_DUPES || dupes >= UR_RETIRE_HARD_CAP
}

/** ส่งออกเฉพาะให้ทดสอบตรง ๆ ได้ (ไม่ยุ่ง Firestore) — pullUR() ด้านล่างคือทางที่ใช้จริง */
export function rollOneUR(pool, pity, copyCount) {
  let rarity

  if (pity.sinceUR + 1 >= UR_HARD_PITY) {
    rarity = 'UR'
  } else {
    const r = Math.random()
    rarity = r < UR_RATES.UR ? 'UR' : r < UR_RATES.UR + UR_RATES.SSR ? 'SSR' : 'SR'
  }

  if (rarity === 'UR') {
    pity.sinceUR = 0
  } else {
    pity.sinceUR += 1
  }

  let list = pool[rarity] ?? []
  if (rarity === 'UR') {
    const eligible = list.filter((id) => !isURRetired(copyCount[id] ?? 0))
    // เก็บครบทุกตัวพร้อมกันแล้ว ไม่มีตัวไหนให้เลี่ยงอีก ปล่อยสุ่มได้ตามปกติกันพูลว่าง
    if (eligible.length) list = eligible
  }

  const id = list[Math.floor(Math.random() * list.length)]
  return { id, rarity }
}

function urAddDupe(pool, rarity) {
  const gain = SHARDS_PER_DUPE[rarity]
  if (rarity === 'UR') return gain
  pool[rarity] = (pool[rarity] ?? 0) + gain
  return gain
}

export async function pullUR(player, count) {
  const cost = count === 10 ? TEN_PULL_COST : PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  const pool = urBannerPool()
  const pity = { sinceUR: player.urPitySinceUR ?? 0 }
  const copyCount = { ...(player.urCopyCount ?? {}) }

  const results = []
  for (let i = 0; i < count; i++) {
    const r = rollOneUR(pool, pity, copyCount)
    results.push(r)
    copyCount[r.id] = (copyCount[r.id] ?? 0) + 1
  }

  const summary = await saveRollResults(
    player,
    results,
    { gems: player.gems - cost, urPitySinceUR: pity.sinceUR, urCopyCount: copyCount },
    { addDupe: urAddDupe }
  )

  return { summary, spent: cost }
}
