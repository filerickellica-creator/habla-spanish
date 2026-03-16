#!/bin/bash
# Creates a git tag as a backup snapshot of the current state
TAG="backup-$(date '+%Y%m%d-%H%M%S')"
git tag "$TAG"
git push origin "$TAG"
echo "Backup created: $TAG"
echo "To restore later, run: ./restore.sh $TAG"
echo ""
echo "All backup tags:"
git tag -l "backup-*"
