import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { isSameThaiDay, runsLeft } from './dayclock'
import { entryPower } from './power'
import { CHARACTERS } from '../data/characters'

// ─────────────────────────────────────────────────────────────
// ยืมตัวช่วยจากผู้เล่นอันดับต้น
//
// ยืมได้เฉพาะตัวที่เจ้าตัวตั้งไว้ในทีมตั้งรับ ซึ่งเป็นข้อมูลที่เขาเปิดให้คนอื่นเห็นอยู่แล้ว
// ไม่ได้ไปอ่านกระเป๋าตัวละครของเขา ซึ่งกฎไม่เปิดให้และไม่ควรเปิด
//
// จำกัดวันละสามครั้ง เพราะตัวช่วยจากคนอันดับหนึ่งแรงกว่าทีมทั้งทีมของคนเพิ่งเริ่ม
// ถ้าใช้ได้ไม่จำกัด ด่านทั้งเกมจะไม่มีความหมาย
// ─────────────────────────────────────────────────────────────

export const HELPER_RUNS_PER_DAY = 3

export function helperRunsLeft(player) {
  return runsLeft(player, HELPER_RUNS_PER_DAY, 'helperRunAt', 'helperRunCount')
}

/** ผู้เล่นค่าพลังสูงสุดที่ตั้งทีมรับไว้แล้ว พร้อมตัวที่แรงที่สุดของเขา */
export async function loadHelpers(myUid, count = 3) {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('rosterPower', 'desc'), limit(20))
  )

  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.uid !== myUid && Array.isArray(u.defense) && u.defense.length)
    .map((u) => {
      const best = [...u.defense].sort((a, b) => entryPower(b) - entryPower(a))[0]
      return {
        uid: u.uid,
        username: u.username,
        guildTag: u.guildTag ?? null,
        rosterPower: u.rosterPower ?? 0,
        entry: best,
        name: CHARACTERS[best.id]?.name ?? '',
        power: entryPower(best),
      }
    })
    .slice(0, count)
}

/** นับโควตาหลังใช้ตัวช่วยจบด่าน */
export async function spendHelper(player) {
  const sameDay = isSameThaiDay(player.helperRunAt)
  await updateDoc(doc(db, 'users', player.uid), {
    helperRunAt: serverTimestamp(),
    helperRunCount: sameDay ? (player.helperRunCount ?? 0) + 1 : 1,
  })
}
