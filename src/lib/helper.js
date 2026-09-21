import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { isSameThaiDay, runsLeft } from './dayclock'
import { entryPower } from './power'
import { CHARACTERS } from '../data/characters'
import { loadFriends } from './friends'

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
        nickname: u.nickname ?? null,
        guildTag: u.guildTag ?? null,
        rosterPower: u.rosterPower ?? 0,
        entry: best,
        name: CHARACTERS[best.id]?.name ?? '',
        power: entryPower(best),
      }
    })
    .slice(0, count)
}

/** ด่านผจญภัย (เนื้อเรื่อง) รหัสเป็น บท-ลำดับ เช่น 8-6 หรือ 8-6@hard ไม่รวมลานฝึก เหมือง หอคอย รอยอดีต และดันเจี้ยนเหรด */
export function isAdventureStage(stage) {
  return /^\d+-\d+(@[a-z]+)?$/.test(stage?.id ?? '')
}

/**
 * ตัวที่แรงที่สุดของผู้เล่นคนหนึ่ง (ตามค่าพลังจริง รวมเลเวล ดาว ยกระดับ ปลุกร่าง อุปกรณ์)
 *
 * ดูจาก roster ซึ่งเป็นสรุปตัวละครทุกตัวที่เจ้าตัวจดไว้บนเอกสารผู้เล่น (ดู buildRoster ใน lib/power.js)
 * ไม่ใช่แค่ห้าตัวในทีมตั้งรับ จึงได้ "ตัวที่โหดที่สุดของเขาจริง ๆ" ไม่ต้องอ่านกระเป๋าตัวละครส่วนตัวที่กฎไม่เปิดให้
 * บัญชีเก่าที่ยังไม่เคยจด roster ตกกลับไปใช้ทีมตั้งรับแทน
 */
export function strongestOf(u) {
  const fromRoster = Object.values(u?.roster ?? {})
  const pool = fromRoster.length ? fromRoster : Array.isArray(u?.defense) ? u.defense : []
  const valid = pool.filter((e) => e && CHARACTERS[e.id])
  if (!valid.length) return null
  return valid.reduce((a, b) => (entryPower(b) > entryPower(a) ? b : a))
}

/** เพื่อนของเราทุกคนที่มีตัวละคร พร้อมตัวที่แรงที่สุดของแต่ละคน เรียงจากแรงไปอ่อน */
export async function loadFriendHelpers(myUid) {
  const friends = await loadFriends(myUid)
  return friends
    .filter((f) => !f.missing)
    .map((f) => {
      const best = strongestOf(f)
      if (!best) return null
      return {
        uid: f.uid,
        username: f.username,
        nickname: f.nickname ?? null,
        guildTag: f.guildTag ?? null,
        rosterPower: f.rosterPower ?? 0,
        entry: best,
        name: CHARACTERS[best.id].name,
        power: entryPower(best),
        isFriend: true,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.power - a.power)
}

/** นับโควตาหลังใช้ตัวช่วยจบด่าน */
export async function spendHelper(player) {
  const sameDay = isSameThaiDay(player.helperRunAt)
  await updateDoc(doc(db, 'users', player.uid), {
    helperRunAt: serverTimestamp(),
    helperRunCount: sameDay ? (player.helperRunCount ?? 0) + 1 : 1,
  })
}
