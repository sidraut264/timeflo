# Tarot & Tea development

Use Node 20 or newer. Put your Gemini key in `.env.local` (ignored by Git):

```dotenv
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Run `node scripts/tarot-dev.cjs`, then open http://127.0.0.1:8765/tarot-and-tea.html. Set `PORT` to change the port. A static file server or opening the HTML directly cannot run the Gemini API route.

For Vercel, set `GEMINI_API_KEY` in the project's environment variables and redeploy. `GEMINI_MODEL` optionally overrides the default `gemini-3.5-flash-lite`. The key stays on the server. Both `/api/tarot` and `/api/gemini` use the same handler.

The Oracle waits for Gemini before showing interpretations, the verdict, or the dare. The server has a 25-second deadline, including one retry for a transient upstream failure; the browser has a 30-second deadline. Fast failures show the waiting state for at least six seconds before displaying the labeled archive reading. Try again requests a fresh Gemini reading and updates the existing journal entry. Starting over cancels the previous request.

The card illustrations and gold framing are adapted from the local `mysticdraw_tarot_reading_app.html` reference. Reversed cards rotate the central illustration while keeping the name readable.

Run `node tests/tarot-oracle.cjs` to check server validation, generation settings, retries, deadlines, reading states, journal updates, stale responses, and the full deck without using API quota.

## Mobile ritual and conversation

The setup screen offers topic suggestions and three tone levels: `gentle`, `spicy` (default), and `hot`. The selected tone goes to Gemini for both readings and follow-ups. The stronger tones target habits and excuses, with supportive handling of sensitive subjects.

Draw by tapping the deck or choosing automatic selection. Reshuffling excludes already selected cards. Leaving the draw cancels scheduled selections. Tap a face-down reading card to reveal it; swipe horizontally or use the arrow buttons to move between cards, the verdict, and chat. Vertical scrolling remains available. Haptics are optional and reduced-motion preferences are respected.

“Spill more” opens a session-only conversation that includes the spread, generated reading, and recent chat history. The chat can change tone without redrawing cards. Failed replies keep the user's message and provide a retry; they never pretend to be live AI. A new reading clears the conversation and discards late replies. The composer adapts to the mobile keyboard. Each session allows twelve questions, with up to the latest nine messages included per request.

`POST /api/tarot` accepts `spice` for a reading. Chat uses the same endpoint with `mode: "chat"`, `readingContext` (up to 8,000 characters), and alternating `messages` containing `role: "user" | "model"` and `text`. User messages are limited to 500 characters. Chat returns `{ reply, source: "gemini" }`.

For touch/browser checks, run the local server on port 8766 (`PORT=8766 node scripts/tarot-dev.cjs`) and disposable Chrome with remote debugging on 9222, then run `node tests/tarot-mobile-browser.cjs`. These UI checks simulate Gemini responses without consuming API quota.
