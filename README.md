# Trello Epic Power-Up

An open-source, self-hosted Trello Power-Up inspired by the workflow of Hello Epics.

## Features

- Hello Epics-style menu:
  - Attach Parent
  - Create and attach new children
  - Attach existing children
- Parent/child relationships stored in Trello Power-Up data.
- Reciprocal relationship: parent knows children and child knows its parent.
- Existing child cards can be multi-selected.
- Rich related-card UI with labels, members, list, status and progress.
- Card badge showing child completion.
- Optional cross-board card search through the Trello REST API.
- No external database.

## REST API configuration

Basic same-board relationships work without REST authorization.

The following features need the Power-Up API key:

- Create child cards
- Search cards on other boards

1. Open the Trello App Admin Portal: https://trello.com/apps/admin
2. Open your Power-Up.
3. Open the API Key tab.
4. Generate the API Key.
5. Add it to Vercel as:

```text
VITE_TRELLO_APP_KEY=<your-api-key>
```

6. Redeploy.

The API key identifies your Power-Up. The user's Trello token is requested through Trello's REST API authorization flow and is stored by Trello.

## Local development

```bash
npm install
npm run dev
```

For Trello testing, serve the app over HTTPS.

## Production

```bash
npm install
npm run build
```

Deploy `dist/` to Vercel or another HTTPS static host.

## Trello Power-Up capabilities

Enable these in the Trello App Admin Portal:

- `card-buttons`
- `card-back-section`
- `card-badges`

Set the Connector URL to the deployed root URL.

## License

MIT
