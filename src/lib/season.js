import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { RANKS, rankOf } from '../data/ranks'
import { seasonIndex, seasonMailId, seasonRewardFor, softReset } from '../data/season'

/**
 * ปิดฤดูกาลเก่าให้ผู้เล่นคนนี้ ถ้าฤดูกาลเปลี่ยนไปแล้ว
 *
 * ทำสองอย่างใน batch เดียว คือออกจดหมายรางวัลกับรีเซ็ตแต้ม
 * ถ้าแยกกันแล้วล้มกลางทาง ผู้เล่นอาจโดนรีเซ็ตแต้มโดยไม่ได้รางวัล
 *
 * คืน null ถ้ายังอยู่ฤดูกาลเดิม จึงเรียกซ้ำได้ปลอดภัย
 */
export async function closeSeasonIfNeeded(player) {
  const now = seasonIndex()
  const mine = player.seasonId ?? null

  // ผู้เล่นใหม่ แค่จดหมายเลขฤดูกาลไว้ ไม่ต้องแจกรางวัล
  if (mine === null) {
    await writeBatch(db)
      .update(doc(db, 'users', player.uid), {
        seasonId: now,
        seasonHighest: rankOf(player.pvpPoints ?? 0).index,
      })
      .commit()
    return null
  }

  if (mine >= now) return null

  const highest = player.seasonHighest ?? 0
  const reward = seasonRewardFor(highest)
  const reset = softReset(player.pvpPoints ?? 0)

  const batch = writeBatch(db)
  batch.set(doc(db, 'users', player.uid, 'mail', seasonMailId(mine)), {
    kind: 'season',
    title: `รางวัลปลายฤดูกาลที่ ${mine}`,
    body: `แรงค์สูงสุดที่ไปถึงคือ ${RANKS[highest].name}`,
    gems: reward.gems,
    pool: reward.pool,
    seasonId: mine,
    rankIndex: highest,
    claimed: false,
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', player.uid), {
    seasonId: now,
    seasonHighest: rankOf(reset).index,
    pvpPoints: reset,
  })
  await batch.commit()

  return { season: mine, reward, from: player.pvpPoints ?? 0, to: reset, highest }
}
