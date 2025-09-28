# StudyMate Graph – AI-Enhanced Study Companion

Interactive React + Tailwind app that visualizes a student's course + concept landscape, highlights weak areas, and layers on lightweight heuristic AI features (projected mastery, study planner, resource fit scoring, natural language concept search) — all fully client-side with no backend required.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!



## Possible Next Steps
* LocalStorage persistence for added students & plans
* Real model-backed mastery prediction (regression / small NN)
* Authentication + multi-user cloud sync
* Dark mode & accessibility refinements
* Larger force-directed or hierarchical concept graph
* Export study plan to calendar / ICS

---

## Feature Summary
Current capabilities:
* Student onboarding (add yourself: courses, weak concepts, availability)
* Weakness detection and projected mastery deltas
* Graph mini-view of student → courses → weak concepts
* Peer similarity (local heuristic only; no Neo4j)
* Resource fit scoring per concept
* AI Study Planner (time allocation optimizer)
* Natural language concept search (token embedding)

Extend by adding persistence, real ML models, multi-user auth, or richer graph analytics.

---

## AI Heuristic Enhancements (Added)

These lightweight AI-style features simulate personalization without external services:

### Projected Mastery
Displayed next to each weak concept: a heuristic predictor estimates short-term mastery improvement based on remaining headroom and generic study effort assumptions.

Formula (simplified):
```
delta ≈ 0.18*headroom + ratingFactor*0.10 + minuteBoost*0.12 + freqBoost*0.06 - difficultyPenalty
projected = clamp(current + 0.65*delta, 0, 1)
```

### AI Study Planner
Greedy allocation of a user-specified time budget (default 120 minutes) into 15‑minute slices across weak concepts, prioritizing highest marginal predicted gain per minute. Returns total projected mastery gain.

### Resource Fit Score
Scores each resource: `0.45*gap + 0.30*rating + 0.20*difficultyAlignment + tagBoost` (0–1 scaled, shown as Fit badge). Higher = better personalized value.

### Natural Language Concept Search
Token-based embedding of concept names + related course titles with cosine similarity. Query phrases like “improve biology genetics” return matching concepts; weak ones are highlighted.

### Extensibility Ideas
* Replace heuristic predictor with a trained regression model (store weights JSON)
* Introduce user feedback loop (“This helped”) to adjust resource scoring weights
* Persist study plans & actual outcomes for adaptive recalibration

All logic lives in `src/ml/` for easy swapping with real models later.

---

## (New) Groq Study Suggestion Prototype

An optional card "💡 Gemini Suggestion" (label kept for now) now generates a concise motivational next-steps plan using Groq Cloud's low-latency LLaMA models via an OpenAI‑compatible Chat Completions endpoint.

### Enable It
1. Create a Groq Cloud account & API key: https://console.groq.com/ 
2. Create `.env.local` in the project root (git‑ignored):
	```bash
	REACT_APP_GROQ_API_KEY=YOUR_KEY_HERE
	```
3. Restart dev server: `npm start`
4. Click "Get AI Suggestion" in the card.

### How It Works
* Builds a prompt with current day/time, student profile, weak concepts, and heuristic plan.
* Calls: `POST https://api.groq.com/openai/v1/chat/completions` with a model chosen from an ordered list.
* Override via env var: `REACT_APP_GROQ_MODEL`.
* Static fallback order (if decommissioned / not found): `llama3-70b-8192` → `llama3-8b-8192` → `mixtral-8x7b-32768`.
* If ALL static fallbacks are decommissioned, the client auto-fetches the live model list (`/openai/v1/models`), heuristically prefers newer llama or mixtral variants, and retries.
* Adds a footer line `(Model fallback used: <model>)` or `(Model auto-discovered: <model>)` when not using the primary.
* Renders first choice message content.

### Important Security Note
Front-end embedding of API keys is insecure. For production deploy a backend proxy (e.g., `/api/study-suggestion`) that holds the key server-side and relays only sanitized prompt + response.

### File References
* API client: `src/ai/groqClient.js` (retry + fallback + dynamic discovery)
* Deprecated stub (Gemini): `src/ai/geminiClient.js` (left as guard)
* UI component: `src/components/StudySuggestion.js`

### Testing
`groqClient.test.js` covers prompt shaping and missing key error. Add integration mocks by stubbing `fetch` if you need richer coverage.

---

