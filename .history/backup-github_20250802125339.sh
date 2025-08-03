#!/bin/bash

# GitHub Backup Script Wrapper
# Makes it easy to backup your project to GitHub

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Function to show usage
show_usage() {
    echo "🚀 GitHub Backup System"
    echo ""
    echo "Usage:"
    echo "  ./backup-github.sh backup [message]  - Backup to GitHub"
    echo "  ./backup-github.sh restore           - Restore from GitHub"
    echo "  ./backup-github.sh status            - Show backup status"
    echo "  ./backup-github.sh setup             - Setup instructions"
    echo ""
    echo "Examples:"
    echo "  ./backup-github.sh backup"
    echo "  ./backup-github.sh backup \"Added new features\""
    echo "  ./backup-github.sh status"
    echo ""
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        echo "Please install Node.js from: https://nodejs.org/"
        exit 1
    fi
}

# Function to check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        echo "❌ Git is not installed"
        echo "Please install Git from: https://git-scm.com/"
        exit 1
    fi
}

# Function to make script executable
make_executable() {
    if [ ! -x "backup-to-github.mjs" ]; then
        chmod +x backup-to-github.mjs
        echo "✅ Made backup script executable"
    fi
}

# Main script
main() {
    # Check dependencies
    check_node
    check_git
    
    # Make script executable
    make_executable
    
    # Get command
    local command="$1"
    local message="$2"
    
    case "$command" in
        "backup"|"b")
            echo "🚀 Starting GitHub backup..."
            if [ -n "$message" ]; then
                node backup-to-github.mjs backup "$message"
            else
                node backup-to-github.mjs backup
            fi
            ;;
        "restore"|"r")
            echo "🔄 Restoring from GitHub..."
            node backup-to-github.mjs restore
            ;;
        "status"|"s")
            echo "📊 Checking backup status..."
            node backup-to-github.mjs status
            ;;
        "setup")
            echo "📋 GitHub backup setup..."
            node backup-to-github.mjs setup
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        "")
            show_usage
            ;;
        *)
            echo "❌ Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 