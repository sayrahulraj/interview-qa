# interview-qa

A personal interview Q&A site for studying from anywhere. Angular (standalone components, signals, strict TypeScript, SCSS), no backend and no database.

- Questions live in one static file: `public/data/questions.json`, loaded at runtime with `HttpClient`.
- Study progress (status, bookmarks, streaks, history, theme) lives in your browser's `localStorage`, with every key prefixed `interview-qa:`.
- Installable PWA that works offline after the first load.

## Run locally

Requires Node.js 22.22.3+ or 24.15.0+ (Angular 22 CLI).

```bash
npm install
node scripts/enable-sw.mjs   # one-time: enables the service worker for production builds
ng serve                     # http://localhost:4200
```

The service worker is disabled in `ng serve`. To try the PWA and offline mode locally:

```bash
ng build
npx http-server dist/interview-qa/browser -p 8080 -c-1 --proxy http://localhost:8080?
```

## Add or edit questions

There is no server, so edits go through an exported file:

1. Open `/admin` and sign in (see "Change the admin credential").
2. Add, edit or delete questions. Changes are saved as a **working draft** in this browser. While you are signed in you see the draft; public visitors always see the deployed `questions.json`.
3. When the "You have unsaved changes" banner appears, open **Import / Export** and download `questions.json`.
4. Replace `public/data/questions.json` in the project with the downloaded file.
5. Commit and push (or run `vercel --prod`) to redeploy.
6. After the redeploy, click **Discard draft and reset to deployed data** so you are looking at the live file again.

You can also edit `public/data/questions.json` by hand. Import validates the same schema: required fields, known groups and topics, unique ids, `tags` as strings, `relatedIds` pointing to existing ids, and `externalLinks` with a label and an http(s) URL.

Groups and topics are defined in one file, `src/app/config/categories.config.ts`. Add a topic there and it appears in the sidebar, dropdowns, filters and admin form.

## Add diagrams

1. Put an `.svg`, `.png` or `.webp` file in `public/assets/diagrams/`.
2. Set the question's **Diagram path** to `assets/diagrams/<file>` (admin form, or the `diagram` field in the JSON).
3. If the file is missing, the card shows a small placeholder instead of a broken image.

For simple flows you can also put a ```` ```mermaid ```` block directly in the answer.

## Change the admin credential

Edit `src/environments/admin.config.ts`, then rebuild and redeploy. The default password is `change-me-now`, and the admin area warns you until you change it.

> This is **front-end-only protection**. The credential is compiled into the JavaScript bundle, so anyone who reads the bundle can see it. That is acceptable here because the admin area can only change a local draft in your own browser. It cannot modify the deployed site. Do not reuse a password from anywhere else.

## Deploy to Vercel

1. Push the project to GitHub, GitLab or Bitbucket.
2. In Vercel choose **Add New, Project** and import the repository.
3. `vercel.json` already sets the following (shown here so you can check them in the dashboard):
   - Build command: `npm run build` (which runs `ng build`)
   - Output directory: `dist/interview-qa/browser`
   - Install command: `npm ci`
4. Click **Deploy**.

`vercel.json` also rewrites every route to `index.html` (SPA routing), gives hashed JS/CSS a one-year immutable cache, and sets no-cache on `index.html`, the service worker files, the manifest and `data/questions.json`, so a redeploy shows up quickly.

### Connect your custom domain

1. In the Vercel project open **Settings, Domains** and add your domain, for example `qa.example.com`.
2. At your DNS provider add what Vercel shows you: a `CNAME` record for a subdomain, or an `A` record (or Vercel nameservers) for the apex domain.
3. Wait for DNS to propagate. Vercel issues the HTTPS certificate automatically, and HTTPS is required for the PWA.

## Offline and updates

The service worker caches the app shell and assets. `data/questions.json` uses a network-first strategy with a 4 second timeout, so you get fresh questions when online and the cached copy when offline. When a new deploy is ready you see a "new version available" banner with a Reload button.

## Keyboard shortcuts

`/` focus search, `t` toggle theme, `?` help. In Practice and Interview Mode, `Space` reveals the answer and the left and right arrows go to the previous and next question. Shortcuts are ignored while you type in a field.

## Print

Use the **Print** button above any question list. It expands every answer, switches to the light theme and opens the print dialog.

## Privacy note

`notes`, `source` and `externalLinks` are stored in the public `questions.json`, so **anyone can read them**. Do not put private information (employer details, internal URLs, secrets) there. Study progress stays in your own browser and is never uploaded.

## Scripts

| Command | What it does |
| --- | --- |
| `ng serve` | Dev server |
| `ng build` | Production build into `dist/interview-qa/browser` |
