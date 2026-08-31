import './styles.css'

declare global {
  interface Window {
    TrelloPowerUp: any
  }
}

const APP_KEY = import.meta.env.VITE_TRELLO_APP_KEY || ''
const APP_NAME = 'Trello Epic Power-Up'
const APP_AUTHOR = 'oong26'
const icon = `${window.location.origin}/icon.svg`

function openManager(t: any) {
  return t.popup({
    title: 'Epic Relationships',
    items: [
      {
        text: 'Attach Parent',
        callback: (popupT: any) =>
          popupT.popup({
            title: 'Attach Parent',
            url: popupT.signUrl('./picker.html?mode=parent'),
            height: 480,
          }),
      },
      {
        text: 'Create and attach new children',
        callback: (popupT: any) =>
          popupT.popup({
            title: 'Create and attach new children',
            url: popupT.signUrl('./picker.html?mode=create'),
            height: 460,
          }),
      },
      {
        text: 'Attach existing children',
        callback: (popupT: any) =>
          popupT.popup({
            title: 'Attach existing children',
            url: popupT.signUrl('./picker.html?mode=children'),
            height: 560,
          }),
      },
    ],
  })
}

window.TrelloPowerUp.initialize(
  {
    'card-buttons': (t: any) => [
      {
        icon,
        text: 'Epic Relationships',
        callback: openManager,
      },
    ],

    'card-back-section': (t: any) => ({
      title: 'Related Cards',
      icon,
      content: {
        type: 'iframe',
        url: t.signUrl('./related.html'),
        height: 520,
      },
      action: {
        text: 'Manage',
        callback: openManager,
      },
    }),

    'card-badges': (t: any) =>
      t.get('card', 'shared', 'epicRelationship', null).then((rel: any) => {
        const parentId = rel?.parentId || null
        const childIds = Array.isArray(rel?.childIds)
          ? rel.childIds
          : []

        const relatedIds = new Set([
          ...(parentId ? [parentId] : []),
          ...childIds,
        ])

        const count = relatedIds.size

        if (!count) return []

        return [
          {
            text: `Related to ${count} ${count === 1 ? 'card' : 'cards'}`,
            color: 'blue',
          },
        ]
      }),
  },
  {
    appKey: APP_KEY,
    appName: APP_NAME,
    appAuthor: APP_AUTHOR,
  },
)
