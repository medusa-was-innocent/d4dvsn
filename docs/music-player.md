# Music player

`src/components/MusicPlayer.vue` is a floating glass card. Drag the MUSIC / SOUNDTRACK handle to move it. With the handle focused, arrow keys move it, Shift makes larger steps, and Home restores its position. The card stays within the screen when dragged or resized. No music starts automatically.

## Available now

- Find searches Audiomack in a new tab. Paste an Audiomack song, album or playlist share link into the same field and press Load to use Audiomack's official embedded player.
- Choose from device opens local audio files. Files remain in the browser; they are not uploaded. Use the line button to play/pause. Its wave is driven by the audio element's actual `playing`, `waiting`, `pause` and `ended` events. Seeking and volume work for these files.
- Audiomack embeds use their own play/pause controls. The Data API documentation does not specify an embed playback-state API, so the custom line does not pretend to report playback inside a cross-origin iframe. Clear unloads the embed and stops it.

## Audiomack catalog search

The complete official [Audiomack Data API documentation](https://audiomack.com/data-api/docs) was reviewed on 2026-09-14. It uses OAuth 1.0a. Even its **Non-authenticated request** example passes `your_consumer_key` and `your_consumer_secret`. These identify the application; they are separate from signing a listener into an Audiomack account.

The **Registration** endpoint automatically returns a *user* access token after creating an account. It does not issue the application's consumer key or consumer secret. An unsigned read-only request to `https://api.audiomack.com/v1/search?q=lofi&show=songs&limit=1` returned HTTP 401 with `Invalid consumer key` on that date.

To show catalog results inside the card, provide an approved Audiomack application key/secret to a server-side service. Never put secrets in `VITE_*` variables or in this Vue component. A same-origin service can call the documented `/v1/search` endpoint and return a deliberately small response:

```json
{"results":[{"title":"Song title","artist":"Artist name","url":"https://audiomack.com/artist/song/song-title"}]}
```

Pass that service's relative path as the component's `search-endpoint` prop. The component already handles loading, empty results, errors, cancelled searches and result selection. Without a service, its Find action explicitly opens Audiomack search and does not present local results as Audiomack results.

Full custom Audiomack playback controls would also need the authorized server-side `/v1/music/:id/play` flow, fresh short-lived stream URLs and the platform's play/stat reporting. This integration currently uses the official embed for Audiomack playback instead.
