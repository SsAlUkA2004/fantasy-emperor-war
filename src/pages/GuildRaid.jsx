import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { RAID_HITS_PER_DAY, DAMAGE_PER_COIN } from '../data/guildraid'
import { GUILD_SHOP } from '../data/guildshop'
import { MATERIALS } from '../data/materials'
import { GRADES, SLOTS } from '../data/gear'
import { POOL_NAMES } from '../data/exchange'
import { ELEMENTS } from '../data/characters'
import { loadRaid, raidHitsLeft } from '../lib/guildraid'
import { loadGuild, loadMembers } from '../lib/guild'
import { buyGuildItem } from '../lib/guildshop'
import { hoursUntilReset } from '../lib/dayclock'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

export default function GuildRaid() {
  const { user, player, refresh } = usePlayer()
  const navigate = useNavigate()

  const [guild, setGuild] = useState(null)
  const [raid, setRaid] = useState(null)
  const [members, setMembers] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [got, setGot] = useState(null)

  useEffect(() => {
    if (!player.guildId) return
    Promise.all([loadGuild(player.guildId), loadRaid(player.guildId), loadMembers(player.guildId)])
      .then(([g, r, m]) => {
        setGuild(g)
        setRaid(r)
        setMembers(m)
      })
      .catch((e) => setError(explainError('อ่านข้อมูลกิลด์เรดไม่สำเร็จ', e)))
  }, [player.guildId])

  if (!player.guildId) {
    return (
      <main className="screen top">
        <div className="sheet">
          <h1>กิลด์เรด</h1>
          <p className="meta center locked-note">ต้องอยู่ในกิลด์ก่อนจึงจะตีบอสกิลด์ได้</p>
          <Link className="rune-link block" to="/guild">
            ไปหน้ากิลด์
          </Link>
        </div>
      </main>
    )
  }

  const left = raidHitsLeft(player)
  const pct = raid ? Math.max(0, Math.round((raid.hp / raid.maxHp) * 100)) : 0
  const dead = raid && raid.hp <= 0

  async function buy(item) {
    setBusy(item.id)
    setError(null)
    setGot(null)
    try {
      setGot(await buyGuildItem({ ...player, uid: user.uid }, item.id))
      await refresh()
    } catch (err) {
      setError(err.message || 'ซื้อไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>กิลด์เรด</h1>
            <p className="meta">{guild ? `${guild.name} [${guild.tag}]` : 'กำลังอ่านข้อมูล'}</p>
          </div>
          <div className="purse coin">
            <span className="coin-mark">⛊</span>
            {fmt(player.guildCoins)}
          </div>
        </header>

        {error && <div className="trace">{error}</div>}

        {raid && (
          <>
            <header className="boss-head">
              <span className="boss-mark">{raid.spec.mark}</span>
              <div>
                <h2 className="rank-title-h">{raid.spec.name}</h2>
                <p className="meta">ธาตุ{ELEMENTS[raid.spec.element].name}</p>
              </div>
            </header>

            <div className="boss-hp">
              <div className="boss-hp-line">
                <span className="hero-level">{dead ? 'ถูกปราบแล้ว' : `${pct}%`}</span>
                <span className="meta">
                  {fmt(Math.max(0, raid.hp))} / {fmt(raid.maxHp)}
                </span>
              </div>
              <div className="bar big">
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="meta tiny">
                ตีไปแล้วรวม {fmt(raid.hits)} ครั้ง · ดาเมจ {DAMAGE_PER_COIN} แลกเหรียญกิลด์ 1 เหรียญ
              </p>
            </div>

            {dead ? (
              <p className="meta center locked-note">บอสกิลด์สัปดาห์นี้ถูกปราบแล้ว</p>
            ) : (
              <>
                <button
                  className="rune-link block primary"
                  disabled={left === 0}
                  onClick={() =>
                    navigate('/boss/fight', {
                      state: { mode: 'raid', guildId: player.guildId, week: raid.week },
                    })
                  }
                >
                  {left === 0
                    ? `ครบโควตาวันนี้ · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`
                    : 'เข้าโจมตี'}
                </button>
                <p className="meta tiny center">
                  วันนี้เหลือ {left} จาก {RAID_HITS_PER_DAY} ครั้ง
                </p>
              </>
            )}
          </>
        )}

        <h2 className="section-title">คะแนนสะสมของสมาชิก</h2>
        <div className="board">
          {members?.map((m, i) => (
            <div className="board-row" key={m.uid} data-me={m.uid === user.uid}>
              <span className="board-place" data-top={i < 3}>
                {i + 1}
              </span>
              <span className="board-body">
                <span className="board-name">{m.username}</span>
              </span>
              <span className="board-points">{fmt(m.contribution)}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">ร้านค้ากิลด์</h2>
        <p className="meta">ซื้อด้วยเหรียญกิลด์ ซึ่งได้จากการตีบอสกิลด์อย่างเดียว</p>

        {got && (
          <p className="levelup center">
            {got.kind === 'gear' &&
              `ได้${SLOTS[got.gear.slot].name}${GRADES[got.gear.grade].name} ระดับไอเทม ${got.gear.ilvl}`}
            {got.kind === 'material' && `ได้${MATERIALS[got.material].name} ${got.amount} ชิ้น`}
            {got.kind === 'pool' && `ได้${POOL_NAMES[got.rarity]} ${got.amount}`}
          </p>
        )}

        {GUILD_SHOP.map((item) => {
          const poor = (player.guildCoins ?? 0) < item.price
          return (
            <div className="card shop-row" key={item.id}>
              <span className="card-mark">{item.kind === 'gear' ? '🎁' : '📦'}</span>
              <div className="card-body">
                <h3>{item.name}</h3>
                <p className="meta">{item.desc}</p>
              </div>
              <button
                className="rune-link"
                disabled={poor || busy === item.id}
                onClick={() => buy(item)}
              >
                ⛊ {item.price}
              </button>
            </div>
          )
        })}

        <div className="gate">
          <Link className="rune-link" to="/guild">
            หน้ากิลด์
          </Link>
          <Link className="rune-link" to="/">
            หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
