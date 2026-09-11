import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { STARTER_IDS } from '../data/characters'
import { gainExp } from './leveling'
import { entryLevelCap } from './stats'

/**
 * บันทึกตัวละครเริ่มต้นที่ผู้เล่นเลือก
 *
 * ใช้ batch เพื่อให้การเขียนสองที่สำเร็จหรือล้มพร้อมกัน
 * ถ้าเขียนแยกกันแล้วเน็ตหลุดกลางทาง อาจได้ผู้เล่นที่ starterChosen เป็น true
 * แต่ในกระเป๋าไม่มีตัวละครสักตัว ซึ่งแก้ยากมากภายหลัง
 */
export async function chooseStarter(uid, charId) {
  if (!STARTER_IDS.includes(charId)) {
    throw new Error('ตัวละครนี้ไม่ใช่ตัวเริ่มต้น')
  }

  const batch = writeBatch(db)

  batch.set(doc(db, 'users', uid, 'collection', charId), {
    level: 1,
    exp: 0,
    star: 1,
    shards: 0,
    skillLevel: 1,
    tier: 0,
    awaken: 0,
    obtainedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', uid), {
    starterChosen: true,
    team: [charId],
  })

  await batch.commit()
}

export async function loadCollection(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'collection'))
  // ตัวละครที่สร้างไว้ก่อนมีระบบเลเวลจะไม่มีฟิลด์ exp จึงเติมศูนย์ให้
  // ตัวละครที่ได้มาก่อนมีระบบเหล่านี้จะไม่มีฟิลด์ จึงเติมค่าเริ่มต้นให้
  return snap.docs.map((d) => ({
    id: d.id,
    exp: 0,
    skillLevel: 1,
    tier: 0,
    awaken: 0,
    ...d.data(),
  }))
}

/**
 * แจกค่าประสบการณ์ให้ทุกตัวที่ร่วมรบ รวมถึงตัวที่ล้มไปแล้ว
 * ตัวที่ตายก็ยังได้ เพราะไม่งั้นผู้เล่นจะเลี่ยงการใช้ตัวอ่อน
 * แล้วทีมจะไม่มีวันโตขึ้นมาพร้อมกัน
 */
export async function awardExp(uid, entries, amount) {
  const batch = writeBatch(db)
  const results = []

  entries.forEach((entry) => {
    const cap = entryLevelCap(entry.id, entry)
    const next = gainExp(entry.level, entry.exp, amount, cap)
    results.push({ id: entry.id, from: entry.level, cap, ...next })
    batch.update(doc(db, 'users', uid, 'collection', entry.id), {
      level: next.level,
      exp: next.exp,
    })
  })

  await batch.commit()
  return results
}
