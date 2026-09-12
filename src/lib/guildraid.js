import { doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import {
  RAID_DAMAGE_CAP,
  RAID_HITS_PER_DAY,
  coinsFromDamage,
  raidBossForWeek,
  raidPoolHp,
  raidWeek,
} from '../data/guildraid'
import { isSameThaiDay, runsLeft } from './dayclock'

const raidRef = (gid) => doc(db, 'guilds', gid, 'raid', 'current')

export async function loadRaid(guildId) {
  const week = raidWeek()
  const spec = raidBossForWeek(week)
  const snap = await getDoc(raidRef(guildId))

  if (snap.exists() && snap.data().week === week) {
    return { ...snap.data(), spec }
  }

  const fresh = {
    week,
    bossId: spec.id,
    maxHp: raidPoolHp(spec),
    hp: raidPoolHp(spec),
    hits: 0,
  }

  try {
    await setDoc(raidRef(guildId), { ...fresh, resetAt: serverTimestamp() })
  } catch {
    const again = await getDoc(raidRef(guildId))
    if (again.exists()) return { ...again.data(), spec }
  }

  return { ...fresh, spec }
}

export function raidHitsLeft(player) {
  return runsLeft(player, RAID_HITS_PER_DAY, 'raidRunAt', 'raidRunCount')
}

/**
 * ส่งดาเมจเข้าบอสกิลด์
 *
 * transaction เดียวแตะสามเอกสาร คือบอส คะแนนกิลด์ และคะแนนสะสมของสมาชิกคนนี้
 * ทั้งสามต้องขยับพร้อมกันเสมอ ไม่งั้นคะแนนกิลด์กับผลรวมของสมาชิกจะไม่ตรงกัน
 */
export async function submitRaidDamage(player, guildId, week, rawDamage) {
  const damage = Math.max(1, Math.min(RAID_DAMAGE_CAP, Math.round(rawDamage)))

  const result = await runTransaction(db, async (tx) => {
    const bossSnap = await tx.get(raidRef(guildId))
    if (!bossSnap.exists()) throw new Error('ยังไม่มีบอสของกิลด์ในสัปดาห์นี้')

    const boss = bossSnap.data()
    if (boss.week !== week) throw new Error('บอสเปลี่ยนตัวแล้ว ลองใหม่อีกครั้ง')
    if (boss.hp <= 0) throw new Error('บอสตัวนี้ถูกปราบไปแล้ว')

    const guildSnap = await tx.get(doc(db, 'guilds', guildId))
    const memberRef = doc(db, 'guilds', guildId, 'members', player.uid)
    const memberSnap = await tx.get(memberRef)
    if (!memberSnap.exists()) throw new Error('คุณไม่ได้อยู่ในกิลด์นี้')

    const dealt = Math.min(damage, boss.hp)

    tx.update(raidRef(guildId), { hp: boss.hp - dealt, hits: (boss.hits ?? 0) + 1 })
    tx.update(doc(db, 'guilds', guildId), {
      points: (guildSnap.data()?.points ?? 0) + dealt,
    })
    tx.update(memberRef, {
      contribution: (memberSnap.data().contribution ?? 0) + dealt,
    })

    return { dealt, remaining: boss.hp - dealt }
  })

  const coins = coinsFromDamage(result.dealt)
  const sameDay = isSameThaiDay(player.raidRunAt)
  await updateDoc(doc(db, 'users', player.uid), {
    guildCoins: (player.guildCoins ?? 0) + coins,
    raidRunAt: serverTimestamp(),
    raidRunCount: sameDay ? (player.raidRunCount ?? 0) + 1 : 1,
  })

  return { ...result, coins }
}
