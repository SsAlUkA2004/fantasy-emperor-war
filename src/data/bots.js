import { CHARACTERS, TEAM_SIZE } from './characters'
import { rankOf } from './ranks'
import { entryPower } from '../lib/power'

// ─────────────────────────────────────────────────────────────
// คู่ซ้อมจำลอง
//
// สร้างขึ้นในเครื่อง ไม่ได้อยู่ใน Firestore เลย
// เพราะถ้าเขียนบอทลงฐานข้อมูล มันจะไปโผล่ในกระดานอันดับและหน้าค้นหาเพื่อน
// ปนกับคนจริง ซึ่งไม่ควร
//
// ความแข็งแกร่งผูกกับแต้มของผู้เล่นที่กำลังดูอยู่ จึงสูสีเสมอ
// ไม่ใช่ของง่ายให้ฟาร์มฟรี และไม่ใช่กำแพงที่ชนะไม่ได้
// ─────────────────────────────────────────────────────────────

const BOT_NAMES = [
  'เงาไร้นาม', 'อัศวินพเนจร', 'ผู้เฝ้าประตูเก่า', 'นักรบไร้ธง',
  'ลูกศิษย์จอมเวท', 'ทหารรับจ้างเหนือ', 'ผู้แสวงบุญ', 'นายพรานเงียบ',
  'ผู้สืบทอดเปลว', 'หมอผีเร่ร่อน', 'ดาบรับจ้างใต้', 'ผู้พิทักษ์ซากเมือง',
]

/** ชุดตัวละครของแต่ละบอท ไล่จากอ่อนไปแข็งตามลำดับ */
const BOT_TEAMS = [
  ['bren', 'moss', 'torg', 'neria', 'corvin'],
  ['torg', 'neria', 'bren', 'moss', 'corvin'],
  ['athen', 'moss', 'torg', 'bren', 'neria'],
  ['galen', 'lumina', 'corvin', 'neria', 'bren'],
  ['athen', 'galen', 'lumina', 'bren', 'moss'],
  ['zephyr', 'iris', 'moss', 'corvin', 'neria'],
  ['velka', 'galen', 'lumina', 'bren', 'torg'],
  ['zephyr', 'velka', 'iris', 'lumina', 'moss'],
  ['athen', 'velka', 'iris', 'zephyr', 'lumina'],
  ['drakos', 'galen', 'lumina', 'velka', 'moss'],
  ['drakos', 'umbra', 'lumina', 'velka', 'zephyr'],
  ['drakos', 'umbra', 'solaris', 'velka', 'iris'],
]

function makeEntry(id, level, star = 1, tier = 0) {
  return {
    id,
    level,
    star,
    exp: 0,
    skillLevel: Math.min(10, 1 + Math.floor(level / 12)),
    tier,
    awaken: 0,
  }
}

function teamCp(ids, level, star = 1, tier = 0) {
  return ids.reduce((sum, id) => sum + entryPower(makeEntry(id, level, star, tier)), 0)
}

/**
 * หาเลเวลที่ทำให้ทีมบอทมีค่าพลังใกล้เป้าที่สุด
 *
 * ตอนแรกผมคำนวณเลเวลบอทจากแต้มของผู้เล่นตรง ๆ แล้วผลออกมาเพี้ยนมาก
 * เพราะแต้มบอกแค่ว่าชนะมากี่ครั้ง ไม่ได้บอกว่าทีมแข็งแค่ไหน
 * พอถึงแรงค์สูงบอทเลยแรงกว่าผู้เล่นสามเท่า ซึ่งท้าไปก็แพ้อย่างเดียว
 * ตอนนี้เทียบกับค่าพลังจริงของทีมบุกแทน บอทจึงสูสีเสมอไม่ว่าผู้เล่นจะปั้นมาแค่ไหน
 */
function fitLevel(ids, targetCp, star, tier) {
  let lo = 1
  let hi = 100
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (teamCp(ids, mid, star, tier) < targetCp) lo = mid + 1
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
  for (const tier of [0, 1, 2]) {
    for (const star of [1, 2, 3, 4, 5]) {
      const level = fitLevel(ids, targetCp, star, tier)
      if (level < 100) return { level, star, tier }
    }
  }
  return { level: 100, star: 5, tier: 2 }
}

/**
 * สร้างคู่ซ้อมตามจำนวนที่ขอ
 *
 * ใช้ดัชนีจากแต้มของผู้เล่นเป็นตัวเลือกชุด ไม่ได้สุ่มล้วน
 * ผู้เล่นจึงเจอชุดที่เหมาะกับระดับตัวเอง ไม่ใช่เจอทีม SSR ตั้งแต่แต้มศูนย์
 */
export function makeBots(player, count = 3, myTeamCp = 0) {
  const points = player?.pvpPoints ?? 0
  const tier = rankOf(points).index

  // ถ้ายังไม่รู้ค่าพลังของผู้เล่น ใช้ค่าประมาณจากแต้มไปก่อน
  const target = myTeamCp > 0 ? myTeamCp : 6000 + points * 6

  // สามระดับ อ่อนกว่า สูสี และแข็งกว่าเล็กน้อย
  // ตั้งให้ต่ำกว่าค่าพลังจริงเล็กน้อยทั้งสามตัว เพราะในการสู้อัตโนมัติ
  // การจัดชุดตัวละครมีผลมากกว่าค่าพลัง บอทที่ค่าพลังเท่ากันจึงมักชนะ
  const SCALES = [0.78, 0.92, 1.05]

  const bots = []
  for (let i = 0; i < count; i++) {
    const slot = Math.min(BOT_TEAMS.length - 1, tier * 2 + i)
    const ids = BOT_TEAMS[slot].filter((id) => CHARACTERS[id]).slice(0, TEAM_SIZE)
    const build = fitBuild(ids, target * SCALES[i % SCALES.length])

    bots.push({
      uid: `bot:${slot}:${i}`,
      isBot: true,
      username: BOT_NAMES[slot % BOT_NAMES.length],
      playerLevel: build.level,
      pvpPoints: Math.max(0, points + [-60, 0, 70][i % 3]),
      titleIndex: 0,
      defense: ids.map((id) => makeEntry(id, build.level, build.star, build.tier)),
    })
  }
  return bots
}
