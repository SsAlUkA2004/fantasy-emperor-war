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
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { ATTACKS_PER_DAY, coinsFromPoints, warPoints, warWeek } from '../data/guildwar'
import { isSameThaiDay, runsLeft } from './dayclock'
import { makeBots } from '../data/bots'

const scoreRef = (guildId) => doc(db, 'guildwar', 'current', 'scores', guildId)

export function attacksLeft(player) {
  return runsLeft(player, ATTACKS_PER_DAY, 'warRunAt', 'warRunCount')
}

export async function loadScores(count = 30) {
  const week = warWeek()
  const snap = await getDocs(
    query(collection(db, 'guildwar', 'current', 'scores'), orderBy('points', 'desc'), limit(count))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.week === week)
}

export async function myScore(guildId) {
  const snap = await getDoc(scoreRef(guildId))
  const week = warWeek()
  if (!snap.exists() || snap.data().week !== week) return { points: 0, wins: 0, attacks: 0, week }
  return snap.data()
}

/**
 * หาเป้าหมาย
 *
 * เอาเฉพาะคนที่อยู่กิลด์อื่นและตั้งทีมรับไว้แล้ว
 * ถ้าไม่พอสามคนก็เติมด้วยคู่ซ้อม เพราะช่วงที่ยังมีกิลด์เดียวในเกม
 * หน้านี้จะว่างเปล่าจนกดอะไรไม่ได้เลย
 */
export async function findWarTargets(me, myTeamCp) {
  const snap = await getDocs(query(collection(db, 'users'), limit(60)))
  const pool = snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter(
      (u) =>
        u.uid !== me.uid &&
        u.guildId &&
        u.guildId !== me.guildId &&
        Array.isArray(u.defense) &&
        u.defense.length
    )

  const picked = []
  const copy = [...pool]
  while (picked.length < 3 && copy.length) {
    picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  if (picked.length < 3) picked.push(...makeBots(me, 3 - picked.length, myTeamCp))
  return picked
}

/**
 * บันทึกผลการปะทะ
 *
 * คะแนนกิลด์กับตัวนับของกิลด์ต้องขยับพร้อมกัน จึงใช้ transaction
 * สมาชิกหลายคนตีพร้อมกันได้โดยคะแนนไม่หาย
 */
export async function submitWarResult(player, guildId, guildName, guildTag, won, myCp, foeCp) {
  const week = warWeek()
  const points = warPoints(won, myCp, foeCp)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(scoreRef(guildId))
    const fresh = !snap.exists() || snap.data().week !== week
    const now = fresh ? { points: 0, wins: 0, attacks: 0 } : snap.data()

    tx.set(scoreRef(guildId), {
      week,
      name: guildName,
      tag: guildTag,
      points: (now.points ?? 0) + points,
      wins: (now.wins ?? 0) + (won ? 1 : 0),
      attacks: (now.attacks ?? 0) + 1,
      updatedAt: serverTimestamp(),
    })
  })

  const coins = coinsFromPoints(points)
  const sameDay = isSameThaiDay(player.warRunAt)
  await updateDoc(doc(db, 'users', player.uid), {
    guildCoins: (player.guildCoins ?? 0) + coins,
    warRunAt: serverTimestamp(),
    warRunCount: sameDay ? (player.warRunCount ?? 0) + 1 : 1,
  })

  return { points, coins, won }
}
