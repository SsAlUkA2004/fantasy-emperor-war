import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { rewardFor } from '../data/ranks'
import { EMPTY_POOL } from '../data/exchange'

/**
 * กดรับรางวัลแรงค์ทีละหนึ่งขั้น
 *
 * ใช้รูปแบบเดียวกับการแลกโค้ด คือจดไว้ว่ารับขั้นไหนไปแล้วในเอกสารของผู้เล่นเอง
 * กฎจึงตรวจได้ว่ารายการที่รับต้องยาวขึ้นทีละหนึ่ง และขั้นที่รับต้องไม่เคยอยู่ในรายการ
 * กับต้องไม่เกินแรงค์สูงสุดที่เคยไปถึง ผู้เล่นจึงกดรับซ้ำหรือกดข้ามขั้นไม่ได้
 */
export async function claimRankReward(player, rankIndex) {
  const reward = rewardFor(rankIndex)
  if (!reward) throw new Error('แรงค์นี้ไม่มีรางวัล')

  const claimed = player.claimedRanks ?? []
  if (claimed.includes(rankIndex)) throw new Error('รับรางวัลขั้นนี้ไปแล้ว')
  if (rankIndex > (player.highestRank ?? 0)) throw new Error('ยังไปไม่ถึงแรงค์นี้')

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  Object.entries(reward.pool).forEach(([r, n]) => {
    pool[r] = (pool[r] ?? 0) + n
  })

  await updateDoc(doc(db, 'users', player.uid), {
    gems: player.gems + reward.gems,
    shardPool: pool,
    claimedRanks: [...claimed, rankIndex],
    lastClaimedRank: rankIndex,
  })

  return reward
}
