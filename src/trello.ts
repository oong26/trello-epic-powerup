export const KEY = 'epicRelationship'

export type CardSnapshot = {
  id: string
  name: string
  url?: string
  shortLink?: string
  closed?: boolean
  dueComplete?: boolean
  idList?: string
  listName?: string
  boardId?: string
  boardName?: string
  labels?: { id: string; name: string; color?: string }[]
  members?: { id: string; fullName?: string; initials?: string; avatar?: string }[]
}

export type Relationship = {
  parentId: string | null
  parentSnapshot: CardSnapshot | null
  childIds: string[]
  childSnapshots: CardSnapshot[]
}

export const EMPTY_RELATIONSHIP: Relationship = {
  parentId: null,
  parentSnapshot: null,
  childIds: [],
  childSnapshots: [],
}

function normalize(value: any): Relationship {
  return {
    parentId: value?.parentId || null,
    parentSnapshot: value?.parentSnapshot || null,
    childIds: Array.isArray(value?.childIds) ? value.childIds : [],
    childSnapshots: Array.isArray(value?.childSnapshots)
      ? value.childSnapshots
      : [],
  }
}

export async function getRelationship(t: any, cardId?: string): Promise<Relationship> {
  const scope = cardId || 'card'
  return normalize(await t.get(scope, 'shared', KEY, EMPTY_RELATIONSHIP))
}

export async function setRelationship(t: any, value: Relationship, cardId?: string) {
  const scope = cardId || 'card'
  await t.set(scope, 'shared', KEY, value)
}

export async function getCurrentCard(t: any): Promise<CardSnapshot> {
  const [card, list, board] = await Promise.all([
    t.card('id', 'name', 'url', 'shortLink', 'closed', 'dueComplete', 'idList', 'labels', 'members'),
    t.list('id', 'name'),
    t.board('id', 'name'),
  ])

  return snapshot(card, { listName: list.name, boardId: board.id, boardName: board.name })
}

export async function getBoardCards(t: any): Promise<CardSnapshot[]> {
  const [cards, board] = await Promise.all([
    t.cards('id', 'name', 'url', 'shortLink', 'closed', 'dueComplete', 'idList', 'labels', 'members'),
    t.board('id', 'name'),
  ])

  const lists = await t.lists('id', 'name')
  const listMap = new Map(lists.map((list: any) => [list.id, list.name]))

  return cards.map((card: any) =>
    snapshot(card, {
      listName: listMap.get(card.idList),
      boardId: board.id,
      boardName: board.name,
    }),
  )
}

export function snapshot(card: any, extra: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    id: card.id,
    name: card.name,
    url: card.url,
    shortLink: card.shortLink,
    closed: !!card.closed,
    dueComplete: !!card.dueComplete,
    idList: card.idList,
    labels: (card.labels || []).map((label: any) => ({
      id: label.id,
      name: label.name || '',
      color: label.color,
    })),
    members: (card.members || []).map((member: any) => ({
      id: member.id,
      fullName: member.fullName,
      initials: member.initials,
      avatar: member.avatar,
    })),
    ...extra,
  }
}

function withoutId(ids: string[], id: string) {
  return ids.filter((value) => value !== id)
}

function withoutSnapshot(snapshots: CardSnapshot[], id: string) {
  return snapshots.filter((value) => value.id !== id)
}

export async function attachParent(t: any, child: CardSnapshot, parent: CardSnapshot) {
  if (child.id === parent.id) throw new Error('A card cannot be its own parent.')

  const childRel = await getRelationship(t)
  const oldParentId = childRel.parentId

  if (oldParentId && oldParentId !== parent.id) {
    const oldParent = await getRelationship(t, oldParentId)
    await setRelationship(
      t,
      {
        ...oldParent,
        childIds: withoutId(oldParent.childIds, child.id),
        childSnapshots: withoutSnapshot(oldParent.childSnapshots, child.id),
      },
      oldParentId,
    )
  }

  await setRelationship(t, {
    ...childRel,
    parentId: parent.id,
    parentSnapshot: parent,
  })

  const parentRel = await getRelationship(t, parent.id)
  const childIds = parentRel.childIds.includes(child.id)
    ? parentRel.childIds
    : [...parentRel.childIds, child.id]

  const childSnapshots = [
    ...withoutSnapshot(parentRel.childSnapshots, child.id),
    child,
  ]

  await setRelationship(t, {
    ...parentRel,
    childIds,
    childSnapshots,
  }, parent.id)
}

export async function attachChildren(t: any, parent: CardSnapshot, children: CardSnapshot[]) {
  const parentRel = await getRelationship(t)

  for (const child of children) {
    if (child.id === parent.id) continue

    const childRel = await getRelationship(t, child.id)

    if (childRel.parentId && childRel.parentId !== parent.id) {
      const oldParentRel = await getRelationship(t, childRel.parentId)
      await setRelationship(t, {
        ...oldParentRel,
        childIds: withoutId(oldParentRel.childIds, child.id),
        childSnapshots: withoutSnapshot(oldParentRel.childSnapshots, child.id),
      }, childRel.parentId)
    }

    await setRelationship(t, {
      ...childRel,
      parentId: parent.id,
      parentSnapshot: parent,
    }, child.id)
  }

  const merged = [...parentRel.childSnapshots]
  for (const child of children) {
    if (child.id === parent.id) continue
    const index = merged.findIndex((item) => item.id === child.id)
    if (index >= 0) merged[index] = child
    else merged.push(child)
  }

  await setRelationship(t, {
    ...parentRel,
    childIds: [...new Set(merged.map((item) => item.id))],
    childSnapshots: merged,
  })
}

export async function detachChild(t: any, parent: CardSnapshot, childId: string) {
  const parentRel = await getRelationship(t)
  const childRel = await getRelationship(t, childId)

  await setRelationship(t, {
    ...parentRel,
    childIds: withoutId(parentRel.childIds, childId),
    childSnapshots: withoutSnapshot(parentRel.childSnapshots, childId),
  })

  if (childRel.parentId === parent.id) {
    await setRelationship(t, {
      ...childRel,
      parentId: null,
      parentSnapshot: null,
    }, childId)
  }
}

export async function detachParent(t: any, child: CardSnapshot) {
  const rel = await getRelationship(t)
  if (!rel.parentId) return

  const parentId = rel.parentId
  const parentRel = await getRelationship(t, parentId)

  await setRelationship(t, {
    ...rel,
    parentId: null,
    parentSnapshot: null,
  })

  await setRelationship(t, {
    ...parentRel,
    childIds: withoutId(parentRel.childIds, child.id),
    childSnapshots: withoutSnapshot(parentRel.childSnapshots, child.id),
  }, parentId)
}

export async function getRestApi(t: any) {
  if (!import.meta.env.VITE_TRELLO_APP_KEY) {
    throw new Error('REST API is not configured. Add VITE_TRELLO_APP_KEY to your Vercel environment variables.')
  }
  return t.getRestApi()
}

export async function authorizeRest(t: any) {
  const rest = await getRestApi(t)
  if (!(await rest.isAuthorized())) {
    await rest.authorize({ scope: 'read,write', expiration: 'never' })
  }
  return rest
}

export async function restFetch(t: any, path: string, options: RequestInit = {}) {
  const rest = await authorizeRest(t)
  const token = await rest.getToken()
  if (!token) throw new Error('Trello authorization was not completed.')

  const key = import.meta.env.VITE_TRELLO_APP_KEY
  const url = new URL(`https://api.trello.com/1/${path.replace(/^\\//, '')}`)
  url.searchParams.set('key', key)
  url.searchParams.set('token', token)

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Trello API returned ${response.status}.`)
  }

  return response.json()
}

export async function getAccessibleBoards(t: any) {
  return restFetch(t, 'members/me/boards?fields=id,name,url,closed')
}

export async function getBoardCardsViaApi(t: any, boardId: string) {
  const [cards, lists] = await Promise.all([
    restFetch(t, `boards/${boardId}/cards?fields=id,name,url,shortLink,closed,dueComplete,idList,labels,members`),
    restFetch(t, `boards/${boardId}/lists?fields=id,name,closed`),
  ])

  const listMap = new Map(lists.map((list: any) => [list.id, list.name]))
  const board = await restFetch(t, `boards/${boardId}?fields=id,name`)

  return cards.map((card: any) =>
    snapshot(card, {
      listName: listMap.get(card.idList),
      boardId: board.id,
      boardName: board.name,
    }),
  )
}

export async function createCard(t: any, name: string) {
  const current = await getCurrentCard(t)
  if (!current.idList) throw new Error('The current card does not have a list.')

  return restFetch(
    t,
    `cards?idList=${encodeURIComponent(current.idList)}&name=${encodeURIComponent(name)}`,
    { method: 'POST' },
  )
}
