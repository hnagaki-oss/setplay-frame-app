# Development

## Requirements

- Node.js 18 or newer
- npm

## Common Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Data Model

The app stores all user data in browser IndexedDB via Dexie. Schema versions are managed in `src/db.ts`, and the visible version constants live in `src/version.ts`.

When changing the IndexedDB schema, update both:

- `src/db.ts`
- `src/version.ts`

## Official Frame Data Import Notes

- Do not import jump attacks or air-only special moves into the frame-kill move list.
- Map official `スーパーアーツ` rows to the app category `超必殺技`.
- For multi-hit active data such as `9-11, 19-20`, store only the final active segment: `activeStartFrames = 19`, `activeFrames = 20`.
- Import official notes into `memo`; the move list surfaces the `備考:` line so it can be checked without opening the detail modal.

## Release Checklist

1. Update `APP_VERSION` in `src/version.ts`.
2. Update `version` in `package.json`.
3. Run `npm run check`.
4. Run `npm run build`.
5. Export backup data from the app before testing data migrations.
