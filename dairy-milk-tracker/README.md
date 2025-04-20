# Dairy Milk Tracker

A comprehensive application for tracking dairy milk production with a React frontend and FastAPI backend.

## Project Structure

The project is organized into two main directories:

- `backend/`: Python FastAPI application
- `frontend/`: React application

## Backend

The backend is built with FastAPI and SQLite, using SQLAlchemy for ORM. It provides a RESTful API for managing users, herds, and milk production records.

### Features

- User authentication with JWT
- CRUD operations for herds
- CRUD operations for milk production records
- Statistics and reporting

### Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies with Poetry:
   ```
   poetry install
   ```

3. Run the application:
   ```
   poetry run python run.py
   ```

4. The API will be available at http://localhost:8000

### Testing

Run the tests with pytest:
```
poetry run pytest
```

## Frontend

The frontend is built with React and uses React Router for navigation and Axios for API communication.

### Features

- User registration and login
- Dashboard with production statistics and charts
- Herd management
- Milk production tracking
- User profile and membership management

### Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. The application will be available at http://localhost:3000

### Testing

Run the Playwright E2E tests:
```
npm run test:e2e
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/token`: Get JWT token (login)

### Users
- `GET /api/users/me`: Get current user profile
- `PUT /api/users/membership`: Update user membership

### Herds
- `GET /api/herds/`: Get all herds for the current user
- `POST /api/herds/`: Create a new herd
- `GET /api/herds/{herd_id}`: Get a specific herd
- `PUT /api/herds/{herd_id}`: Update a herd
- `DELETE /api/herds/{herd_id}`: Delete a herd

### Milk Production
- `GET /api/milk-production/`: Get all milk production records
- `POST /api/milk-production/`: Create a new milk production record
- `GET /api/milk-production/{record_id}`: Get a specific record
- `DELETE /api/milk-production/{record_id}`: Delete a record
- `GET /api/milk-production/stats`: Get milk production statistics

## Application Flow

The application follows the user flow depicted in the diagram:

1. User registers/logs in
2. New users go through onboarding to set up their first herd
3. Users can track milk production for each herd
4. The dashboard provides a visual overview of production data
5. Users can upgrade their membership for additional features

## Technologies Used

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Poetry
- Pytest

### Frontend
- React
- React Router
- Chart.js
- Axios
- Playwright (for testing)
