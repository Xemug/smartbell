# Dairy Milk Tracker

Track a dairy herd's milk production: a React frontend talking to a FastAPI + SQLite backend.

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) when something doesn't work.

## Requirements

- Python 3.9+ and [Poetry](https://python-poetry.org/)
- Node.js and npm

## Setup and run

### Quick start

From this directory:

```bash
./start.sh                  # add --force-install to reinstall frontend dependencies
```

It checks for `python3`, `poetry` and `npm`, migrates an existing database, starts the backend in the
background, then runs the frontend dev server in the foreground. Ctrl+C stops both.

### Manually (two terminals)

Backend, on http://localhost:8000:

```bash
cd backend
poetry install
poetry run python run.py
```

Frontend, on http://localhost:3000:

```bash
cd frontend
npm install
npm start
```

The backend must be on port **8000**: the frontend's API client (`frontend/src/services/api.js`) calls
`http://localhost:8000` directly. The frontend can be on any port. If 3000 is taken, `npm start`
offers 3001, 3002, and so on, and the backend accepts CORS requests from `localhost` or `127.0.0.1` on
any port.

Interactive API docs are at http://localhost:8000/docs.

### Configuration

The backend reads these environment variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `SECRET_KEY` | random on every start | Signs JWTs. Leave it unset and every backend restart (including `--reload` restarts after code edits) invalidates existing logins. Set it to keep sessions across restarts. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token lifetime. |

```bash
export SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
poetry run python run.py
```

Nothing loads a `.env` file, so export the variables in the shell that starts the backend.

## How to log in

There are no seeded accounts.

1. Open the frontend and go to **Register** (`/register`). Enter an email and a password.
2. Registration logs you in and sends you to **Onboarding** to create your first herd.
3. After that, sign in at `/login` with the same **email** and password.

On login the frontend posts the credentials as form data to `POST /api/auth/token`. It stores the
returned JWT in `localStorage` under `token`, and the `api` axios instance (`src/services/api.js`)
sends it as `Authorization: Bearer <token>` on every request. A wrong email or password returns
**401 "Incorrect email or password"**, which the login page shows. Any 401 on a later request clears
the token and redirects to `/login`.

## Architecture

```
dairy-milk-tracker/
├── backend/                  FastAPI app
│   ├── run.py                uvicorn on 0.0.0.0:8000 with reload
│   ├── fix_database.py       adds columns missing from older databases (also runs on startup)
│   ├── app/
│   │   ├── main.py           app, CORS, startup (migrate + create tables)
│   │   ├── auth.py           password hashing (bcrypt), JWT creation/validation
│   │   ├── database.py       async SQLAlchemy engine on backend/dairy_milk_tracker.db
│   │   ├── api/endpoints/    auth, users, herds, milk_production routers
│   │   ├── models/           User, Herd, MilkProduction
│   │   └── schemas/          Pydantic request/response models
│   └── tests/test_api.py     pytest suite
├── frontend/                 Create React App
│   ├── src/App.js            routes; mobile/desktop switch per page
│   ├── src/contexts/AuthContext.js   login, register, current user, profile actions
│   ├── src/services/api.js   axios instance: base URL, auth header, 401 handling
│   ├── src/pages/            desktop pages, *New.js mobile pages, herds/, milk/
│   ├── src/components/ui/    shared UI kit (Header, Hamburger, Sidebar, Card, Form, ...)
│   └── tests/auth.spec.js    Playwright end-to-end test
└── start.sh                  starts backend and frontend together
```

### Backend

- **Storage:** SQLite at `backend/dairy_milk_tracker.db` through async SQLAlchemy (`aiosqlite`). The
  file is created on first start and is not tracked in git. There is no Alembic. On startup the app runs
  `fix_database.py` to add columns older databases lack (`users.username`,
  `herds.location_line1/2`), then `create_all` creates missing tables.
- **Models:** a `User` (email, optional username, membership `free`/`annual`/`lifetime`) owns `Herd`s
  (name, cow count, two location lines), which own `MilkProduction` records (date, liters, optional fat
  and protein %).
- **Auth:** OAuth2 password flow. JWT (HS256) whose subject is the user's email.

### API

All routes are under `/api`. Everything except `auth` requires a bearer token.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a user (JSON: `email`, `password`, optional `username`) |
| POST | `/auth/token` | Log in (form: `username` = email, `password`) → `access_token` |
| GET | `/users/me` | Current user |
| PUT | `/users/profile` | Update username, email or password |
| PUT | `/users/membership?membership_type=…` | Change membership |
| DELETE | `/users/` | Delete the account |
| GET, POST | `/herds/` | List or create herds |
| GET, PUT, DELETE | `/herds/{id}` | Read, update or delete a herd |
| GET, POST | `/milk-production/` | List or create records |
| GET | `/milk-production/stats` | Production statistics, with time-span filtering and liters per cow |
| GET, PUT, DELETE | `/milk-production/{id}` | Read, update or delete a record |

### Frontend

- React 18, React Router 6, axios, Chart.js (`react-chartjs-2`).
- `/dashboard`, `/herds` and `/profile` render different components by width. At 768px and below
  (`MobileDetector`) they render the mobile pages `DashboardNew`, `RanchNew` and `ProfileNew` inside
  `MobileLayout`. Above it they render the desktop `Dashboard`, `HerdsList` and `Profile`.
- The header shows nav links on desktop and a hamburger that opens a slide-in sidebar on mobile.
- Herd add/edit/detail, milk production list/add/edit and onboarding use the desktop layout at every
  width.
- All authenticated requests go through `api` (`src/services/api.js`). Requests made with bare `axios`
  carry no token and get 401s.
- In development, `window.milkTrackerDebug` (`src/services/debugTools.js`) has `checkConfig()`,
  `applyAuthToken()` and `fixAuth()` for inspecting auth state from the browser console.

## Tests

Backend (each test uses its own temporary SQLite file):

```bash
cd backend
poetry run pytest
```

This covers registration, login, a wrong password returning 401, CORS for local dev ports (and
rejecting other origins), and creating herds and milk records.

Frontend end-to-end (needs both servers running):

```bash
cd frontend
npm run test:e2e
```

## Current state and known gaps

- Login works whichever local port the frontend is on. A bad password gives a real 401 with a readable
  message, and the pages send the token on every request (commit `7f29357b`).
- Without `SECRET_KEY`, logins don't survive backend restarts (see [Configuration](#configuration)).
- The API URL is hard-coded to `http://localhost:8000`, so the app only works locally as is.
- The schema is migrated by hand-written checks in `fix_database.py`, not migration tooling.
- The desktop and mobile versions of the dashboard, herds and profile pages are separate components.
- Login, Register and Onboarding don't use the shared UI kit yet.
- The backend uses deprecated FastAPI `on_event` startup hooks and `datetime.utcnow()`, which show up
  as test warnings.
