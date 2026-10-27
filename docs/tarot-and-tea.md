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
