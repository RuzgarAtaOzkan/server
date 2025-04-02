#!/bin/bash

set -e  # Exit on any error

# Default values
PRODUCTION=false
RELOAD=false
HELP=false

# Parse options
while getopts "rph" opt; do
  case "$opt" in
    p) PRODUCTION=true ;;
    r) RELOAD=true ;;
    h) HELP=true ;;
    *) echo "Invalid option"; exit 1 ;;
  esac
done

shift $((OPTIND - 1))

# Display help message
if $HELP; then
  echo "Usage: ./script.sh [-p] [-r] [-h]"
  echo "  -p   Start project for production (PM2)"
  echo "  -r   Reload PM2 after building the project"
  echo "  -h   Show this help message"
  exit 0
fi

# Display Banner
echo "
███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
"

# Install dependencies
npm install
npm audit fix
npm run clean
npm run build

# Determine execution mode
if $RELOAD; then
  npm run pm2-reload
elif $PRODUCTION; then
  npm run pm2
else
  npm run start
fi
