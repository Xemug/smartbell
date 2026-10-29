# Port Configuration Fix for Dairy Milk Tracker

## Issue Fixed

We've identified and resolved an issue with port configuration in the Dairy Milk Tracking Application:

1. The React frontend runs on port 3000 (http://localhost:3000)
2. The backend API runs on port 8000 (http://localhost:8000)
3. API requests were being sent to the wrong port (3000 instead of 8000)

## Changes Made

1. **Updated API Configuration**:
   - Modified the API service to explicitly use port 8000 for all requests
   - Added request interceptors to ensure authentication token is applied
   - Improved error handling for network and authentication issues

2. **Fixed Login Endpoint**:
   - Updated the login endpoint to use the correct backend URL
   - Ensured consistent API URL usage across the application

3. **Added Debugging Tools**:
   - Created utilities to help diagnose and fix authentication issues
   - Added browser console tools for quick fixes during development
   - Created an authentication test page for direct API testing

4. **Streamlined Authentication Logic**:
   - Ensured token is applied before making API requests
   - Simplified token application code for better reliability
   - Improved error handling for authentication failures

## How to Test

1. **Use the Authentication Test Page**:
   - While the app is running, navigate to: http://localhost:3000/auth-test.html
   - Use the buttons to test different aspects of authentication
   - Check if API requests succeed with different URL configurations

2. **Use Browser Console Tools**:
   - Open the browser console (F12 > Console)
   - Run `milkTrackerDebug.checkConfig()` to view current configuration
   - Run `milkTrackerDebug.fixAuth()` to force-apply authentication token
   - Run `milkTrackerDebug.applyAuthToken()` to refresh the token

3. **Common Issues and Solutions**:

   a. **"401 Unauthorized" errors**:
   ```
   // In browser console
   milkTrackerDebug.fixAuth()
   ```

   b. **Wrong API URL**:
   ```
   // Ensure the API URL is correct
   console.log(api.defaults.baseURL)  // Should be "http://localhost:8000"
   ```

   c. **Missing or invalid token**:
   ```
   // Check if token exists
   console.log(!!localStorage.getItem('token'))
   
   // If no token or invalid token, you need to log in again
   ```

## Technical Details

### Why This Issue Occurred

The port mismatch occurred because:

1. The React development server uses a proxy setting to forward API requests
2. The proxy was correctly configured in package.json, but direct API URLs in the code were overriding it
3. During responsive testing, browser cache and state changes caused inconsistent authentication

### The Correct API URL Pattern

Always use one of these patterns for API requests:

1. **Using the API service (preferred)**:
   ```javascript
   import api from '../services/api';
   
   // The URL is automatically configured to use port 8000
   const response = await api.get('/api/herds/');
   ```

2. **Using absolute URLs**:
   ```javascript
   const response = await axios.post('http://localhost:8000/api/auth/token', ...);
   ```

3. **Using relative URLs with proxy (in development)**:
   ```javascript
   // This works in development because of the proxy setting in package.json
   const response = await axios.get('/api/herds/');
   ```

Remember that the authentication token must be included in all requests to protected endpoints.
