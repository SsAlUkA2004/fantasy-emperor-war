import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import {
  CREATE_COST,
  GUILD_ROLES,
  MAX_MEMBERS,
  guildLevel,
  pointsForNextLevel,
} from '../data/guild'
import {
  browseGuilds,
  createGuild,
  findGuildByTag,
  joinGuild,
  kickMember,
  leaveGuild,
  loadGuild,
  loadMembers,
  setNotice,
  setRole,
} from '../lib/guild'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

export default function Guild() {
  const { user, player, refresh } = usePlayer()
  const [guild, setGuild] = useState(undefined)
  const [members, setMembers] = useState(null)
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [term, setTerm] = useState('')
  const [found, setFound] = useState(undefined)
  const [draftNotice, setDraftNotice] = useState(null)

  async function reload() {
    if (player.guildId) {
      const g = await loadGuild(player.guildId)
      setGuild(g)
      setMembers(g ? await loadMembers(player.guildId) : [])
      setList(null)
    } else {
      setGuild(null)
      setMembers(null)
      setList(await browseGuilds(20))
    }
  }

  useEffect(() => {
    reload().catch(() =>
      setError('อ่านข้อมูลกิลด์ไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง')
    )
  }, [player.guildId])

  async function run(label, fn) {
    setBusy(label)
    setError(null)
    try {
      await fn()
      await refresh()
      await reload()
    } catch (err) {
      setError(err.message || 'ทำไม่สำเร็จ')
    }
    setBusy(null)
  }

  const me = members?.find((m) => m.uid === user.uid)
  const canManage = me && GUILD_ROLES[me.role]?.rank >= 1
  const isOwner = me?.role === 'owner'

  // ───── ยังไม่มีกิลด์ ─────
  if (guild === null) {
    return (
      <main className="screen top">
        <div className="sheet">
          <h1>กิลด์</h1>
          <p className="meta">เข้าร่วมกิลด์ที่มีอยู่ หรือสร้างกิลด์ของตัวเอง</p>

          {error && <div className="trace">{error}</div>}

          <h2 className="section-title">ค้นหาด้วยตัวย่อ</h2>
          <div className="search-row">
            <input
              value={term}
              placeholder="เช่น DRAGN"
              onChange={(e) => setTerm(e.target.value.toUpperCase())}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') setFound(await findGuildByTag(term))
              }}
            />
            <button
              className="rune-link"
              disabled={!term.trim()}
              onClick={async () => setFound(await findGuildByTag(term))}
            >
              ค้นหา
            </button>
          </div>
          {found === null && <p className="meta">ไม่พบกิลด์ตัวย่อนี้</p>}
          {found && (
            <GuildRow g={found} busy={busy} onJoin={run} player={{ ...player, uid: user.uid }} />
          )}

          <h2 className="section-title">กิลด์ที่เปิดรับ</h2>
          {list === null && <p className="meta">กำลังอ่านรายชื่อ</p>}
          {list?.length === 0 && <p className="meta">ยังไม่มีกิลด์ในเกม เป็นคนแรกเลยไหม</p>}
          {list?.map((g) => (
            <GuildRow key={g.id} g={g} busy={busy} onJoin={run} player={{ ...player, uid: user.uid }} />
          ))}

          <h2 className="section-title">สร้างกิลด์ใหม่</h2>
          <p className="meta">ใช้เพชร {fmt(CREATE_COST)} เม็ด · ตัวย่อห้ามซ้ำกับกิลด์อื่น</p>
          <div className="field">
            <label htmlFor="gname">ชื่อกิลด์</label>
            <input id="gname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="gtag">ตัวย่อ 2 ถึง 5 ตัว</label>
            <input
              id="gtag"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="DRAGN"
            />
          </div>
          <button
            className="rune-link block primary"
            disabled={busy === 'create' || (player.gems ?? 0) < CREATE_COST}
            onClick={() =>
              run('create', () => createGuild({ ...player, uid: user.uid }, name, tag))
            }
          >
            {(player.gems ?? 0) < CREATE_COST ? 'เพชรไม่พอ' : 'สร้างกิลด์'}
          </button>

          <div className="gate">
            <Link className="rune-link" to="/">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (guild === undefined) {
    return (
      <main className="screen">
        <div className="stage">
          <p className="meta center">กำลังอ่านข้อมูลกิลด์</p>
        </div>
      </main>
    )
  }

  // ───── อยู่ในกิลด์แล้ว ─────
  const level = guildLevel(guild.points)

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="boss-head">
          <span className="boss-mark">🏰</span>
          <div>
            <h1>{guild.name}</h1>
            <p className="meta">
              [{guild.tag}] · เลเวล {level} · สมาชิก {guild.memberCount ?? 0}/{MAX_MEMBERS}
            </p>
          </div>
        </header>

        {error && <div className="trace">{error}</div>}

        <div className="cp-banner">
          <span className="meta">คะแนนกิลด์</span>
          <strong>
            {fmt(guild.points)}
            <span className="meta tiny"> / {fmt(pointsForNextLevel(level))}</span>
          </strong>
        </div>

        <h2 className="section-title">ประกาศ</h2>
        {draftNotice === null || draftNotice === undefined ? (
          <>
            <p className="meta">{guild.notice || 'ยังไม่มีประกาศ'}</p>
            {canManage && (
              <button className="plain-link" onClick={() => setDraftNotice(guild.notice ?? '')}>
                แก้ประกาศ
              </button>
            )}
          </>
        ) : (
          <>
            <div className="field">
              <input
                value={draftNotice}
                maxLength={200}
                onChange={(e) => setDraftNotice(e.target.value)}
              />
            </div>
            <button
              className="rune-link block"
              disabled={busy === 'notice'}
              onClick={() =>
                run('notice', async () => {
                  await setNotice(guild.id, draftNotice)
                  setDraftNotice(null)
                })
              }
            >
              บันทึกประกาศ
            </button>
          </>
        )}

        <h2 className="section-title">สมาชิก</h2>
        {members?.map((m) => (
          <div className="card guild-member" key={m.uid}>
            <div className="card-body">
              <h3>
                {m.username}
                <span className="rarity">{GUILD_ROLES[m.role]?.name ?? 'สมาชิก'}</span>
              </h3>
              <p className="meta">คะแนนสะสม {fmt(m.contribution)}</p>
            </div>
            {isOwner && m.uid !== user.uid && (
              <div className="card-actions">
                <button
                  className="plain-link inline"
                  disabled={busy === m.uid}
                  onClick={() =>
                    run(m.uid, () =>
                      setRole(guild.id, m.uid, m.role === 'officer' ? 'member' : 'officer')
                    )
                  }
                >
                  {m.role === 'officer' ? 'ปลด' : 'ตั้งรอง'}
                </button>
                <button
                  className="plain-link inline"
                  disabled={busy === m.uid}
                  onClick={() => run(m.uid, () => kickMember(guild.id, m.uid))}
                >
                  เชิญออก
                </button>
              </div>
            )}
          </div>
        ))}

        <Link className="rune-link block primary" to="/guild/raid">
          กิลด์เรดและร้านค้ากิลด์
        </Link>

        <button
          className="plain-link"
          disabled={busy === 'leave'}
          onClick={() => run('leave', () => leaveGuild({ ...player, uid: user.uid }))}
        >
          ออกจากกิลด์
        </button>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}

function GuildRow({ g, busy, onJoin, player }) {
  const full = (g.memberCount ?? 0) >= MAX_MEMBERS
  return (
    <div className="card shop-row">
      <span className="card-mark">🏰</span>
      <div className="card-body">
        <h3>
          {g.name}
          <span className="rarity">[{g.tag}]</span>
        </h3>
        <p className="meta">
          เลเวล {guildLevel(g.points)} · สมาชิก {g.memberCount ?? 0}/{MAX_MEMBERS} · หัวหน้า{' '}
          {g.ownerName ?? '—'}
        </p>
        {g.notice && <p className="meta tiny">{g.notice}</p>}
      </div>
      <button
        className="rune-link"
        disabled={full || busy === g.id}
        onClick={() => onJoin(g.id, () => joinGuild(player, g.id))}
      >
        {full ? 'เต็ม' : 'เข้าร่วม'}
      </button>
    </div>
  )
}
