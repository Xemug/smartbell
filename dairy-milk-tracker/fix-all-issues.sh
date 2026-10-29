#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Dairy Milk Tracker - Complete Fix Script${NC}"
echo -e "${BLUE}===============================================${NC}"

# Make sure we're in the project root directory
cd "$(dirname "$0")"
DAIRY_ROOT=$(pwd)
echo -e "${GREEN}Working in directory: ${DAIRY_ROOT}${NC}"

# Step 1: Fix frontend dependencies
echo -e "\n${YELLOW}Step 1: Fixing frontend dependencies...${NC}"
cd "$DAIRY_ROOT/frontend"
echo -e "${GREEN}Running dependency fix script...${NC}"

# Check if chart.js needs to be reinstalled
npm list chart.js || REINSTALL_CHART=true

# Run dependency fix
if [ -f "fix-dependencies.sh" ]; then
  chmod +x fix-dependencies.sh
  ./fix-dependencies.sh
else
  echo -e "${YELLOW}Fix dependencies script not found, running manual fix...${NC}"
  # Backup package.json and package-lock.json
  cp package.json package.json.bak
  if [ -f "package-lock.json" ]; then
    cp package-lock.json package-lock.json.bak
  fi
  
  # Fix React Router issue
  npm uninstall react-router-dom react-router
  npm install react-router@6.3.0 react-router-dom@6.3.0
  
  # Reinstall chart.js if needed
  if [ "$REINSTALL_CHART" = true ]; then
    echo -e "${YELLOW}Reinstalling chart.js...${NC}"
    npm uninstall chart.js react-chartjs-2
    npm install chart.js@4.4.0 react-chartjs-2@5.2.0
  fi
  
  # Clean and reinstall
  echo -e "${YELLOW}Cleaning npm cache...${NC}"
  npm cache clean --force
  
  echo -e "${YELLOW}Removing node_modules folder...${NC}"
  rm -rf node_modules
  
  echo -e "${YELLOW}Reinstalling dependencies...${NC}"
  npm install
fi

# Step 2: Apply authentication fix for responsive testing
echo -e "\n${YELLOW}Step 2: Applying authentication fix...${NC}"
cd "$DAIRY_ROOT"

# Make the auth fix script executable
echo -e "${GREEN}Making authentication fix script executable...${NC}"
chmod +x start-with-auth-fix.sh
chmod +x chmod_script.sh

# Step 3: Create .env file for backend
echo -e "\n${YELLOW}Step 3: Setting up backend environment...${NC}"
cd "$DAIRY_ROOT/backend"
if [ ! -f ".env" ]; then
  echo -e "${GREEN}Creating .env file with fixed SECRET_KEY...${NC}"
  echo "SECRET_KEY=dairy_milk_tracker_supersecret_key_for_auth_999" > .env
  echo -e "${GREEN}Created .env file with fixed SECRET_KEY${NC}"
fi

# Step 4: Start the application
echo -e "\n${YELLOW}Step 4: Starting the application...${NC}"
cd "$DAIRY_ROOT"
echo -e "${GREEN}Ready to start! Run the following command:${NC}"
echo -e "${BLUE}./start-with-auth-fix.sh${NC}"

echo -e "\n${GREEN}Fix process complete!${NC}"
echo -e "${YELLOW}If you still experience issues:${NC}"
echo -e "1. Check console logs for specific errors"
echo -e "2. Make sure both backend and frontend servers start properly"
echo -e "3. When testing responsive mode, use the AuthDebug tool (orange 'A' button) if 401 errors occur"

# Make this script executable on future runs
chmod +x "$0"
