#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"

plan_for() { # fixture uname_r -> dry-run output
  env OPENDS5_OS_RELEASE="$here/fixtures/$1/os-release" \
      OPENDS5_UNAME_R="$2" OPENDS5_SYSROOT=/nonexistent \
      OPENDS5_SB_STATE=disabled OPENDS5_DRY_RUN=1 \
      bash "$here/../opends5-install" --yes
}

no_dkms() { case "$1" in *"dkms add"*|*"dkms install"*|*headers*|*-devel*) echo 1 ;; *) echo 0 ;; esac; }

out="$(plan_for fedora 6.15.4-200.fc44.x86_64)"
assert_contains "$out" "modprobe vhci-hcd" "fedora loads vhci-hcd"
assert_contains "$out" "dnf install -y kernel-modules-extra-6.15.4-200.fc44.x86_64" "fedora installs modules-extra only if modprobe fails"
assert_contains "$out" "modules-load.d/vds.conf" "fedora autoload"
assert_eq 0 "$(no_dkms "$out")" "fedora: no DKMS / headers"

out="$(plan_for fedora-cachyos 7.1.2-cachyos1.fc44.x86_64)"
assert_contains "$out" "modprobe vhci-hcd" "fedora COPR kernel loads vhci-hcd"

out="$(plan_for cachyos 6.15.4-2-cachyos)"
assert_contains "$out" "modprobe vhci-hcd" "cachyos loads vhci-hcd"
case "$out" in *"pacman -S"*) f=1 ;; *) f=0 ;; esac
assert_eq 0 "$f" "cachyos: no packages needed"

out="$(plan_for debian 6.8.0-41-generic)"
assert_contains "$out" "apt-get install -y linux-modules-extra-6.8.0-41-generic" "debian modules-extra fallback"

out="$(plan_for suse 6.15.4-1-default)"
assert_contains "$out" "modprobe vhci-hcd" "suse loads vhci-hcd"
assert_eq 0 "$(no_dkms "$out")" "suse: no DKMS / headers"

tmp="$(mktemp -d)"; mkdir -p "$tmp/run"; : > "$tmp/run/ostree-booted"
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/bazzite/os-release" OPENDS5_UNAME_R=6.15.4-104.bazzite.fc44.x86_64 \
      OPENDS5_SYSROOT="$tmp" OPENDS5_SB_STATE=disabled OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes)"
assert_contains "$out" "rpm-ostree install --idempotent kernel-modules-extra" "bazzite layers modules-extra only if needed"
assert_contains "$out" "REBOOT" "bazzite warns about reboot"
rm -rf "$tmp"

out="$(plan_for nixos 6.15.4)"
assert_contains "$out" "opends5-vds.nix" "nixos generates snippet"

out="$(env OPENDS5_OS_RELEASE=/nonexistent OPENDS5_UNAME_R=1.0 OPENDS5_SYSROOT=/nonexistent \
      OPENDS5_SB_STATE=disabled OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes 2>&1 || true)"
assert_contains "$out" "unsupported" "unknown distro refuses cleanly"

# Upgrades from a DKMS-era release remove the old module, every version.
tmp="$(mktemp -d)"
mkdir -p "$tmp/sys/module/vds_hcd"
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/cachyos/os-release" OPENDS5_UNAME_R=6.15.4-2-cachyos \
      OPENDS5_SYSROOT="$tmp" OPENDS5_SB_STATE=disabled OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes)"
assert_contains "$out" "remove the old out-of-tree vds_hcd module" "loaded legacy module removed"
assert_contains "$out" "dkms status vds_hcd" "legacy removal enumerates every registered version"
assert_contains "$out" "rm -rf /usr/src/vds_hcd-*" "legacy sources removed"
rm -rf "$tmp"; tmp="$(mktemp -d)"
mkdir -p "$tmp/usr/src/vds_hcd-1.6.3"
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/cachyos/os-release" OPENDS5_UNAME_R=6.15.4-2-cachyos \
      OPENDS5_SYSROOT="$tmp" OPENDS5_SB_STATE=disabled OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes)"
assert_contains "$out" "remove the old out-of-tree vds_hcd module" "staged legacy sources trigger cleanup"
rm -rf "$tmp"
out="$(plan_for cachyos 6.15.4-2-cachyos)"
case "$out" in *"vds_hcd module"*) f=1 ;; *) f=0 ;; esac
assert_eq 0 "$f" "no legacy step on a clean system"
finish
