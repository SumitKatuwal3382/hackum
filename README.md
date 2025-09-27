# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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
* LocalStorage persistence layer
* Backend API integration (GraphQL or REST)
* Authentication + multi-user sessions
* Dark mode & accessibility improvements
* Force-directed graph for larger datasets
* Export plan / schedule as calendar event

---

## Summary
The app supports:
* Local visualization & recommendations over in-memory data
* Onboarding to add a student and see recalculated weaknesses
* Peer similarity (local heuristic)
* Resource suggestions per weak concept

Extend by adding persistence, authentication, or more advanced graph algorithms in a future backend.

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

