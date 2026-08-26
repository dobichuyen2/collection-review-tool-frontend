#!/bin/sh

# clone production undp-review database
# for development/testing.

DB="$1"

DB_BASE=undp-collections-review

# TEMP! should be $DB_BASE!!!!
PROD_DB=${DB_BASE}-pgulley-pg
PROD=brown.angwin

FQDN=$(hostname -f)

SCRIPT_DIR=$(dirname $0)

case "$DB" in
*-$DB_BASE) ;;
*) echo "Usage: $0 NAME-$DB_BASE" 1>&2; exit;;
esac

if [ $(whoami) = root ]; then
    if [ $FQDN = $PROD ]; then
	alias prod=dokku
    else
	alias prod="ssh dokku@$PROD"
    fi
    alias local=dokku
else
    alias prod="ssh dokku@$PROD"
    alias local="ssh dokku@$FQDN"
fi

echo checking $PROD_DB access
if ! prod postgres:exists $PROD_DB >/dev/null 2>&1; then
    echo "cannot access $PROD $PROD_DB" 1>&2
    exit 2
fi
echo checking if $DB exists
if ! local postgres:exists $DB >/dev/null 2>&1; then
    echo "cannot access $DB" 1>&2
    exit 2
fi

echo starting copy...
prod postgres:export $PROD_DB | local postgres:import $DB
