import { PULL_COST, TEN_PULL_COST, saveRollResults } from './gacha'
import { SHARDS_PER_DUPE } from '../data/exchange'
import { URPLUS_RATES, urPlusBannerPool } from '../data/urplusbanner'
import { isURRetired } from './urgacha'

// ─────────────────────────────────────────────────────────────
// ตู้จักรพรรดิโคลโน — ฝั่งตรรกะการสุ่ม
//
// การันตีสองชั้นเหมือนตู้ธาตุ/ตู้เริ่มต้น (rollOne ใน lib/gacha.js) แต่ขยับระดับขึ้นไปที่ UR/UR+:
//   sinceUR     รีเซ็ตเมื่อได้ UR หรือ UR+ (ทั้งคู่ถือว่า "UR ขึ้นไป") ครบ 400 ครั้งการันตี UR ขึ้นไปแน่นอน
//   sinceURPlus รีเซ็ตเฉพาะเมื่อได้ UR+ ครบ 900 ครั้งการันตี UR+ แน่นอน
//
// ตัวละครระดับ UR แต่ละตัว "เก็บครบ" (ห้าดาว ดู isURRetired ใน lib/urgacha.js) แล้วจะไม่ออกซ้ำอีก
// เหมือนตู้ UR เดิม ถ้า UR ทั้งสามตัวเก็บครบพร้อมกัน ปล่อยให้สุ่มได้ตามปกติกันพูลว่าง
// กลไกนี้ใช้กับ UR เท่านั้น ไม่ใช้กับ UR+ เพราะมีตัวเดียว ถ้าตัดออกการันตี 900 จะไม่มีตัวให้ออก
// จำนวนครั้งที่ได้ UR แต่ละตัวเก็บที่ player.urPlusCopyCount (แยกจาก urCopyCount ของตู้ UR เดิม)
//
// ตัวซ้ำระดับ SR/SSR สะสมเศษวิญญาณกลาง (shardPool) แบบเดียวกับตู้อื่น เพราะแปดตัวนี้ไม่ได้ผูกขาด
// ยังแลกเปลี่ยนได้ตามปกติ ส่วนตัวซ้ำระดับ UR/UR+ ไม่มีกองกลางให้สะสม (แลกเปลี่ยนไม่ได้)
// จึงได้แค่ชิ้นส่วนของตัวเองไว้หลอมดาวเท่านั้น เหมือนตู้ UR เดิมทุกประการ
// ─────────────────────────────────────────────────────────────

export const URPLUS_HARD_PITY = 900 // ครบ 900 ครั้งได้ UR+ การันตีแน่นอน
export const URPLUS_UR_HARD_PITY = 400 // ครบ 400 ครั้งได้ UR ขึ้นไปแน่นอน

/** สุ่มทีเดียว 50 ครั้ง ราคาพิเศษ ถูกกว่าสุ่มทีละครั้งคูณห้าสิบอยู่ 500 เพชร (5,000 → 4,500) */
export const URPLUS_FIFTY_PULL_COST = 4500

/**
 * เงื่อนไขปลดล็อกตู้นี้ — ตู้ปลายเกม จึงล็อกไว้จนกว่าผู้เล่นจะไปถึงจุดที่กำหนด
 *   1. เคยไปถึงแรงค์แชมเปี้ยนขึ้นไป (RANKS[3] ใน data/ranks.js) อย่างน้อยหนึ่งครั้ง
 *   2. ผ่านด่าน 8-6 (แก่นคริสตัลนิรันดร์ บทที่ 8) มาแล้ว
 * ใช้ player.highestRank แทน rankOf(player.pvpPoints).index เพราะเป็นรางวัลถาวร
 * ตกแรงค์ไปแล้วไม่ควรถูกล็อกตู้คืน เหมือนกับที่ titlesFor/claimableRanks ใช้ฟิลด์เดียวกันนี้
 */
export const URPLUS_RANK_REQUIRED = 3
export const URPLUS_STAGE_REQUIRED = '8-6'

export function isURPlusUnlocked(player) {
  const rankOk = (player?.highestRank ?? 0) >= URPLUS_RANK_REQUIRED
  const stageOk = (player?.stageProgress?.[URPLUS_STAGE_REQUIRED] ?? 0) > 0
  return rankOk && stageOk
}

/** ส่งออกเฉพาะให้ทดสอบตรง ๆ ได้ (ไม่ยุ่ง Firestore) — pullURPlus() ด้านล่างคือทางที่ใช้จริง */
export function rollOneURPlus(pool, pity, copyCount = {}) {
  let rarity

  if (pity.sinceURPlus + 1 >= URPLUS_HARD_PITY) {
    rarity = 'UR+'
  } else if (pity.sinceUR + 1 >= URPLUS_UR_HARD_PITY) {
    const urPlusShare = URPLUS_RATES['UR+'] / (URPLUS_RATES['UR+'] + URPLUS_RATES.UR)
    rarity = Math.random() < urPlusShare ? 'UR+' : 'UR'
  } else {
    const r = Math.random()
    rarity =
      r < URPLUS_RATES['UR+']
        ? 'UR+'
        : r < URPLUS_RATES['UR+'] + URPLUS_RATES.UR
          ? 'UR'
          : r < URPLUS_RATES['UR+'] + URPLUS_RATES.UR + URPLUS_RATES.SSR
            ? 'SSR'
            : 'SR'
  }

  if (rarity === 'UR+') {
    pity.sinceURPlus = 0
    pity.sinceUR = 0
  } else if (rarity === 'UR') {
    pity.sinceUR = 0
    pity.sinceURPlus += 1
  } else {
    pity.sinceUR += 1
    pity.sinceURPlus += 1
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

function urPlusAddDupe(pool, rarity) {
  const gain = SHARDS_PER_DUPE[rarity]
  if (rarity === 'UR' || rarity === 'UR+') return gain
  pool[rarity] = (pool[rarity] ?? 0) + gain
  return gain
}

export async function pullURPlus(player, count) {
  if (!isURPlusUnlocked(player)) {
    throw new Error('ต้องอยู่แรงค์แชมเปี้ยนขึ้นไปและผ่านด่าน 8-6 ก่อนถึงจะสุ่มตู้นี้ได้')
  }

  const cost = count === 50 ? URPLUS_FIFTY_PULL_COST : count === 10 ? TEN_PULL_COST : PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  const pool = urPlusBannerPool()
  const pity = {
    sinceUR: player.urPlusPitySinceUR ?? 0,
    sinceURPlus: player.urPlusPitySinceURPlus ?? 0,
  }

  const copyCount = { ...(player.urPlusCopyCount ?? {}) }

  const results = []
  for (let i = 0; i < count; i++) {
    const r = rollOneURPlus(pool, pity, copyCount)
    results.push(r)
    if (r.rarity === 'UR') copyCount[r.id] = (copyCount[r.id] ?? 0) + 1
  }

  const summary = await saveRollResults(
    player,
    results,
    {
      gems: player.gems - cost,
      urPlusPitySinceUR: pity.sinceUR,
      urPlusPitySinceURPlus: pity.sinceURPlus,
      urPlusCopyCount: copyCount,
    },
    { addDupe: urPlusAddDupe }
  )

  return { summary, spent: cost }
}
