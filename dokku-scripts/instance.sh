#!/bin/sh

# create or destroy UNDP Collections Review server as a Dokku app
# Patterned after mediacloud/web-search dokku-scripts/instance.sh

# Phil: IMO unduly mangled from my web-search and rss-fetcher versions
# please copy from one of those, or maybe it's time to have a repo
# with a single/common version of the scripts??  This version doesn't
# handle arguments that contain quotes, which the above versions do!!

SCRIPT_DIR=$(dirname "$0")

OP=$1
INSTANCE=$2

VHOSTS=/var/tmp/undp-review-vhosts$$
trap "rm -f $VHOSTS" 0

case "$OP" in
create|destroy)
    # Update push.sh if you change how instances are named
    case "$INSTANCE" in
    prod|staging)
        ;;
    *)
        if ! id "$INSTANCE" >/dev/null 2>&1; then
            echo "$0: user $INSTANCE does not exist" 1>&2
            exit 1
        fi
        ;;
    esac
    ;;
*)
    ERR=1
    ;;
esac

if [ -n "$ERR" ]; then
    echo "Usage: $0 create|destroy prod|staging|USERNAME" 1>&2
    echo '   "create" can be re-run, will only update as-needed.' 1>&2
    exit 1
fi

# After INSTANCE set, sets APP, PG_SVC, ALLOWED_HOSTS, etc.
. "$SCRIPT_DIR/common.sh"

check_not_root

check_service() {
    local PLUGIN=$1
    shift
    local SERVICE=$1
    shift
    local APP_NAME=$1
    shift
    local CREATE_OPTIONS=$1

    if dokku plugin:list | awk '{ print $1 }' | grep -Fqx "$PLUGIN"; then
        echo "found $PLUGIN plugin"
    else
        echo "plugin $PLUGIN not installed" 1>&2
        exit 1
    fi

    if dokku "$PLUGIN":exists "$SERVICE" >/dev/null 2>&1; then
        echo "found $PLUGIN service $SERVICE"
    else
        echo "creating $PLUGIN service $SERVICE $CREATE_OPTIONS"
        dokku "$PLUGIN":create "$SERVICE" $CREATE_OPTIONS
    fi

    if dokku "$PLUGIN":linked "$SERVICE" "$APP_NAME" >/dev/null 2>&1; then
        echo "found $PLUGIN service $SERVICE link to app $APP_NAME"
    else
        echo "linking $PLUGIN service $SERVICE to app $APP_NAME"
        dokku "$PLUGIN":link "$SERVICE" "$APP_NAME"
    fi
}

create_app() {
    if dokku apps:exists "$APP" >/dev/null 2>&1; then
        echo "found app $APP"
    else
        echo "creating app $APP"
        dokku apps:create "$APP"
        CREATED_APP=1
    fi

    # Ensure postgres service exists and is linked
    check_service postgres "$PG_SVC" "$APP"

    # Configure domains for this app
    dokku domains:report "$APP" | awk '/Domains app vhosts:/ { for (i = 4; i <= NF; i++) print $i }' >"$VHOSTS"
    for DOMAIN in $(echo "$ALLOWED_HOSTS" | tr , ' '); do
        if grep -Fiqx "$DOMAIN" "$VHOSTS"; then
            echo "found domain $DOMAIN for $APP"
        else
            echo "adding domain $DOMAIN to $APP"
            dokku domains:add "$APP" "$DOMAIN"
        fi
    done

    # Ensure git remote exists in this repo and points at the current FQDN/app
    if git remote | grep -Fqx "$DOKKU_GIT_REMOTE"; then
        echo "updating git remote $DOKKU_GIT_REMOTE to dokku@$FQDN:$APP"
        git remote set-url "$DOKKU_GIT_REMOTE" "dokku@$FQDN:$APP"
    else
        echo "adding git remote $DOKKU_GIT_REMOTE -> dokku@$FQDN:$APP"
        git remote add "$DOKKU_GIT_REMOTE" "dokku@$FQDN:$APP"
    fi

    if [ -n "$CREATED_APP" ]; then
        echo "app created, but not deployed." 1>&2
        echo "run '$SCRIPT_DIR/push.sh' from the appropriate branch to deploy." 1>&2
    fi
}

destroy_service() {
    PLUGIN=$1
    SERVICE=$2
    if dokku "$PLUGIN":exists "$SERVICE" >/dev/null 2>&1; then
        if dokku "$PLUGIN":linked "$SERVICE" "$APP" >/dev/null 2>&1; then
            echo "unlinking $PLUGIN service $SERVICE from $APP"
            dokku "$PLUGIN":unlink "$SERVICE" "$APP"
        fi
        dokku "$PLUGIN":destroy "$SERVICE"
    fi
}

destroy_app() {
    if dokku apps:exists "$APP" >/dev/null 2>&1; then
        dokku apps:destroy "$APP"
    fi
    destroy_service postgres "$PG_SVC"
}

case "$OP" in
create) create_app ;;
destroy) destroy_app ;;
*)
    echo "$0: unknown command $OP" 1>&2
    exit 1
    ;;
esac

