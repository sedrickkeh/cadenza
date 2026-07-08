# Cadenza

*Every score becomes a stage.*

A rhythm game rendered as ink on paper. Notes fall as engraved noteheads down a
printed system toward a final barline, while doodled **marginalia imps** invade
the page — every note you hit fires a music-note glyph that splats them into
ink blots. Upload any sheet music (MusicXML / MIDI) and it becomes a playable
level.

The whole game is a single dependency-free HTML file.

## Play

Open `index.html` in a browser — or enable GitHub Pages on this repo
(Settings → Pages → deploy from branch, root) and play at your Pages URL.

**Controls:** `D` `F` `J` `K` or arrow keys. Tap lanes on touch. `Esc` pauses.
Hold notes: press on the head, keep it down until the tail.

## Features

- **57 built-in tracks** across seven suites (The Conservatory, The Recital,
  The Ballroom, Nocturnes, Yuletide, Folk Tales, The Gala), with in-suite
  level progression
- **Bring your own score** — MusicXML (`.xml`/`.musicxml`), compressed `.mxl`,
  and MIDI (`.mid`/`.midi`) parsed in-browser; charts generated per difficulty
- **Four difficulties** — Easy through Virtuoso, with hold notes and
  procedurally seeded streams (jacks, trills, rolls) on the top tiers
- **Marginalia imps tuned to the chart** — the game's little mascots: plump
  multicoloured doodle-imps that scurry along the page margins, one per
  marked note (dense streams send a swarm, every hold sends a heavyweight,
  stray notes a lone raider). They never cross onto the printed system;
  each lurks in the margin beside its note's lane and is splatted the
  moment that note is played. Miss the note and it stays to gnaw your ink
  away until your hits splat it. Knockback, HP, and a Crescendo fever mode
  at 25 combo; score multiplier ladder, milestone shockwaves, full-combo
  seals
- **Curtain calls** — every run ends behind red velvet: a graceful close on
  a clear, a slam (and a sour sting) on a fail
- **Normalized scoring** — every chart tops out at exactly 1,000,000, so
  scores are comparable across songs and difficulties
- **Ink gauge** — misses bleed ink and gnawing imps drain it; hits restore
  it, and splatting an imp splashes back most of what it stole. Run dry and
  the recital ends early.
- **Synthesized audio** — a celesta-like tone via Web Audio; no audio files

## Development

```
npm install        # jsdom, for the test suite only
npm run build      # src/shell.html + src/game.js -> index.html
npm test           # parser/chart unit tests + headless boot smoke test
```

`src/game.js` contains the parsers (MIDI, MusicXML), the chart generator, the
compact melody notation DSL used to author the built-in tracks, and all
game/UI code. `src/shell.html` is the page shell and stylesheet.

## Music

All built-in melodies are traditional or public-domain works, encoded by hand
in a compact notation DSL (see `parseMel` in `src/game.js`).

## License

MIT — see `LICENSE`.
