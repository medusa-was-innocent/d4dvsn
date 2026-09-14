# Audiomack music card

Audius has been removed. The card uses the official Audiomack embed for song, album, or playlist links. Local device files still support the native line/wave control. Nothing starts automatically on page load.

## Connect direct catalog search

Audiomack search requires an approved application's **consumer key and consumer secret**. In the repository root, create a git-ignored `.env.local` with these server-only variables:

```
AUDIOMACK_CONSUMER_KEY=your_approved_key
AUDIOMACK_CONSUMER_SECRET=your_approved_secret
```

Restart `npm run dev`. Never prefix these variables with `VITE_`, commit them, or put them into the Vue component. The card checks `/api/music/status` and enables catalog search when both variables are configured. Missing credentials are reported honestly; there are no substitute artist feeds or fabricated results.

`server/audiomack.mjs` signs read-only requests with OAuth 1.0a/HMAC-SHA1. Search requests songs from verified uploaders, supports pagination, and caches bounded results for one minute. Responses only expose display metadata and official embed links, not credentials. Verified uploaders are not a guarantee that every recording is an original or available in every region.

`vite.config.js` mounts the API middleware in both the development server and `npm run preview`. A static `dist` upload, including GitHub Pages, cannot run these routes. For public deployment, the same middleware needs a Node/serverless backend behind the same-origin `/api/music/*` routes. Live signed search has not been verified against Audiomack without approved credentials; signing, normalization, pagination, and missing-credential behavior have automated tests.

Selecting a search result loads its official player inside the card. Playback uses **Audiomack's own controls**. The cross-origin embed has no playback-control/state API documented in the Data API, so the portfolio's line button opens those controls and does not falsely animate as if it can observe embedded playback. For device files, the wave follows actual playing/pause/waiting/ended events.

Drag only the MUSIC/SOUNDTRACK handle; arrow keys also move it, Shift increases the step, and Home resets its position. Escape minimizes the card. The artwork is not draggable.

Reference: [Audiomack Data API documentation](https://audiomack.com/data-api/docs). Its “Non-authenticated request” example still requires a consumer key and secret. The registration endpoint returns user tokens, not application credentials.
