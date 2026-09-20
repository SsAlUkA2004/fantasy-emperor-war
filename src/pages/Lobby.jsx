import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { loadCollection } from '../lib/player'
import { getCharacter, ELEMENTS, ROLES, TEAM_SIZE } from '../data/characters'
import { expToNext, playerExpToNext, PLAYER_MAX_LEVEL } from '../lib/leveling'
import { entryStats, entryLevelCap } from '../lib/stats'
import { buildRoster, entryPower, teamPower, formatPower } from '../lib/power'
import { effectiveRarity, awakenName } from '../data/ascension'
import { titlesFor, TITLES, claimableRanks } from '../data/ranks'
import { PERMANENT_QUESTS } from '../data/quests'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { rankLabel, rankOf, titleName } from '../data/ranks'
import { UNLOCKS, chapterCleared, GEM_RUNS_PER_DAY } from '../data/stages'
import { RUNS_PER_DAY as DUNGEON_RUNS } from '../data/dungeon'
import { runsLeft } from '../lib/dayclock'
import { RUNS_PER_SLOT, SLOTS_PER_ROUND } from '../data/chardungeon'
import { totalRunsLeft } from '../lib/chardungeon'
import { roundFor } from '../data/chardungeon'
import { RAID_TIERS, meetsRequirement } from '../data/raiddungeon'
import { totalRunsLeftForTier } from '../lib/raiddungeon'
import StatPeek from '../components/StatPeek'
import { signOut } from '../lib/auth'

function statRows(entry) {
  const s = entryStats(entry.id, entry)
  return [
    ['พลังชีวิต', s.hp],
    ['โจมตี', s.atk],
    ['ป้องกัน', s.def],
    ['ความเร็ว', s.spd],
  ]
}

export default function Lobby() {
  const [pickingTitle, setPickingTitle] = useState(false)
  const { user, player, refresh, attacked, clearAttacked } = usePlayer()
  const [owned, setOwned] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(async (list) => {
      setOwned(list)
      // จดค่าพลังรวมและสรุปตัวละครทุกตัวไว้ในเอกสารของตัวเอง เพื่อนและบอร์ดจัดอันดับจึงดูได้
      // ต้องจดไว้เพราะกระเป๋าตัวละครของเราคนอื่นอ่านไม่ได้ และไม่ควรเปิดให้อ่าน
      // roster เก็บทุกตัวที่มี (ไม่ใช่แค่ห้าตัวในทีมตั้งรับ) ให้บอร์ดอันดับตัวละครเห็นครบ
      const total = teamPower(list)
      const roster = buildRoster(list)
      const patch = {}
      if (total !== (player.rosterPower ?? 0)) patch.rosterPower = total
      if (JSON.stringify(roster) !== JSON.stringify(player.roster ?? {})) patch.roster = roster
      if (Object.keys(patch).length) {
        updateDoc(doc(db, 'users', user.uid), patch).catch(() => {})
      }
    })
  }, [user.uid])

  // เรียงตามลำดับที่จัดไว้ในทีม ไม่ใช่ลำดับที่ได้ตัวละครมา
  const active = owned
    ? (player.team ?? []).map((id) => owned.find((o) => o.id === id)).filter(Boolean)
    : null

  // ฉายาจากเควสถาวรโชว์ตัวสูงสุดที่ปลดล็อกแล้วอัตโนมัติ ไม่ต้องมีตัวเลือกแยกเหมือนฉายาตามแรงค์
  const earnedLevelTitle = [...PERMANENT_QUESTS]
    .reverse()
    .find((q) => (player.levelTitles ?? []).includes(q.level))

  // ล็อกลิงก์ด่วนนี้ไว้จนกว่าจะปลดล็อกระดับง่ายสุด (ระดับอื่นเข้มกว่านี้ ดูรายละเอียดในหน้าดันเจี้ยนเหรด)
  const raidUnlocked = owned ? meetsRequirement(owned, RAID_TIERS[0].need) : false

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>{player.username}</h1>
            <p className="meta">
              {rankOf(player.pvpPoints ?? 0).mark} {rankLabel(player.pvpPoints ?? 0)} ·{' '}
              {player.pvpPoints ?? 0} แต้ม
            </p>
            <button className="title-line" onClick={() => setPickingTitle((v) => !v)}>
              {titleName(player.titleIndex ?? 0)}
              <span className="title-edit">เปลี่ยน</span>
            </button>
            {earnedLevelTitle && <span className="chip gold">{earnedLevelTitle.title}</span>}
            {player.guildTag && (
              <p className="meta guild-line">
                <Link to="/guild">
                  {player.guildName || 'กิลด์'} [{player.guildTag}]
                </Link>
              </p>
            )}

            <div className="level-block">
              <div className="level-line">
                <span className="hero-level">เลเวล {player.playerLevel ?? 1}</span>
                <span className="meta tiny">
                  {(player.playerLevel ?? 1) >= PLAYER_MAX_LEVEL
                    ? 'ถึงเลเวลสูงสุดแล้ว'
                    : `${(player.playerExp ?? 0).toLocaleString('th-TH')} / ${playerExpToNext(
                        player.playerLevel ?? 1
                      ).toLocaleString('th-TH')} exp`}
                </span>
              </div>

              {(player.playerLevel ?? 1) < PLAYER_MAX_LEVEL && (
                <>
                  <div className="bar thin wide">
                    <span
                      style={{
                        width: `${Math.round(((player.playerExp ?? 0) / playerExpToNext(player.playerLevel ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="meta tiny source-note">
                    ได้จากด่านผจญภัย (ครั้งแรกเต็มอัตรา เล่นซ้ำมีโควตา) และเหมืองคริสตัล ลานฝึกไม่ให้
                  </p>
                  <p className="meta tiny">
                    อีก{' '}
                    {(
                      playerExpToNext(player.playerLevel ?? 1) - (player.playerExp ?? 0)
                    ).toLocaleString('th-TH')}{' '}
                    หน่วยจะขึ้นเลเวล {(player.playerLevel ?? 1) + 1}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="purse-stack">
            <div className="purse">
              <span className="gem">◆</span>
              {player.gems.toLocaleString('th-TH')}
            </div>
            <div className="purse coin">
              <span className="coin-mark">⛁</span>
              {(player.coins ?? 0).toLocaleString('th-TH')}
            </div>
            {owned && (
              <div className="purse cp-big">
                <span className="cp-mark">⚔</span>
                {formatPower(teamPower(owned))}
                <span className="cp-team">(ทีม {formatPower(teamPower(active ?? []))})</span>
              </div>
            )}
          </div>
        </header>

        {attacked && (
          <p className="meta defense-note">
            ระหว่างที่ไม่อยู่ มีคนมาท้าและชนะ {attacked.count} ครั้ง เสียไป {attacked.lost} แต้ม
            <button className="plain-link inline" onClick={clearAttacked}>
              รับทราบ
            </button>
          </p>
        )}

        {pickingTitle && (
          <div className="title-picker">
            <p className="meta tiny">ปลดล็อกตามแรงค์สูงสุดที่เคยไปถึง</p>
            <div className="title-grid">
              {TITLES.map((t) => {
                const open = t.requires <= (player.highestRank ?? 0)
                return (
                  <button
                    key={t.index}
                    className="title-chip"
                    data-active={(player.titleIndex ?? 0) === t.index}
                    disabled={!open}
                    onClick={async () => {
                      await updateDoc(doc(db, 'users', user.uid), { titleIndex: t.index })
                      await refresh()
                      setPickingTitle(false)
                    }}
                  >
                    {open ? t.name : 'ยังไม่ปลดล็อก'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <section className="roster">
          <div className="roster-head">
            <h2 className="section-title flush">ผู้ติดตามที่ใช้อยู่</h2>
            <Link className="plain-link inline" to="/team">
              จัดทีม
            </Link>
          </div>

          {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

          {active?.length === 0 && <p className="meta">ยังไม่ได้เลือกใครเข้าทีม</p>}

          {active?.map((entry) => {
            const c = getCharacter(entry.id)
            if (!c) return null
            return (
              <Link className="card peek-host" to={`/hero/${entry.id}`} key={entry.id}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span
                      className="rarity"
                      data-rarity={effectiveRarity(entry.id, entry.tier)}
                      data-upgraded={(entry.tier ?? 0) > 0}
                      title={
                        (entry.tier ?? 0) > 0
                          ? `ยกระดับมาจาก ${c.rarity}`
                          : 'ระดับตั้งต้นจากกาชา'
                      }
                    >
                      {effectiveRarity(entry.id, entry.tier)}
                      {(entry.tier ?? 0) > 0 && <span className="up-mark">↑</span>}
                    </span>
                    {(entry.awaken ?? 0) > 0 && (
                      <span className="awaken-tag">{awakenName(entry.awaken)}</span>
                    )}
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level} · {'★'.repeat(entry.star)} ·{' '}
                    <span className="cp">⚔ {formatPower(entryPower(entry))}</span>
                  </p>
                  {entry.level < entryLevelCap(entry.id, entry) && (
                    <div className="bar thin">
                      <span
                        style={{ width: `${Math.round((entry.exp / expToNext(entry.level)) * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="meta tiny">
                    {entry.level >= entryLevelCap(entry.id, entry)
                      ? `ตันที่เพดาน ${entryLevelCap(entry.id, entry)}`
                      : `${entry.exp} / ${expToNext(entry.level)}`}
                  </p>
                </div>
                <span className="card-more">›</span>
                <StatPeek
                  title={c.name}
                  subtitle={`เลเวล ${entry.level} · ${'★'.repeat(entry.star)}`}
                  element={c.element}
                  power={entryPower(entry)}
                  stats={statRows(entry)}
                  note={c.skill.name}
                />
              </Link>
            )
          })}

          {owned && active.length < TEAM_SIZE && (
            <p className="meta tiny">
              ทีมยังว่างอีก {TEAM_SIZE - active.length} ช่อง · มีตัวละครทั้งหมด {owned.length} ตัว
            </p>
          )}
        </section>

        <div className="lobby-actions">
          <Link className="rune-link block" to="/stages">
            ออกผจญภัย
            <span className="btn-note">
              เหมืองเหลือ {runsLeft(player, GEM_RUNS_PER_DAY)} ครั้ง
            </span>
          </Link>

          <Link className="rune-link block" to="/dungeon">
            ดันเจี้ยน
            <span className="btn-note">
              วันนี้เหลือ {runsLeft(player, DUNGEON_RUNS, 'dunRunAt', 'dunRunCount')} ครั้ง
            </span>
          </Link>

          <Link className="rune-link block" to="/hunt">
            ดันเจี้ยนรอยอดีต · หาตัวละคร
            <span className="btn-note">
              รอบนี้เหลือ {totalRunsLeft(player, roundFor().slots)} ครั้ง
            </span>
          </Link>

          <Link
            className="rune-link block"
            to="/boss"
            data-locked={!chapterCleared(player.stageProgress, UNLOCKS.worldboss.chapter)}
          >
            บอสโลก
            {!chapterCleared(player.stageProgress, UNLOCKS.worldboss.chapter) &&
              ' · ต้องผ่านบทที่ 3'}
          </Link>

          <Link
            className="rune-link block"
            to="/arena"
            data-locked={!chapterCleared(player.stageProgress, UNLOCKS.arena.chapter)}
          >
            ประลอง
            {!chapterCleared(player.stageProgress, UNLOCKS.arena.chapter) && ' · ต้องผ่านบทที่ 1'}
            {claimableRanks(player.highestRank ?? 0, player.claimedRanks ?? []).length > 0 &&
              ' · มีรางวัลรอรับ'}
          </Link>

          <Link className="rune-link block" to="/vault" data-locked={owned ? !raidUnlocked : false}>
            ดันเจี้ยนเหรด
            {owned && !raidUnlocked && (
              <span className="btn-note">
                ต้องมี SSR เลเวล {RAID_TIERS[0].need.level} อย่างน้อย {RAID_TIERS[0].need.count} ตัว
              </span>
            )}
            {owned && raidUnlocked && (
              <span className="btn-note">
                รวมเหลือ {RAID_TIERS.reduce((sum, t) => sum + totalRunsLeftForTier(player, t), 0)} ครั้ง
              </span>
            )}
          </Link>
        </div>

        <p className="meta tiny center lobby-hint">
          โหมดอื่นทั้งหมดอยู่ในแถบด้านล่าง กดปุ่มเมนูขวาสุดเพื่อดูทุกหน้า
        </p>
      </div>
    </main>
  )
}
