#!/bin/bash

# Stop on errors
set -e

echo "===== MedSeal - Deploy Script ====="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Make sure dfx is running
echo "Checking if dfx replica is running..."
dfx ping || {
  echo "Starting Internet Computer replica..."
  dfx start --background
  sleep 2
}

# Remove artifacts that might cause issues
echo "Cleaning up previous build artifacts..."
rm -rf .dfx/local/canisters/MedSeal_backend/MedSeal_backend.wasm

# Create the canisters if they don't exist yet
# echo "Ensuring canisters are created..."
# dfx canister create --all || true

# Build the Rust backend directly
echo "Building Rust backend..."
cargo build --target wasm32-unknown-unknown --release --package MedSeal_backend

# Make sure the directory exists
mkdir -p .dfx/local/canisters/MedSeal_backend/

# Copy the wasm to the .dfx directory
cp target/wasm32-unknown-unknown/release/MedSeal_backend.wasm .dfx/local/canisters/MedSeal_backend/

# Install the wasm module to the canister
echo "Installing backend canister..."
# dfx canister install --mode=reinstall MedSeal_backend

# Build and install the frontend
echo "Building and installing frontend..."
# dfx deploy MedSeal_frontend

# Show URLs
# echo ""
# echo "===== Deployment Complete ====="
# FRONTEND_ID=$(dfx canister id MedSeal_frontend)
# BACKEND_ID=$(dfx canister id MedSeal_backend)
# echo "Frontend canister: $FRONTEND_ID"
# echo "Backend canister: $BACKEND_ID"
# echo "Your application is available at: http://localhost:4943/?canisterId=$FRONTEND_ID"

# echo ""
# echo "You can also use these commands to interact with your canisters:"
# echo "- Check dataset size: dfx canister call MedSeal_backend get_dataset_size"
# echo "- Test greeting: dfx canister call MedSeal_backend greet '(\"World\")'"

# ===== New: Deploy to Playground =====
echo ""
echo "===== Deploying to Playground ====="
dfx deploy --playground
echo "===== Playground Deployment Complete ====="
# PLAYGROUND_FRONTEND_ID=$(dfx canister id MedSeal_frontend)
# PLAYGROUND_BACKEND_ID=$(dfx canister id MedSeal_backend)
# echo "Playground Frontend canister: $PLAYGROUND_FRONTEND_ID"
# echo "Playground Backend canister: $PLAYGROUND_BACKEND_ID"
# echo "Playground application is available at: http://localhost:4943/?canisterId=$PLAYGROUND_FRONTEND_ID"