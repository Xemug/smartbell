#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Dairy Milk Tracker - With Authentication Fix${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "${GREEN}Running on macOS...${NC}"
  
  # Create SECRET_KEY if it doesn't exist
  if [ ! -f ./backend/.env ]; then
    echo -e "${YELLOW}Creating .env file with SECRET_KEY...${NC}"
    echo "SECRET_KEY=dairy_milk_tracker_supersecret_key_for_auth_999" > ./backend/.env
    echo -e "${GREEN}Created .env file with fixed SECRET_KEY${NC}"
  fi
  
  # Start backend in the background
  echo -e "${YELLOW}Starting backend server...${NC}"
  cd ./backend
  
  # Check if python-dotenv is installed
  if ! pip list | grep -q python-dotenv; then
    echo -e "${YELLOW}Installing python-dotenv...${NC}"
    pip install python-dotenv
  fi
  
  # Start the backend
  python run.py &
  BACKEND_PID=$!
  cd ..
  
  # Start frontend
  echo -e "${YELLOW}Starting frontend server...${NC}"
  cd ./frontend
  npm start &
  FRONTEND_PID=$!
  cd ..
  
  echo -e "${GREEN}Both servers are starting...${NC}"
  echo -e "${YELLOW}Backend PID: ${BACKEND_PID}${NC}"
  echo -e "${YELLOW}Frontend PID: ${FRONTEND_PID}${NC}"
  echo -e "${GREEN}Once servers are ready:${NC}"
  echo -e "   Backend: ${BLUE}http://localhost:8000${NC}"
  echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
  
  # Trap CTRL+C to kill both processes
  trap "echo -e '${RED}Shutting down servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
  
  # Keep script running until CTRL+C
  echo -e "${YELLOW}Press CTRL+C to stop both servers${NC}"
  wait
else
  echo -e "${RED}This script is designed for macOS.${NC}"
  echo -e "${YELLOW}For Windows, please run:${NC}"
  echo -e "1. In one terminal:"
  echo -e "   ${BLUE}cd backend${NC}"
  echo -e "   ${BLUE}set SECRET_KEY=dairy_milk_tracker_supersecret_key_for_auth_999${NC}"
  echo -e "   ${BLUE}python run.py${NC}"
  echo -e "2. In another terminal:"
  echo -e "   ${BLUE}cd frontend${NC}"
  echo -e "   ${BLUE}npm start${NC}"
fi
