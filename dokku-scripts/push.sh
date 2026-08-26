#!/bin/sh

# Deploy code by pushing current branch to Dokku app instance
# Patterned after mediacloud/web-search dokku-scripts/push.sh

# Phil: IMO unduly mangled from my web-search and rss-fetcher versions
# please copy from one of those, or maybe it's time to have a repo
# with a single/common version of the scripts??  This version doesn't
# handle arguments that contain quotes, which the above versions do!!
#
# ALSO: This file contains functions (load_management_config
# derive_airtable_hardware normalize_airtable_hardware) that seem to
# be called only once.  I consider this an anti-pattern.  If the
# functions are of general utility they should be located somewhere
# else!

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

load_env_file() {
    _env_file=$1
    if [ -f "$_env_file" ]; then
        echo "Loading environment from $_env_file"
        # Export sourced variables so they are available to child processes.
        set -a
        # shellcheck disable=SC1090
        . "$_env_file"
        set +a
        return 0
    fi
    return 1
}

load_management_config() {
    # Default to SSH so deploy uses the current user's GitHub credentials/agent.
    MGMT_REPO_URL=${MANAGEMENT_CONFIG_REPO_URL:-git@github.com:mediacloud/management-config.git}
    MGMT_DIR=${MANAGEMENT_CONFIG_DIR:-"$HOME/.cache/management-config"}

    if [ ! -d "$MGMT_DIR/.git" ]; then
        echo "Cloning management-config to $MGMT_DIR"
        if ! git clone "$MGMT_REPO_URL" "$MGMT_DIR" >/dev/null 2>&1; then
            echo "Warning: unable to clone $MGMT_REPO_URL; continuing without centralized secrets." 1>&2
            return 1
        fi
    else
        echo "Refreshing management-config in $MGMT_DIR"
        if ! (cd "$MGMT_DIR" && git pull --ff-only >/dev/null 2>&1); then
            echo "Warning: unable to refresh $MGMT_DIR; continuing with existing checkout." 1>&2
        fi
    fi

    for CANDIDATE in \
        "$MGMT_DIR/env.sh" \
        "$MGMT_DIR/.env" \
        "$MGMT_DIR/management-config/env.sh" \
        "$MGMT_DIR/management-config/.env"
    do
        if load_env_file "$CANDIDATE"; then
            return 0
        fi
    done

    echo "Warning: no env file found in management-config checkout." 1>&2
    return 1
}

set_dokku_config_var() {
    _key=$1
    eval "_value=\${$_key-}"
    if [ -n "$_value" ]; then
        dokku config:set --no-restart "$APP" "$_key=$_value" >/dev/null
    fi
}

derive_airtable_hardware() {
    if [ -n "${AIRTABLE_HARDWARE:-}" ]; then
        return
    fi

    DOKKU_HOST=$(printf "%s" "$FQDN" | awk -F@ '{print $NF}')
    DOKKU_HOST=$(printf "%s" "$DOKKU_HOST" | awk -F: '{print $1}')

    if [ -z "$DOKKU_HOST" ] || [ "$DOKKU_HOST" = "localhost" ]; then
        HOST_RAW=$(hostname -f 2>/dev/null || hostname 2>/dev/null || true)
    else
        HOST_RAW=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "dokku@$DOKKU_HOST" "hostname -f || hostname" 2>/dev/null || true)
    fi

    if [ -n "$HOST_RAW" ]; then
        AIRTABLE_HARDWARE=$(printf "%s" "$HOST_RAW" | awk -F. '{print $1}')
        export AIRTABLE_HARDWARE
    fi
}

normalize_airtable_hardware() {
    if [ -n "${AIRTABLE_HARDWARE:-}" ]; then
        AIRTABLE_HARDWARE=$(printf "%s" "$AIRTABLE_HARDWARE" | tr '[:upper:]' '[:lower:]')
        export AIRTABLE_HARDWARE
    fi
}

usage() {
    cat 1>&2 <<-EOF
$0: push current branch to dokku instance (depending on branch)
options:
 --force-push
      add --force to git push commands
 --help or -h
      this message.
 --unpushed or -u
      allow deployment even if current branch not pushed to upstream.
EOF
}

PUSH_FLAGS=
# MCWEB_UNPUSHED inherited from environment
for ARG in "$@"; do
    case "$ARG" in
    --force-push) PUSH_FLAGS=--force ;; # force push code to dokku repo
    --unpushed|-u) MCREVIEW_UNPUSHED=1 ;;  # allow unpushed repo for development
    --help|-h)
        usage
        exit 0
        ;;
    *)
        echo "$0: unknown argument $ARG" 1>&2
        usage
        exit 1
        ;;
    esac
done

# works when su'ed to another user or invoked via ssh
UNAME=$(whoami)

BRANCH=$(git branch --show-current)

if [ -z "$BRANCH" ]; then
    echo "$0: could not determine current branch" 1>&2
    exit 1
fi

# Update instance.sh if you change how instances are named!
case "$BRANCH" in
prod|staging)
    INSTANCE=$BRANCH
    ;;
*)
    INSTANCE=$UNAME
    ;;
esac

export INSTANCE
. "$SCRIPT_DIR/common.sh"

check_not_root

# Load local .env and optional centralized secrets before configuring Dokku.
load_env_file "$ROOT_DIR/.env" || true
load_management_config || true

if [ -z "${AIRTABLE_ENV:-}" ]; then
    AIRTABLE_ENV=prod
    export AIRTABLE_ENV
fi

if [ -z "${AIRTABLE_NAME:-}" ]; then
    AIRTABLE_NAME=collection-review
    export AIRTABLE_NAME
fi

derive_airtable_hardware
normalize_airtable_hardware

# Ensure dokku app exists
if ! dokku apps:exists "$APP" >/dev/null 2>&1; then
    echo "$0: dokku app $APP does not exist." 1>&2
    echo "Run '$SCRIPT_DIR/instance.sh create $INSTANCE' first." 1>&2
    exit 1
fi

# Make sure branch is pushed and in sync with upstream (unless overridden)
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null)
if [ -z "$UPSTREAM" ]; then
    if [ -z "$MCREVIEW_UNPUSHED" ]; then
        echo "$0: branch $BRANCH has no upstream; push to GitHub first or use --unpushed." 1>&2
        exit 1
    fi
else
    AHEAD=$(git rev-list --count "${UPSTREAM}..$BRANCH" 2>/dev/null)
    if [ "${AHEAD:-0}" -gt 0 ] && [ -z "$MCREVIEW_UNPUSHED" ]; then
        echo "$0: branch $BRANCH has unpushed commits; push to upstream or use --unpushed." 1>&2
        exit 1
    fi
fi

# Set deploy branch inside Dokku to main (idempotent)
dokku git:set "$APP" deploy-branch main >/dev/null 2>&1 || true

# Sync local/deploy environment variables to Dokku (when defined).
if [ -f "$ROOT_DIR/.env" ]; then
    awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' "$ROOT_DIR/.env" | while read -r ENV_KEY; do
        [ -n "$ENV_KEY" ] || continue
        set_dokku_config_var "$ENV_KEY"
    done
fi

# Always include Airtable deployment vars, even if not listed in .env.
set_dokku_config_var AIRTABLE_API_KEY
set_dokku_config_var AIRTABLE_BASE_ID
set_dokku_config_var AIRTABLE_ENV
set_dokku_config_var AIRTABLE_HARDWARE
set_dokku_config_var AIRTABLE_NAME

if [ -z "${AIRTABLE_API_KEY:-}" ] || [ -z "${AIRTABLE_BASE_ID:-}" ]; then
    echo "Warning: AIRTABLE_API_KEY or AIRTABLE_BASE_ID missing; deploy tracking will be skipped." 1>&2
fi

echo "Deploying branch $BRANCH to dokku app $APP (instance=$INSTANCE) on $FQDN"

set -e

DATE_TIME=$(date -u '+%F-%H-%M-%S')
TAG=${DATE_TIME}-$(hostname)-${INSTANCE}

echo ''
echo adding local tag $TAG
git tag $TAG

git push $PUSH_FLAGS "$DOKKU_GIT_REMOTE" "$BRANCH:main"

echo ''
echo pushing tag $TAG to "$DOKKU_GIT_REMOTE"
git push "$DOKKU_GIT_REMOTE" "$TAG"

if [ "x$MCREVIEW_UNPUSHED" != x -a "x$UPSTREAM" != x ]; then
    echo ''
    echo pushing $TAG to $UPSTREAM
    git push $TAG $UPSTREAM
fi

echo ''
echo "Deployment to $APP complete."
