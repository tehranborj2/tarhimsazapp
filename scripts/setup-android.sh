#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

printf '\n[1/3] Installing project packages...\n'
npm install --no-audit --no-fund

printf '\n[2/3] Preparing the Android release project...\n'
npm run android:prepare

printf '\n[3/3] Opening Android Studio...\n'
npx cap open android
