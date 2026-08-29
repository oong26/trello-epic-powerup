import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { getRelationship, setRelationship, getCurrentCard, getBoardCards } from './trello'

type Card = {
  id: string
  name: string
  url?: string
  dueComplete?: boolean
  closed?: boolean
}

function App() {
  const [t, setT] = useState<any>()
  const [current, setCurrent] = useState<Card | null>(null)
  const [relationship, setRelationshipState] = useState({ parentId: null as string | null, childIds: [] as string[] })
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const trello = window.TrelloPowerUp.iframe()
    setT(trello)
    Promise.all([getCurrentCard(trello), getRelationship(trello), getBoardCards(trello)])
      .then(([card, rel, boardCards]) => {
        setCurrent(card)
        setRelationshipState(rel)
        setCards(boardCards)
      })
      .catch((e) => setError(e?.message || 'Unable to load related cards.'))
  }, [])

  const parent = useMemo(
    () => cards.find((card) => card.id === relationship.parentId),
    [cards, relationship.parentId],
  )

  const children = useMemo(
    () => cards.filter((card) => relationship.childIds.includes(card.id)),
    [cards, relationship.childIds],
  )

  const done = children.filter((card) => card.dueComplete || card.closed).length
  const percent = children.length ? Math.round((done / children.length) * 100) : 0

  async function removeParent() {
    if (!t) return
    const next = { ...relationship, parentId: null }
    await setRelationship(t, next)
    setRelationshipState(next)
  }

  async function removeChild(id: string) {
    if (!t) return
    const next = { ...relationship, childIds: relationship.childIds.filter((x) => x !== id) }
    await setRelationship(t, next)
    setRelationshipState(next)
  }

  async function addChild() {
    if (!t || !current) return
    const available = cards.filter(
      (card) => card.id !== current.id && !relationship.childIds.includes(card.id),
    )
    const selected = await t.popup({
      title: 'Add Child Card',
      url: t.signUrl('./picker.html?mode=child'),
      height: 420,
    })
    if (selected?.id) {
      const next = { ...relationship, childIds: [...relationship.childIds, selected.id] }
      await setRelationship(t, next)
      setRelationshipState(next)
    }
  }

  if (error) return <div className="container error">{error}</div>

  return (
    <div className="container">
      <div className="header">
        <div className="title">Related Cards</div>
        <button className="primary small" onClick={addChild}>+ Child</button>
      </div>

      {children.length > 0 && (
        <>
          <div className="meta">{done} of {children.length} completed · {percent}%</div>
          <div className="progress"><div style={{ width: `${percent}%` }} /></div>
        </>
      )}

      {parent && (
        <div style={{ marginTop: 14 }}>
          <div className="muted">Parent Epic</div>
          <div className="card">
            <div className="card-main">
              <a className="card-link card-name" href={parent.url} target="_blank" rel="noreferrer">
                {parent.name}
              </a>
            </div>
            <button className="danger small" onClick={removeParent}>Remove</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="muted">Child Cards</div>
        {children.length === 0 ? (
          <div className="empty muted">No child cards yet.</div>
        ) : (
          children.map((card) => (
            <div className="card" key={card.id}>
              <div className="card-main">
                <a className="card-link card-name" href={card.url} target="_blank" rel="noreferrer">
                  {card.closed ? '✓ ' : card.dueComplete ? '✓ ' : ''}{card.name}
                </a>
              </div>
              <button className="danger small" onClick={() => removeChild(card.id)}>Remove</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)