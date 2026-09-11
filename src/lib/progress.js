import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { FIRST_CLEAR_GEMS, GEM_RUNS_PER_DAY } from '../data/stages'
import { gainPlayerExp } from './leveling'
import { isSameThaiDay, runsLeft } from './dayclock'
import { MATERIAL_IDS, MATERIAL_RUNS_PER_DAY, EMPTY_BAG } from '../data/materials'

// ─────────────────────────────────────────────────────────────
// ค่าประสบการณ์ในเกมนี้มีสองสาย และตั้งใจให้ได้มาคนละทาง
//
// ตัวละคร — ได้จากทุกการต่อสู้ ฟาร์มลานฝึกได้ไม่จำกัด
//           เพราะผู้เล่นควรดันตัวที่เพิ่งสุ่มได้ให้ทันทีมได้เสมอ
//
// ผู้เล่น  — ได้จากของที่จำกัดต่อวันเท่านั้น คือผ่านด่านครั้งแรก
//           กับเหมืองคริสตัลที่มีโควตาวันละสามครั้ง
//           ฟาร์มลานฝึกทั้งคืนก็ไม่ได้เลเวลผู้เล่นเพิ่มสักหน่วย
//
// ที่แยกแบบนี้เพราะถ้าเลเวลผู้เล่นฟาร์มได้ ตัวเลขจะบอกแค่ว่าใครนั่งกดนานกว่ากัน
// พอผูกกับโควตารายวัน เลเวลผู้เล่นจึงบอกว่า "เล่นมากี่วัน" ซึ่งปลอมไม่ได้
// ─────────────────────────────────────────────────────────────

/** ผ่านด่านเนื้อเรื่องครั้งแรก ได้ค่าประสบการณ์ผู้เล่นสามเท่าของที่ตัวละครได้ */
const FIRST_CLEAR_ACCOUNT_MULT = 3

export async function saveStageResult(player, stage, stars, exp) {
  const stageId = stage.id
  const previous = player.stageProgress?.[stageId] ?? 0
  const firstClear = !stage.training && !stage.gemStage && previous === 0

  // ───── ลานฝึก ─────
  // ไม่บันทึกความคืบหน้า ไม่ให้เพชร และไม่ให้ค่าประสบการณ์ผู้เล่น
  // เล่นซ้ำได้ไม่จำกัดเพื่อดันเลเวลตัวละครอย่างเดียว
  if (stage.training) {
    return { firstClear: false, gems: 0, account: null }
  }

  // ───── เหมืองคริสตัล ─────
  if (stage.gemStage) {
    const left = runsLeft(player, GEM_RUNS_PER_DAY)
    if (left <= 0) return { firstClear: false, gems: 0, account: null, quotaSpent: true }

    const account = gainPlayerExp(
      player.playerLevel ?? 1,
      player.playerExp ?? 0,
      stage.accountExp ?? 0
    )
    const sameDay = isSameThaiDay(player.gemRunAt)

    await updateDoc(doc(db, 'users', player.uid), {
      playerLevel: account.level,
      playerExp: account.exp,
      gems: player.gems + stage.gems,
      gemRunAt: serverTimestamp(),
      gemRunCount: sameDay ? (player.gemRunCount ?? 0) + 1 : 1,
    })

    return {
      firstClear: false,
      gems: stage.gems,
      accountExp: stage.accountExp ?? 0,
      account,
      runsLeft: left - 1,
    }
  }

  // ───── ด่านหาของ ─────
  // ของที่ดรอปเป็นจำนวนตายตัวตามด่าน ไม่สุ่ม เพื่อให้กฎตรวจได้
  // ใช้โควตาคนละชุดกับเหมืองคริสตัล จะได้ไม่แย่งกัน
  if (stage.materialStage) {
    const left = runsLeft(player, MATERIAL_RUNS_PER_DAY, 'matRunAt', 'matRunCount')
    if (left <= 0) return { firstClear: false, gems: 0, account: null, quotaSpent: true }

    const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
    MATERIAL_IDS.forEach((id) => {
      bag[id] = (bag[id] ?? 0) + (stage.drops[id] ?? 0)
    })

    const sameDay = isSameThaiDay(player.matRunAt)
    await updateDoc(doc(db, 'users', player.uid), {
      materials: bag,
      matRunAt: serverTimestamp(),
      matRunCount: sameDay ? (player.matRunCount ?? 0) + 1 : 1,
    })

    return { firstClear: false, gems: 0, account: null, drops: stage.drops, runsLeft: left - 1 }
  }

  // ───── ด่านเนื้อเรื่อง ─────
  if (!firstClear && stars <= previous) return { firstClear: false, gems: 0, account: null }

  const accountExp = firstClear ? exp * FIRST_CLEAR_ACCOUNT_MULT : 0
  const account = gainPlayerExp(player.playerLevel ?? 1, player.playerExp ?? 0, accountExp)

  // เขียนทั้งก้อนแทนการใช้ field path แบบจุด
  // เพราะรหัสด่านอย่าง "1-1" ขึ้นต้นด้วยตัวเลขและมีขีดกลาง
  // ซึ่ง Firestore ไม่ยอมรับเป็น field path
  const patch = {
    playerLevel: account.level,
    playerExp: account.exp,
    stageProgress: {
      ...(player.stageProgress ?? {}),
      [stageId]: Math.max(previous, stars),
    },
  }

  if (firstClear) patch.gems = player.gems + FIRST_CLEAR_GEMS

  await updateDoc(doc(db, 'users', player.uid), patch)

  return {
    firstClear,
    gems: firstClear ? FIRST_CLEAR_GEMS : 0,
    accountExp,
    account,
  }
}
