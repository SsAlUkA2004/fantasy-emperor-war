import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  DAMAGE_CAP,
  HITS_PER_DAY,
  HITS_PER_DAY_2,
  bossForWeek,
  bossForWeek2,
  claimKey,
  tiersEarned,
  weekIndex,
} from '../data/worldboss'
import { EMPTY_POOL } from '../data/exchange'
import { isSameThaiDay, runsLeft } from './dayclock'
import { addDrop } from './gear'

/**
 * บอสโลกสองตัวพร้อมกัน แยกกันสนิทด้วยพารามิเตอร์ slot ('current' | 'current2')
 *
 * ทุกฟังก์ชันในไฟล์นี้รับ slot เป็นพารามิเตอร์แรกเสมอ (ค่าเริ่มต้น 'current' ให้พฤติกรรม
 * เดิมทุกจุดที่เรียกไม่ได้ระบุ slot มาก่อนหน้านี้) แล้วแตกไปใช้เอกสาร ก้อนสเปก และฟิลด์
 * โควตาในเอกสารผู้เล่นคนละชุดตาม SLOT_CONFIG ด้านล่าง จึงตีสองตัวในวันเดียวกันได้เต็มโควตา
 * ทั้งคู่โดยไม่แย่งกัน
 */
const SLOT_CONFIG = {
  current: {
    specFor: bossForWeek,
    hitsPerDay: HITS_PER_DAY,
    runAtField: 'bossRunAt',
    runCountField: 'bossRunCount',
    weekIndexField: 'bossWeekIndex',
    weekCountField: 'bossWeekCount',
    claimedField: 'claimedBoss',
  },
  current2: {
    specFor: bossForWeek2,
    hitsPerDay: HITS_PER_DAY_2,
    runAtField: 'boss2RunAt',
    runCountField: 'boss2RunCount',
    weekIndexField: 'boss2WeekIndex',
    weekCountField: 'boss2WeekCount',
    claimedField: 'claimedBoss2',
  },
}

function slotConfig(slot) {
  return SLOT_CONFIG[slot] ?? SLOT_CONFIG.current
}

const bossDoc = (slot) => doc(db, 'worldboss', slot)

/**
 * อ่านบอสตัวปัจจุบันของ slot ที่ระบุ และรีเซ็ตให้ถ้าขึ้นสัปดาห์ใหม่แล้ว
 *
 * ไม่ได้ใช้ตัวตั้งเวลาบนเซิร์ฟเวอร์ คนแรกที่เปิดหน้าในสัปดาห์ใหม่เป็นคนรีเซ็ตเอง
 * ถ้าสองคนเปิดพร้อมกัน transaction จะทำให้มีคนเดียวที่เขียนสำเร็จ
 */
export async function loadBoss(slot = 'current') {
  const week = weekIndex()
  const spec = slotConfig(slot).specFor(week)
  const snap = await getDoc(bossDoc(slot))

  if (snap.exists() && snap.data().week === week) {
    return { ...snap.data(), spec }
  }

  const fresh = {
    week,
    bossId: spec.id,
    maxHp: spec.poolHp,
    hp: spec.poolHp,
    hits: 0,
    resetAt: serverTimestamp(),
  }

  try {
    await setDoc(bossDoc(slot), fresh)
  } catch {
    // มีคนรีเซ็ตไปก่อนแล้ว อ่านของเขาแทน
    const again = await getDoc(bossDoc(slot))
    if (again.exists()) return { ...again.data(), spec }
  }

  return { ...fresh, resetAt: null, spec }
}

export function hitsLeft(player, slot = 'current') {
  const cfg = slotConfig(slot)
  return runsLeft(player, cfg.hitsPerDay, cfg.runAtField, cfg.runCountField)
}

/**
 * ส่งดาเมจเข้าบอส
 *
 * ใช้ transaction เพื่อให้การหักเลือดถูกต้องแม้มีคนตีพร้อมกัน
 * Firestore จะอ่านใหม่แล้วลองใหม่เองเมื่อมีคนเขียนแทรกระหว่างทาง
 * จึงไม่ต้องมีระบบล็อกคิวให้คนอื่นรอ
 */
export async function submitDamage(player, week, rawDamage, slot = 'current') {
  const cfg = slotConfig(slot)
  const damage = Math.max(1, Math.min(DAMAGE_CAP, Math.round(rawDamage)))
  const myRef = doc(db, 'worldboss', slot, 'damage', player.uid)

  const result = await runTransaction(db, async (tx) => {
    const bossSnap = await tx.get(bossDoc(slot))
    if (!bossSnap.exists()) throw new Error('ยังไม่มีบอสในสัปดาห์นี้')

    const boss = bossSnap.data()
    if (boss.week !== week) throw new Error('บอสเปลี่ยนตัวแล้ว ลองใหม่อีกครั้ง')
    if (boss.hp <= 0) throw new Error('บอสตัวนี้ถูกปราบไปแล้ว')

    const dealt = Math.min(damage, boss.hp)
    const mineSnap = await tx.get(myRef)
    const mine = mineSnap.exists() ? mineSnap.data() : { total: 0, hits: 0 }

    tx.update(bossDoc(slot), { hp: boss.hp - dealt, hits: (boss.hits ?? 0) + 1 })
    const sameWeek = mine.week === week
    const total = (sameWeek ? mine.total : 0) + dealt
    const best = Math.max(sameWeek ? mine.best ?? 0 : 0, dealt)

    tx.set(myRef, {
      username: player.username,
      week,
      total,
      best,
      hits: (sameWeek ? mine.hits : 0) + 1,
      lastAt: serverTimestamp(),
    })

    return { dealt, remaining: boss.hp - dealt, total, best }
  })

  // นับโควตารายวันแยกจาก transaction เพราะอยู่คนละเอกสารและไม่ต้องอะตอมมิกร่วมกัน
  const sameDay = isSameThaiDay(player[cfg.runAtField])
  const sameBossWeek = (player[cfg.weekIndexField] ?? -1) === week
  await updateDoc(doc(db, 'users', player.uid), {
    [cfg.runAtField]: serverTimestamp(),
    [cfg.runCountField]: sameDay ? (player[cfg.runCountField] ?? 0) + 1 : 1,
    [cfg.weekIndexField]: week,
    [cfg.weekCountField]: sameBossWeek ? (player[cfg.weekCountField] ?? 0) + 1 : 1,
  })

  // บอสโลกดรอปของสีม่วงถึงแดง เป็นแหล่งเดียวของสองสีนั้นนอกจากดันเจี้ยน
  const drop = await addDrop(player.uid, 'worldboss', 5).catch(() => null)

  return { ...result, drop }
}

export async function loadRanking(count = 30, slot = 'current') {
  const snap = await getDocs(
    query(collection(db, 'worldboss', slot, 'damage'), orderBy('total', 'desc'), limit(count))
  )
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

export async function loadMyDamage(uid, slot = 'current') {
  const snap = await getDoc(doc(db, 'worldboss', slot, 'damage', uid))
  return snap.exists() ? snap.data() : null
}

/** รับรางวัลตามขั้นดาเมจ ขั้นละครั้งต่อหนึ่งสัปดาห์ */
export async function claimTier(player, week, tierId, myDamage, slot = 'current') {
  const cfg = slotConfig(slot)
  const tier = tiersEarned(myDamage).find((t) => t.id === tierId)
  if (!tier) throw new Error('ดาเมจยังไม่ถึงขั้นนี้')

  const key = claimKey(week, tierId)
  const claimed = player[cfg.claimedField] ?? []
  if (claimed.includes(key)) throw new Error('รับรางวัลขั้นนี้ไปแล้ว')

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  Object.entries(tier.pool).forEach(([r, n]) => {
    pool[r] = (pool[r] ?? 0) + n
  })

  await updateDoc(doc(db, 'users', player.uid), {
    gems: player.gems + tier.gems,
    shardPool: pool,
    [cfg.claimedField]: [...claimed, key],
    lastBossClaim: key,
  })

  return tier
}
