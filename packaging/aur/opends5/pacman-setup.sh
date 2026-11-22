#!/bin/sh
# Run by 95-opends5.hook after pacman installs or upgrades OpenDS5: adds the user
# who ran pacman to the vds group, loads vhci-hcd and (re)starts vdsd.

# Nothing to start in a chroot or container build.
[ -d /run/systemd/system ] || exit 0

systemd-sysusers opends5.conf >/dev/null 2>&1 || true

# sudo (also used by AUR helpers) and pkexec record who asked for the install.
user="${SUDO_USER:-}"
if [ -z "$user" ] && [ -n "${PKEXEC_UID:-}" ]; then
  user=$(id -nu "$PKEXEC_UID" 2>/dev/null)
fi
if [ -n "$user" ] && [ "$user" != root ]; then
  if ! id -nG "$user" | tr ' ' '\n' | grep -qx vds; then
    usermod -aG vds "$user"
    echo "  -> Added $user to the vds group. Log out and back in once so OpenDS5 can reach vdsd."
  fi
else
  echo '  -> Add your user to the vds group, then log out and back in:'
  echo '       sudo usermod -aG vds "$USER"'
fi

# Older releases used an out-of-tree vds_hcd module (the opends5-dkms package this
# one replaces). vdsd now plugs its controllers into the in-tree vhci-hcd driver;
# drop a still-loaded vds_hcd so nothing keeps using it.
if [ -d /sys/module/vds_hcd ]; then
  systemctl stop vdsd.service 2>/dev/null
  rmmod vds_hcd 2>/dev/null || echo "  -> The old vds_hcd module is in use; it goes away after a reboot."
fi
modprobe vhci-hcd || echo "  -> Could not load vhci-hcd; check that your kernel provides it (CONFIG_USBIP_VHCI_HCD)."

if systemctl is-active --quiet vdsd.service; then
  systemctl restart vdsd.service
else
  systemctl enable --now vdsd.service
fi
