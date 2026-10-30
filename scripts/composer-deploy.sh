#!/usr/bin/env bash
# Redeploy the servarr `revista` stack (the LAN copy of erfianugrah.com)
# through composer AFTER CI has pushed erfianugrah/revista-4:latest.
# POST /stacks/revista/deploy = git sync -> compose pull -> compose up -d.
# Before this ran from CI, composer's push webhook redeployed at push time,
# minutes before the image existed, so the LAN copy ran the previous build
# (revista-3#2).
#
# Job containers on the router's forgejo bridge can only reach the host
# through the edge Caddy at 10.0.10.1:443, so the public hostname is pinned
# there with --resolve (same reasoning as memledger scripts/composer-deploy.sh).
#
# Needs COMPOSER_API_KEY in the env. Never prints it.
#   COMPOSER_URL  default https://composer.erfi.io
#   COMPOSER_PIN  --resolve target, default composer.erfi.io:443:10.0.10.1
#                 (set empty to use DNS)
#   EXPECT_SHA    if set, fail unless the synced checkout is this commit
set -euo pipefail

: "${COMPOSER_API_KEY:?COMPOSER_API_KEY missing - add it as a repo Actions secret}"
base=${COMPOSER_URL:-https://composer.erfi.io}/api/v1
pin=${COMPOSER_PIN-composer.erfi.io:443:10.0.10.1}
stack=revista

api() { # method path [curl args...]
  local m=$1 p=$2
  shift 2
  curl -sS -f --connect-timeout 15 ${pin:+--resolve "$pin"} \
    -X "$m" -H "X-API-Key: $COMPOSER_API_KEY" "$@" "$base$p"
}

job=$(api POST "/stacks/$stack/deploy?async=true" | jq -r .job_id)
echo "deploy $stack: job $job"
for ((t = 0; ; t += 5)); do
  st=$(api GET "/jobs/$job" | jq -r .status)
  case $st in
    completed) break ;;
    failed)
      echo "deploy $stack: job $job FAILED" >&2
      api GET "/jobs/$job" | jq -r '.error // .output' >&2
      exit 1
      ;;
  esac
  if ((t >= 600)); then
    echo "deploy $stack: job $job still $st after ${t}s" >&2
    exit 1
  fi
  sleep 5
done

synced=$(api GET "/stacks/$stack" | jq -r .git_config.last_commit_sha)
echo "deploy $stack: completed, checkout at ${synced:0:9}"
if [[ -n ${EXPECT_SHA:-} && $synced != "$EXPECT_SHA" ]]; then
  echo "synced commit ${synced:0:9} != expected ${EXPECT_SHA:0:9}" >&2
  exit 1
fi
# The job completes once compose has created the container; starting it
# can take ~10s more (measured 2026-10-30), so wait for it to run
for ((t = 0; ; t += 5)); do
  state=$(api GET "/stacks/$stack" | jq -r '"\(.running_count)/\(.container_count)"')
  [[ $state != 0/* && ${state%/*} == "${state#*/}" ]] && break
  if ((t >= 60)); then
    echo "deploy $stack: containers running $state after ${t}s" >&2
    exit 1
  fi
  sleep 5
done
echo "deploy $stack: running $state"
