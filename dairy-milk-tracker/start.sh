#!/bin/bash

# Dairy Milk Tracker Quick Start Script

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Dairy Milk Tracker - Startup Script  ${NC}"
echo -e "${GREEN}=======================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to run a command with proper error handling
run_command() {
  echo -e "${YELLOW}Running: $1${NC}"
  eval $1
  if [ $? -ne 0 ]; then
    echo -e "${RED}Command failed: $1${NC}"
    exit 1
  fi
}

# Check prerequisites
echo -e "\n${GREEN}Checking prerequisites...${NC}"

if ! command_exists python; then
  echo -e "${RED}Python is not installed. Please install Python and try again.${NC}"
  exit 1
else
  echo -e "${GREEN}Python is installed.${NC}"
fi

if ! command_exists poetry; then
  echo -e "${YELLOW}Poetry is not installed. You can install it with:${NC}"
  echo "curl -sSL https://install.python-poetry.org | python3 -"
  echo -e "${YELLOW}Do you want to proceed anyway? (y/n)${NC}"
  read proceed
  if [ "$proceed" != "y" ]; then
    exit 1
  fi
else
  echo -e "${GREEN}Poetry is installed.${NC}"
fi

if ! command_exists npm; then
  echo -e "${RED}npm is not installed. Please install Node.js and npm and try again.${NC}"
  exit 1
else
  echo -e "${GREEN}npm is installed.${NC}"
fi

# Fix database if needed
echo -e "\n${GREEN}Checking database...${NC}"
if [ -f "backend/dairy_milk_tracker.db" ]; then
  echo -e "${YELLOW}Running database fix script...${NC}"
  cd backend
  python fix_database.py
  cd ..
else
  echo -e "${YELLOW}No existing database found. A new one will be created.${NC}"
fi

# Start backend
echo -e "\n${GREEN}Starting backend server...${NC}"
echo -e "${YELLOW}If you encounter any issues with the backend, see TROUBLESHOOTING-DB.md${NC}"
cd backend

# Check if Poetry virtual environment exists
if [ ! -d ".venv" ]; then
  echo -e "${YELLOW}Setting up Poetry virtual environment...${NC}"
  run_command "poetry install"
fi

# Start backend in the background
run_command "poetry run python run.py &"
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID $BACKEND_PID${NC}"

# Switch to frontend
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "\n${GREEN}Installing frontend dependencies...${NC}"
  run_command "npm install"
fi

# Start frontend
echo -e "\n${GREEN}Starting frontend development server...${NC}"
echo -e "${YELLOW}The application will be available at http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID; exit" INT

# Start frontend
npm start

# If frontend exits, kill backend too
kill $BACKEND_PID
