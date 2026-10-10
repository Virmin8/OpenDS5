#!/bin/sh
# Run by 95-opends5.hook after pacman installs or upgrades OpenDS5: adds the user
# who ran pacman to the vds group, loads vds_hcd and (re)starts vdsd.

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

# An upgrade ships a new module; swap it in when the loaded one is a different
# version. A controller still holding it keeps the old one until reboot.
loaded=$(cat /sys/module/vds_hcd/version 2>/dev/null)
installed=$(modinfo -F version vds_hcd 2>/dev/null)
if [ -n "$loaded" ] && [ -n "$installed" ] && [ "$loaded" != "$installed" ]; then
  systemctl stop vdsd.service 2>/dev/null
  rmmod vds_hcd 2>/dev/null || echo "  -> vds_hcd $loaded is in use; $installed loads after a reboot."
fi
modprobe vds_hcd || echo "  -> Could not load vds_hcd; see 'dkms status vds_hcd'."

if systemctl is-active --quiet vdsd.service; then
  systemctl restart vdsd.service
else
  systemctl enable --now vdsd.service
fi
