# Trello Epic Power-Up

An open-source, self-hosted Trello Power-Up for simple parent/child card relationships.

## V1 features

- Set a parent Epic on a card.
- Show the parent Epic on the card back.
- Show child cards.
- Calculate child completion progress.
- Remove a parent.
- Remove child relationships.
- No external database required.

## Important V1 limitation

Trello Power-Up iframes are isolated. The initial implementation uses Trello plugin data on each card and is intentionally simple. Cross-board relationships and a polished "add existing child" workflow are planned for V2.

## Local development

```bash
npm install
npm run dev
```

The Vite dev server must be exposed through HTTPS for Trello. For local testing, use an HTTPS tunnel such as Cloudflare Tunnel or ngrok.

## Production

```bash
npm install
npm run build
```

Deploy the generated `dist/` directory to a static HTTPS host such as Vercel, Netlify, or GitHub Pages.

## Trello configuration

1. Open the Trello App Admin Portal: https://trello.com/apps/admin
2. Create a new Power-Up owned by your Workspace.
3. Set the Connector URL to the deployed `index.html` URL.
4. Enable the capabilities:
   - `card-buttons`
   - `card-back-section`
5. Enable the custom Power-Up on a board in that Workspace.

## License

MIT
