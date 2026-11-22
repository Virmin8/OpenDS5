#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
cd "$tmp"
env OPENDS5_OS_RELEASE="$here/fixtures/nixos/os-release" OPENDS5_UNAME_R=6.15.4 \
    OPENDS5_SYSROOT=/nonexistent OPENDS5_SB_STATE=disabled \
    bash "$here/../opends5-install" --yes >/dev/null
assert_eq 1 "$([ -f opends5-vds.nix ] && echo 1 || echo 0)" "snippet written"
assert_contains "$(cat opends5-vds.nix)" 'boot.kernelModules = [ "vhci-hcd" ];' "loads the in-tree vhci-hcd"
case "$(cat opends5-vds.nix)" in *extraModulePackages*|*vds_hcd*) f=1 ;; *) f=0 ;; esac
assert_eq 0 "$f" "no out-of-tree module in the snippet"
assert_eq 0 "$([ -e opends5-vds-src ] && echo 1 || echo 0)" "no module source copied"
cd /
rm -rf "$tmp"
finish
