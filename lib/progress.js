import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  DIFFICULTIES,
  FIRST_CLEAR_GEMS,
  GEM_RUNS_PER_DAY,
  STORY_EXP_RUNS_PER_DAY,
} from '../data/stages'
import { gainPlayerExp } from './leveling'
import { isSameThaiDay, runsLeft } from './dayclock'
import { STAGE_DROP_CHANCE, coinsForStage } from '../data/gear'
import { addDrop } from './gear'
import { RUNS_PER_DAY as DUNGEON_RUNS, ilvlForFloor } from '../data/dungeon'
import { MATERIAL_IDS, MATERIAL_RUNS_PER_DAY, EMPTY_BAG } from '../data/materials'
import { weekIndex } from '../data/worldboss'

// ─────────────────────────────────────────────────────────────
// ค่าประสบการณ์ในเกมนี้มีสองสาย และตั้งใจให้ได้มาคนละทาง
//
// ตัวละคร — ได้จากทุกการต่อสู้ ฟาร์มลานฝึกได้ไม่จำกัด
//           เพราะผู้เล่นควรดันตัวที่เพิ่งสุ่มได้ให้ทันทีมได้เสมอ
//
// ผู้เล่น  — ได้จากของที่จำกัดต่อวันเท่านั้น คือผ่านด่านครั้งแรก (เต็มอัตรา)
//           เล่นด่านเนื้อเรื่องซ้ำ (อัตราลดลง มีโควตาต่อวัน)
//           กับเหมืองคริสตัลที่มีโควตาวันละสามครั้ง
//           ฟาร์มลานฝึกทั้งคืนก็ไม่ได้เลเวลผู้เล่นเพิ่มสักหน่วย
//
// ที่แยกแบบนี้เพราะถ้าเลเวลผู้เล่นฟาร์มได้ ตัวเลขจะบอกแค่ว่าใครนั่งกดนานกว่ากัน
// พอผูกกับโควตารายวัน เลเวลผู้เล่นจึงบอกว่า "เล่นมากี่วัน" ซึ่งปลอมไม่ได้
// ─────────────────────────────────────────────────────────────

/** ผ่านด่านเนื้อเรื่องครั้งแรก ได้ค่าประสบการณ์ผู้เล่นสามเท่าของที่ตัวละครได้ */
const FIRST_CLEAR_ACCOUNT_MULT = 3

/** เล่นด่านเนื้อเรื่องซ้ำ ได้ค่าประสบการณ์ผู้เล่นเท่ากับที่ตัวละครได้ (ไม่คูณ) และมีโควตารายวัน */
const STORY_REPLAY_ACCOUNT_MULT = 1

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

  // ───── ดันเจี้ยน ─────
  // ผ่านชั้นใหม่ครั้งแรกได้อุปกรณ์แน่นอนหนึ่งชิ้น เล่นซ้ำได้เหรียญกับโอกาสดรอป
  if (stage.dungeon) {
    const left = runsLeft(player, DUNGEON_RUNS, 'dunRunAt', 'dunRunCount')
    if (left <= 0) return { firstClear: false, gems: 0, account: null, quotaSpent: true }

    const best = player.dungeonFloor ?? 0
    const newFloor = stage.floor > best
    const ilvl = ilvlForFloor(stage.floor)
    const drop = newFloor || Math.random() < 0.5
      ? await addDrop(player.uid, 'dungeon', ilvl).catch(() => null)
      : null

    const sameDay = isSameThaiDay(player.dunRunAt)
    const sameDunWeek = (player.dunWeekIndex ?? -1) === weekIndex()
    await updateDoc(doc(db, 'users', player.uid), {
      coins: (player.coins ?? 0) + stage.coins,
      dungeonFloor: Math.max(best, stage.floor),
      dunRunAt: serverTimestamp(),
      dunRunCount: sameDay ? (player.dunRunCount ?? 0) + 1 : 1,
      dunWeekIndex: weekIndex(),
      dunWeekCount: sameDunWeek ? (player.dunWeekCount ?? 0) + 1 : 1,
    })

    return {
      firstClear: newFloor,
      gems: 0,
      account: null,
      coins: stage.coins,
      drop,
      newFloor,
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
  //
  // เดิมโค้ดตรงนี้คืนค่าออกไปเลยถ้าเล่นซ้ำแล้วได้ดาวไม่ดีขึ้น
  // ผลคือเล่นซ้ำแล้วไม่ได้อะไรเลยแม้แต่เหรียญ ซึ่งขัดกับที่ตั้งใจไว้
  // ตอนนี้เหรียญกับอุปกรณ์ได้ทุกครั้งที่ผ่าน ส่วนดาวกับเพชรยังให้เฉพาะตอนทำได้ดีขึ้น
  const chapter = stage.chapter ?? 1
  const diff =
    DIFFICULTIES.find((d) => d.id === (stage.difficulty ?? 'normal')) ?? DIFFICULTIES[0]

  const coins = Math.round(coinsForStage(chapter) * diff.reward)
  let drop = null
  if (Math.random() < STAGE_DROP_CHANCE) {
    // โหมดยากขึ้นให้ของระดับไอเทมสูงขึ้นด้วย ไม่ใช่แค่จำนวนมากขึ้น
    const ilvl = Math.min(5, chapter + diff.ilvlBonus)
    drop = await addDrop(player.uid, 'stage', ilvl).catch(() => null)
  }

  // เล่นซ้ำก็ได้ค่าประสบการณ์ผู้เล่นด้วย แต่ถูกจำกัดด้วยโควตารายวันแยกจากผ่านครั้งแรก
  // ผ่านครั้งแรกไม่กินโควตานี้ เพราะเป็นรางวัลทางเดียวที่ให้ครั้งเดียวต่อด่านอยู่แล้ว
  const storyExpLeft = firstClear
    ? Infinity
    : runsLeft(player, STORY_EXP_RUNS_PER_DAY, 'storyExpRunAt', 'storyExpRunCount')

  let accountExp = 0
  if (firstClear) accountExp = exp * FIRST_CLEAR_ACCOUNT_MULT
  else if (storyExpLeft > 0) accountExp = Math.round(exp * STORY_REPLAY_ACCOUNT_MULT)

  const account = gainPlayerExp(player.playerLevel ?? 1, player.playerExp ?? 0, accountExp)

  // นับจำนวนครั้งที่ผ่านด่านผจญภัย (ทุกด่าน ทุกโหมดความยาก) ไว้ให้เควสรายวัน/รายสัปดาห์อ่าน
  const sameAdvDay = isSameThaiDay(player.advRunAt)
  const sameAdvWeek = (player.advWeekIndex ?? -1) === weekIndex()

  // เขียนทั้งก้อนแทนการใช้ field path แบบจุด
  // เพราะรหัสด่านอย่าง "1-1" ขึ้นต้นด้วยตัวเลขและมีขีดกลาง
  // ซึ่ง Firestore ไม่ยอมรับเป็น field path
  const patch = {
    playerLevel: account.level,
    playerExp: account.exp,
    coins: (player.coins ?? 0) + coins,
    stageProgress: {
      ...(player.stageProgress ?? {}),
      [stageId]: Math.max(previous, stars),
    },
    advRunAt: serverTimestamp(),
    advRunCount: sameAdvDay ? (player.advRunCount ?? 0) + 1 : 1,
    advWeekIndex: weekIndex(),
    advWeekCount: sameAdvWeek ? (player.advWeekCount ?? 0) + 1 : 1,
  }

  if (firstClear) {
    patch.gems = player.gems + diff.gems
  } else if (accountExp > 0) {
    const sameStoryDay = isSameThaiDay(player.storyExpRunAt)
    patch.storyExpRunAt = serverTimestamp()
    patch.storyExpRunCount = sameStoryDay ? (player.storyExpRunCount ?? 0) + 1 : 1
  }

  await updateDoc(doc(db, 'users', player.uid), patch)

  return {
    firstClear,
    gems: firstClear ? diff.gems : 0,
    accountExp,
    account,
    coins,
    drop,
  }
}
