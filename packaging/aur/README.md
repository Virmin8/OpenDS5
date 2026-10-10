# AUR packages

Each folder is one AUR package (one AUR git repository):

| Folder | AUR package | How it installs |
|---|---|---|
| `opends5-bin/` | `opends5-bin` | Unpacks the release AppImage; nothing to compile. Recommended for most users |
| `opends5/` | `opends5` + `opends5-dkms` | Builds the app and `vdsd` from the release source tarball, using the system `electron39` |

Both install the companion app, `vdsd`, `vdsctl`, `vdsd.service`, the udev rules, the
WirePlumber config and the `vds` group, plus the `vds_hcd` module source, which DKMS
compiles for each installed kernel (kernel modules always have to be built per kernel).
They conflict with each other.

The launcher sets `OPENDS5_LAUNCHER`, so the app knows a package manages the system:
the setup wizard and in-app uninstaller are hidden, the AppImage updater stays off,
and "Launch at startup" points at `/usr/bin/opends5`. Updates come through pacman or
an AUR helper. (This needs a release newer than 1.9.1; on 1.9.1 the in-app
"Uninstall OpenDS5" button is still shown and must not be used.)

## Install without an AUR helper

The release workflow builds `opends5-bin` from the release AppImage and attaches it to
every GitHub release. Download it and run `sudo pacman -U ./opends5-bin-….pkg.tar.zst`;
pacman refuses it as a URL because the package is unsigned (`RemoteFileSigLevel`
requires a signature, `LocalFileSigLevel` does not).

## Test a package locally

```bash
cd packaging/aur/opends5-bin    # or packaging/aur/opends5
makepkg -si
```

A pacman hook (`95-opends5.hook`) then finishes the setup once DKMS has built the
module: it adds the user who ran `sudo pacman`/the AUR helper to the `vds` group, loads
`vds_hcd`, and enables and starts `vdsd.service` (on upgrades it reloads the module and
restarts `vdsd`). Log out and back in once after the first install so the new group
membership applies.

`sudo pacman -R opends5-bin` (or `opends5 opends5-dkms`) removes everything outside
your home folder: it stops `vdsd`, unloads the module (the DKMS hook deletes the built
module for every kernel), turns BlueZ's input plugin back on so Bluetooth keyboards and
mice work again, and deletes `vdsd`'s data in `/var/lib/vds`, its log and the `vds`
group. A "Launch at startup" entry that starts the package's launcher is removed
too (one pointing at an AppImage is left alone). Your settings in `~/.config/OpenDS5`
are kept.

Machines that used the AppImage's system installer must remove its files first
(`/etc/systemd/system/vdsd.service`, `/etc/modules-load.d/vds.conf`,
`/usr/local/bin/vdsd`, `/usr/local/bin/vdsctl`, and the `vds_hcd` DKMS registration
and `/usr/src/vds_hcd-*`), otherwise pacman reports file conflicts or the old unit
overrides the packaged one.

## Update for a new release

After the `vX.Y.Z` release (with its AppImage) is published on GitHub, in each folder:

```bash
sed -i 's/^pkgver=.*/pkgver=X.Y.Z/; s/^pkgrel=.*/pkgrel=1/' PKGBUILD
updpkgsums                          # from pacman-contrib
makepkg --printsrcinfo > .SRCINFO
makepkg -f                          # check it still builds
```

Commit the changes here, then copy the folder into its AUR clone and push.
For the source package, if the app moves to a new Electron major, change `_electron`
in its PKGBUILD to match the `electron` version in `ds5-bridge/companion/package.json`.
