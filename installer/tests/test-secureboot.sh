#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"
OPENDS5_INSTALL_SOURCED=1 . "$here/../opends5-install"

tmp="$(mktemp -d)"
mkdir -p "$tmp/sys/kernel/security"

printf 'none [integrity] confidentiality\n' > "$tmp/sys/kernel/security/lockdown"
assert_eq integrity "$(SYSROOT=$tmp detect_lockdown)" "lockdown integrity"
printf '[none] integrity confidentiality\n' > "$tmp/sys/kernel/security/lockdown"
assert_eq none "$(SYSROOT=$tmp detect_lockdown)" "lockdown none"
assert_eq none "$(SYSROOT=/nonexistent detect_lockdown)" "lockdown file missing -> none"

assert_eq 1 "$(OPENDS5_SB_STATE=enabled detect_secureboot)"  "SB enabled override"
assert_eq 0 "$(OPENDS5_SB_STATE=disabled detect_secureboot)" "SB disabled override"

rm -rf "$tmp"
finish
