#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"
OPENDS5_INSTALL_SOURCED=1 . "$here/../opends5-install"

assert_eq "1.7.0" "$(OPENDS5_MODULE_VERSION=1.7.0 OPENDS5_INSTALL_SOURCED=1 bash -c '. "$1"; echo "$APP_VER"' _ "$here/../opends5-install")" "app version from the companion"

tmp="$(mktemp -d)"
assert_eq 0 "$(SYSROOT="$tmp" detect_legacy_module)" "clean system: no legacy module"
mkdir -p "$tmp/sys/module/vds_hcd"
assert_eq 1 "$(SYSROOT="$tmp" detect_legacy_module)" "loaded vds_hcd detected"
rm -rf "$tmp"
finish
