import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import {
  CardSnapshot,
  Relationship,
  attachChildren,
  detachChild,
  detachParent,
  getBoardCards,
  getCurrentCard,
  getRelationship,
} from './trello'

function StatusPill({ card }: { card: CardSnapshot }) {
  const done = card.closed || card.dueComplete
  return <span className={`status-pill ${done ? 'done' : 'open'}`}>{done ? 'Done' : 'Open'}</span>
}

function CardTile({
  card,
  onRemove,
  showRemove = true,
}: {
  card: CardSnapshot
  onRemove?: () => void
  showRemove?: boolean
}) {
  const labels = (card.labels || []).filter((label) => label.name || label.color).slice(0, 5)
  const members = (card.members || []).slice(0, 4)

  return (
    <div className="epic-card">
      <div className="epic-card-labels">
        {labels.length ? labels.map((label) => (
          <span
            key={label.id}
            className="label-bar"
            title={label.name}
            data-color={label.color || 'blue'}
          />
        )) : <span className="label-placeholder" />}
      </div>

      <div className="epic-card-body">
        <a className="epic-card-title" href={card.url} target="_blank" rel="noreferrer">
          {card.name}
        </a>

        <div className="epic-card-meta">
          <StatusPill card={card} />
          {card.listName && <span className="list-name">{card.listName}</span>}
        </div>
      </div>

      <div className="epic-card-footer">
        <div className="member-stack">
          {members.map((member) => (
            <span key={member.id} className="member-avatar" title={member.fullName || member.initials}>
              {member.initials || (member.fullName || '?').slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>

        {showRemove && onRemove && (
          <button className="icon-button" title="Detach" onClick={onRemove}>×</button>
        )}
      </div>
    </div>
  )
}

function App() {
  const [t, setT] = useState<any>()
  const [current, setCurrent] = useState<CardSnapshot | null>(null)
  const [relationship, setRelationshipState] = useState<Relationship | null>(null)
  const [boardCards, setBoardCards] = useState<CardSnapshot[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const trello = window.TrelloPowerUp.iframe()
      setT(trello)
      const [card, rel, cards] = await Promise.all([
        getCurrentCard(trello),
        getRelationship(trello),
        getBoardCards(trello),
      ])
      setCurrent(card)
      setRelationshipState(rel)
      setBoardCards(cards)
    } catch (e: any) {
      setError(e?.message || 'Unable to load related cards.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const children = useMemo(() => {
    if (!relationship) return []
    return relationship.childSnapshots.map((snapshot) => {
      const fresh = boardCards.find((card) => card.id === snapshot.id)
      return fresh || snapshot
    })
  }, [relationship, boardCards])

  const parent = useMemo(() => {
    if (!relationship?.parentSnapshot) return null
    return boardCards.find((card) => card.id === relationship.parentId) || relationship.parentSnapshot
  }, [relationship, boardCards])

  const done = children.filter((card) => card.closed || card.dueComplete).length
  const percent = children.length ? Math.round((done / children.length) * 100) : 0

  async function removeParent() {
    if (!t || !current) return
    await detachParent(t, current)
    await load()
  }

  async function removeChild(id: string) {
    if (!t || !current) return
    await detachChild(t, current, id)
    await load()
  }

  if (error) return <div className="container error">{error}</div>
  if (!relationship || !current) return <div className="container muted">Loading…</div>

  return (
    <div className="container related-container">
      <div className="related-header">
        <div>
          <div className="eyebrow">EPIC RELATIONSHIPS</div>
          <div className="section-title">Related Cards</div>
        </div>
        <button
          className="manage-button"
          onClick={() => t.popup({
            title: 'Epic Relationships',
            items: [
              {
                text: 'Attach Parent',
                callback: (popupT: any) => popupT.popup({
                  title: 'Attach Parent',
                  url: popupT.signUrl('./picker.html?mode=parent'),
                  height: 480,
                }),
              },
              {
                text: 'Create and attach new children',
                callback: (popupT: any) => popupT.popup({
                  title: 'Create and attach new children',
                  url: popupT.signUrl('./picker.html?mode=create'),
                  height: 460,
                }),
              },
              {
                text: 'Attach existing children',
                callback: (popupT: any) => popupT.popup({
                  title: 'Attach existing children',
                  url: popupT.signUrl('./picker.html?mode=children'),
                  height: 560,
                }),
              },
            ],
          })}
        >
          Manage
        </button>
      </div>

      {parent && (
        <section className="relationship-section">
          <div className="section-heading">
            <span className="section-icon">↑</span>
            <span>Parent</span>
          </div>
          <CardTile card={parent} onRemove={removeParent} />
        </section>
      )}

      <section className="relationship-section">
        <div className="section-heading">
          <span className="section-icon">↓</span>
          <span>Children</span>
          <span className="count-pill">{children.length}</span>
        </div>

        {children.length > 0 && (
          <div className="progress-panel">
            <div className="progress-top">
              <span>{done}/{children.length} done</span>
              <strong>{percent}%</strong>
            </div>
            <div className="progress-track"><div style={{ width: `${percent}%` }} /></div>
          </div>
        )}

        {children.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">↳</div>
            <strong>No child cards yet</strong>
            <span>Attach existing cards or create new ones.</span>
          </div>
        ) : (
          <div className="card-list">
            {children.map((card) => (
              <CardTile key={card.id} card={card} onRemove={() => removeChild(card.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
