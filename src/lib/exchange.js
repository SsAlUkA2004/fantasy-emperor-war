import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { CHARACTERS, RARITIES } from '../data/characters'
import { EMPTY_POOL, EXCHANGE_COST } from '../data/exchange'

/**
 * แลกเศษวิญญาณเป็นตัวละครใหม่
 *
 * แลกได้เฉพาะตัวที่ยังไม่มี เพราะถ้าแลกตัวที่มีอยู่แล้วจะได้แค่ชิ้นส่วนคืน
 * ซึ่งเป็นการวนเปล่า ๆ ที่ทำให้ผู้เล่นเสียของโดยไม่ได้อะไร
 */
export async function exchangeFor(player, charId, owned) {
  const c = CHARACTERS[charId]
  if (!c) throw new Error('ไม่พบตัวละครนี้')
  if (owned.some((o) => o.id === charId)) throw new Error('มีตัวนี้อยู่แล้ว')

  const rarity = c.rarity
  const cost = EXCHANGE_COST[rarity]
  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  if ((pool[rarity] ?? 0) < cost) throw new Error('เศษวิญญาณไม่พอ')

  pool[rarity] -= cost

  const batch = writeBatch(db)
  batch.set(doc(db, 'users', player.uid, 'collection', charId), {
    level: 1,
    exp: 0,
    star: 1,
    shards: 0,
    skillLevel: 1,
    tier: 0,
    awaken: 0,
    obtainedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', player.uid), { shardPool: pool })
  await batch.commit()

  return { charId, rarity, cost, pool }
}

/** ตัวที่ยังไม่มี แยกตามระดับหายาก */
export function missingByRarity(owned) {
  const have = new Set(owned.map((o) => o.id))
  return RARITIES.reduce((acc, r) => {
    acc[r] = Object.values(CHARACTERS)
      .filter((c) => c.rarity === r && !have.has(c.id))
      .map((c) => c.id)
    return acc
  }, {})
}
