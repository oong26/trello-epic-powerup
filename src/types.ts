export type EpicRelationship = {
  parentId: string | null
  childIds: string[]
}

export type TrelloCard = {
  id: string
  name: string
  url?: string
  shortLink?: string
  dueComplete?: boolean
  closed?: boolean
  idList?: string
}

export interface TrelloPowerUp {
  initialize: (capabilities: Record<string, unknown>) => void
  iframe: (options?: Record<string, unknown>) => any
}