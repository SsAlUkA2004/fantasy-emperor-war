import { PULL_COST, TEN_PULL_COST, saveRollResults } from './gacha'
import { SHARDS_PER_DUPE } from '../data/exchange'
import { UR_RATES, urBannerPool } from '../data/urbanner'

// ─────────────────────────────────────────────────────────────
// ตู้ UR — ฝั่งตรรกะการสุ่ม
//
// ต่างจากตู้อื่นตรงที่ "ไม่มีการันตีเลย" ตามที่ตั้งใจไว้ ไม่มีตัวนับ pity ใด ๆ
// สุ่มอิสระทุกครั้งตามอัตราตรง ๆ (SR 80% · SSR 19.95% · UR 0.05%)
// จึงไม่ผ่าน rollAndSave() ของตู้ปกติ (ซึ่งผูกกับตัวนับการันตีเสมอ) แต่เรียก
// saveRollResults() ตรง ๆ แทน — ฟังก์ชันเดียวกับที่ตู้อื่นใช้บันทึกผลลง Firestore
//
// ตัวซ้ำระดับ SR/SSR สะสมเศษวิญญาณกลาง (shardPool) แบบเดียวกับตู้เริ่มต้น/ตู้ทัพหน้า
// เพราะแปดตัวนี้ไม่ได้ผูกขาด ยังแลกเปลี่ยนได้ตามปกติ ส่วนตัวซ้ำระดับ UR ไม่มีกองกลางให้สะสม
// (ไม่มีที่ให้ใช้จ่าย เพราะ UR แลกเปลี่ยนไม่ได้) จึงได้แค่ชิ้นส่วนของตัวเองไว้หลอมดาวเท่านั้น
// ─────────────────────────────────────────────────────────────

function rollOneUR(pool) {
  const r = Math.random()
  const rarity = r < UR_RATES.UR ? 'UR' : r < UR_RATES.UR + UR_RATES.SSR ? 'SSR' : 'SR'
  const list = pool[rarity] ?? []
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
  const results = []
  for (let i = 0; i < count; i++) results.push(rollOneUR(pool))

  const summary = await saveRollResults(player, results, { gems: player.gems - cost }, { addDupe: urAddDupe })

  return { summary, spent: cost }
}
