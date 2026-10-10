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

## Test a package locally

```bash
cd packaging/aur/opends5-bin    # or packaging/aur/opends5
makepkg -si
```

A pacman hook (`95-opends5.hook`) then finishes the setup once DKMS has built the
module: it adds the user who ran `sudo pacman`/the AUR helper to the `vds` group, loads
`vds_hcd`, and enables and starts `vdsd.service` (on upgrades it reloads the module and
restarts `vdsd`). Log out and back in once after the first install so the new group
membership applies. Removing the package stops `vdsd` and unloads the module.

Machines that used the AppImage's system installer must remove its files first
(`/etc/systemd/system/vdsd.service`, `/etc/modules-load.d/vds.conf`,
`/usr/local/bin/vdsd`, `/usr/local/bin/vdsctl`, and the `vds_hcd` DKMS registration
and `/usr/src/vds_hcd-*`), otherwise pacman reports file conflicts or the old unit
overrides the packaged one.

## Publish (first time)

1. Create an account on <https://aur.archlinux.org> and add your SSH public key in
   *My Account*.
2. For each package, clone its (empty) AUR repository and copy the folder in:

   ```bash
   git clone ssh://aur@aur.archlinux.org/opends5-bin.git aur-opends5-bin
   cp -r packaging/aur/opends5-bin/. aur-opends5-bin/
   cd aur-opends5-bin
   git add . && git commit -m "Initial import: opends5-bin 1.9.1" && git push
   ```

   Do the same with `opends5` if you also publish the source package; its AUR
   repository is named after `pkgbase` and lists `opends5-dkms` automatically.

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
