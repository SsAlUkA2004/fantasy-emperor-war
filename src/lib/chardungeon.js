import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { RUNS_PER_SLOT, dropRateFor, hourIndex } from '../data/chardungeon'
import { SHARDS_PER_DUPE, EMPTY_POOL } from '../data/exchange'
import { CHARACTERS } from '../data/characters'

/**
 * เหลือกี่ครั้งในด่านนั้นของชั่วโมงนี้
 *
 * เก็บเป็นก้อนเดียวคู่กับหมายเลขชั่วโมง พอข้ามชั่วโมงก็ถือว่าเริ่มนับใหม่ทั้งหมด
 * ไม่ต้องมีตัวนับแยกหกตัวและไม่ต้องคอยล้างค่าเก่า
 */
export function runsLeftFor(player, slotIndex, hour = hourIndex()) {
  const box = player?.charDun
  if (!box || box.hour !== hour) return RUNS_PER_SLOT
  return Math.max(0, RUNS_PER_SLOT - (box.counts?.[String(slotIndex)] ?? 0))
}

export function totalRunsLeft(player, slots, hour = hourIndex()) {
  return slots.reduce((sum, s) => sum + runsLeftFor(player, s.slot, hour), 0)
}

/**
 * บันทึกผลการลงด่านหาตัวละคร
 *
 * ตัวที่ยังไม่มีจะได้มาเป็นตัวใหม่ ตัวที่มีแล้วจะได้เศษวิญญาณแทน
 * เพราะถ้าได้ตัวซ้ำเฉย ๆ ผู้เล่นจะรู้สึกว่าเสียเวลาไปฟรี ๆ
 */
export async function runCharDungeon(player, stage, owned) {
  const hour = stage.hour
  const box = player.charDun
  const same = box?.hour === hour
  const counts = same ? { ...(box.counts ?? {}) } : {}
  const key = String(stage.slotIndex)
  const used = counts[key] ?? 0
  if (used >= RUNS_PER_SLOT) throw new Error('ครบโควตาของด่านนี้ในชั่วโมงนี้แล้ว')

  counts[key] = used + 1

  const hit = Math.random() < dropRateFor(stage.rarity)
  const has = owned.some((o) => o.id === stage.charId)
  const batch = writeBatch(db)
  const patch = { charDun: { hour, counts } }
  let got = null

  if (hit) {
    if (!has) {
      batch.set(doc(db, 'users', player.uid, 'collection', stage.charId), {
        level: 1,
        exp: 0,
        star: 1,
        shards: 0,
        skillLevel: 1,
        tier: 0,
        awaken: 0,
        obtainedAt: serverTimestamp(),
      })
      got = { isNew: true, charId: stage.charId }
    } else {
      const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
      const gain = SHARDS_PER_DUPE[stage.rarity]
      pool[stage.rarity] = (pool[stage.rarity] ?? 0) + gain
      patch.shardPool = pool
      got = { isNew: false, charId: stage.charId, shards: gain }
    }
  }

  batch.update(doc(db, 'users', player.uid), patch)
  await batch.commit()

  return { got, left: RUNS_PER_SLOT - counts[key], name: CHARACTERS[stage.charId]?.name }
}
