import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { STARTER_IDS } from '../data/characters'

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
    star: 1,
    shards: 0,
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
