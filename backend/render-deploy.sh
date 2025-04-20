#!/bin/bash

# Script to deploy backend to Render.com

echo "Starting deployment to Render..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Copy SQL files to dist
echo "Copying SQL files to dist/database..."
mkdir -p dist/database
cp src/database/*.sql dist/database/

# Add execution permission to dist folder
chmod -R 755 dist

echo "Deployment preparation completed!" 