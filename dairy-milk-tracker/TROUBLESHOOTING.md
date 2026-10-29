# Troubleshooting

Commands below run from `dairy-milk-tracker/` unless they `cd` somewhere. See [README.md](./README.md)
for setup.

## Login and authentication

### Login fails with no useful message, or the browser console shows a CORS error

- Check the backend is up: `curl http://localhost:8000/` should return
  `{"message":"Welcome to the Dairy Milk Tracker API"}`.
- The backend must be on port 8000. The frontend calls `http://localhost:8000` directly, so the
  `proxy` entry in `package.json` doesn't help.
- The frontend can be on any port, on `localhost` or `127.0.0.1`. CORS used to allow only
  `http://localhost:3000`, so when `npm start` moved to 3001 every request was blocked, login included.
  If you see this, your backend predates commit `7f29357b`: pull and restart it.
- Opening the frontend from another hostname (a LAN IP, a tunnel) is blocked by CORS. Add the origin
  to `allow_origin_regex` in `backend/app/main.py`.

### "Incorrect email or password"

The backend returned 401. Log in with the **email** you registered with, not a username. There are no
default accounts, so register at `/register` first.

### Logged in, but pages bounce back to `/login` or API calls return 401

- **The backend restarted without `SECRET_KEY` set.** The signing key is random on every start, and
  `run.py` uses `reload=True`, so editing backend code restarts it and invalidates every token. Log in
  again, or export a fixed `SECRET_KEY` before starting the backend (see README → Configuration).
- **The token expired.** Tokens last 30 minutes by default (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **A page used bare `axios` instead of `api`.** Only the `api` instance in
  `frontend/src/services/api.js` attaches `Authorization: Bearer <token>`. New code must import `api`.
- To inspect auth state, run `milkTrackerDebug.checkConfig()` in the browser console. It shows the base
  URL and whether a token and auth header are set. In DevTools → Application → Local Storage, the
  `token` key holds the JWT. Remove it to force a clean login.

## Database

The database is `backend/dairy_milk_tracker.db`. It isn't tracked in git. The backend creates it on
first start.

### `no such column: users.username` / `herds.location_line1`

The database predates those columns. The backend adds them on startup, but you can also run the
migration script by hand with the backend stopped:

```bash
cd backend
python3 fix_database.py
```

Or add the columns yourself:

```bash
sqlite3 backend/dairy_milk_tracker.db <<'SQL'
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE herds ADD COLUMN location_line1 TEXT;
ALTER TABLE herds ADD COLUMN location_line2 TEXT;
SQL
```

Check the schema with `sqlite3 backend/dairy_milk_tracker.db ".schema"`.

### Start over with an empty database

This deletes all data. Back it up first if you need it:

```bash
sqlite3 backend/dairy_milk_tracker.db .dump > backup.sql   # optional backup
rm backend/dairy_milk_tracker.db
cd backend && poetry run python run.py                     # recreates the schema
```

### `database is locked`

Another process holds the file. Look for a second backend still running:
`lsof -iTCP:8000 -sTCP:LISTEN`. Also close any `sqlite3` shell that has the file open. Then restart.

## Startup

### `./start.sh` says Python isn't installed

The script needs `python3` on `PATH` (`python3 --version`).

### Port 8000 or 3000 already in use

```bash
lsof -iTCP:8000 -sTCP:LISTEN     # find the old backend
kill <PID>
```

For the frontend, let `npm start` move to the next free port. CORS allows it. The backend has to be on
8000.

### Frontend won't compile after changing dependencies

Reinstall from the lockfile:

```bash
cd frontend
rm -rf node_modules
npm ci
```

## Mobile layout

`/dashboard`, `/herds` and `/profile` switch to their mobile versions at 768px wide and below. To test,
use DevTools device mode or narrow the window. Other pages always use the desktop layout. If you get
401s after resizing in device mode, see
[Logged in, but pages bounce back to `/login`](#logged-in-but-pages-bounce-back-to-login-or-api-calls-return-401).
