// ─────────────────────────────────────────────────────────────
// ระบบเควส
//
// สามชุด
//   รายวัน   — รีเซ็ตเที่ยงคืนไทย นับจากตัวนับโควตารายวันที่แต่ละระบบมีอยู่แล้ว
//   รายสัปดาห์ — รีเซ็ตตามหมายเลขสัปดาห์เดียวกับที่บอสโลก/ศึกชิงธงใช้ ต้องมีตัวนับใหม่
//               เพราะของเดิมมีแต่แบบรายวัน
//   ถาวร     — ผูกกับเลเวลผู้เล่น ทำครั้งเดียวจบไม่รีเซ็ต ได้ทั้งเพชรและฉายาประจำเลเวลนั้น
//
// รางวัลทุกชุดจ่ายผ่านกล่องจดหมาย (เหมือนรางวัลรายวันตามแรงค์) เพราะกฎฝั่ง Security Rules
// ตรวจจำนวนเพชรจากสูตรได้แน่นอน ไม่ต้องเปิดช่องให้ผู้เล่นเขียนจำนวนเพชรเอง
// ความคืบหน้าที่โชว์ในหน้าเควสอิงจากตัวนับที่ฝั่งไคลเอนต์เขียนเอง กฎจึงตรวจได้แค่จำนวนเพชร
// กับกันเควสเดิมซ้ำ (ผ่าน mailId เฉพาะของแต่ละเควส/วัน/สัปดาห์) เหมือนของอื่นในเกมนี้ทั้งหมด
// ─────────────────────────────────────────────────────────────

export const DAILY_QUESTS = [
  { id: 'adv', name: 'ลุยด่านผจญภัย', target: 5, gems: 40, countField: 'advRunCount' },
  { id: 'boss', name: 'โจมตีบอสโลก', target: 3, gems: 40, countField: 'bossRunCount' },
  { id: 'arena', name: 'ลงสนามประลอง', target: 5, gems: 40, countField: 'pvpRunCount' },
  { id: 'dungeon', name: 'ลุยดันเจี้ยน', target: 3, gems: 30, countField: 'dunRunCount' },
  { id: 'raid', name: 'โจมตีบอสกิลด์', target: 2, gems: 30, countField: 'raidRunCount' },
]

export const WEEKLY_QUESTS = [
  { id: 'adv', name: 'ลุยด่านผจญภัย', target: 40, gems: 250, countField: 'advWeekCount' },
  { id: 'boss', name: 'โจมตีบอสโลก', target: 12, gems: 250, countField: 'bossWeekCount' },
  { id: 'arena', name: 'ลงสนามประลอง', target: 25, gems: 250, countField: 'pvpWeekCount' },
  { id: 'dungeon', name: 'ลุยดันเจี้ยน', target: 15, gems: 180, countField: 'dunWeekCount' },
  { id: 'raid', name: 'โจมตีบอสกิลด์', target: 10, gems: 180, countField: 'raidWeekCount' },
]

/**
 * เควสถาวร ผูกกับเลเวลผู้เล่น ได้ทั้งเพชรและฉายาประจำเลเวลนั้น
 * ฉายาเหล่านี้แยกจากฉายาตามแรงค์ประลองโดยสิ้นเชิง เลือกโชว์ได้อีกช่องหนึ่งต่างหาก
 */
export const PERMANENT_QUESTS = [
  { level: 30, gems: 500, title: 'นักรบดาวรุ่ง' },
  { level: 60, gems: 1000, title: 'ผู้พิชิตแดนไกล' },
  { level: 90, gems: 2000, title: 'ขุนศึกแห่งสมรภูมิ' },
  { level: 120, gems: 3500, title: 'จักรพรรดิในตำนาน' },
  { level: 150, gems: 6000, title: 'จักรพรรดิเหนือกาลเวลา' },
]

export function dailyQuestMailId(id, dayKey) {
  return `quest-daily-${id}-${dayKey}`
}

export function weeklyQuestMailId(id, week) {
  return `quest-weekly-${id}-${week}`
}

export function permQuestMailId(level) {
  return `quest-perm-${level}`
}
