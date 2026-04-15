#!/bin/sh

set -eu  # exit on any error

NAME="${PWD##*/}" # project namespace

OS="$(uname -s 2>/dev/null || echo unknown)" # operating system detection
SERVICES="mongod redis-server" # required services in the systemd

START=false # -s (start after build)
RESTART=false # -r (restart after build)

ACTION="" # systemctl "$ACTION" "${NAME}.service"

if [ "$OS" != "Linux" ]; then
  echo "Error: Unsupported OS: $OS (Linux required)" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is NOT installed" >&2
  exit 1
fi

for service in $SERVICES; do
  if ! systemctl list-unit-files "${service}.service" >/dev/null 2>&1; then
    echo "Error: Required service '$service' is not installed" >&2
    exit 1
  fi

  if ! systemctl is-active "${service}.service" >/dev/null 2>&1; then
    echo "Error: Required service '$service' is not running" >&2
    exit 1
  fi
done

if [ ! -f "/etc/systemd/system/${NAME}.service" ]; then
  echo "Error: Service file required ($NAME.service)" >&2
  exit 1
fi

while getopts "srh" opt; do
  case $opt in
    s) START=true ;;
    r) RESTART=true ;;
    h)
      echo "Usage: sh $0 [-s|-r]"
      echo
      echo "Options:"
      echo "  -s    Build and start the app (systemctl start ${NAME})"
      echo "  -r    Build and restart the app (systemctl restart ${NAME})"
      echo "  -h    Show this help message"
      exit 0 
      ;;
    *) exit 1 ;;
  esac
done

if [ "$START" = true ] && [ "$RESTART" = true ]; then
  echo "Error: use either -s or -r, not both" >&2
  exit 1
fi

echo "
███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
"

rm -rf build
rm -rf node_modules
rm -f package-lock.json

mkdir build
mkdir -p public/images public/videos

npm install
npm audit fix
npm run build

if [ "$START" = true ]; then
  ACTION="start";
elif [ "$RESTART" = true ]; then
  ACTION="restart";
fi

if [ -n "$ACTION" ]; then
  systemctl "$ACTION" "${NAME}.service"

  journalctl -u "${NAME}.service" --since "30 seconds ago" -f &

  PID=$!

  sleep 30

  kill "$PID"
  wait "$PID" 2>/dev/null

  exit 0
fi
