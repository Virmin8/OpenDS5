#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"

plan_sb() { # sb_state sysroot -> dry-run output
  env OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release" \
      OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 OPENDS5_SYSROOT="$2" \
      OPENDS5_SB_STATE="$1" OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes
}

# vhci-hcd is part of the signed distribution kernel: Secure Boot needs no
# signing key, MOK enrollment or DKMS configuration in either state.
for sb in disabled enabled; do
  out="$(plan_sb "$sb" /nonexistent)"
  case "$out" in *mok*|*MOK*|*dkms/framework*|*openssl*) f=1 ;; *) f=0 ;; esac
  assert_eq 0 "$f" "no signing/MOK steps (SB $sb)"
  assert_contains "$out" "modprobe vhci-hcd" "vhci-hcd planned (SB $sb)"
done
finish
