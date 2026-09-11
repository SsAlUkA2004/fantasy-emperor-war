import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { BY_RARITY, CHARACTERS } from '../data/characters'
import { MAX_STAR } from './leveling'

export const PULL_COST = 100
export const TEN_PULL_COST = 900

export const RATES = { R: 0.79, SR: 0.18, SSR: 0.03 }

export const PITY_SR = 10 // ครบ 10 ครั้งได้ SR ขึ้นไปแน่นอน
export const PITY_SSR = 60 // ครบ 60 ครั้งได้ SSR แน่นอน

export const SHARDS_PER_DUPE = { R: 5, SR: 20, SSR: 50 }
export const STAR_COST = { 2: 15, 3: 30, 4: 60, 5: 120 }

/**
 * สุ่มหนึ่งครั้ง โดยดูตัวนับการันตีประกอบ
 *
 * ตัวนับสองตัวทำงานแยกกัน sinceSR รีเซ็ตเมื่อได้ SR ขึ้นไป
 * ส่วน sinceSSR รีเซ็ตเฉพาะเมื่อได้ SSR
 */
function rollOne(pity) {
  let rarity

  if (pity.sinceSSR + 1 >= PITY_SSR) {
    rarity = 'SSR'
  } else if (pity.sinceSR + 1 >= PITY_SR) {
    rarity = Math.random() < RATES.SSR / (RATES.SR + RATES.SSR) ? 'SSR' : 'SR'
  } else {
    const r = Math.random()
    rarity = r < RATES.SSR ? 'SSR' : r < RATES.SSR + RATES.SR ? 'SR' : 'R'
  }

  const pool = BY_RARITY[rarity]
  const id = pool[Math.floor(Math.random() * pool.length)]

  if (rarity === 'SSR') {
    pity.sinceSSR = 0
    pity.sinceSR = 0
  } else if (rarity === 'SR') {
    pity.sinceSR = 0
    pity.sinceSSR += 1
  } else {
    pity.sinceSR += 1
    pity.sinceSSR += 1
  }

  return { id, rarity }
}

/**
 * สุ่มหลายครั้งแล้วบันทึกผลลง Firestore
 *
 * ⚠️ ตอนนี้การสุ่มเกิดขึ้นในเบราว์เซอร์ Security Rules ตรวจได้แค่ว่า
 * เพชรถูกหักครบและตัวนับการันตีขยับถูกต้อง แต่พิสูจน์ไม่ได้ว่าตัวที่ออกมาสุ่มจริง
 * คนที่แก้โค้ดเป็นสามารถบังคับให้ออก SSR ทุกครั้งได้ภายในเพชรที่มี
 *
 * ไฟล์ functions/index.js มีโค้ดฝั่งเซิร์ฟเวอร์เตรียมไว้แล้ว
 * เมื่อเปิดใช้ ให้เปลี่ยนฟังก์ชันนี้ไปเรียก httpsCallable แทน ส่วนอื่นไม่ต้องแก้
 */
export async function pull(player, count) {
  const cost = count === 10 ? TEN_PULL_COST : PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  const pity = {
    sinceSR: player.pitySR ?? 0,
    sinceSSR: player.pitySSR ?? 0,
  }

  const results = []
  for (let i = 0; i < count; i++) results.push(rollOne(pity))

  const uid = player.uid
  const owned = {}

  // อ่านของเดิมก่อน เพื่อรู้ว่าตัวไหนซ้ำ
  await Promise.all(
    [...new Set(results.map((r) => r.id))].map(async (id) => {
      const snap = await getDoc(doc(db, 'users', uid, 'collection', id))
      owned[id] = snap.exists() ? { exp: 0, shards: 0, ...snap.data() } : null
    })
  )

  const batch = writeBatch(db)
  const summary = []

  results.forEach(({ id, rarity }) => {
    const ref = doc(db, 'users', uid, 'collection', id)

    if (!owned[id]) {
      owned[id] = { level: 1, exp: 0, star: 1, shards: 0, skillLevel: 1, tier: 0, awaken: 0 }
      batch.set(ref, { ...owned[id], obtainedAt: serverTimestamp() })
      summary.push({ id, rarity, isNew: true })
    } else {
      const gain = SHARDS_PER_DUPE[rarity]
      owned[id].shards += gain
      batch.update(ref, { shards: owned[id].shards })
      summary.push({ id, rarity, isNew: false, shards: gain })
    }
  })

  batch.update(doc(db, 'users', uid), {
    gems: player.gems - cost,
    pitySR: pity.sinceSR,
    pitySSR: pity.sinceSSR,
  })

  await batch.commit()
  return { summary, spent: cost, pity }
}

/** ชิ้นส่วนที่ต้องใช้เพื่อขึ้นดาวถัดไป คืน null ถ้าเต็มแล้ว */
export function nextStarCost(star) {
  return star >= MAX_STAR ? null : STAR_COST[star + 1]
}

export async function ascend(uid, entry) {
  const cost = nextStarCost(entry.star)
  if (cost === null) throw new Error('ดาวเต็มแล้ว')
  if ((entry.shards ?? 0) < cost) throw new Error('ชิ้นส่วนไม่พอ')

  const batch = writeBatch(db)
  batch.update(doc(db, 'users', uid, 'collection', entry.id), {
    star: entry.star + 1,
    shards: entry.shards - cost,
  })
  await batch.commit()

  return { star: entry.star + 1, shards: entry.shards - cost }
}

export function rarityOf(id) {
  return CHARACTERS[id]?.rarity ?? 'R'
}
