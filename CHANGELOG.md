# Changelog

Each release's GitHub notes are taken from its section below. Add a new
`## [x.y.z] - YYYY-MM-DD — short summary` section at the top before tagging
`vx.y.z`; the summary becomes the release title (`vx.y.z — short summary`).

Write each section like this: an opening paragraph saying what is in the release
and what the reader has to do (in bold), then `### Fixed`, `### Changed`,
`### Added` and so on. Every bullet starts with a **bold one-sentence summary**,
followed by what was wrong or missing and what changed. Add
`### Verified on hardware` only for what was actually tested on a real
controller or machine.

## [Unreleased]

### Added
- **Automatic Audio Buffer Length (Linux).** The controller's audio buffer was a
  fixed value, so it had to be set high enough for the worst Bluetooth moments
  and added that delay to every haptic all the time. vdsd now sets it after every
  packet from the gaps between Bluetooth sends: it covers the 3rd-longest gap of
  the last ~3 s, rises on the packet that brings a third spike into that window
  and falls as soon as spikes age out. On a clean link the buffer drops from
  21 ms to as low as 13 ms. It is on by default; switch it off under Audio
  Buffer Length to use a fixed value. Diagnostics shows the live value.
- **Haptics-only packets while the speaker is silent.** Every Bluetooth audio
  packet carried a 200-byte speaker frame, even when the speaker had nothing to
  play, so a haptics-only game still sent 398-byte packets. After about a second
  of speaker silence vdsd now sends the 206-byte 0x33 report with the same
  haptics, rumble, trigger and lightbar data; the first packet with speaker
  sound switches back. Less airtime per packet means fewer late sends, so the
  automatic buffer can sit lower. Diagnostics shows "(haptics only)" while it is
  active.

### Fixed
- **No standing backlog in vdsd's send queue.** Audio comes in from USB and goes
  out over Bluetooth at the same rate, so a backlog left by a burst stayed as
  extra haptics delay for the rest of the stream. vdsd now skips one chunk when
  the queue holds more than one spare for ~2 s, and restarts after running dry
  on 2 chunks instead of 3. Diagnostics counts the trimmed chunks.
- **The Audio Buffer Length control fits in the Speaker card.** The Automatic
  switch is on the same line as the title, and the slider only shows when
  Automatic is off, instead of an extra row that pushed the slider out of the
  card and dimmed the whole control.

### Verified on hardware
- HD haptics in Final Fantasy VII Rebirth over Bluetooth on CachyOS: the
  automatic buffer tracked the link and felt tighter than the fixed 64, and
  haptics-only packets switched on during speaker silence and back when sound
  played, a little more responsive again. Two further steps were tried and
  rejected: sending with no spare chunk (the queue kept running dry) and
  16-sample haptics packets every 5.3 ms (haptics felt broken; the DualSense
  needs 32 samples per packet).

## [1.9.2] - 2026-10-10 — pacman and AUR packages; delete the Default profile

OpenDS5 now installs on Arch Linux and CachyOS as a real pacman package, and
profiles are easier to manage. **Arch/CachyOS users can switch from the AppImage
to the package**: download the `opends5-bin-1.9.2-….pkg.tar.zst` file below and
run `sudo pacman -U` on the downloaded file (not the link; the package is
unsigned). If you set up the AppImage's driver before, remove that setup first,
as described in the README. **Log out and back in once** after the first
install. AppImage users on other distributions update as usual.

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Added
- **A pacman package on every release, and AUR recipes.** Until now the only way
  to install on Arch was the AppImage's setup wizard, which puts `vdsd` and the
  kernel module outside the package manager. The release now carries
  `opends5-bin`, built from the release AppImage, which installs the app,
  `vdsd`, `vdsctl`, the service, udev rules, WirePlumber config, the `vds` group
  and the `vds_hcd` module source, which DKMS rebuilds on every kernel update.
  A pacman hook then loads the module, starts `vdsd` and adds the installing
  user to `vds`. `packaging/aur/` also has `opends5-bin` and a build-from-source
  `opends5` for the AUR.
- **The Default profile can be deleted once you have another profile.** Default
  was a protected built-in that the app always put back. It can now go as long
  as one of your own profiles remains; the app switches to that profile, and so
  does "Launch with profile" if it pointed at Default. Default returns if you
  delete all your own profiles, or with Restore Defaults.
- **The Bluetooth tab explains permission problems.** When `vdsd` refused the
  app because the user is not in the `vds` group, the tab only showed
  "vdsd is not reachable: EACCES". It now says to log out and back in when you
  were just added to the group, or shows the `usermod` command when you are not
  in it.

### Fixed
- **Turning on Auto switch no longer makes the Bluetooth card overlap the page.**
  The Bluetooth tab reused the System tab's layout, which caps the card row at
  326 px; the idle-time options and hints that Auto switch reveals pushed the
  card past it. The row now grows with its content, and the five idle-time
  buttons sit on one row instead of wrapping "30 min" onto a second line.
- **Launch at startup works for package installs.** The autostart entry was only
  written when the app ran as an AppImage, so the switch silently did nothing
  otherwise. It now points at the package's `/usr/bin/opends5` launcher.

### Changed
- **The System tab no longer has its own profile dropdown.** It duplicated the
  selector in the sidebar, which is now the one place to switch profiles.
- **Package installs hide the setup wizard and the in-app uninstaller.** The
  package manager installs and removes the driver and `vdsd`, and the bundled
  installer those features run is not part of a package install.

### Developer
- **The nix-flake job fixes `npmDepsHash` itself.** Any `package-lock.json`
  change, including a version bump, changes the hash, and the stale one had
  failed every nix-flake run since 1.9.0. On pushes the job now takes the
  correct hash from the mismatch error, commits it, and builds with it.

### Verified on hardware
- `opends5-bin` installed with pacman on CachyOS (kernel 7.2.9): DKMS built
  `vds_hcd` for both installed kernels, the module loaded and `vdsd` ran from
  the packaged unit.
- The Bluetooth tab with Auto switch on, and the System tab without the profile
  dropdown, checked in the running app.

## [1.9.1] - 2026-10-10 — clearer Bluetooth audio and HD haptics; controller shortcuts

Better sound and HD haptics over Bluetooth, new controller shortcuts, and every
setting in the Linux app now either works or has been removed. **Update the
AppImage from inside the app**; the driver is rebuilt automatically on the next
launch.

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Audio
- **Clearer speaker and headphone sound.** The old linear resampler distorted
  treble and turned bright sounds (cymbals, "s" sounds) gritty, and the Opus
  encoder was not running at full quality. A proper band-limited resampler
  replaces it, and the encoder now runs at full quality.
- **Louder built-in speaker without distortion.** Bass the tiny speaker cannot
  play is filtered out first, then the sound is boosted by up to 18 dB with a
  limiter that keeps it from clipping. Headphones are not affected.
- **Mono for the built-in speaker.** The controller has one speaker, so the
  whole Bluetooth audio budget now goes to one channel, roughly halving the
  coding error. Headphones keep stereo.
- **Smooth volume slider.** Small moves near the top of the Speaker slider made
  the sound very quiet; the slider now changes the volume evenly.
- **Default speaker preamp gain is now 1.** The boost provides the loudness, so
  installs still on the old default of 4 are moved to 1.

### HD haptics
- **More accurate vibration.** Simple averaging let high-frequency audio turn
  into false buzzing, lost quiet detail in the 8-bit conversion, and made
  vibration coarser as the haptics gain went up. A proper filter replaces it and
  reproduces the actuator band flat.

### Added
- **Controller shortcuts on the Mute button.** Holding PS for several seconds
  turns the DualSense off, so the shortcuts use Mute instead:
  - **Mute + D-pad Up/Down:** speaker volume.
  - **Mute + D-pad Left/Right:** previous/next controller profile (new).
  - **Mute + Triangle:** turn the controller off.
- **Turn Off Controller actually turns it off.** Renamed from "Sleep"; available
  as an Overview quick action, a shortcut and a chord action.
- **Lights come back after a native DualSense game.** A game that took over the
  lightbar, player LEDs or triggers left them off until the next game; the
  previous state is now restored when it exits.
- **Audio diagnostics** under System → Diagnostics: buffer size, packet rate,
  longest gap, late packets (probable dropouts) and speaker mode, live.
- **More Idle Disconnect timeouts:** 1 minute, 1 hour and 2 hours.

### Fixed
- **Settings that were shown but did nothing over vds now work.** Audio Buffer
  Length, Classic Rumble V1 (v2 remains the default) and the Volume Shortcut
  are applied. Idle Disconnect turns the controller off after the chosen time
  without input (buttons, triggers and sticks; motion does not count), and PC
  Sleep Disconnect turns it off before the PC sleeps.
- **The mute light no longer comes on.** There is no microphone over vds.
- **The Settings dialog no longer overflows its frame.**

### Removed (Linux)
- **Settings that cannot work over Bluetooth with vds are hidden.** Polling
  Rate, the microphone and pass-through controls, Mute Button Behavior and the
  Windows-only Emergency Device Repair are gone from the Linux app, and the
  System and Overview tabs show "Bridge: vds" instead of an emulated firmware
  version.

### Developer
- **Measurement tools.** `vds/tools/audio_compare.cc` measures Bluetooth vs USB
  audio and haptics fidelity; `vds/tools/imu_haptics_test.py` measures real
  vibration with the controller's accelerometer.
- **New tests** for the speaker resampler, enhancer and mono encoding, haptics,
  rumble mode, controller shortcuts, idle activity and game-session restore.

## [1.9.0] - 2026-10-10 — first fork release: DualShock 4 and Xbox 360 personas, Bluetooth tab

First release of this fork of
[LordVicky/OpenDS5](https://github.com/LordVicky/OpenDS5), based on upstream
1.8.1. **Switching from upstream: install this AppImage and run it once**; update
checks then follow this fork. For earlier history, see the
[upstream releases](https://github.com/LordVicky/OpenDS5/releases).

The changes in this release were made by
[Claude](https://claude.com/claude-code), Anthropic's AI assistant, using
Claude Code, working with the fork's maintainer.

### Added
- **Controller personas.** Games that don't support the DualSense can now see it
  as a **DualShock 4** or an **Xbox 360** controller. Switch from the Overview
  or System tab; the Bluetooth link stays up while the virtual controller
  changes identity, and rumble and lightbar output from the game are passed
  back to the DualSense.
- **Bluetooth tab.** Switch between *OpenDS5 mode*, where vds owns the
  controller, and *normal mode*, where Bluetooth keyboards, mice and other pads
  work again. Optional auto switching drops to normal mode after 10 s – 1 h
  with no controller connected and returns to OpenDS5 mode when your DualSense
  connects. Paired controllers are listed with their state and can be attached
  or detached.
- **Heroic and Lutris games.** Add Game now finds games from Heroic Games
  Launcher and Lutris as well as Steam, with a search box.
- **Profile when playing.** Link a game to one of your own controller profiles;
  with auto switching on, that profile is selected while the game runs.
- **Launch with profile and Start minimized settings.** "Launch at startup" now
  also creates a proper login item for the AppImage.
- **Diagnostics.** View the `vdsd` log and turn input/output tracing on or off
  from the System tab.
- **Test Triggers quick action** on the Overview, replacing the microphone test,
  which vds can't support.
- **Full uninstall.** Remove OpenDS5 from Settings → Maintenance, or with
  `./OpenDS5.AppImage --uninstall-system [--purge]`. This removes the kernel
  module, `vdsd`, udev rules, WirePlumber config, BlueZ override, the `vds`
  group and the launcher, and turns the BlueZ input plugin back on; `--purge`
  also deletes app settings.
- **Speaker gain setting** (preamp levels 1–7) on the Audio tab.

### Fixed
- **No more crackling and periodic dropouts from the controller speaker over
  Bluetooth.** Speaker packets are now paced correctly and briefly buffered
  after an underrun. (From
  [djanice1980/DS5_Bridge](https://github.com/djanice1980/DS5_Bridge), as are
  the next three.)
- **Playing audio no longer un-mutes the controller microphone.**
- **The speaker volume set by the game or app is kept** instead of being forced
  to maximum.
- **Speaker and haptics audio get a plain 4-channel output in
  PipeWire/WirePlumber,** and the config applies without logging out.
- **Scanning for installed games no longer freezes the app** on large game
  folders.
- **App updates rebuild and reload the kernel module,** so a new version's
  module is actually used.

### Changed
- **Update checks and the "releases" link point at this fork**
  ([Virmin8/OpenDS5](https://github.com/Virmin8/OpenDS5)), so you get this
  fork's builds instead of upstream's.
- **The Ko-fi badges are removed.**
