# Search-and-play music card

The active player uses Audius's public search and streaming API. Type a song or artist, then select a result to play inside the portfolio. There are no pasted links, iframes, automatic artist recommendations, or promotional feeds. It searches the Audius catalog, not the entire Spotify/Audiomack catalog. Some searches return remixes or no matches. Gated, unavailable, and unlisted tracks are excluded. Local device files also work. Nothing starts automatically on page load.

## Controls

The player starts as a glass circle marked ×. Click it to reveal the compact waveform bar (+); click + to expand search and controls; click − to return to the bar. After seven seconds without pointer, keyboard, form, or wheel activity inside the player, it collapses to the circle. Dragging delays collapse. Music and the queue continue playing while collapsed. A small dot indicates active playback.

Play/pause, previous/next, seeking, volume, and automatic queue advancement use the native audio element. The wave follows real playback events, including buffering and pause. Browser autoplay restrictions may require a second play gesture, particularly for automatic queue advancement on mobile.

Drag only the MUSIC/SOUNDTRACK handle; arrow keys also move it, Shift increases the step, and Home resets its position. Escape minimizes the panel. The artwork is not draggable. Resizing clamps the player to the visible viewport.

## Connection and deployment

`src/services/musicCatalog.js` searches `https://api.audius.co/v1/tracks/search` with pagination and an identifying app name. The stream endpoint redirects to the public audio source when playback starts. No private API secrets are shipped. Search requests cancel when the query changes and time out after 15 seconds; service failures are shown in the card. API availability and rate limits remain external dependencies.

The active Audius player can run on static hosting. The existing Audiomack server adapter is retained but is not called by the player. Reactivating it would require authorized consumer credentials stored server-side and a hosted backend. No credentials from Yard were copied or used.

Tests cover public-track filtering, search encoding, pagination, player state transitions, and the separate Audiomack adapter. Live browser checks confirmed catalog results and playback continuing while the player collapsed.

Reference: [Audius developer documentation](https://docs.audius.co/).
