# Authentication Fix for Dairy Milk Tracking Application

## Issue Fixed
Fixed the 401 Unauthorized error that was occurring when trying to access protected API endpoints like `/api/herds/`.

## Changes Made

1. Created a centralized API service in `src/services/api.js` that:
   - Sets up an Axios instance with proper configuration
   - Adds a request interceptor to automatically include the authentication token
   - Adds a response interceptor to handle authentication errors

2. Updated the `AuthContext.js` to use this new API service:
   - Removed redundant interceptor code
   - Updated all API calls to use the new service

3. Updated `DashboardNew.js` to use the API service:
   - Replaced direct Axios calls with the API service
   - Ensured proper authentication token handling

## How This Fixes the Problem

The 401 Unauthorized errors were occurring because the authentication token wasn't being properly included in API requests. The API service now ensures that all requests include the proper authentication headers.

## How to Test

1. Start the backend server
2. Start the frontend application
3. Log in to the application
4. Navigate to the dashboard
5. Verify that the herds data is loaded correctly without 401 errors

## Next Steps

If you encounter any additional authentication issues, check the following:

1. Verify that the token is being stored correctly in localStorage
2. Ensure that the backend is properly validating the token
3. Check that the token format matches what the backend expects

You can also check the browser console for detailed error messages.