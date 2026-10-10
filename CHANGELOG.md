# Changelog

Each release's GitHub notes are taken from its section below. Add a new
`## [x.y.z]` section at the top before tagging `vx.y.z`.

## [1.9.0] - 2026-10-10

First release of this fork of
[LordVicky/OpenDS5](https://github.com/LordVicky/OpenDS5), based on upstream
1.8.1. For earlier history, see the
[upstream releases](https://github.com/LordVicky/OpenDS5/releases).

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Added
- **Controller personas.** Present your DualSense to the PC as a
  **DualShock 4** or an **Xbox 360** controller, for games that don't support
  the DualSense. Switch from the Overview or System tab; the Bluetooth link
  stays up while the virtual controller changes identity. Rumble and lightbar
  output from the game are passed back to the DualSense.
- **Bluetooth tab.** Switch between *OpenDS5 mode* (vds owns the controller)
  and *normal mode* (Bluetooth keyboards, mice and other pads work again).
  Optional auto switching drops to normal mode after 10 s – 1 h with no
  controller connected, and returns to OpenDS5 mode when your DualSense
  connects. Paired controllers are listed with their state and can be
  attached or detached.
- **Heroic and Lutris games.** Add Game now finds games from Heroic Games
  Launcher and Lutris as well as Steam, with a search box.
- **Profile when playing.** Link a game to one of your own controller
  profiles; with auto switching on, that profile is selected while the game
  runs.
- **Launch with profile** and **Start minimized** settings, and the
  "Launch at startup" option now creates a proper login item for the
  AppImage.
- **Diagnostics.** View the `vdsd` log and turn input/output tracing on or
  off from the System tab.
- **Test Triggers** quick action on the Overview (replaces the microphone
  test, which vds can't support).
- **Uninstall.** Remove OpenDS5 completely from Settings → Maintenance, or
  with `./OpenDS5.AppImage --uninstall-system [--purge]`. This removes the
  kernel module, `vdsd`, udev rules, WirePlumber config, BlueZ override, the
  `vds` group and the launcher, and turns the BlueZ input plugin back on.
  `--purge` also deletes app settings.
- **Speaker gain** setting (preamp levels 1–7) on the Audio tab.

### Fixed
Audio fixes from
[djanice1980/DS5_Bridge](https://github.com/djanice1980/DS5_Bridge):
- Crackling and periodic dropouts from the controller speaker over
  Bluetooth. Speaker packets are now paced correctly and briefly buffered
  after an underrun.
- Playing audio no longer un-mutes the controller microphone.
- The speaker volume set by the game or app is kept instead of being forced
  to maximum.
- Speaker and haptics audio now get a plain 4-channel output in
  PipeWire/WirePlumber, and the config applies without logging out.

Other fixes:
- Scanning for installed games no longer freezes the app on large game
  folders.
- App updates now rebuild and reload the kernel module, so a new version's
  module is actually used.

### Changed
- Update checks and the "releases" link now point at this fork
  ([Virmin8/OpenDS5](https://github.com/Virmin8/OpenDS5)), so you get this
  fork's builds instead of upstream's.
- Removed the Ko-fi badges.
