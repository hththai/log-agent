# Quickstart: Log Dashboard Reporting

## Prerequisites
- Node.js and pnpm installed
- Python environment available for the server
- Docker Compose available if you want to run the full stack locally

## Run the backend
```bash
cd server
source .venv/bin/activate
uvicorn main:app --reload
```

## Run the frontend
```bash
cd client
pnpm install
pnpm dev
```

## Validate the feature
1. Open the app in a browser and confirm the public demo section is visible before sign-in.
2. Sign in with an email-based SSO-style flow and confirm the dashboard becomes available.
3. Change filters such as service, report type, or time range and verify the visible cards and charts update.
4. Toggle dark mode and confirm the layout and theme preference persist across reloads.
5. Run the focused tests:
```bash
cd client
pnpm test
```
