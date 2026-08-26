#!/bin/sh

# Common configuration and helpers for UNDP Collections Review Dokku deployments.
# Patterned after mediacloud/web-search dokku-scripts/common.sh.

# Phil: IMO unduly mangled from my web-search and rss-fetcher versions
# please copy from one of those, or maybe it's time to have a repo
# with a single/common version of the scripts??

FQDN=$(hostname -f | tr A-Z a-z)
HOST=$(hostname -s)

if [ "x$(whoami)" = xroot ]; then
    # for crontab.sh
    # no dokku function needed
    alias check_root=true
    check_not_root() {
	echo "$0 must not be run as root" 1>&2
	exit 1
    }
else
    dokku() {
	local _OK_FILE
	_OK_FILE=$SCRIPT_DIR/.dokku-ssh-ok.$HOST
	if [ ! -f $_OK_FILE ]; then
	    # check ssh access working
	    if ! ssh -n dokku@$FQDN version | grep -q '^dokku version'; then
		echo "'ssh dokku@$FQDN' failed; need to run 'dokku ssh-keys' as root first" 1>&2
		exit 1
	    fi
	    touch $_OK_FILE
	fi
	# NOTE! can't use localhost for ssh if user home directories NFS
	# shared across servers (or else it will look like the host
	# identity keeps changing)
	ssh dokku@$FQDN "$@"
    }
    alias check_not_root=true
    check_root() {
	echo "$0 must be run as root" 1>&2
	exit 1
    }
fi

# Base app name for all instances
APP_BASE=undp-collections-review

# Git remote name used for Dokku
DOKKU_GIT_REMOTE=${APP_BASE}_$INSTANCE


# INSTANCE is provided by the caller (prod, staging, or username)
# Phil: conform to convention used w/ other apps:
#	instance prefix first in app name
case "$INSTANCE" in
prod)
    APP="$APP_BASE"
    ALLOWED_HOSTS="${APP_BASE}.mediacloud.org"
    ;;
'')
    echo "common.sh: INSTANCE is not set" 1>&2
    exit 1
    ;;
*)
    APP="${INSTANCE}-$APP_BASE"
    ALLOWED_HOSTS="${APP_BASE}-${INSTANCE}.mediacloud.org"
    ;;
esac

# Postgres service name (per app)
PG_SVC="${APP}"
