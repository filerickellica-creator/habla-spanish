#!/bin/bash
# Restores the repo and Firebase production to a backup snapshot
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <tag-name>"
  echo ""
  echo "Available backups:"
  git tag -l "backup-*"
  exit 1
fi

TAG="$1"

if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: Tag '$TAG' not found."
  echo ""
  echo "Available backups:"
  git tag -l "backup-*"
  exit 1
fi

echo "Restoring to: $TAG"
git checkout main
git reset --hard "$TAG"
git push origin main --force

echo "Building and deploying to Firebase..."
npm run build
firebase deploy --only hosting,firestore:rules,functions

echo "Restored to $TAG. GitHub and Firebase are in sync."
