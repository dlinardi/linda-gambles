# Linda's Portfolio Builder

Crowd-powered stock investing demo. Spin a random stock, get AI analysis (via Claude + web search), and let the audience vote INVEST or SKIP.

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Render

1. Push to GitHub
2. Create a new **Web Service** at [render.com](https://render.com)
3. Connect the repo
4. Settings will auto-detect from `render.yaml`:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start`
5. Add `ANTHROPIC_API_KEY` in the Environment tab
6. Deploy
