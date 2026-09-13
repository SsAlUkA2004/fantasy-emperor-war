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
  bossForWeek,
  claimKey,
  tiersEarned,
  weekIndex,
} from '../data/worldboss'
import { EMPTY_POOL } from '../data/exchange'
import { isSameThaiDay, runsLeft } from './dayclock'
import { addDrop } from './gear'

const BOSS_DOC = () => doc(db, 'worldboss', 'current')

/**
 * อ่านบอสตัวปัจจุบัน และรีเซ็ตให้ถ้าขึ้นสัปดาห์ใหม่แล้ว
 *
 * ไม่ได้ใช้ตัวตั้งเวลาบนเซิร์ฟเวอร์ คนแรกที่เปิดหน้าในสัปดาห์ใหม่เป็นคนรีเซ็ตเอง
 * ถ้าสองคนเปิดพร้อมกัน transaction จะทำให้มีคนเดียวที่เขียนสำเร็จ
 */
export async function loadBoss() {
  const week = weekIndex()
  const spec = bossForWeek(week)
  const snap = await getDoc(BOSS_DOC())

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
    await setDoc(BOSS_DOC(), fresh)
  } catch {
    // มีคนรีเซ็ตไปก่อนแล้ว อ่านของเขาแทน
    const again = await getDoc(BOSS_DOC())
    if (again.exists()) return { ...again.data(), spec }
  }

  return { ...fresh, resetAt: null, spec }
}

export function hitsLeft(player) {
  return runsLeft(player, HITS_PER_DAY, 'bossRunAt', 'bossRunCount')
}

/**
 * ส่งดาเมจเข้าบอส
 *
 * ใช้ transaction เพื่อให้การหักเลือดถูกต้องแม้มีคนตีพร้อมกัน
 * Firestore จะอ่านใหม่แล้วลองใหม่เองเมื่อมีคนเขียนแทรกระหว่างทาง
 * จึงไม่ต้องมีระบบล็อกคิวให้คนอื่นรอ
 */
export async function submitDamage(player, week, rawDamage) {
  const damage = Math.max(1, Math.min(DAMAGE_CAP, Math.round(rawDamage)))
  const myRef = doc(db, 'worldboss', 'current', 'damage', player.uid)

  const result = await runTransaction(db, async (tx) => {
    const bossSnap = await tx.get(BOSS_DOC())
    if (!bossSnap.exists()) throw new Error('ยังไม่มีบอสในสัปดาห์นี้')

    const boss = bossSnap.data()
    if (boss.week !== week) throw new Error('บอสเปลี่ยนตัวแล้ว ลองใหม่อีกครั้ง')
    if (boss.hp <= 0) throw new Error('บอสตัวนี้ถูกปราบไปแล้ว')

    const dealt = Math.min(damage, boss.hp)
    const mineSnap = await tx.get(myRef)
    const mine = mineSnap.exists() ? mineSnap.data() : { total: 0, hits: 0 }

    tx.update(BOSS_DOC(), { hp: boss.hp - dealt, hits: (boss.hits ?? 0) + 1 })
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
  const sameDay = isSameThaiDay(player.bossRunAt)
  await updateDoc(doc(db, 'users', player.uid), {
    bossRunAt: serverTimestamp(),
    bossRunCount: sameDay ? (player.bossRunCount ?? 0) + 1 : 1,
  })

  // บอสโลกดรอปของสีม่วงถึงแดง เป็นแหล่งเดียวของสองสีนั้นนอกจากดันเจี้ยน
  const drop = await addDrop(player.uid, 'worldboss', 5).catch(() => null)

  return { ...result, drop }
}

export async function loadRanking(count = 30) {
  const snap = await getDocs(
    query(collection(db, 'worldboss', 'current', 'damage'), orderBy('total', 'desc'), limit(count))
  )
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

export async function loadMyDamage(uid) {
  const snap = await getDoc(doc(db, 'worldboss', 'current', 'damage', uid))
  return snap.exists() ? snap.data() : null
}

/** รับรางวัลตามขั้นดาเมจ ขั้นละครั้งต่อหนึ่งสัปดาห์ */
export async function claimTier(player, week, tierId, myDamage) {
  const tier = tiersEarned(myDamage).find((t) => t.id === tierId)
  if (!tier) throw new Error('ดาเมจยังไม่ถึงขั้นนี้')

  const key = claimKey(week, tierId)
  const claimed = player.claimedBoss ?? []
  if (claimed.includes(key)) throw new Error('รับรางวัลขั้นนี้ไปแล้ว')

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  Object.entries(tier.pool).forEach(([r, n]) => {
    pool[r] = (pool[r] ?? 0) + n
  })

  await updateDoc(doc(db, 'users', player.uid), {
    gems: player.gems + tier.gems,
    shardPool: pool,
    claimedBoss: [...claimed, key],
    lastBossClaim: key,
  })

  return tier
}
