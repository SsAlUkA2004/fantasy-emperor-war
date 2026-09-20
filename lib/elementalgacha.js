import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { invalidateRoster } from './rostercache'
import { todayKey } from './dayclock'
import { PULL_COST, TEN_PULL_COST, DAILY_DISCOUNT, rollAndSave } from './gacha'
import { SHARDS_PER_DUPE } from '../data/exchange'
import { CHARACTERS } from '../data/characters'
import {
  ELEMENTAL_IDS,
  EMPTY_ELEM_POOL,
  activeElement,
  elementalHourIndex,
  elementalPool,
} from '../data/elemental'

// ─────────────────────────────────────────────────────────────
// ตู้กาชาธาตุหมุนเวียน — ฝั่งตรรกะการสุ่มและแลกเปลี่ยน
//
// ใช้เครื่องยนต์เดียวกับตู้ปกติ (rollAndSave ใน lib/gacha.js) แต่แยกตัวนับการันตี
// และวันที่ใช้ส่วนลดเป็นคนละชุด ไม่ให้ไปปนกับสองตู้เดิม เพราะเป็นระบบสะสมคนละสาย
// ราคาสุ่มใช้ตัวเลขเดียวกับตู้ปกติ (ไม่ได้ตั้งเป็นเศรษฐกิจใหม่แยกต่างหาก)
//
// ตัวซ้ำให้ "ชิ้นส่วนธาตุ" (elemShardPool ซ้อนด้วยธาตุ) แทนเศษวิญญาณกลาง (shardPool)
// ของตู้เดิม ใช้แลกได้แค่ตัวละครธาตุเดียวกันเท่านั้น ไม่ปนข้ามธาตุและไม่ปนกับตู้เดิม
// ─────────────────────────────────────────────────────────────

export const ELEM_PITY_FIELDS = { sr: 'elemPitySR', ssr: 'elemPitySSR' }

function addElementalDupe(pool, rarity, id) {
  const element = CHARACTERS[id].element
  pool[element] = { ...(pool[element] ?? { R: 0, SR: 0, SSR: 0 }) }
  const gain = SHARDS_PER_DUPE[rarity]
  pool[element][rarity] = (pool[element][rarity] ?? 0) + gain
  return gain
}

export function elementalDiscountAvailable(player) {
  return (player?.elemGachaDiscountDay ?? null) !== todayKey()
}

export function elementalDiscountedPullCost() {
  return Math.round(PULL_COST * DAILY_DISCOUNT)
}

/**
 * สุ่มจากตู้ธาตุที่เปิดอยู่ตอนนี้
 *
 * ล็อกกองตัวละครด้วยหมายเลขชั่วโมง ณ ตอนกดสุ่มจริง (ไม่ใช่ตอนโหลดหน้า)
 * กันปัญหาคนเปิดหน้าค้างไว้ข้ามชั่วโมงแล้วกดสุ่มแต่ยังเห็นธาตุเดิม
 */
export async function pullElemental(player, count) {
  const hour = elementalHourIndex()
  const element = activeElement(hour)
  const pool = elementalPool(element)

  const useDiscount = count === 1 && elementalDiscountAvailable(player)
  const cost = count === 10 ? TEN_PULL_COST : useDiscount ? elementalDiscountedPullCost() : PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  const extraPatch = {
    gems: player.gems - cost,
    ...(useDiscount ? { elemGachaDiscountDay: todayKey() } : {}),
  }

  const { summary, pity } = await rollAndSave(player, count, pool, ELEM_PITY_FIELDS, extraPatch, {
    poolField: 'elemShardPool',
    emptyPool: EMPTY_ELEM_POOL,
    addDupe: addElementalDupe,
  })

  return { summary, spent: cost, pity, element, hour, discounted: useDiscount }
}

/**
 * แลกชิ้นส่วนธาตุเป็นตัวละครธาตุนั้นที่ยังไม่มี
 *
 * ต่างจากหอแลกเปลี่ยนเดิมตรงที่ไม่มีรอบหมุนเวียนสี่ชั่วโมง แลกตัวไหนก็ได้ในธาตุนั้นทันที
 * เพราะชิ้นส่วนธาตุเป็นเศรษฐกิจปิดเฉพาะของตู้นี้อยู่แล้ว ไม่ต้องจำกัดรอบซ้อนอีกชั้น
 */
export async function exchangeElemental(player, charId, owned) {
  const c = CHARACTERS[charId]
  if (!c) throw new Error('ไม่พบตัวละครนี้')
  if (!ELEMENTAL_IDS[c.element]?.includes(charId)) {
    throw new Error('ตัวละครนี้ไม่ได้อยู่ในตู้ธาตุ')
  }

  const rarity = c.rarity
  const cost = SHARDS_PER_DUPE[rarity] * 3
  const pool = { ...EMPTY_ELEM_POOL, ...(player.elemShardPool ?? {}) }
  const elemPool = { ...(pool[c.element] ?? { R: 0, SR: 0, SSR: 0 }) }
  if ((elemPool[rarity] ?? 0) < cost) throw new Error('ชิ้นส่วนธาตุไม่พอ')

  elemPool[rarity] -= cost
  pool[c.element] = elemPool

  const existing = owned.find((o) => o.id === charId)
  const batch = writeBatch(db)

  if (existing) {
    const gain = SHARDS_PER_DUPE[rarity]
    batch.update(doc(db, 'users', player.uid, 'collection', charId), {
      shards: (existing.shards ?? 0) + gain,
    })
    batch.update(doc(db, 'users', player.uid), { elemShardPool: pool })
    await batch.commit()
    invalidateRoster()
    return { charId, rarity, cost, pool, dupe: true, shardsGained: gain }
  }

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
  batch.update(doc(db, 'users', player.uid), { elemShardPool: pool })
  await batch.commit()
  invalidateRoster()

  return { charId, rarity, cost, pool, dupe: false }
}
