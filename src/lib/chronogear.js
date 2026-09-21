import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { invalidateRoster } from './rostercache'
import { SLOT_IDS, rollSubstats, rollVariance } from '../data/gear'
import { CHRONOGEAR_RATES } from '../data/chronogear'

// ─────────────────────────────────────────────────────────────
// ตู้อุปกรณ์โคลโน — ฝั่งตรรกะการสุ่ม
//
// การันตีชั้นเดียว (ต่างจากตู้จักรพรรดิโคลโนที่มีสองชั้น) เพราะตู้นี้มีแค่ระดับ "การันตี
// เทพนิยาย" ระดับเดียวที่มีความหมาย สามเกรดที่เหลือ (ตำนาน/เทพ/อมตะ) ล้วนเป็นของดีอยู่แล้ว
// ไม่จำเป็นต้องมีการันตีรองอีกชั้นเหมือนฝั่งตัวละคร
//
// ของทุกชิ้นจากตู้นี้ล็อกระดับไอเทมไว้ที่ 5 (สูงสุด) เสมอ เพราะเป็นเนื้อหาที่จ่ายด้วยเพชร
// ไม่ใช่ของดรอปฟรีตามความคืบหน้า จึงไม่ผูกกับบทที่ผ่านมาแล้วเหมือนของดรอปปกติ
// ─────────────────────────────────────────────────────────────

export const CHRONOGEAR_PULL_COST = 500
export const CHRONOGEAR_TEN_PULL_COST = 4500
export const CHRONOGEAR_HARD_PITY = 60 // ครบ 60 ครั้งได้เทพนิยายการันตีแน่นอน
export const CHRONOGEAR_ILVL = 5

const bag = (uid) => collection(db, 'users', uid, 'gear')

/** สุ่มเกรดหนึ่งครั้ง โดยดูตัวนับการันตีประกอบ — ส่งออกแยกให้ทดสอบตรง ๆ ได้ ไม่ยุ่ง Firestore */
export function rollOneChronoGrade(pity) {
  let grade

  if (pity.sinceBlack + 1 >= CHRONOGEAR_HARD_PITY) {
    grade = 'black'
  } else {
    const r = Math.random()
    let acc = 0
    grade = Object.keys(CHRONOGEAR_RATES).find((g) => {
      acc += CHRONOGEAR_RATES[g]
      return r < acc
    })
    if (!grade) grade = 'orange'
  }

  pity.sinceBlack = grade === 'black' ? 0 : pity.sinceBlack + 1
  return grade
}

/** สร้างของหนึ่งชิ้นจากเกรดที่สุ่มได้ ช่องสวมใส่สุ่มเท่า ๆ กันทุกช่องเหมือนของดรอปปกติ */
export function rollChronoGear(grade) {
  const slot = SLOT_IDS[Math.floor(Math.random() * SLOT_IDS.length)]
  return {
    slot,
    grade,
    ilvl: CHRONOGEAR_ILVL,
    plus: 0,
    substats: rollSubstats(grade, slot),
    variance: rollVariance(),
  }
}

export async function pullChronoGear(player, count) {
  const cost = count === 10 ? CHRONOGEAR_TEN_PULL_COST : CHRONOGEAR_PULL_COST * count
  if (player.gems < cost) throw new Error('เพชรไม่พอ')

  const pity = { sinceBlack: player.chronoGearPitySinceBlack ?? 0 }
  const rolled = []
  for (let i = 0; i < count; i++) {
    const grade = rollOneChronoGrade(pity)
    rolled.push(rollChronoGear(grade))
  }

  const batch = writeBatch(db)
  const items = rolled.map((gear, i) => {
    // ต่อท้ายด้วยเลขลำดับกันชนกันเองภายในชุดเดียว เผื่อกรณีที่ Date.now() ตกช่วงมิลลิวินาทีเดียวกัน
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${i}`
    batch.set(doc(bag(player.uid), id), {
      ...gear,
      source: 'gacha',
      equippedBy: null,
      obtainedAt: serverTimestamp(),
    })
    return { id, ...gear }
  })

  batch.update(doc(db, 'users', player.uid), {
    gems: player.gems - cost,
    chronoGearPitySinceBlack: pity.sinceBlack,
  })

  await batch.commit()
  invalidateRoster()

  return { items, spent: cost, pity: pity.sinceBlack }
}
