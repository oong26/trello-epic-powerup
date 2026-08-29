import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { getRelationship, setRelationship, getBoardCards, getCurrentCard } from './trello'

type Card = {
  id: string
  name: string
  url?: string
  closed?: boolean
}

function App() {
  const [t, setT] = useState<any>()
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState<Card | null>(null)
  const [relationship, setRelationshipState] = useState({ parentId: null as string | null, childIds: [] as string[] })
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const mode = new URLSearchParams(window.location.search).get('mode') || 'parent'

  useEffect(() => {
    const trello = window.TrelloPowerUp.iframe()
    setT(trello)
    Promise.all([getBoardCards(trello), getCurrentCard(trello), getRelationship(trello)])
      .then(([boardCards, card, rel]) => {
        setCards(boardCards)
        setCurrent(card)
        setRelationshipState(rel)
      })
      .catch((e) => setError(e?.message || 'Unable to load cards.'))
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return cards
      .filter((card) => card.id !== current?.id)
      .filter((card) => mode === 'parent' ? !relationship.childIds.includes(card.id) : true)
      .filter((card) => !q || card.name.toLowerCase().includes(q))
      .slice(0, 100)
  }, [cards, current, query, mode, relationship.childIds])

  async function select(card: Card) {
    if (!t) return

    if (mode === 'child') {
      await t.closePopup()
      // Parent popup cannot directly return a value to a sibling iframe.
      // Store the temporary selection on the current card, then the parent UI
      // can be refreshed. This branch is intentionally handled by the popup
      // caller in future V2. For V1, use "Set Parent Epic" for parent relations.
      await setRelationship(t, { ...relationship, childIds: [...relationship.childIds, card.id] })
      await t.closePopup()
      return
    }

    await setRelationship(t, { ...relationship, parentId: card.id })
    await t.closePopup()
  }

  if (error) return <div className="container error">{error}</div>

  return (
    <div className="container">
      <div className="title">{mode === 'child' ? 'Select Child Card' : 'Select Parent Epic'}</div>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cards..."
      />
      <div className="list">
        {filtered.length === 0 ? (
          <div className="empty muted">No matching cards.</div>
        ) : (
          filtered.map((card) => (
            <div className="card" key={card.id}>
              <div className="card-main">
                <div className="card-name">{card.name}</div>
              </div>
              <button className="primary small" onClick={() => select(card)}>Select</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)