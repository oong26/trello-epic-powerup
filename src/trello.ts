export const KEY = 'epicRelationship'

export async function getRelationship(t: any) {
  return (await t.get('card', 'shared', KEY, {
    parentId: null,
    childIds: [],
  })) as { parentId: string | null; childIds: string[] }
}

export async function setRelationship(t: any, value: { parentId: string | null; childIds: string[] }) {
  await t.set('card', 'shared', KEY, value)
}

export async function getCurrentCard(t: any) {
  return t.card('id', 'name', 'url', 'shortLink', 'dueComplete', 'closed')
}

export async function getBoardCards(t: any) {
  return t.cards('id', 'name', 'url', 'shortLink', 'dueComplete', 'closed')
}