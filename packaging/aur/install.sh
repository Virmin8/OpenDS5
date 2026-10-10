#!/usr/bin/env bash
# Installs OpenDS5 on Arch Linux / CachyOS from the pacman package attached to the
# latest GitHub release, without an AUR helper:
#
#   bash <(curl -fsSL https://raw.githubusercontent.com/Virmin8/OpenDS5/main/packaging/aur/install.sh)
#
# Offers to remove an earlier AppImage installer setup first. Run it again to update.
set -euo pipefail

repo=Virmin8/OpenDS5

die() { echo "error: $*" >&2; exit 1; }
ask() { local reply; read -r -p "$1 [y/N] " reply < /dev/tty; [[ $reply == [yY]* ]]; }

[ "$(id -u)" -ne 0 ] || die "run this as your normal user; it asks for sudo when it needs it."
command -v pacman >/dev/null || die "this script is for Arch Linux and derivatives (pacman not found)."

# The package added to the release by CI: opends5-bin-<version>-<rel>-x86_64.pkg.tar.zst
url=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" |
  grep -o '"browser_download_url": *"[^"]*opends5-bin-[^"]*\.pkg\.tar\.zst"' |
  sed 's/.*"\(https[^"]*\)"$/\1/' | head -n 1)
[ -n "$url" ] || die "the latest release has no pacman package; see packaging/aur/README.md."

# The AppImage's setup wizard installs vdsd and the module outside pacman. Its unit and
# binaries would override the package, and its module source makes pacman refuse.
leftovers=()
for path in /etc/systemd/system/vdsd.service /usr/local/bin/vdsd /usr/local/bin/vdsctl /etc/modules-load.d/vds.conf; do
  [ -e "$path" ] && leftovers+=("$path")
done
for dir in /usr/src/vds_hcd-*; do
  [ -d "$dir" ] && ! pacman -Qqo "$dir" >/dev/null 2>&1 && leftovers+=("$dir")
done
if [ ${#leftovers[@]} -gt 0 ]; then
  echo "==> Found files from the OpenDS5 AppImage installer:"
  printf '      %s\n' "${leftovers[@]}"
  ask "Remove them so the package can take over? (your settings are kept)" ||
    die "remove them first; see packaging/aur/README.md."
  sudo systemctl disable --now vdsd.service 2>/dev/null || true
  for path in "${leftovers[@]}"; do
    if [[ $path == /usr/src/vds_hcd-* ]]; then
      sudo dkms remove "vds_hcd/${path#/usr/src/vds_hcd-}" --all 2>/dev/null || true
    fi
    sudo rm -rf -- "$path"
  done
  sudo modprobe -r vds_hcd 2>/dev/null || true
  sudo systemctl daemon-reload
fi

echo "==> Installing ${url##*/}"
sudo pacman -U --needed "$url"

echo "==> Done. If you were just added to the vds group, log out and back in, then start OpenDS5."
