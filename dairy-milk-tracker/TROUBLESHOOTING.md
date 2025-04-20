# Troubleshooting Guide

## Database Migration Issues

If you encounter database errors related to missing columns like `users.username` or `herds.location_line1`, it means there's an issue with the database migration.

### Solution 1: Delete the Database and Let It Recreate

The simplest solution is to let the application recreate the database from scratch:

1. Stop the backend server
2. Delete the database file: `dairy_milk_tracker.db` from the backend directory
3. Restart the backend server with: `poetry run python run.py`

The updated code will automatically recreate the database with all the necessary columns.

### Solution 2: Manually Run SQLite Commands

If you want to keep your existing data, you can manually add the columns:

```bash
# Install sqlite3 if you don't have it
brew install sqlite3  # On macOS with Homebrew

# Connect to your database
sqlite3 dairy_milk_tracker.db

# Add the columns
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE herds ADD COLUMN location_line1 TEXT;
ALTER TABLE herds ADD COLUMN location_line2 TEXT;

# Exit SQLite
.exit
```

## Frontend Registration Issues

If you encounter registration issues:

1. Make sure the backend is running correctly
2. Check browser console for specific error messages
3. Verify network requests in the browser developer tools

## Mobile Layout Issues

If the mobile layout isn't displaying correctly:

1. Make sure Mobile.css is properly imported
2. Check that the MobileDetector component is working correctly
3. Try forcing mobile mode by resizing your browser window to a narrow width

## API Connection Issues

If the frontend can't connect to the backend:

1. Ensure backend is running on http://localhost:8000
2. Verify the proxy setting in frontend/package.json
3. Check for CORS issues in the browser console

## Authentication Issues

If login or registration fails:

1. Check the backend logs for specific error messages
2. Verify JWT token configuration in app/auth.py
3. Make sure the right credentials are being used

## Database Schema Issues

To see the current database schema:

```bash
sqlite3 dairy_milk_tracker.db ".schema"
```

This will show you all table definitions and help troubleshoot structural issues.
