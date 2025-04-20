# Database Troubleshooting Guide

If you're having trouble accessing the application due to database issues, follow these steps to fix it.

## Common Database Errors

1. `no such column: users.username` - This happens when the database schema is out of date
2. Database migration errors when trying to alter tables
3. SQLite locking errors

## Solution 1: Reset the Database (Quickest Fix)

**Note:** This will delete all your existing data.

1. Stop the backend server by pressing Ctrl+C in the terminal running it
2. Navigate to the backend directory:
   ```
   cd /Users/juan/Documents/Inversiones/AI training/templates-main/Cursor MCP/dairy-milk-tracker/backend
   ```
3. Delete the database file:
   ```
   rm dairy_milk_tracker.db
   ```
4. Restart the backend:
   ```
   poetry run python run.py
   ```

The backend will create a new database with the correct schema.

## Solution 2: Manual Column Addition

If you want to keep your data, you can manually add the missing columns:

1. Stop the backend server
2. Install SQLite command-line tools if not already installed:
   ```
   brew install sqlite3  # For macOS
   ```
3. Connect to your database:
   ```
   sqlite3 /Users/juan/Documents/Inversiones/AI\ training/templates-main/Cursor\ MCP/dairy-milk-tracker/backend/dairy_milk_tracker.db
   ```
4. Check the current schema:
   ```sql
   .schema users
   .schema herds
   ```
5. Add the missing columns:
   ```sql
   ALTER TABLE users ADD COLUMN username TEXT;
   ALTER TABLE herds ADD COLUMN location_line1 TEXT;
   ALTER TABLE herds ADD COLUMN location_line2 TEXT;
   ```
6. Exit SQLite:
   ```
   .exit
   ```
7. Restart the backend server:
   ```
   poetry run python run.py
   ```

## Solution 3: Back Up and Restore Data

If solutions 1 and 2 don't work:

1. Export your data:
   ```
   sqlite3 dairy_milk_tracker.db .dump > backup.sql
   ```
2. Delete the database:
   ```
   rm dairy_milk_tracker.db
   ```
3. Start the backend to create a new database with the correct schema:
   ```
   poetry run python run.py
   ```
   (Let it run for a few seconds, then stop it with Ctrl+C)
4. Import your data carefully (you might need to edit backup.sql if there are schema conflicts):
   ```
   sqlite3 dairy_milk_tracker.db < backup.sql
   ```

## Checking Database Health

To verify your database is correctly set up:

```
sqlite3 dairy_milk_tracker.db <<EOF
.headers on
.mode column
PRAGMA table_info(users);
PRAGMA table_info(herds);
EOF
```

You should see `username` in the users table columns and `location_line1` and `location_line2` in the herds table columns.

## Firefox Users: Database Locking Issues

SQLite has known issues with Firefox's persistent connections. If you're using Firefox and experiencing database locking errors:

1. Try using a different browser for testing
2. Change the SQLite journal mode:
   ```sql
   PRAGMA journal_mode = DELETE;
   ```
3. Increase the busy timeout:
   ```sql
   PRAGMA busy_timeout = 5000;
   ```

## If All Else Fails

If you continue to have database issues:

1. Use Solution 1 (reset the database)
2. Check for file permission issues:
   ```
   ls -la dairy_milk_tracker.db
   ```
   Make sure the file is writable by your user
3. Check for SQLite version issues:
   ```
   sqlite3 --version
   ```
   You should have SQLite 3.24.0 or higher
4. Consider switching to a different database backend like PostgreSQL for production use
