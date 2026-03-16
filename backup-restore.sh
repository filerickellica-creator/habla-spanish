#!/bin/bash
# Habla Espanyol - Backup & Restore Script
# Usage:
#   ./backup-restore.sh backup          - Create a timestamped backup zip
#   ./backup-restore.sh restore <file>  - Restore from a backup zip
#   ./backup-restore.sh list            - List available backups

BACKUP_DIR="$HOME/habla-backups"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="habla-spanish"

mkdir -p "$BACKUP_DIR"

backup() {
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BRANCH=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    COMMIT=$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo "none")
    BACKUP_FILE="$BACKUP_DIR/${PROJECT_NAME}_${TIMESTAMP}_${BRANCH}_${COMMIT}.zip"

    echo "=== Habla Espanyol Backup ==="
    echo "Project:  $PROJECT_DIR"
    echo "Branch:   $BRANCH"
    echo "Commit:   $COMMIT"
    echo "Backup:   $BACKUP_FILE"
    echo ""

    # Build dist before backup
    echo "Building project..."
    (cd "$PROJECT_DIR" && npm run build 2>/dev/null)

    echo "Creating backup..."
    (cd "$PROJECT_DIR" && zip -r "$BACKUP_FILE" \
        src/ \
        dist/ \
        public/ \
        functions/ \
        firebase.json \
        firestore.rules \
        vite.config.js \
        package.json \
        package-lock.json \
        index.html \
        deploy.sh \
        backup-restore.sh \
        README.md \
        -x "node_modules/*" "*.DS_Store" ".firebase/*" \
    )

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo ""
        echo "Backup complete! ($SIZE)"
        echo "Saved to: $BACKUP_FILE"
    else
        echo "Backup failed!"
        exit 1
    fi
}

restore() {
    BACKUP_FILE="$1"

    if [ -z "$BACKUP_FILE" ]; then
        echo "Usage: ./backup-restore.sh restore <backup-file>"
        echo "Run './backup-restore.sh list' to see available backups."
        exit 1
    fi

    # Resolve relative paths
    if [[ "$BACKUP_FILE" != /* ]]; then
        BACKUP_FILE="$(pwd)/$BACKUP_FILE"
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    echo "=== Habla Espanyol Restore ==="
    echo "Restoring from: $BACKUP_FILE"
    echo "Target:         $PROJECT_DIR"
    echo ""
    read -p "This will overwrite current files. Continue? (y/N) " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Restore cancelled."
        exit 0
    fi

    echo "Restoring files..."
    unzip -o "$BACKUP_FILE" -d "$PROJECT_DIR"

    if [ $? -eq 0 ]; then
        echo ""
        echo "Restore complete!"
        echo "Run 'npm install' if needed, then 'firebase deploy' to redeploy."
    else
        echo "Restore failed!"
        exit 1
    fi
}

list_backups() {
    echo "=== Available Backups ==="
    if [ -d "$BACKUP_DIR" ] && ls "$BACKUP_DIR"/${PROJECT_NAME}_*.zip 1>/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR"/${PROJECT_NAME}_*.zip | awk '{print NR". "$NF, "("$5")", $6, $7, $8}'
    else
        echo "No backups found in $BACKUP_DIR"
    fi
}

case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Habla Espanyol - Backup & Restore"
        echo ""
        echo "Usage:"
        echo "  ./backup-restore.sh backup          Create a timestamped backup"
        echo "  ./backup-restore.sh restore <file>   Restore from a backup zip"
        echo "  ./backup-restore.sh list             List available backups"
        ;;
esac
