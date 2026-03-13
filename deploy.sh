#!/bin/bash
COMMIT_MSG="${1:-"Deploy update $(date '+%Y-%m-%d %H:%M')"}"
echo "Building project..."
npm run build
echo "Deploying to Firebase..."
firebase deploy --only hosting
echo "Pushing to GitHub..."
git add -A
git diff --cached --quiet && echo "No changes to commit." || git commit -m "$COMMIT_MSG"
git push origin main
echo "Done! Firebase + GitHub are in sync."
