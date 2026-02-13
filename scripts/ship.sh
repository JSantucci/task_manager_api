#!/usr/bin/env bash
set -euo pipefail

echo "Running format, lint, and tests..."
npm run format
npm run lint
npm run test:ci

echo "Staging all changes..."
git add -A

echo "Repository status (changes staged):"
git status --porcelain

read -p "Enter commit message (or Ctrl-C to abort): " msg
if [ -z "$msg" ]; then
  echo "Empty commit message, aborting." >&2
  exit 1
fi

git commit -m "$msg"
git push

echo "Pushed."
