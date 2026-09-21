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
import { assembleOpponents, pointRange } from '../data/matchmaking'
import { weekIndex } from '../data/worldboss'

/**
 * หาคู่แข่งหกช่อง สามช่องแรกเป็นผู้เล่นจริงที่แรงค์ห่างจากเราไม่เกินหนึ่งขั้น ที่เหลือเป็นบอท
 *
 * ดึงเฉพาะคนที่แต้มอยู่ในช่วงแรงค์ข้างเคียง (ดู pointRange) ลงมาและขึ้นไปจากเราอย่างละชุด
 * ที่ทำสองทิศเพราะถ้าดึงทางเดียว คนที่อยู่บนสุดของกระดานจะไม่เจอใครเลย
 * แล้วให้ assembleOpponents สุ่มเลือกสามคนและเติมบอทให้ครบ
 * พารามิเตอร์ตัวที่สองไม่ได้ใช้แล้ว (บอทผูกกับแรงค์ ไม่ใช่ค่าพลังของผู้เล่น) เก็บไว้ให้ผู้เรียกเดิมไม่พัง
 */
export async function findOpponents(me) {
  const points = me.pvpPoints ?? 0
  const base = collection(db, 'users')
  const { lo, hi } = pointRange(points)

  const belowQuery = query(
    base,
    where('pvpPoints', '>=', lo),
    where('pvpPoints', '<=', points),
    orderBy('pvpPoints', 'desc'),
    limit(20)
  )
  const aboveQuery = Number.isFinite(hi)
    ? query(base, where('pvpPoints', '>', points), where('pvpPoints', '<', hi), orderBy('pvpPoints', 'asc'), limit(20))
    : query(base, where('pvpPoints', '>', points), orderBy('pvpPoints', 'asc'), limit(20))

  const [below, above] = await Promise.all([getDocs(belowQuery), getDocs(aboveQuery)])
  const pool = [...below.docs, ...above.docs].map((d) => ({ uid: d.id, ...d.data() }))

  return assembleOpponents(me, pool)
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

/**
 * สร้างสนามรบสำหรับการประลอง
 *
 * ใช้ createBattle สองครั้งแล้วเอาฝั่งพันธมิตรของอีกชุดมาพลิกเป็นฝ่ายตรงข้าม
 * เพราะฝั่งตรงข้ามเป็นตัวละครผู้เล่น ไม่ใช่มอนสเตอร์ จึงสร้างจากข้อมูลคนละชุดกัน
 */
export function createPvpBattle(myEntries, foeEntries, foeName) {
  const pseudoStage = {
    id: 'pvp',
    intro: `เริ่มการประลองกับ ${foeName}`,
    enemies: [],
  }

  const mine = createBattle(myEntries, pseudoStage)
  const foes = createBattle(foeEntries, pseudoStage).units.map((u, i) => ({
    ...u,
    key: `e${i}`,
    side: 'enemy',
  }))

  const state = {
    ...mine,
    units: [...mine.units.filter((u) => u.side === 'ally'), ...foes],
  }
  state.order = state.units
    .filter((u) => u.alive)
    .sort((a, b) => b.spd - a.spd)
    .map((u) => u.key)
  state.cursor = 0

  // createBattle เติมพลังเวทให้ตัวแรกของสนามเดิมไปแล้วตอนสร้าง
  // แต่พอรวมสองฝั่งเข้าด้วยกัน ลำดับเปลี่ยน ตัวที่ได้ไปจึงอาจไม่ใช่ตัวที่จะลงมือจริง
  // ล้างให้เป็นศูนย์ทั้งหมดก่อน แล้วค่อยเติมให้ตัวแรกของลำดับใหม่
  state.units.forEach((u) => {
    u.mp = 0
  })
  const first = currentUnit(state)
  if (first) first.mp = 2

  return state
}

/** ตัดสินผลเมื่อครบเพดานรอบแล้วยังไม่มีใครล้มหมด */
export function decideByHp(state) {
  const mine = hpRatio(state, 'ally')
  const theirs = hpRatio(state, 'enemy')
  return {
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

/** จำลองการประลองจนจบ ใช้ตอนที่ผู้เล่นไม่ได้ลงมือเอง */
export function simulate(myEntries, foeEntries, foeName) {
  let state = createPvpBattle(myEntries, foeEntries, foeName)

  let guard = 0
  while (!state.outcome && state.round <= ROUND_LIMIT && guard++ < 900) {
    if (!currentUnit(state)) break
    state = takeTurn(state, null)
  }

  if (!state.outcome) state = decideByHp(state)
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
  const seasonHighest = Math.max(player.seasonHighest ?? 0, rankOf(points).index)
  const sameDay = isSameThaiDay(player.pvpRunAt)
  const sameWeek = (player.pvpWeekIndex ?? -1) === weekIndex()

  await updateDoc(doc(db, 'users', player.uid), {
    pvpPoints: points,
    highestRank: highest,
    seasonHighest,
    pvpRunAt: serverTimestamp(),
    pvpRunCount: sameDay ? (player.pvpRunCount ?? 0) + 1 : 1,
    pvpWeekIndex: weekIndex(),
    // firestore.rules ปฏิเสธถ้า pvpWeekCount เกิน 100 แต่โควตาประลองวันละ 20 ครั้งรวมเจ็ดวันได้ถึง 140
    // ผู้เล่นสายประลองจึงจะบันทึกผลไม่ได้เลยตั้งแต่กลางสัปดาห์ ต้องหยุดนับที่เพดานกฎ
    // (เควสรายสัปดาห์ใช้แค่เป้า 25 ครั้ง ค่าเกินนั้นไม่มีใครอ่าน)
    pvpWeekCount: Math.min(100, sameWeek ? (player.pvpWeekCount ?? 0) + 1 : 1),
  })

  return { delta, points, highest, seasonHighest }
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
