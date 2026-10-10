#!/usr/bin/env bash
# Installs OpenDS5 on Arch Linux / CachyOS as a pacman package, without an AUR helper:
#
#   bash <(curl -fsSL https://raw.githubusercontent.com/Virmin8/OpenDS5/main/packaging/aur/install.sh)
#
# Downloads the opends5-bin PKGBUILD from this repository, points it at the latest
# GitHub release, then builds and installs it with makepkg/pacman. Run it again to update.
set -euo pipefail

repo=Virmin8/OpenDS5
raw="https://raw.githubusercontent.com/$repo/main/packaging/aur/opends5-bin"
files=(PKGBUILD opends5-bin.sh opends5.desktop opends5.install opends5.sysusers
       opends5-modules-load.conf 95-opends5.hook pacman-setup.sh)

die() { echo "error: $*" >&2; exit 1; }
ask() { local reply; read -r -p "$1 [y/N] " reply < /dev/tty; [[ $reply == [yY]* ]]; }

[ "$(id -u)" -ne 0 ] || die "run this as your normal user; it asks for sudo when it needs it."
command -v pacman >/dev/null || die "this script is for Arch Linux and derivatives (pacman not found)."

echo "==> Installing build tools (base-devel)"
sudo pacman -S --needed --noconfirm base-devel curl

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
    sudo rm -rf "$path"
  done
  sudo modprobe -r vds_hcd 2>/dev/null || true
  sudo systemctl daemon-reload
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"

echo "==> Downloading the package recipe"
for file in "${files[@]}"; do
  curl -fsSL -o "$file" "$raw/$file"
done

# Follow the latest release even if the PKGBUILD in main has not been bumped yet;
# the release publishes the AppImage's checksum next to it.
version=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" |
  sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$version" ] || die "could not find the latest release."
current=$(sed -n 's/^pkgver=//p' PKGBUILD)
if [ "$version" != "$current" ]; then
  sum=$(curl -fsSL "https://github.com/$repo/releases/download/v$version/OpenDS5-Companion-Setup-$version.AppImage.sha256" |
    cut -d' ' -f1)
  [[ $sum =~ ^[0-9a-f]{64}$ ]] || die "could not read the checksum of release $version."
  sed -i "s/^pkgver=.*/pkgver=$version/; s/^pkgrel=.*/pkgrel=1/; s/^sha256sums=('[0-9a-f]*'/sha256sums=('$sum'/" PKGBUILD
fi

echo "==> Building and installing opends5-bin $version"
makepkg -si

echo "==> Done. If you were just added to the vds group, log out and back in, then start OpenDS5."
