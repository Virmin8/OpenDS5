#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
mkdir -p "$tmp/vds-bin"
for f in vdsd vdsctl; do : > "$tmp/vds-bin/$f"; done
printf 'ExecStart=@VDS_SYSTEMD_VDSD@\n' > "$tmp/vds-bin/vdsd.service.in"
: > "$tmp/vds-bin/override-bluetoothd.sh"

plan() { # extra args...
  env OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release" OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 \
      OPENDS5_SB_STATE=disabled OPENDS5_USERSPACE_DIR="$tmp/vds-bin" HOME="$tmp/home" \
      bash "$here/../opends5-install" --uninstall --dry-run "$@"
}

out="$(plan)"
assert_contains "$out" "systemctl disable --now vdsd.service" "service stopped"
assert_contains "$out" "rm -f /etc/systemd/system/vdsd.service" "unit removed"
assert_contains "$out" "enable-input --restart" "BlueZ input plugin restored"
assert_contains "$out" "rm -rf /usr/share/opends5" "override script removed"
assert_contains "$out" "modprobe -r vds_hcd" "module unloaded"
assert_contains "$out" "dkms remove" "dkms registration removed"
assert_contains "$out" "rm -rf /usr/src/vds_hcd-*" "module source removed"
assert_contains "$out" "rm -f /etc/modules-load.d/vds.conf" "autoload removed"
assert_contains "$out" "rm -f /usr/local/bin/vdsd /usr/local/bin/vdsctl" "binaries removed"
assert_contains "$out" "rm -f /etc/udev/rules.d/99-vds-dualsense-udev.rules" "udev rules removed"
assert_contains "$out" "groupdel vds" "group removed"
assert_contains "$out" "rm -rf /var/lib/vds" "daemon state removed"
assert_contains "$out" "$tmp/home/.config/wireplumber/wireplumber.conf.d/99-vds-dualsense-wireplumber.conf" "wireplumber config removed"
assert_contains "$out" "$tmp/home/Applications/OpenDS5.AppImage" "appimage removed"
assert_contains "$out" "$tmp/home/.config/autostart/opends5.desktop" "autostart removed"
case "$out" in *".config/OpenDS5"*) f=1 ;; *) f=0 ;; esac
assert_eq 0 "$f" "settings kept without --purge"

out="$(plan --purge)"
assert_contains "$out" "$tmp/home/.config/OpenDS5" "settings removed with --purge"

# The install plan always ships the override script vdsd's mode switch needs.
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release" OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 \
      OPENDS5_SB_STATE=disabled OPENDS5_USERSPACE_DIR="$tmp/vds-bin" OPENDS5_SYSROOT=/nonexistent \
      OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes)"
assert_contains "$out" "install -D -m 0755 '$tmp/vds-bin/override-bluetoothd.sh' /usr/share/opends5/override-bluetoothd.sh &&" "override script always installed"

# --rebuild-module rebuilds even with vds_hcd loaded (app update with new module sources).
mkdir -p "$tmp/sys/sys/module/vds_hcd"
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release" OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 \
      OPENDS5_SB_STATE=disabled OPENDS5_USERSPACE_DIR="$tmp/vds-bin" OPENDS5_SYSROOT="$tmp/sys" \
      OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes)"
assert_contains "$out" "Kernel module already loaded; skipping module build" "loaded module skipped by default"
out="$(env OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release" OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 \
      OPENDS5_SB_STATE=disabled OPENDS5_USERSPACE_DIR="$tmp/vds-bin" OPENDS5_SYSROOT="$tmp/sys" \
      OPENDS5_DRY_RUN=1 bash "$here/../opends5-install" --yes --rebuild-module)"
assert_contains "$out" "modprobe -r vds_hcd" "rebuild unloads the old module"
assert_contains "$out" "dkms add vds_hcd/" "rebuild registers the new module"

rm -rf "$tmp"
finish
