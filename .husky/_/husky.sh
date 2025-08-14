#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }
  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi
  if [ ! -f package.json ]; then
    debug "package.json not found, skipping hook"
    exit 0
  fi
  if command -v node >/dev/null 2>&1; then
    if [ -f .huskyrc ]; then
      debug ".huskyrc is deprecated, please migrate your configuration"
    fi
    export readonly npm_lifecycle_event="husky-$hook_name"
    node <<'EOF'
      const path = require('path')
      const fs = require('fs')
      const crypto = require('crypto')
      function hash(s) { return crypto.createHash('sha256').update(s).digest('hex') }
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
      const hook = pkg.scripts && pkg.scripts[process.env.npm_lifecycle_event]
      if (!hook) {
        process.exit(0)
      }
      const key = '_husky_cache_' + hash(hook)
      if (process.env[key]) return
      process.env[key] = 1
      const { status } = require('child_process').spawnSync(hook, { stdio: 'inherit', shell: true })
      process.exit(status)
    EOF
    exit $?
  else
    debug "can't find node in PATH, skipping hook"
    exit 0
  fi
fi
