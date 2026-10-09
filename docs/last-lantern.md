# The Last Lantern — implementation record

## Audit and plan

The existing standalone page contains 15 narrative nodes, five freely reachable locations, two supply gates, optional song/lens branches and two endings. The arcade links directly to it. Keep its original SVG and story routes, including existing local changes.

Issues: globally hidden cursor, full-card mouse tilt despite reduced motion, delayed reading animations, very small controls, no audio or optional object examination, save parsing coupled to ending parsing, no explicit transition guards, and references to Mara before meeting her. Restart from the opening silently overwrites a save.

Phases:
1. Validate/migrate saves independently of ending history; guard transitions and confirm replacement.
2. Preserve illustration and add weathered details, scene lighting and distinct ending transformations; remove presentation gimmicks.
3. Add optional memories, Mara's family story, a keepsake decision and consequences, a skippable opening, inventory examination and ending recap.
4. Add original Web Audio ambience and a recurring melody with explicit opt-in and graceful failure.
5. Improve readable typography, touch targets, focus, motion preferences and ending revisits.
6. Browser-test routes, persistence, failure modes, input and responsive layouts; record actual results below.

## Implemented

- Preserved standalone deployment, existing SVG compositions, arcade link, five destinations and both endings. Added weathered marks, a photograph, rope/net details, clouds, dawn color, sweeping beacon and shoreline lights. Environmental animations run selectively; the reading surface is static.
- Added a short skippable opening, five optional memories, Mara's brother/niece, and a brass-button decision with revisit and ending consequences. Shore guidance now explicitly relies on the sheltered channel, tide, lamps and familiar song. Required supplies still gate both endings.
- Added item descriptions, a useful notebook, quiet decision recaps, and an ending collection that preserves each newly completed journey's choices. Legacy endings have a clearly labelled generic replay when no detailed snapshot exists.
- Added readable text, 44px minimum secondary controls, native cursor, keyboard focus, touch-compatible interactions, reduced-motion support and a saved Stillness preference. Removed scanlines, overlay grain, pointer glow, card tilt, delayed prose and forced layout animation resets.
- Added original procedural Web Audio: filtered surf/wind, room/dock tones, a recurring eight-note motif, collection/paper cues and fuller ending harmonies. Audio is explicitly enabled per page session, fades on mute, suspends when hidden, and degrades gracefully when unavailable. No audio/image/font downloads, external assets, attribution obligations or missing asset placeholders.
- Added version-2 save validation, supply prerequisites, stale-choice rejection, non-destructive v1 migration, independent ending parsing, restart confirmation and recovery download. Corrupted/unsupported saves remain untouched; play continues in memory until the user manually resolves the stored data. Normal new stories replace the active journey only after the player chooses to do so; old v1 data remains intact.

## Validation record

During implementation: extracted script parsed successfully after foundation/narrative integration and after archive/audio cleanup. Browser checks passed before and after the final feature changes.

`tests/last-lantern-browser.py` uses the installed Chrome DevTools protocol and Python `websocket-client` without adding a game dependency. It exercises opening/start, supply gates, unmet-Mara text, all eight beacon combinations of supply order/song/lens, village ending variants, both keepsake consequences, five memories, examination, save/reload, ending archives without overwriting the active save, restart/cancel, number shortcuts, focus-visible, touch emulation, user/system reduced motion, four viewport sizes, legacy migration, malformed saves, impossible endings and denied storage. The audio checks confirm no context before opt-in, running context after a gesture, nonzero generated samples, fade to silence and unsupported-API fallback. No uncaught browser exceptions were observed. Desktop screenshot inspected for layout and readability.

## Run locally

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8765/games/story/last-lantern.html` or enter through `/arcade.html`. Hosting requires only static HTML. Sound is off until selected.

For the browser regression script, use a **disposable** Chrome profile (the test clears this origin's storage):

```sh
google-chrome --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --remote-allow-origins='*' --user-data-dir=/tmp/lantern-test-browser about:blank
python3 tests/last-lantern-browser.py
```

The test requires Python's `websocket-client` package; this was already installed in the development environment. `--no-sandbox` is for constrained test environments only. Use normal browser sandboxing where supported.

## Limits

Audio is synthesized, without recorded voices, acoustic instruments or environmental field recordings. Automated tests verify output and lifecycle, not subjective listening quality. Chrome was tested; Safari/Firefox, physical touch devices and screen-reader speech were not manually tested. The 10–20 minute duration is an editorial estimate, not a measured playtest. Art remains an intentionally compact SVG illustration, not a new set of painted backgrounds. Invalid saves can be exported but are not automatically repaired. Legacy ending replays cannot reconstruct choices the original game never archived.
