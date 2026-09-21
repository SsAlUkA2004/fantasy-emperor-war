import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { BANNERS, CHARACTERS, ELEMENTS, FOCUS, bannerPool } from '../data/characters'
import {
  PULL_COST,
  TEN_PULL_COST,
  PITY_SR,
  PITY_SSR,
  discountAvailable,
  discountedPullCost,
  effectiveRates,
  pull,
} from '../lib/gacha'
import { loadCollection } from '../lib/player'
import ElementalGacha from '../components/ElementalGacha'
import URGacha from '../components/URGacha'
import URPlusGacha from '../components/URPlusGacha'
import ChronoGearGacha from '../components/ChronoGearGacha'
import PullResult from '../components/PullResult'

export default function Gacha() {
  const { user, player, refresh } = usePlayer()
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [banner, setBanner] = useState(BANNERS[0].id)
  const [owned, setOwned] = useState(null)
  const [showPool, setShowPool] = useState(false)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pool = bannerPool(banner)
  const rates = effectiveRates(pool)
  const inBanner = BANNERS.find((b) => b.id === banner)?.ids ?? []
  const hasChar = (id) => owned?.some((o) => o.id === id) ?? false

  const discount = discountAvailable(player, banner)
  const singleCost = discount ? discountedPullCost() : PULL_COST

  const sinceSR = player.pitySR ?? 0
  const sinceSSR = player.pitySSR ?? 0

  async function roll(count) {
    const cost = count === 10 ? TEN_PULL_COST : singleCost
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pull({ ...player, uid: user.uid }, count, banner)
      setResults(r.summary)
      await refresh()
      loadCollection(user.uid).then(setOwned)
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <header className="lobby-head">
          <div>
            <h1>ประตูอัญเชิญ</h1>
            <p className="meta">
              โอกาสออกในตู้นี้ ·{' '}
              {['R', 'SR', 'SSR']
                .filter((r) => rates[r] > 0)
                .map((r) => `${r} ${(rates[r] * 100).toFixed(rates[r] < 0.05 ? 0 : 0)}%`)
                .join(' · ')}
            </p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <div className="mode-tabs banner-tabs">
          {BANNERS.map((b) => (
            <button
              key={b.id}
              className="mode-tab"
              data-active={banner === b.id}
              onClick={() => setBanner(b.id)}
            >
              {b.name}
              <span className="mode-count">{b.ids.length}</span>
            </button>
          ))}
        </div>
        <p className="meta">{BANNERS.find((b) => b.id === banner)?.desc}</p>
        <p className="meta tiny">
          ตู้นี้มี SSR {pool.SSR.length} ตัว · SR {pool.SR.length} ตัว · R {pool.R.length} ตัว ·
          ตัวนับการันตีใช้ร่วมกันทั้งสองตู้
          {pool.R.length === 0 && ' · ตู้นี้ไม่มีตัวระดับ R โอกาสที่ควรออก R จึงเลื่อนขึ้นเป็น SR ทั้งหมด'}
        </p>

        <div className="roster-head">
          <span className="meta">
            ในตู้นี้คุณมีแล้ว {inBanner.filter((id) => hasChar(id)).length} จาก {inBanner.length} ตัว
          </span>
          <button className="plain-link inline" onClick={() => setShowPool((v) => !v)}>
            {showPool ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อในตู้'}
          </button>
        </div>

        {showPool && (
          <div className="pool-grid">
            {inBanner.map((id) => {
              const c = CHARACTERS[id]
              const mine = hasChar(id)
              return (
                <span className="pool-chip" key={id} data-owned={mine} data-rarity={c.rarity}>
                  {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                  <span className="pool-rarity">{c.rarity}</span>
                </span>
              )
            })}
          </div>
        )}

        <section className="pity">
          <div className="pity-row">
            <span className="meta">อีก {Math.max(0, PITY_SR - sinceSR)} ครั้งได้ SR ขึ้นไปแน่นอน</span>
            <div className="bar thin wide">
              <span style={{ width: `${(sinceSR / PITY_SR) * 100}%` }} />
            </div>
          </div>
          <div className="pity-row">
            <span className="meta">อีก {Math.max(0, PITY_SSR - sinceSSR)} ครั้งได้ SSR แน่นอน</span>
            <div className="bar thin wide">
              <span style={{ width: `${(sinceSSR / PITY_SSR) * 100}%` }} />
            </div>
          </div>
        </section>

        {error && <div className="trace">{error}</div>}

        <div className="pull-row">
          <button className="rune-link" disabled={busy} onClick={() => roll(1)} data-deal={discount}>
            สุ่ม 1 ครั้ง · {singleCost}
            {discount && <span className="deal-tag">ครั้งแรกของวัน ลด 50%</span>}
          </button>
          <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
            สุ่ม 10 ครั้ง · {TEN_PULL_COST}
          </button>
        </div>
        <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร</p>

        {busy && <p className="meta center">กำลังอัญเชิญ</p>}

        <div className="gate">
          <Link className="rune-link" to="/collection">
            หอสะสมฮีโร่
          </Link>
        </div>
      </div>

      {results && (
        <PullResult
          results={results}
          count={lastCount}
          again={lastCount === 10 ? TEN_PULL_COST : PULL_COST}
          gems={player.gems}
          busy={busy}
          onAgain={() => roll(lastCount)}
          onClose={() => setResults(null)}
        />
      )}

      {/* ตู้ธาตุหมุนเวียน — การ์ดใหม่แยกจากตู้ด้านบนทั้งหมด ไม่แก้อะไรในส่วนบนเลย */}
      <ElementalGacha />

      {/* ตู้ UR — การ์ดใหม่อีกใบ แยกจากตู้ธาตุและตู้เดิมทั้งหมดเช่นกัน */}
      <URGacha />

      {/* ตู้จักรพรรดิโคลโน — ระดับ UR+ ใหม่ ล็อกไว้จนกว่าจะถึงแรงค์แชมเปี้ยนและผ่านด่าน 8-6 */}
      <URPlusGacha />

      {/* ตู้อุปกรณ์โคลโน — สุ่มอุปกรณ์แทนตัวละคร แยกอิสระจากตู้ตัวละครทั้งหมดด้านบน */}
      <ChronoGearGacha />
    </main>
  )
}
