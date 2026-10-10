# Changelog

Each release's GitHub notes are taken from its section below. Add a new
`## [x.y.z]` section at the top before tagging `vx.y.z`.

## [1.9.2] - 2026-10-10

OpenDS5 is now on the Arch User Repository, and profiles are easier to manage.

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Added
- **AUR packages for Arch Linux and CachyOS.** `opends5-bin` repackages the
  release AppImage, so there is nothing to compile; `opends5` builds the app
  and vdsd from source. Both install vdsd, the kernel module (rebuilt by DKMS
  on kernel updates), the udev rules and the WirePlumber config. When the
  install finishes, the module is loaded, vdsd is started and you are added
  to the `vds` group; log out and back in once. Updates come through your AUR
  helper.
- **Delete the Default profile** once you have another profile. The app
  switches to your remaining profile, and so does "Launch with profile" if it
  was set to Default. Default comes back if you delete all your own profiles,
  or with Restore Defaults.
- **Clear message when the app cannot reach vdsd because of permissions.**
  The Bluetooth tab now says to log out and back in (just added to the `vds`
  group) or shows the command to add yourself, instead of "EACCES".

### Fixed
- **Bluetooth tab:** turning on Auto switch no longer makes the card overlap
  the rest of the page, and the five idle-time buttons fit on one row.
- **Launch at startup** now works when OpenDS5 is installed as a package, not
  only from the AppImage.

### Changed
- The System tab no longer has its own profile dropdown; switch profiles from
  the sidebar.
- When OpenDS5 is installed by a package, the setup wizard and the in-app
  uninstaller are hidden, since the package manager handles both.

### Developer
- The nix-flake CI job now updates `npmDepsHash` itself when
  `package-lock.json` changes, and the stale hash that failed every run since
  1.9.0 is fixed.

## [1.9.1] - 2026-10-10

Better sound and HD haptics over Bluetooth, new controller shortcuts, and
every setting in the Linux app now either works or has been removed.

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Audio
- **Clearer speaker and headphone sound.** The Opus encoder now runs at full
  quality, and a proper band-limited resampler replaces the old linear one,
  which distorted treble and turned bright sounds (cymbals, "s" sounds)
  gritty.
- **Louder built-in speaker without distortion.** Bass the tiny speaker
  cannot play is filtered out, then the sound is boosted by up to 18 dB with
  a limiter that keeps it from clipping. Headphones are not affected.
- **Mono for the built-in speaker.** The controller has one speaker, so the
  whole Bluetooth audio budget now goes to one channel: roughly half the
  coding error. Headphones keep stereo.
- **Smooth volume slider.** The Speaker slider now changes the volume
  evenly; before, small moves near the top made it very quiet.
- The default speaker preamp gain is now 1 (the boost provides the
  loudness); installs still on the old default of 4 are moved to 1.

### HD haptics
- **More accurate vibration.** A proper filter replaces simple averaging:
  the actuator band is reproduced flat, high-frequency audio no longer turns
  into false buzzing, quiet detail survives the 8-bit conversion, and the
  haptics gain no longer makes vibration coarser.

### Added
- **Controller shortcuts**, all on the Mute button (holding PS for several
  seconds turns the DualSense off, so it is not used):
  - **Mute + D-pad Up/Down:** speaker volume.
  - **Mute + D-pad Left/Right:** previous/next controller profile (new).
  - **Mute + Triangle:** turn the controller off.
- **Turn Off Controller** (Overview quick action, shortcut, chord action),
  renamed from "Sleep", now actually turns the controller off.
- **Lights restored after a native DualSense game.** When a game that took
  over the lightbar, player LEDs or triggers exits, the previous state comes
  back instead of staying off until the next game.
- **Audio diagnostics** (System → Diagnostics): buffer size, packet rate,
  longest gap, late packets (probable dropouts) and speaker mode, live.
- Idle Disconnect timeouts of **1 minute, 1 hour and 2 hours**.

### Fixed
Settings that were shown but did nothing over vds now work:
- **Audio Buffer Length**
- **Classic Rumble V1** (v2 remains the default)
- **Volume Shortcut**
- **Idle Disconnect**: turns the controller off after the chosen time
  without input (buttons, triggers, sticks; motion does not count).
- **PC Sleep Disconnect**: turns the controller off before the PC sleeps.

Also:
- The mute light no longer comes on (there is no microphone over vds).
- The Settings dialog no longer overflows its frame.

### Removed (Linux)
Settings that cannot work over Bluetooth with vds are hidden: Polling
Rate, microphone and pass-through controls, Mute Button Behavior, and the
Windows-only Emergency Device Repair. The System and Overview tabs show
"Bridge: vds" instead of an emulated firmware version.

### Developer
- `vds/tools/audio_compare.cc`: measures Bluetooth vs USB audio and haptics
  fidelity; `vds/tools/imu_haptics_test.py`: measures real vibration with
  the controller's accelerometer.
- New tests for the speaker resampler, enhancer and mono encoding, haptics,
  rumble mode, controller shortcuts, idle activity and game-session
  restore.

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
