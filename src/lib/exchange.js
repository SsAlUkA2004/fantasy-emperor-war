import { invalidateRoster } from './rostercache'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { CHARACTERS, RARITIES, BY_RARITY } from '../data/characters'
import { EMPTY_POOL, EXCHANGE_COST, SHARDS_PER_DUPE } from '../data/exchange'

/**
 * รอบหอแลกเปลี่ยน รีทุก 4 ชั่วโมง
 *
 * แบ่งเป็นช่องตายตัวต่อรอบ: SSR 3 ตัว, SR 5 ตัว, R 5 ตัว
 * R มีแค่ 5 ตัวทั้งเกมพอดี เลยใส่มาครบทุกตัวเสมอโดยไม่ต้องสุ่ม
 * มีแต่ SSR (จากทั้งหมด) และ SR ที่ต้องสุ่มเลือกมาบางส่วน
 *
 * ใช้เวลาปัจจุบันเป็นเมล็ดสุ่ม แบ่งเป็นช่วงละ 4 ชั่วโมง (epoch)
 * ผู้เล่นทุกคนที่เข้ามาในช่วงเวลาเดียวกันจึงเห็นรอบเดียวกันเป๊ะ
 * ไม่ต้องเก็บสถานะรอบไว้ใน Firestore หรือรอฟังก์ชันฝั่งเซิร์ฟเวอร์รีเซ็ตให้
 */
const ROTATE_HOURS = 4
const SHOP_SLOTS = { SSR: 3, SR: 5, R: 5 }

function shopPeriodMs() {
  return ROTATE_HOURS * 60 * 60 * 1000
}

function shopEpoch(now) {
  return Math.floor(now.getTime() / shopPeriodMs())
}

// mulberry32: PRNG ตัวเล็กจากเมล็ดข้อความ พอสำหรับสุ่มหน้าร้าน ไม่ต้องปลอดภัยระดับรหัสผ่าน
function seededRandom(seedText) {
  let h = 1779033703 ^ seedText.length
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function pickRandom(ids, count, rng) {
  const pool = [...ids]
  const picked = []
  while (picked.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length)
    picked.push(pool.splice(i, 1)[0])
  }
  return picked
}

/** รายชื่อตัวละครในหอแลกเปลี่ยนรอบปัจจุบัน แยกตามระดับหายาก */
export function currentShop(now = new Date()) {
  const rng = seededRandom(`exchange-shop-${shopEpoch(now)}`)
  return RARITIES.reduce((acc, r) => {
    const pool = BY_RARITY[r] ?? []
    const want = SHOP_SLOTS[r] ?? pool.length
    acc[r] = want >= pool.length ? [...pool] : pickRandom(pool, want, rng)
    return acc
  }, {})
}

/** เหลืออีกกี่นาทีก่อนรอบหน้า ไว้แสดงนับถอยหลังในหน้าจอ */
export function minutesUntilShopReset(now = new Date()) {
  const period = shopPeriodMs()
  const next = (shopEpoch(now) + 1) * period
  return Math.max(1, Math.ceil((next - now.getTime()) / 60000))
}

/**
 * แลกเศษวิญญาณเป็นตัวละคร
 *
 * แลกได้เฉพาะตัวที่อยู่ในรอบหอแลกเปลี่ยนตอนนี้เท่านั้น
 * ถ้ามีตัวนั้นอยู่แล้ว แลกซ้ำได้ตามปกติ แต่จะได้ชิ้นส่วนของตัวเองแทนตัวใหม่
 * (เหมือนตัวซ้ำจากกาชา) เอาไว้หลอมดาวต่อ แทนที่จะแลกไม่ได้เลยแล้วเศษวิญญาณกองอยู่เฉย ๆ
 */
export async function exchangeFor(player, charId, owned) {
  const c = CHARACTERS[charId]
  if (!c) throw new Error('ไม่พบตัวละครนี้')

  const rarity = c.rarity
  const shop = currentShop()
  if (!(shop[rarity] ?? []).includes(charId)) {
    throw new Error('ตัวนี้ไม่อยู่ในรอบแลกตอนนี้ รอรอบหน้าอีก 4 ชั่วโมง')
  }

  const cost = EXCHANGE_COST[rarity]
  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  if ((pool[rarity] ?? 0) < cost) throw new Error('เศษวิญญาณไม่พอ')

  pool[rarity] -= cost

  const existing = owned.find((o) => o.id === charId)
  const batch = writeBatch(db)

  if (existing) {
    // แลกซ้ำตัวที่มีอยู่แล้ว ได้ชิ้นส่วนของตัวนั้นสะสมไว้หลอมดาว
    const gain = SHARDS_PER_DUPE[rarity]
    batch.update(doc(db, 'users', player.uid, 'collection', charId), {
      shards: (existing.shards ?? 0) + gain,
    })
    batch.update(doc(db, 'users', player.uid), { shardPool: pool })
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
  batch.update(doc(db, 'users', player.uid), { shardPool: pool })
  await batch.commit()
  invalidateRoster()

  return { charId, rarity, cost, pool, dupe: false }
}

/**
 * แปลงชิ้นส่วนของตัวละครที่มีอยู่ ให้กลายเป็นเศษวิญญาณกลาง
 *
 * ชิ้นส่วนที่ติดมากับตัวซ้ำใช้ได้แค่หลอมดาวตัวนั้นตัวเดียว
 * พอหลอมครบห้าดาวแล้วมันก็กองอยู่เฉย ๆ ไม่มีทางใช้ต่อ
 * ทางนี้เปิดให้เอาไปแลกตัวที่ยังไม่มีได้ในอัตราหนึ่งต่อหนึ่ง
 */
export async function convertShards(player, entry, amount) {
  const c = CHARACTERS[entry.id]
  if (!c) throw new Error('ไม่พบตัวละครนี้')

  const take = Math.max(1, Math.min(entry.shards ?? 0, Math.floor(amount)))
  if (take < 1) throw new Error('ตัวนี้ไม่มีชิ้นส่วนเหลือ')

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  pool[c.rarity] = (pool[c.rarity] ?? 0) + take

  const batch = writeBatch(db)
  batch.update(doc(db, 'users', player.uid, 'collection', entry.id), {
    shards: (entry.shards ?? 0) - take,
  })
  batch.update(doc(db, 'users', player.uid), { shardPool: pool })
  await batch.commit()
  invalidateRoster()

  return { rarity: c.rarity, amount: take }
}

/** ตัวละครในรอบหอแลกเปลี่ยนตอนนี้ พร้อมบอกว่ามีอยู่แล้วหรือยัง แยกตามระดับหายาก */
export function shopEntries(owned) {
  const have = new Set(owned.map((o) => o.id))
  const shop = currentShop()
  return RARITIES.reduce((acc, r) => {
    acc[r] = (shop[r] ?? []).map((id) => ({ id, owned: have.has(id) }))
    return acc
  }, {})
}