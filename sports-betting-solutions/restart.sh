#!/bin/bash

# Stop any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "next dev" || true

# Clear the Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Install any new dependencies if package.json was changed
echo "Checking for dependencies..."
npm install

# Start the development server
echo "Starting the development server..."
npm run dev 