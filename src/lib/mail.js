import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  LEVEL_REWARD_STEP,
  dailyGemsFor,
  dailyMailId,
  levelMailId,
  levelRewardGems,
} from '../data/mail'
import { PLAYER_MAX_LEVEL } from './leveling'
import { rankOf } from '../data/ranks'
import { todayKey } from './dayclock'
import { EMPTY_POOL } from '../data/exchange'

const box = (uid) => collection(db, 'users', uid, 'mail')

/**
 * ออกจดหมายรางวัลประจำวันให้ตัวเอง
 *
 * ผู้เล่นเป็นคนสร้างจดหมายเอง เพราะไม่มีเซิร์ฟเวอร์คอยส่ง
 * กันการออกซ้ำด้วยการใช้รหัสวันเป็นรหัสเอกสาร วันหนึ่งจึงมีได้ฉบับเดียว
 * และกฎตรวจว่าจำนวนเพชรในจดหมายตรงกับแรงค์ที่ผู้เล่นอยู่จริง
 */
export async function issueDailyMail(player) {
  const day = todayKey()
  const id = dailyMailId(day)
  const rank = rankOf(player.pvpPoints ?? 0)
  const gems = dailyGemsFor(rank.index)

  try {
    await setDoc(doc(box(player.uid), id), {
      kind: 'dailyRank',
      title: `รางวัลประจำวัน · ${rank.name}`,
      body: `ของขวัญรายวันสำหรับผู้เล่นระดับ ${rank.name}`,
      gems,
      pool: {},
      day,
      rankIndex: rank.index,
      claimed: false,
      createdAt: serverTimestamp(),
    })
    return true
  } catch {
    // มีอยู่แล้วหรือกฎปฏิเสธ ไม่ถือเป็นข้อผิดพลาดที่ต้องแจ้งผู้เล่น
    return false
  }
}

/**
 * ออกจดหมายรางวัลเลื่อนเลเวลที่ยังไม่เคยออกให้ครบทุกจุดที่ผ่านมาแล้ว
 *
 * ไล่ออกทีละจุด (10, 20, 30, ...) จนถึงเลเวลปัจจุบัน แทนที่จะออกจุดล่าสุดจุดเดียว
 * เพราะผู้เล่นอาจฟาร์มทีเดียวข้ามหลายจุดจนเปิดกล่องจดหมายไม่ทันทุกจุด
 * รหัสเอกสารผูกกับเลขจุดเลเวลอยู่แล้ว จึงออกซ้ำจุดเดิมไม่ได้ ไม่ต้องกันเองในนี้
 */
export async function issueLevelMail(player) {
  const level = Math.min(player.playerLevel ?? 1, PLAYER_MAX_LEVEL)
  const reached = Math.floor(level / LEVEL_REWARD_STEP) * LEVEL_REWARD_STEP
  if (reached < LEVEL_REWARD_STEP) return 0

  let issued = 0
  for (let milestone = LEVEL_REWARD_STEP; milestone <= reached; milestone += LEVEL_REWARD_STEP) {
    try {
      await setDoc(doc(box(player.uid), levelMailId(milestone)), {
        kind: 'levelReward',
        title: `รางวัลเลื่อนเลเวล · เลเวล ${milestone}`,
        body: `ของขวัญสำหรับผู้เล่นที่ถึงเลเวล ${milestone}`,
        gems: levelRewardGems(milestone),
        pool: {},
        milestone,
        claimed: false,
        createdAt: serverTimestamp(),
      })
      issued += 1
    } catch {
      // จุดนี้เคยออกไปแล้วหรือกฎปฏิเสธ ไม่ถือเป็นข้อผิดพลาดที่ต้องแจ้งผู้เล่น
    }
  }
  return issued
}

export async function loadMail(uid) {
  const snap = await getDocs(query(box(uid), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * เปิดจดหมายหนึ่งฉบับ
 *
 * ทำสองอย่างพร้อมกันใน batch คือปิดผนึกจดหมายกับเพิ่มของเข้ากระเป๋า
 * ถ้าแยกกันแล้วเน็ตหลุดกลางทาง ผู้เล่นอาจได้ของสองรอบหรือไม่ได้เลย
 */
export async function claimMail(player, mail) {
  if (mail.claimed) throw new Error('เปิดจดหมายฉบับนี้ไปแล้ว')

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  Object.entries(mail.pool ?? {}).forEach(([r, n]) => {
    pool[r] = (pool[r] ?? 0) + n
  })

  const batch = writeBatch(db)
  batch.update(doc(box(player.uid), mail.id), { claimed: true, claimedAt: serverTimestamp() })
  batch.update(doc(db, 'users', player.uid), {
    gems: player.gems + (mail.gems ?? 0),
    shardPool: pool,
    lastMail: mail.id,
  })
  await batch.commit()

  return { gems: mail.gems ?? 0, pool: mail.pool ?? {} }
}

export async function claimAll(player, mails) {
  const unread = mails.filter((m) => !m.claimed)
  if (!unread.length) throw new Error('ไม่มีจดหมายที่ยังไม่ได้เปิด')

  let gems = player.gems
  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  const batch = writeBatch(db)

  unread.forEach((m) => {
    gems += m.gems ?? 0
    Object.entries(m.pool ?? {}).forEach(([r, n]) => {
      pool[r] = (pool[r] ?? 0) + n
    })
    batch.update(doc(box(player.uid), m.id), { claimed: true, claimedAt: serverTimestamp() })
  })

  batch.update(doc(db, 'users', player.uid), { gems, shardPool: pool, lastMail: 'bulk' })
  await batch.commit()

  return { count: unread.length, gems: gems - player.gems }
}

export async function removeMail(uid, mailId) {
  await deleteDoc(doc(box(uid), mailId))
}
