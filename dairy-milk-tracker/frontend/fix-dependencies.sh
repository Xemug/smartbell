#!/bin/bash

# Stop on errors
set -e

echo "======================="
echo "Dependency Fix Script"
echo "======================="

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Make sure you're in the project directory."
  exit 1
fi

# Backup package.json and package-lock.json
echo "Backing up package files..."
cp package.json package.json.bak
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.bak
fi

echo "Fixing React Router issue..."

# Option 1: Install specific compatible versions
echo "Installing compatible React Router versions..."
npm uninstall react-router-dom react-router
npm install react-router@6.3.0 react-router-dom@6.3.0

# Fix other potential issues
echo "Cleaning npm cache..."
npm cache clean --force

echo "Removing node_modules folder..."
rm -rf node_modules

echo "Reinstalling dependencies..."
npm install

echo "======================="
echo "Fix complete! Try running the app again with: npm start"
echo "If issues persist, you can restore the backups:"
echo "  cp package.json.bak package.json"
echo "  cp package-lock.json.bak package-lock.json"
echo "======================="
