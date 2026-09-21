import { invalidateRoster } from './rostercache'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { BANNERS, CHARACTERS, bannerPool } from '../data/characters'
import { MAX_STAR } from './leveling'
import { EMPTY_POOL, SHARDS_PER_DUPE } from '../data/exchange'
import { todayKey } from './dayclock'

export const PULL_COST = 100
export const TEN_PULL_COST = 900

/** ส่วนลดของการสุ่มครั้งแรกในแต่ละวัน */
export const DAILY_DISCOUNT = 0.5

export function discountedPullCost() {
  return Math.round(PULL_COST * DAILY_DISCOUNT)
}

/**
 * วันนี้ยังไม่ได้ใช้ส่วนลดของตู้นี้ใช่ไหม
 *
 * เดิมเก็บวันที่ใช้ส่วนลดไว้ในฟิลด์เดียว (gachaDiscountDay) ใช้ร่วมกันทั้งตู้เริ่มต้น
 * และตู้ทัพหน้าใหม่ ทำให้สุ่มตู้หนึ่งไปแล้ววันนั้นอีกตู้พลอยเสียสิทธิ์ส่วนลดไปด้วย
 * เปลี่ยนมาเก็บเป็นออบเจ็กต์แยกต่อรหัสตู้แทน แต่ละตู้จึงมีสิทธิ์ส่วนลดของตัวเอง
 */
export function discountAvailable(player, bannerId = 'origin') {
  return (player?.gachaDiscountDay?.[bannerId] ?? null) !== todayKey()
}

export const RATES = { R: 0.79, SR: 0.18, SSR: 0.03 }

export const PITY_SR = 10 // ครบ 10 ครั้งได้ SR ขึ้นไปแน่นอน
export const PITY_SSR = 60 // ครบ 60 ครั้งได้ SSR แน่นอน

export { SHARDS_PER_DUPE }

/**
 * ค่าอัปดาว เท่ากับชิ้นส่วนที่ได้จากตัวซ้ำหนึ่งตัวพอดี
 *
 * เดิมไล่ขึ้นเป็น 15/30/60/120 ซึ่งแปลว่าดาวหลัง ๆ ต้องใช้ตัวซ้ำหลายตัว
 * เปลี่ยนเป็นหนึ่งตัวซ้ำต่อหนึ่งดาวตรง ๆ ผู้เล่นจึงนับเองได้ว่าต้องการอีกกี่ตัว
 * และของหายากที่ซ้ำยากก็ยังแพงกว่าอยู่ดี เพราะคิดตามระดับของตัวนั้น
 */
export function starCostFor(rarity) {
  return SHARDS_PER_DUPE[rarity] ?? SHARDS_PER_DUPE.R
}

/**
 * ยกระดับผลที่สุ่มได้ ถ้าตู้นั้นไม่มีตัวละครระดับนั้นเลย
 *
 * ตู้ทัพหน้าใหม่ไม่มีตัวระดับ R แต่การสุ่มยังออกผล R ได้เจ็ดสิบเก้าเปอร์เซ็นต์
 * เดิมโค้ดจึงไปหยิบจากกองว่างแล้วได้ค่าว่าง ซึ่งพังตอนเขียนลง Firestore
 *
 * แก้โดยเลื่อนขึ้นไประดับที่ตู้นั้นมีจริง ผลคือตู้ที่ไม่มีของระดับต่ำ
 * จะให้ของดีกว่าโดยอัตโนมัติ ซึ่งถูกต้องแล้วและผู้เล่นเห็นอัตราจริงในหน้ากาชา
 */
function liftRarity(rarity, pool) {
  const order = ['R', 'SR', 'SSR']
  const from = order.indexOf(rarity)
  for (let i = from; i < order.length; i++) {
    if (pool[order[i]]?.length) return order[i]
  }
  for (let i = from - 1; i >= 0; i--) {
    if (pool[order[i]]?.length) return order[i]
  }
  return null
}

/** อัตราออกจริงของตู้หนึ่ง หลังยุบระดับที่ตู้นั้นไม่มีเข้ากับระดับที่มี */
export function effectiveRates(pool) {
  const out = { R: 0, SR: 0, SSR: 0 }
  Object.entries(RATES).forEach(([rarity, chance]) => {
    const target = liftRarity(rarity, pool)
    if (target) out[target] += chance
  })
  return out
}

/**
 * สุ่มหนึ่งครั้ง โดยดูตัวนับการันตีประกอบ
 *
 * ตัวนับสองตัวทำงานแยกกัน sinceSR รีเซ็ตเมื่อได้ SR ขึ้นไป
 * ส่วน sinceSSR รีเซ็ตเฉพาะเมื่อได้ SSR
 */
function rollOne(pity, pool) {
  let rarity

  if (pity.sinceSSR + 1 >= PITY_SSR) {
    rarity = 'SSR'
  } else if (pity.sinceSR + 1 >= PITY_SR) {
    rarity = Math.random() < RATES.SSR / (RATES.SR + RATES.SSR) ? 'SSR' : 'SR'
  } else {
    const r = Math.random()
    rarity = r < RATES.SSR ? 'SSR' : r < RATES.SSR + RATES.SR ? 'SR' : 'R'
  }

  // ตู้บางตู้ไม่มีตัวละครทุกระดับ ต้องเลื่อนขึ้นไประดับที่มีจริง
  rarity = liftRarity(rarity, pool) ?? rarity
  const list = pool[rarity] ?? []
  if (!list.length) throw new Error('ตู้นี้ยังไม่มีตัวละครให้สุ่ม')
  const id = list[Math.floor(Math.random() * list.length)]

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
export async function pull(player, count, bannerId = 'origin') {
  // ส่วนลดใช้ได้กับการสุ่มทีละครั้งเท่านั้น และวันละหนึ่งครั้งต่อตู้ (ดู discountAvailable)
  const useDiscount = count === 1 && discountAvailable(player, bannerId)
  const cost = count === 10 ? TEN_PULL_COST : useDiscount ? discountedPullCost() : PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  // แต่ละตู้มีกองตัวละครของตัวเอง ตัวนับการันตีใช้ร่วมกันทั้งสองตู้
  const charPool = bannerPool(bannerId)
  const extraPatch = {
    gems: player.gems - cost,
    ...(useDiscount
      ? { gachaDiscountDay: { ...(player.gachaDiscountDay ?? {}), [bannerId]: todayKey() } }
      : {}),
  }

  const { summary, pity } = await rollAndSave(
    player,
    count,
    charPool,
    { sr: 'pitySR', ssr: 'pitySSR' },
    extraPatch
  )

  return { summary, spent: cost, pity, bannerId, discounted: useDiscount }
}

/** พฤติกรรมเดิม: ตัวซ้ำให้ชิ้นส่วนตามเรตของระดับหายากนั้น สะสมลงกองเดียวกันแบนราบ */
function defaultAddDupe(pool, rarity) {
  const gain = SHARDS_PER_DUPE[rarity]
  pool[rarity] = (pool[rarity] ?? 0) + gain
  return gain
}

/**
 * แกนกลางของการบันทึกผลที่สุ่มมาแล้วลง Firestore ใช้ร่วมกันได้กับกองตัวละครชุดไหนก็ได้
 *
 * แยกออกมาจาก rollAndSave() เพื่อให้ตู้ที่ไม่มีตัวนับการันตีเลย (เช่นตู้ UR ใน
 * lib/urgacha.js ซึ่ง "ไม่มีการันตี" ตามที่ออกแบบไว้) ใช้ตรรกะบันทึกผล/หักเพชร/สะสมชิ้นส่วน
 * ชุดเดียวกันได้ โดยไม่ต้องยุ่งกับ pity ที่ตัวเองไม่มี
 */
export async function saveRollResults(player, results, extraPatch = {}, opts = {}) {
  // ใช้ปรับได้ว่าชิ้นส่วนตัวซ้ำไปสะสมไว้ที่ฟิลด์ไหนและรูปร่างเริ่มต้นเป็นอย่างไร
  // ตู้ธาตุหมุนเวียนใช้ 'elemShardPool' (ซ้อนอีกชั้นด้วยธาตุ) แทน 'shardPool' แบบตู้เดิม
  // เพื่อไม่ให้ชิ้นส่วนตัวละครตู้ธาตุไปปนกับเศษวิญญาณกลางของตู้อื่น
  const { poolField = 'shardPool', emptyPool = EMPTY_POOL, addDupe = defaultAddDupe } = opts

  // กันไม่ให้ค่าว่างหลุดลงไปถึง Firestore
  // ถ้าเคยหลุด ข้อความที่ได้จะเป็น indexOf ของ undefined ซึ่งตามต้นตอยากมาก
  if (results.some((r) => !r.id || !CHARACTERS[r.id])) {
    throw new Error('ผลการสุ่มผิดพลาด ลองใหม่อีกครั้ง')
  }

  const uid = player.uid
  const owned = {}

  // อ่านของเดิมก่อน เพื่อรู้ว่าตัวไหนซ้ำ
  await Promise.all(
    [...new Set(results.map((r) => r.id))].map(async (id) => {
      const snap = await getDoc(doc(db, 'users', uid, 'collection', id))
      owned[id] = snap.exists() ? { exp: 0, shards: 0, ...snap.data() } : null
    })
  )

  const summary = []
  const pool = { ...emptyPool, ...(player[poolField] ?? {}) }

  // รวมผลของตัวละครแต่ละตัวให้จบก่อน แล้วค่อยเขียนลงฐานข้อมูลตัวละหนึ่งครั้ง
  //
  // เดิมเขียนทันทีในลูป พอสุ่มสิบครั้งแล้วได้ตัวเดิมซ้ำที่ยังไม่เคยมี
  // รอบแรกสั่งสร้างเอกสาร รอบสองสั่งแก้ไขเอกสารที่ยังไม่มีอยู่จริง แล้วทั้งชุดถูกปฏิเสธ
  // ตู้ที่มีตัวละครน้อยยิ่งเจอบ่อย เพราะโอกาสซ้ำในหนึ่งชุดสูงกว่ามาก
  const changes = {}

  results.forEach(({ id, rarity }) => {
    if (!changes[id]) {
      changes[id] = {
        rarity,
        existed: Boolean(owned[id]),
        shards: owned[id]?.shards ?? 0,
        gained: 0,
      }
    }

    const c = changes[id]
    if (!c.existed && c.gained === 0 && !c.created) {
      // ครั้งแรกที่ได้ตัวนี้ในชุดนี้ และยังไม่เคยมีมาก่อน
      c.created = true
      summary.push({ id, rarity, isNew: true })
      return
    }

    // ตัวซ้ำให้ทั้งชิ้นส่วนของตัวเอง (ไว้หลอมดาว)
    // และเศษวิญญาณกลาง (ไว้แลกตัวที่ยังไม่มีในหอแลกเปลี่ยน) — addDupe กำหนดว่าไปลงที่ไหน
    const gain = addDupe(pool, rarity, id)
    c.shards += gain
    c.gained += gain
    summary.push({ id, rarity, isNew: false, shards: gain })
  })

  const batch = writeBatch(db)

  Object.entries(changes).forEach(([id, c]) => {
    const ref = doc(db, 'users', uid, 'collection', id)

    if (c.created) {
      // สร้างใหม่พร้อมชิ้นส่วนที่ได้จากตัวซ้ำในชุดเดียวกันไปเลย
      batch.set(ref, {
        level: 1,
        exp: 0,
        star: 1,
        shards: c.shards,
        skillLevel: 1,
        tier: 0,
        awaken: 0,
        obtainedAt: serverTimestamp(),
      })
    } else if (c.gained > 0) {
      batch.update(ref, { shards: c.shards })
    }
  })

  batch.update(doc(db, 'users', uid), { ...extraPatch, [poolField]: pool })

  await batch.commit()

  invalidateRoster()
  return summary
}

/**
 * สุ่มหลายครั้งพร้อมตัวนับการันตี แล้วบันทึกผลผ่าน saveRollResults()
 *
 * แยกตัวนับการันตีเป็นคนละคู่ต่อตู้ ผ่านพารามิเตอร์ pityFields ไม่ให้ไปปนกับตู้เดิม
 * (ตู้ที่ไม่มีการันตีเลยอย่างตู้ UR ไม่ผ่านฟังก์ชันนี้ แต่เรียก saveRollResults ตรง ๆ แทน)
 */
export async function rollAndSave(player, count, charPool, pityFields, extraPatch = {}, opts = {}) {
  const pity = {
    sinceSR: player[pityFields.sr] ?? 0,
    sinceSSR: player[pityFields.ssr] ?? 0,
  }

  const results = []
  for (let i = 0; i < count; i++) results.push(rollOne(pity, charPool))

  const summary = await saveRollResults(
    player,
    results,
    { ...extraPatch, [pityFields.sr]: pity.sinceSR, [pityFields.ssr]: pity.sinceSSR },
    opts
  )

  return { summary, pity }
}

/** ชิ้นส่วนที่ต้องใช้เพื่อขึ้นดาวถัดไป คืน null ถ้าเต็มแล้ว */
export function nextStarCost(star, rarity = 'R') {
  return star >= MAX_STAR ? null : starCostFor(rarity)
}

export async function ascend(uid, entry) {
  const cost = nextStarCost(entry.star, CHARACTERS[entry.id]?.rarity ?? 'R')
  if (cost === null) throw new Error('ดาวเต็มแล้ว')
  if ((entry.shards ?? 0) < cost) throw new Error('ชิ้นส่วนไม่พอ')

  const batch = writeBatch(db)
  batch.update(doc(db, 'users', uid, 'collection', entry.id), {
    star: entry.star + 1,
    shards: entry.shards - cost,
  })
  await batch.commit()
  invalidateRoster()

  return { star: entry.star + 1, shards: entry.shards - cost }
}

/**
 * คำนวณผลไต่ดาวของตัวละครหนึ่งตัว ไล่ทีละดาวจนกว่าชิ้นส่วนจะหมดหรือดาวเต็ม
 *
 * แยกเป็นฟังก์ชันล้วน (ไม่แตะ Firestore) ไว้ต่างหากจาก ascendAll() เพื่อให้เทสต์คำนวณ
 * ตรง ๆ ได้โดยไม่ต้องเชื่อมต่อฐานข้อมูลจริง เหมือนกับที่ nextStarCost/starCostFor แยกไว้แล้ว
 */
export function ascendSteps(entry, rarity) {
  let star = entry.star ?? 1
  let shards = entry.shards ?? 0
  let steps = 0

  for (;;) {
    const cost = nextStarCost(star, rarity)
    if (cost === null || shards < cost) break
    star += 1
    shards -= cost
    steps += 1
  }

  return { star, shards, steps }
}

/**
 * อัปดาวทีเดียวทั้งทีม ให้แต่ละตัวไต่ขึ้นไปเรื่อย ๆ จนกว่าชิ้นส่วนจะหมดหรือดาวเต็ม
 * ไม่ใช่แค่ขึ้นให้ทีละดาวเหมือนกด ascend() ตัวเดียว เพราะถ้าตัวไหนตุนชิ้นส่วนไว้พอขึ้นได้
 * หลายดาวรวด ผู้เล่นก็ควรได้ครบในคลิกเดียว ไม่ต้องกดปุ่มนี้ซ้ำหลายรอบ
 *
 * ใช้ writeBatch เดียวคุมทุกตัวละครที่ขึ้นได้จริง (เขียนเอกสารละครั้งเดียว ไม่ใช่ต่อดาว)
 * ตัวที่ขึ้นไม่ได้เลยจะไม่ถูกแตะต้องและไม่รวมอยู่ใน results
 */
export async function ascendAll(uid, entries) {
  const batch = writeBatch(db)
  const results = []
  let totalSteps = 0

  for (const entry of entries) {
    const rarity = CHARACTERS[entry.id]?.rarity ?? 'R'
    const { star, shards, steps } = ascendSteps(entry, rarity)
    if (steps === 0) continue
    batch.update(doc(db, 'users', uid, 'collection', entry.id), { star, shards })
    results.push({ id: entry.id, star, shards, steps })
    totalSteps += steps
  }

  if (results.length > 0) {
    await batch.commit()
    invalidateRoster()
  }

  return { count: results.length, totalSteps, results }
}

export function rarityOf(id) {
  return CHARACTERS[id]?.rarity ?? 'R'
}
