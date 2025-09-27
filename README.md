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
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

# StudyMate Graph (Custom Additions)

This app visualizes a student's enrolled courses, related concepts, and weakest mastery areas, recommending study slots, peers, and resources.

## New Features Added
* Dynamic onboarding form ("Add Yourself") to create a new student profile.
* In-memory data store (`src/store.js`) using React Context to hold students, enrollments, weaknesses, and availability.
* Graph hover tooltips + legend for clarity.
* Tailwind CSS integration for rapid styling.

## Onboarding Flow
1. Click **Add Yourself**.
2. Enter basic info (name, major, GPA).
3. Select courses you are (or will be) taking.
4. Mark weak concepts and optionally adjust initial mastery sliders (0–1 scale; lower = weaker).
5. Add one or more availability slots (day + hour range, 24h format).
6. Save: you are auto-selected and recommendations refresh.

Data is ephemeral (not persisted). Refreshing the browser resets to seed data.

## Data Model Overview
| Entity | File | Key Fields |
| ------ | ---- | --------- |
| Student | store state (seed from `data.js`) | id, name, major, gpa |
| Course | `data.js` | id, title, level |
| Concept | `data.js` | id, name |
| CourseConcept | `data.js` | course_id, concept_id |
| Enrollment | store state | student_id, course_id, term, grade_num |
| Weakness | store state | student_id, concept_id, mastery (0–1) |
| Availability | store state | student_id, day, hour_start, hour_end |

## Recommendation Logic
* Weakest concepts: lowest mastery for selected student.
* Next free slot: first availability today after current hour, else earliest future.
* Peer matches: other students weak in same target concepts.
* Resources: first two resources mapped per concept.

All logic functions accept injected arrays internally (see `logic.js`) which enables stateful overrides.

## Tailwind Notes
Tailwind directives live in `src/index.css`. JIT compilation runs automatically via CRA + PostCSS config.

## Running Tests
Includes `Onboarding.test.js` verifying that a new student appears after form submission.

```bash
npm test
```

## Possible Next Steps
* LocalStorage persistence layer
* Backend API integration (GraphQL or REST)
* Authentication + multi-user sessions
* Dark mode & accessibility improvements
* Force-directed graph for larger datasets
* Export plan / schedule as calendar event

---
