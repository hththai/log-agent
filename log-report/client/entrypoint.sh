#!/bin/sh
set -e

# Start the SSR handler on the internal port (nginx proxies to this)
srvx serve --prod --port=3001 --host=127.0.0.1 --entry=dist/server/server.js &

# Give srvx a moment to bind
sleep 1

# Start nginx in the foreground (PID 1 must stay alive)
exec nginx -g "daemon off;"
