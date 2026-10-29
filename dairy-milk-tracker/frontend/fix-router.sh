#!/bin/bash

# Stop on errors
set -e

echo "Fixing React Router dependencies..."

# Remove existing React Router packages
echo "Removing existing React Router packages..."
npm uninstall react-router-dom react-router

# Install compatible versions
echo "Installing compatible versions..."
npm install react-router@6.3.0 react-router-dom@6.3.0

echo "Dependencies fixed! Try running the app again."
