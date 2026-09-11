import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createBattle, takeTurn, currentUnit } from './battle'
import { applyDelta, pointDelta, rankOf, MATCHES_PER_DAY } from '../data/ranks'
import { isSameThaiDay, runsLeft } from './dayclock'
import { makeBots } from '../data/bots'

/**
 * หาคู่แข่งที่แต้มใกล้เคียงกัน
 *
 * ดึงคนที่แต้มต่ำกว่าเราลงมาและสูงกว่าเราขึ้นไปอย่างละชุด แล้วสุ่มเลือกสามคน
 * ที่ทำสองทิศเพราะถ้าดึงทางเดียว คนที่อยู่บนสุดของกระดานจะไม่เจอใครเลย
 */
export async function findOpponents(me, myTeamCp = 0) {
  const points = me.pvpPoints ?? 0
  const base = collection(db, 'users')

  const [below, above] = await Promise.all([
    getDocs(query(base, where('pvpPoints', '<=', points), orderBy('pvpPoints', 'desc'), limit(12))),
    getDocs(query(base, where('pvpPoints', '>', points), orderBy('pvpPoints', 'asc'), limit(12))),
  ])

  const pool = [...below.docs, ...above.docs]
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.uid !== me.uid && u.starterChosen)

  // เอาเฉพาะคนที่ตั้งทีมรับไว้แล้ว คนที่ยังไม่ตั้งจะท้าไม่ได้อยู่ดี
  const ready = pool.filter((u) => Array.isArray(u.defense) && u.defense.length)

  const picked = []
  const copy = [...ready]
  while (picked.length < 3 && copy.length) {
    picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }

  // เติมด้วยคู่ซ้อมจนครบสาม
  // เกมนี้เล่นกันในกลุ่มเพื่อน ถ้ารอคนจริงอย่างเดียว
  // ช่วงแรกหน้าประลองจะว่างเปล่าจนกดอะไรไม่ได้เลย
  if (picked.length < 3) {
    picked.push(...makeBots(me, 3 - picked.length, myTeamCp))
  }

  return picked
}

/**
 * ทีมตั้งรับของคู่แข่ง
 *
 * เก็บไว้ในเอกสารของเจ้าตัวเป็นสำเนาค่าสถานะ ไม่ใช่แค่รหัสตัวละคร
 * เพราะถ้าเก็บแค่รหัส เราต้องอ่านคอลเลกชันย่อยของคนอื่น
 * ซึ่งกฎไม่เปิดให้ และไม่ควรเปิดด้วย
 */
export function defenseEntries(user) {
  return Array.isArray(user?.defense) ? user.defense : []
}

/**
 * เพดานจำนวนรอบของการประลอง
 *
 * ถ้าไม่มีเพดาน ทีมที่มีหมอกับตัวดึงเป้าจะชนะทุกครั้งแม้ค่าพลังต่ำกว่ามาก
 * เพราะฟื้นเลือดได้เร็วกว่าที่อีกฝ่ายตีเข้า การสู้จึงยืดไปจนกว่าฝ่ายบุกจะหมดแรง
 * พอมีเพดานแล้วตัดสินด้วยเลือดที่เหลือ พลังโจมตีจึงมีความหมายกลับมา
 */
export const ROUND_LIMIT = 30

function hpRatio(state, side) {
  const units = state.units.filter((u) => u.side === side)
  const now = units.reduce((s, u) => s + u.hp, 0)
  const max = units.reduce((s, u) => s + u.maxHp, 0)
  return max ? now / max : 0
}

/** จำลองการประลองจนจบ คืนผลพร้อมบันทึกการต่อสู้ */
export function simulate(myEntries, foeEntries, foeName) {
  const pseudoStage = {
    id: 'pvp',
    intro: `เริ่มการประลองกับ ${foeName}`,
    enemies: [],
  }

  const state0 = createBattle(myEntries, pseudoStage)

  // ใส่ฝั่งตรงข้ามเข้าไปเองด้วยข้อมูลตัวละครผู้เล่น ไม่ใช่มอนสเตอร์
  const foes = createBattle(foeEntries, pseudoStage).units.map((u, i) => ({
    ...u,
    key: `e${i}`,
    side: 'enemy',
  }))

  let state = {
    ...state0,
    units: [...state0.units.filter((u) => u.side === 'ally'), ...foes],
  }
  state.order = state.units
    .filter((u) => u.alive)
    .sort((a, b) => b.spd - a.spd)
    .map((u) => u.key)
  state.cursor = 0

  let guard = 0
  while (!state.outcome && state.round <= ROUND_LIMIT && guard++ < 900) {
    if (!currentUnit(state)) break
    state = takeTurn(state, null)
  }

  // ครบเพดานแล้วยังไม่มีใครล้มหมด ตัดสินด้วยสัดส่วนเลือดที่เหลือของทั้งทีม
  if (!state.outcome) {
    const mine = hpRatio(state, 'ally')
    const theirs = hpRatio(state, 'enemy')
    state = {
      ...state,
      outcome: mine >= theirs ? 'won' : 'lost',
      decidedByHp: true,
      log: [
        ...state.log,
        {
          text: `ครบ ${ROUND_LIMIT} รอบ ตัดสินด้วยเลือดที่เหลือ ${Math.round(mine * 100)}% ต่อ ${Math.round(theirs * 100)}%`,
          kind: mine >= theirs ? 'win' : 'lose',
        },
      ],
    }
  }

  return state
}

export function matchesLeft(player) {
  return runsLeft(player, MATCHES_PER_DAY, 'pvpRunAt', 'pvpRunCount')
}

/**
 * บันทึกผลการประลอง
 *
 * แต้มเปลี่ยนได้เฉพาะในช่วงที่กฎอนุญาต และนับรวมไม่เกินสิบครั้งต่อวัน
 * แรงค์สูงสุดที่เคยไปถึงขึ้นได้อย่างเดียว ใช้ปลดล็อกฉายา
 */
export async function saveMatch(player, foe, won) {
  const delta = pointDelta(player.pvpPoints ?? 0, foe.pvpPoints ?? 0, won)
  const points = applyDelta(player.pvpPoints ?? 0, delta)
  const highest = Math.max(player.highestRank ?? 0, rankOf(points).index)
  const sameDay = isSameThaiDay(player.pvpRunAt)

  await updateDoc(doc(db, 'users', player.uid), {
    pvpPoints: points,
    highestRank: highest,
    pvpRunAt: serverTimestamp(),
    pvpRunCount: sameDay ? (player.pvpRunCount ?? 0) + 1 : 1,
  })

  return { delta, points, highest }
}

export async function saveDefense(uid, entries) {
  await updateDoc(doc(db, 'users', uid), { defense: entries })
}

export async function loadLeaderboard(count = 50) {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('pvpPoints', 'desc'), limit(count))
  )
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}
