import './styles.css'

declare global {
  interface Window {
    TrelloPowerUp: any
  }
}

const icon = `${window.location.origin}/icon.svg`

window.TrelloPowerUp.initialize({
  'card-buttons': (t: any) => [
    {
      icon,
      text: 'Set Parent Epic',
      callback: (context: any) =>
        context.popup({
          title: 'Set Parent Epic',
          url: context.signUrl('./picker.html'),
          height: 420,
        }),
    },
  ],

  'card-back-section': (t: any) => ({
    title: 'Related Cards',
    icon,
    content: {
      type: 'iframe',
      url: t.signUrl('./related.html'),
      height: 260,
    },
    action: {
      text: 'Manage',
      callback: (context: any) =>
        context.popup({
          title: 'Related Cards',
          url: context.signUrl('./related.html'),
          height: 420,
        }),
    },
  }),
})