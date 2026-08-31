import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import {
  CardSnapshot,
  attachChildren,
  attachParent,
  createCard,
  getAccessibleBoards,
  getBoardCards,
  getBoardCardsViaApi,
  getCurrentCard,
  getRelationship,
} from './trello'

const mode = new URLSearchParams(window.location.search).get('mode') || 'parent'

function CardRow({
  card,
  selected,
  onClick,
}: {
  card: CardSnapshot
  selected: boolean
  onClick: () => void
}) {
  return (
    <button className={`picker-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="picker-card-copy">
        <div className="picker-labels">
          {(card.labels || []).slice(0, 4).map((label) => (
            <span key={label.id} className="label-bar" data-color={label.color || 'blue'} />
          ))}
        </div>
        <div className="picker-name">{card.name}</div>
        <div className="picker-meta">
          {card.boardName || 'Current board'}{card.listName ? ` · ${card.listName}` : ''}
        </div>
      </div>
      <span className={`selection ${selected ? 'checked' : ''}`}>{selected ? '✓' : ''}</span>
    </button>
  )
}

function CreateChildren({ t, current, onDone }: any) {
  const [names, setNames] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    const list = names
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean)

    if (!list.length) return

    setBusy(true)
    setError('')
    try {
      const created: CardSnapshot[] = []
      for (const name of list) {
        const card = await createCard(t, name)
        created.push(card)
      }
      await attachChildren(t, current, created)
      await t.alert({ message: `${created.length} child card${created.length === 1 ? '' : 's'} created and attached.` })
      await t.closePopup()
      onDone()
    } catch (e: any) {
      setError(e?.message || 'Unable to create child cards.')
      setBusy(false)
    }
  }

  return (
    <div className="container picker-container">
      <div className="eyebrow">CREATE CHILDREN</div>
      <div className="picker-title">Create and attach new children</div>
      <p className="helper">Enter one child card per line. New cards will be created in the current card's list.</p>
      <textarea
        className="textarea"
        rows={7}
        value={names}
        onChange={(e) => setNames(e.target.value)}
        placeholder={'Login API\nLogin UI\nForgot Password'}
        autoFocus
      />
      {error && <div className="error">{error}</div>}
      <button className="primary full-button" disabled={busy} onClick={submit}>
        {busy ? 'Creating…' : 'Create & Attach'}
      </button>
    </div>
  )
}

function App() {
  const [t, setT] = useState<any>()
  const [current, setCurrent] = useState<CardSnapshot | null>(null)
  const [relationship, setRelationship] = useState<any>()
  const [cards, setCards] = useState<CardSnapshot[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const trello = window.TrelloPowerUp.iframe({
      appKey: import.meta.env.VITE_TRELLO_APP_KEY || '',
      appName: 'Trello Epic Power-Up',
      appAuthor: 'oong26',
    })
    setT(trello)

    Promise.all([
      getCurrentCard(trello),
      getRelationship(trello),
      getBoardCards(trello),
    ])
      .then(([card, rel, boardCards]) => {
        setCurrent(card)
        setRelationship(rel)
        setCards(boardCards)
      })
      .catch((e) => setError(e?.message || 'Unable to load cards.'))
      .finally(() => setLoading(false))
  }, [])

  async function loadOtherBoards() {
    if (!t || !import.meta.env.VITE_TRELLO_APP_KEY) {
      setError('Cross-board search needs VITE_TRELLO_APP_KEY configured in Vercel.')
      return
    }

    setLoadingBoards(true)
    setError('')
    try {
      const boards = await getAccessibleBoards(t)
      const currentBoard = current?.boardId
      const otherBoards = boards.filter((board: any) => !board.closed && board.id !== currentBoard).slice(0, 30)
      const result: CardSnapshot[] = [...cards]

      for (const board of otherBoards) {
        try {
          const boardCards = await getBoardCardsViaApi(t, board.id)
          result.push(...boardCards)
        } catch {
          // Ignore boards that the current member cannot read.
        }
      }

      setCards(result)
      setApiAvailable(true)
    } catch (e: any) {
      setError(e?.message || 'Unable to load other boards.')
    } finally {
      setLoadingBoards(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return cards
      .filter((card) => card.id !== current?.id)
      .filter((card) => mode === 'parent' ? !relationship?.childIds?.includes(card.id) : true)
      .filter((card) => !q || card.name.toLowerCase().includes(q) || (card.boardName || '').toLowerCase().includes(q))
      .slice(0, 80)
  }, [cards, current, query, relationship])

  async function save() {
    if (!t || !current) return

    try {
      if (mode === 'parent') {
        const parent = cards.find((card) => card.id === selected[0])
        if (!parent) return
        await attachParent(t, current, parent)
      } else if (mode === 'children') {
        const children = cards.filter((card) => selected.includes(card.id))
        await attachChildren(t, current, children)
      }

      await t.closePopup()
    } catch (e: any) {
      setError(e?.message || 'Unable to save relationship.')
    }
  }

  if (loading) return <div className="container muted">Loading cards…</div>
  if (mode === 'create') {
    return <CreateChildren t={t} current={current} onDone={() => undefined} />
  }
  if (error) return <div className="container error">{error}</div>

  const title = mode === 'parent' ? 'Attach Parent' : 'Attach existing children'
  const subtitle = mode === 'parent'
    ? 'Choose the card that should be this card’s parent.'
    : 'Select one or more existing cards to attach as children.'

  return (
    <div className="container picker-container">
      <div className="eyebrow">EPIC RELATIONSHIPS</div>
      <div className="picker-title">{title}</div>
      <p className="helper">{subtitle}</p>

      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cards…"
        autoFocus
      />

      {mode === 'children' && (
        <div className="picker-toolbar">
          <span>{selected.length} selected</span>
          <button className="secondary small" onClick={loadOtherBoards}>
            {loadingBoards ? 'Loading…' : apiAvailable ? 'Refresh boards' : 'Search other boards'}
          </button>
        </div>
      )}

      <div className="picker-list">
        {filtered.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            selected={selected.includes(card.id)}
            onClick={() => {
              if (mode === 'parent') setSelected([card.id])
              else setSelected((items) => items.includes(card.id) ? items.filter((id) => id !== card.id) : [...items, card.id])
            }}
          />
        ))}
        {!filtered.length && <div className="empty-state compact">No matching cards.</div>}
      </div>

      <button className="primary full-button" disabled={!selected.length} onClick={save}>
        {mode === 'parent' ? 'Attach Parent' : `Attach ${selected.length || ''} Child${selected.length === 1 ? '' : 'ren'}`.replace(/Attach  Children$/, 'Attach Children')}
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
