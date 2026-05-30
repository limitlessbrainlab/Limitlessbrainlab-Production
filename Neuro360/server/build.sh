#!/usr/bin/env bash
# Build script for Render - installs native dependencies for canvas

set -e

echo "Installing native dependencies for canvas..."
apt-get update
apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pkg-config

echo "Installing npm packages..."
npm install

echo "Build complete!"
