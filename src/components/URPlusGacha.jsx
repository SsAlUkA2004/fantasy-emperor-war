import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS } from '../data/characters'
import { RANKS } from '../data/ranks'
import { URPLUS_BANNER_IDS, URPLUS_RATES, ALL_URPLUS_BANNER_IDS } from '../data/urplusbanner'
import { PULL_COST, TEN_PULL_COST } from '../lib/gacha'
import {
  URPLUS_HARD_PITY,
  URPLUS_UR_HARD_PITY,
  URPLUS_FIFTY_PULL_COST,
  URPLUS_RANK_REQUIRED,
  URPLUS_STAGE_REQUIRED,
  isURPlusUnlocked,
  pullURPlus,
} from '../lib/urplusgacha'
import { isURRetired } from '../lib/urgacha'
import { loadCollection } from '../lib/player'
import PullResult from './PullResult'

function costFor(count) {
  return count === 50 ? URPLUS_FIFTY_PULL_COST : count === 10 ? TEN_PULL_COST : PULL_COST
}

/**
 * การ์ดตู้จักรพรรดิโคลโน — ระดับความหายากสูงสุดใหม่ของเกม (UR+)
 *
 * ล็อกไว้จนกว่าผู้เล่นจะถึงแรงค์แชมเปี้ยนและผ่านด่าน 8-6 (ดู isURPlusUnlocked)
 * เพราะเป็นเนื้อหาปลายเกม ตัวการันตีสองชั้น 400/900 ดูรายละเอียดที่ lib/urplusgacha.js
 */
export default function URPlusGacha() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [showPool, setShowPool] = useState(false)
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  const unlocked = isURPlusUnlocked(player)
  const rankOk = (player.highestRank ?? 0) >= URPLUS_RANK_REQUIRED
  const stageOk = (player.stageProgress?.[URPLUS_STAGE_REQUIRED] ?? 0) > 0
  const rankName = RANKS[URPLUS_RANK_REQUIRED]?.name ?? 'แชมเปี้ยน'

  const hasChar = (id) => owned?.some((o) => o.id === id) ?? false
  const sinceUR = player.urPlusPitySinceUR ?? 0
  const sinceURPlus = player.urPlusPitySinceURPlus ?? 0
  const copyCount = player.urPlusCopyCount ?? {}

  async function roll(count) {
    const cost = costFor(count)
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pullURPlus({ ...player, uid: user.uid }, count)
      setResults(r.summary)
      await refresh()
      loadCollection(user.uid).then(setOwned)
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  return (
    <div className="sheet">
      <header className="lobby-head">
        <div>
          <h1>⏳ ตู้จักรพรรดิโคลโน</h1>
          <p className="meta">
            โอกาสออกในตู้นี้ · SR {(URPLUS_RATES.SR * 100).toFixed(0)}% · SSR{' '}
            {(URPLUS_RATES.SSR * 100).toFixed(2)}% · UR {(URPLUS_RATES.UR * 100).toFixed(2)}% · UR+{' '}
            {(URPLUS_RATES['UR+'] * 100).toFixed(2)}%
          </p>
        </div>
        {unlocked && (
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        )}
      </header>

      <p className="meta">
        ตู้ใหม่ที่มีระดับความหายากสูงกว่า UR ขึ้นไปอีกขั้น (UR+) ตัวละครในตู้นี้ทั้งสิบสองตัวเป็นตัวใหม่ทั้งหมด
        สุ่มอิสระตามอัตราด้านบน แต่การันตี UR ขึ้นไปแน่นอนถ้าสุ่มครบ {URPLUS_UR_HARD_PITY} ครั้งโดยไม่เคยได้เลย
        และการันตี UR+ แน่นอนถ้าสุ่มครบ {URPLUS_HARD_PITY} ครั้งโดยไม่เคยได้เลย
      </p>

      {!unlocked ? (
        <div className="pity">
          <p className="meta locked-note">ตู้นี้เป็นเนื้อหาปลายเกม ต้องปลดล็อกก่อนจึงจะสุ่มได้</p>
          <div className="stage-row" data-locked={!rankOk}>
            <span className="stage-body">
              <span className="stage-name">{rankOk ? '✓' : '✗'} เคยอยู่แรงค์ {rankName} ขึ้นไป</span>
            </span>
          </div>
          <div className="stage-row" data-locked={!stageOk}>
            <span className="stage-body">
              <span className="stage-name">{stageOk ? '✓' : '✗'} ผ่านด่าน {URPLUS_STAGE_REQUIRED} มาแล้ว</span>
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className="meta tiny">
            ระดับ UR+ เพดานเลเวลตันที่ 100 และดันไปถึง 130 ได้เมื่อครบห้าดาว สูงกว่าระดับ UR ทุกด้าน
            ตัว UR ตัวไหนเก็บชิ้นส่วนพอหลอมครบห้าดาวแล้วจะไม่ออกซ้ำอีก เปิดทางให้ตัวอื่นออกแทน
          </p>

          <section className="pity">
            <div className="pity-row">
              <span className="meta">
                อีก {Math.max(0, URPLUS_UR_HARD_PITY - sinceUR)} ครั้งได้ UR ขึ้นไปการันตีแน่นอน
              </span>
              <div className="bar thin wide">
                <span style={{ width: `${(sinceUR / URPLUS_UR_HARD_PITY) * 100}%` }} />
              </div>
            </div>
            <div className="pity-row">
              <span className="meta">
                อีก {Math.max(0, URPLUS_HARD_PITY - sinceURPlus)} ครั้งได้ UR+ การันตีแน่นอน
              </span>
              <div className="bar thin wide">
                <span style={{ width: `${(sinceURPlus / URPLUS_HARD_PITY) * 100}%` }} />
              </div>
            </div>
          </section>

          <div className="roster-head">
            <span className="meta">
              ในตู้นี้คุณมีแล้ว {ALL_URPLUS_BANNER_IDS.filter((id) => hasChar(id)).length} จาก{' '}
              {ALL_URPLUS_BANNER_IDS.length} ตัว
            </span>
            <button className="plain-link inline" onClick={() => setShowPool((v) => !v)}>
              {showPool ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อในตู้'}
            </button>
          </div>

          {showPool && (
            <div className="pool-grid">
              {['UR+', 'UR', 'SSR', 'SR'].flatMap((rarity) =>
                URPLUS_BANNER_IDS[rarity].map((id) => {
                  const c = CHARACTERS[id]
                  const mine = hasChar(id)
                  const retired = rarity === 'UR' && isURRetired(copyCount[id] ?? 0)
                  return (
                    <span className="pool-chip" key={id} data-owned={mine} data-rarity={rarity}>
                      {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                      <span className="pool-rarity">{rarity}</span>
                      {retired && <span className="pool-rarity">เก็บครบ · ไม่ออกซ้ำ</span>}
                    </span>
                  )
                })
              )}
            </div>
          )}

          {error && <div className="trace">{error}</div>}

          <div className="pull-row">
            <button className="rune-link" disabled={busy} onClick={() => roll(1)}>
              สุ่ม 1 ครั้ง · {PULL_COST}
            </button>
            <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
              สุ่ม 10 ครั้ง · {TEN_PULL_COST}
            </button>
            <button className="rune-link" disabled={busy} onClick={() => roll(50)}>
              สุ่ม 50 ครั้ง · {URPLUS_FIFTY_PULL_COST}
            </button>
          </div>
          <p className="meta tiny center">
            สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร · สุ่มห้าสิบครั้งถูกกว่าอยู่ 500 เพชร
          </p>

          {busy && <p className="meta center">กำลังอัญเชิญ</p>}

          {results && (
            <PullResult
              results={results}
              count={lastCount}
              again={costFor(lastCount)}
              gems={player.gems}
              busy={busy}
              onAgain={() => roll(lastCount)}
              onClose={() => setResults(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
