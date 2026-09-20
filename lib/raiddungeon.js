import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { RUNS_PER_BOSS, hourIndex, raidTier, furthestChapter, ilvlForChapter } from '../data/raiddungeon'
import { addDrop } from './gear'

/**
 * เหลือกี่ครั้งของบอสตัวนี้ในชั่วโมงนี้
 *
 * เก็บเป็นก้อนเดียวคู่กับหมายเลขชั่วโมง คู่กับ vaultRun ในเอกสารผู้เล่น (ดู runRaidBoss ด้านล่าง)
 * พอข้ามชั่วโมงถือว่าเริ่มนับใหม่ทั้งหมด ไม่ต้องมีตัวนับแยกเก้าตัวและไม่ต้องคอยล้างค่าเก่า
 */
export function runsLeftFor(player, bossId, hour = hourIndex()) {
  const box = player?.vaultRun
  if (!box || box.hour !== hour) return RUNS_PER_BOSS
  return Math.max(0, RUNS_PER_BOSS - (box.counts?.[bossId] ?? 0))
}

export function totalRunsLeftForTier(player, tier, hour = hourIndex()) {
  return tier.bosses.reduce((sum, id) => sum + runsLeftFor(player, id, hour), 0)
}

/**
 * บันทึกผลการโค่นบอสดันเจี้ยนเหรด
 *
 * ระดับไอเทมของที่ดรอปยึดตามบทไกลสุดที่ผ่านมาแล้ว (เหมือนของดรอปในด่านเนื้อเรื่อง/ดันเจี้ยนหอคอย)
 * ระดับความยากของดันเจี้ยนนี้คุมแค่ช่วงสีที่ดรอปได้ (ดู RAID_TIERS.source กับ SOURCE_RANGE ใน data/gear.js)
 * ของได้แน่นอนทุกครั้งที่ชนะ ไม่สุ่มว่าจะดรอปไหม เพราะกิจกรรมนี้ถูกจำกัดด้วยโควตาต่อชั่วโมงอยู่แล้ว
 */
export async function runRaidBoss(player, stage) {
  const hour = hourIndex()
  const box = player.vaultRun
  const same = box?.hour === hour
  const counts = same ? { ...(box.counts ?? {}) } : {}
  const used = counts[stage.bossId] ?? 0
  if (used >= RUNS_PER_BOSS) throw new Error('ครบโควตาของบอสตัวนี้ในชั่วโมงนี้แล้ว')
  counts[stage.bossId] = used + 1

  const tier = raidTier(stage.tierId)
  const ilvl = ilvlForChapter(furthestChapter(player.stageProgress))
  const drop = await addDrop(player.uid, tier.source, ilvl).catch(() => null)
  const coins = (player.coins ?? 0) + (stage.coins ?? 0)

  await updateDoc(doc(db, 'users', player.uid), { vaultRun: { hour, counts }, coins })

  return { drop, coins: stage.coins ?? 0, raidLeft: RUNS_PER_BOSS - counts[stage.bossId] }
}
