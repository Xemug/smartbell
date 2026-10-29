# Authentication Fix for Dairy Milk Tracking Application (V2)

## Issues Fixed

We've resolved the authentication issues that were causing 401 Unauthorized errors:

1. The backend was using a randomly generated SECRET_KEY that changed on each restart
2. The python-dotenv dependency was missing
3. The frontend needed better authentication handling

## Setup Instructions

### Backend Setup

You have two options to fix the backend:

#### Option 1: Install python-dotenv

```bash
# Navigate to backend directory
cd /Users/juan/Documents/Inversiones/AI training/templates-main/Cursor\ MCP/dairy-milk-tracker/backend/

# Install python-dotenv using pip
pip install python-dotenv

# Or using poetry
poetry add python-dotenv

# Start the backend
python run.py
```

#### Option 2: Set environment variables manually

On macOS/Linux:
```bash
# Navigate to backend directory
cd /Users/juan/Documents/Inversiones/AI training/templates-main/Cursor\ MCP/dairy-milk-tracker/backend/

# Make the start script executable
chmod +x start.sh

# Run the start script
./start.sh
```

On Windows:
```
# Navigate to backend directory
cd /Users/juan/Documents/Inversiones/AI training/templates-main/Cursor MCP/dairy-milk-tracker/backend/

# Set environment variables
set_env.bat

# Start the backend
python run.py
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd /Users/juan/Documents/Inversiones/AI training/smartbell/dairy-milk-tracker/frontend/

# Start the frontend
npm start
```

## Testing the Fix

1. Start the backend server using one of the methods above
2. Start the frontend application
3. Open http://localhost:3000 in your browser
4. Log in to the application
5. Check the browser console for authentication messages
6. Verify that herds data loads without 401 errors

## Debugging Tips

If you encounter issues:

1. **Check browser console:**
   - Look for authentication messages
   - Verify token is being added to requests

2. **Check backend logs:**
   - Look for JWT validation errors
   - Verify environment variables are set correctly

3. **Clear local storage:**
   - Open browser developer tools
   - Go to Application > Local Storage
   - Clear the token and try logging in again

4. **Verify the SECRET_KEY:**
   - Make sure the SECRET_KEY is set consistently
   - The same SECRET_KEY should be used across restarts
