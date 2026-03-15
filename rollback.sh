#!/bin/bash
# Rollback to last known working state
# Commit: 0eaf37f - All subscribe/paywall fixes working

ROLLBACK_COMMIT="0eaf37f"

echo "Rolling back to commit $ROLLBACK_COMMIT..."
git fetch origin
git checkout claude/count-branches-3doSl
git reset --hard $ROLLBACK_COMMIT
echo "Code restored. Rebuilding..."
npm run build
echo "Deploying to Firebase..."
firebase deploy --only hosting
echo "Rollback complete."
