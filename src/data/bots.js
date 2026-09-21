import { CHARACTERS, TEAM_SIZE } from './characters'
import { rankOf } from './ranks'
import { maxAwakenFor } from './ascension'
import { entryPower } from '../lib/power'

// ─────────────────────────────────────────────────────────────
// คู่ซ้อมจำลอง
//
// สร้างขึ้นในเครื่อง ไม่ได้อยู่ใน Firestore เลย
// เพราะถ้าเขียนบอทลงฐานข้อมูล มันจะไปโผล่ในกระดานอันดับและหน้าค้นหาเพื่อน
// ปนกับคนจริง ซึ่งไม่ควร
//
// ความแข็งแกร่งผูกกับแรงค์ของผู้เล่นที่กำลังดูอยู่ (ดู BOT_CP_BY_RANK) ยิ่งแรงค์สูงบอทยิ่งเก่ง
// ไม่ใช่ของง่ายให้ฟาร์มฟรี และไม่ใช่กำแพงที่ชนะไม่ได้
// ─────────────────────────────────────────────────────────────

/**
 * ค่าพลังต่อสู้เป้าหมายของบอทตามแรงค์ของผู้เล่น (ค่าพลังรวมทั้งทีมห้าตัว)
 *
 * ไล่ตามลำดับแรงค์ ผู้ฝึกหัดราว 5,000 ถึงกึ่งเทพราว 300,000 ขั้นบนเพิ่มทีละราว 1.7-1.8 เท่า
 * (เพิ่มแบบคูณ ไม่ใช่บวก เพราะค่าพลังของทีมโตแบบทบต้นตามเลเวล ดาว และการปลุกร่าง)
 * ผู้ฝึกหัดที่ 5,000 ต่ำกว่าทีมที่ตัวละครธรรมดาห้าตัวเลเวล 1 ทำได้ (ราว 5,700) บอทจึงตันที่เลเวล 1 ดาว 1
 * และมีค่าพลังราว 5,700 แทน ดู BOT_TEAMS สามชุดแรกที่เลือกตัวค่าพลังต่ำสุดไว้เพื่อเหตุนี้
 * ช่องที่ i คือแรงค์ index i ใน RANKS
 */
export const BOT_CP_BY_RANK = [5000, 17000, 30000, 55000, 95000, 170000, 300000]

/** บอทสามตัวต่อรอบ อ่อนกว่า พอดี และแข็งกว่าเล็กน้อยรอบค่าเป้าหมายของแรงค์นั้น */
const BOT_SCALES = [0.9, 1.0, 1.1]

export function botTargetCp(points = 0) {
  return BOT_CP_BY_RANK[rankOf(points).index] ?? BOT_CP_BY_RANK[0]
}

const BOT_NAMES = [
  'เงาไร้นาม', 'อัศวินพเนจร', 'ผู้เฝ้าประตูเก่า', 'นักรบไร้ธง',
  'ลูกศิษย์จอมเวท', 'ทหารรับจ้างเหนือ', 'ผู้แสวงบุญ', 'นายพรานเงียบ',
  'ผู้สืบทอดเปลว', 'หมอผีเร่ร่อน', 'ดาบรับจ้างใต้', 'ผู้พิทักษ์ซากเมือง',
]

/** ชุดตัวละครของแต่ละบอท ไล่จากอ่อนไปแข็งตามลำดับ */
const BOT_TEAMS = [
  ['moss', 'mossrik', 'aerdon', 'bren', 'aqualin'],
  ['ashwen', 'breezel', 'radia', 'torrek', 'terrun'],
  ['aqualin', 'moss', 'torrek', 'riplen', 'ashwen'],
  ['galen', 'lumina', 'corvin', 'neria', 'bren'],
  ['athen', 'galen', 'lumina', 'bren', 'moss'],
  ['zephyr', 'iris', 'moss', 'corvin', 'neria'],
  ['velka', 'galen', 'lumina', 'bren', 'torg'],
  ['zephyr', 'velka', 'iris', 'lumina', 'moss'],
  ['athen', 'velka', 'iris', 'zephyr', 'lumina'],
  ['drakos', 'galen', 'lumina', 'velka', 'moss'],
  ['drakos', 'umbra', 'lumina', 'velka', 'zephyr'],
  ['drakos', 'umbra', 'solaris', 'velka', 'iris'],
  // สามชุดท้ายมีตัว UR/UR+ เพราะทีม SSR ล้วนเก่งได้ไม่ถึงราว 300,000 ที่กึ่งเทพต้องการ
  ['seraphyx', 'zephyrion', 'elyria', 'drakos', 'umbra'],
  ['nyxaroth', 'abyssara', 'ignatrix', 'elyria', 'zephyrion'],
  ['chronathar', 'seraphyx', 'nyxaroth', 'elyria', 'ignatrix'],
]

// awaken คือขั้นปลุกร่างที่ต้องการ แต่ละตัวถูกตัดที่ขั้นสูงสุดของตัวมันเอง (ตัว UR ไปได้ 5 ตัวอื่น 3)
function makeEntry(id, level, star = 1, tier = 0, awaken = 0) {
  return {
    id,
    level,
    star,
    exp: 0,
    skillLevel: Math.min(10, 1 + Math.floor(level / 12)),
    tier,
    awaken: Math.min(awaken, maxAwakenFor(id)),
  }
}

function teamCp(ids, level, star = 1, tier = 0, awaken = 0) {
  return ids.reduce((sum, id) => sum + entryPower(makeEntry(id, level, star, tier, awaken)), 0)
}

/**
 * หาเลเวลที่ทำให้ทีมบอทมีค่าพลังใกล้เป้าที่สุด
 *
 * ตอนแรกผมคำนวณเลเวลบอทจากแต้มของผู้เล่นตรง ๆ แล้วผลออกมาเพี้ยนมาก
 * เพราะแต้มบอกแค่ว่าชนะมากี่ครั้ง ไม่ได้บอกว่าทีมแข็งแค่ไหน
 * พอถึงแรงค์สูงบอทเลยแรงกว่าผู้เล่นสามเท่า ซึ่งท้าไปก็แพ้อย่างเดียว
 * ตอนนี้เทียบกับค่าพลังจริงของทีมบุกแทน บอทจึงสูสีเสมอไม่ว่าผู้เล่นจะปั้นมาแค่ไหน
 */
function fitLevel(ids, targetCp, star, tier, awaken = 0) {
  let lo = 1
  let hi = 100
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (teamCp(ids, mid, star, tier, awaken) < targetCp) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * หาชุดเลเวล ดาว และขั้นยกระดับที่ทำให้บอทมีค่าพลังใกล้เป้า
 *
 * ต้องไล่ดาวกับขั้นยกระดับด้วย ไม่ใช่เลเวลอย่างเดียว
 * เพราะผู้เล่นที่ปั้นจนสุดมีค่าพลังเกินที่เลเวล 100 ดาวเดียวจะไปถึงได้
 * ถ้าดันแต่เลเวล บอทจะตันแล้วกลายเป็นของฟรีให้ฟาร์มแต้ม
 */
function fitBuild(ids, targetCp) {
  // ปลุกร่างเป็นวงนอกสุด ลองเป็นทางเลือกสุดท้ายหลังเลเวล ดาว และขั้นยกระดับตันแล้วเท่านั้น
  // เป้าหมายของแรงค์ต่ำจึงได้บิลด์แบบเดิมทุกอย่าง มีแต่แรงค์สูงที่ต้องอาศัยการปลุกร่างถึงจะไปถึง
  for (const awaken of [0, 1, 2, 3, 4, 5]) {
    for (const tier of [0, 1, 2]) {
      for (const star of [1, 2, 3, 4, 5]) {
        const level = fitLevel(ids, targetCp, star, tier, awaken)
        if (level < 100) return { level, star, tier, awaken }
      }
    }
  }
  return { level: 100, star: 5, tier: 2, awaken: 5 }
}

/**
 * สร้างคู่ซ้อมตามจำนวนที่ขอ
 *
 * ใช้ดัชนีจากแต้มของผู้เล่นเป็นตัวเลือกชุดฐาน ไม่ได้สุ่มล้วน
 * ผู้เล่นจึงเจอชุดที่เหมาะกับระดับตัวเอง ไม่ใช่เจอทีม SSR ตั้งแต่แต้มศูนย์
 *
 * แต่ต้องมีสุ่มปนอยู่ด้วย เพราะ findOpponents ตกมาเรียกฟังก์ชันนี้ตรง ๆ ทุกครั้งที่มีคนจริง
 * ไม่พอสามคน (ซึ่งเป็นเกือบตลอดเวลาตอนผู้เล่นยังน้อย) — ถ้าไม่สุ่มอะไรเลย กดหาคู่ใหม่กี่ครั้ง
 * ก็จะได้บอทชุดเดิมทุกตัวเป๊ะ ๆ เพราะแต้มกับค่าพลังทีมไม่เปลี่ยนระหว่างกด
 */
export function makeBots(player, count = 3) {
  const points = player?.pvpPoints ?? 0
  const tier = rankOf(points).index

  // เป้าหมายผูกกับแรงค์ ไม่ผูกกับค่าพลังของผู้เล่นแล้ว (เดิมเทียบทีมบุกของผู้เล่นตรง ๆ)
  // แรงค์สูงจึงเจอบอทแรงตามที่ตั้งไว้เสมอ ไม่ว่าทีมตัวเองจะปั้นมาแค่ไหน
  const target = botTargetCp(points)
  const SCALES = BOT_SCALES

  // ผู้ฝึกหัดใช้ได้แค่สามชุดแรก ชุดถัดไปแม้เลเวล 1 ดาว 1 ก็มีค่าพลังเกินเป้า 5,000 ไปมาก
  const maxSlot = tier === 0 ? 2 : BOT_TEAMS.length - 1
  const usedSlots = new Set()
  const bots = []
  for (let i = 0; i < count; i++) {
    // สุ่มขยับชุดตัวละครในช่วง ±1 รอบตำแหน่งฐาน ไม่ใช่สุ่มเต็มช่วง
    // เพื่อให้ยังอยู่ใกล้ระดับที่เหมาะกับผู้เล่น แต่ไม่ใช่ชุดเดิมทุกครั้งที่กดหาใหม่
    const base = tier * 2 + (i % 3)
    let slot = base
    for (let guard = 0; guard < 6; guard++) {
      const offset = Math.floor(Math.random() * 3) - 1
      slot = Math.max(0, Math.min(maxSlot, base + offset))
      if (!usedSlots.has(slot)) break
    }
    usedSlots.add(slot)

    const ids = BOT_TEAMS[slot].filter((id) => CHARACTERS[id]).slice(0, TEAM_SIZE)
    // สุ่มค่าพลังเป้าหมายเพิ่มอีก ±6% กันบอทระดับ/ดาวเดิมเป๊ะเวลาสุ่มชุดตัวละครได้ตำแหน่งเดิมพอดี
    const jitter = 0.94 + Math.random() * 0.12
    const build = fitBuild(ids, target * SCALES[i % SCALES.length] * jitter)

    bots.push({
      uid: `bot:${slot}:${i}:${Math.floor(Math.random() * 1e6)}`,
      isBot: true,
      username: BOT_NAMES[slot % BOT_NAMES.length],
      playerLevel: build.level,
      pvpPoints: Math.max(0, points + [-60, 0, 70][i % 3]),
      titleIndex: 0,
      defense: ids.map((id) => makeEntry(id, build.level, build.star, build.tier, build.awaken)),
    })
  }
  return bots
}
