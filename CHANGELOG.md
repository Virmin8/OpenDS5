<p align="center">
  <img src="ds5-bridge/assets/brand/opends5-wordmark.png" alt="OpenDS5" width="480">
</p>

<h1 align="center">📜 Changelog</h1>

<p align="center">
  What changed in each OpenDS5 release. Downloads are on the <a href="../../releases">Releases</a> page.
</p>

<!--
Maintainers: each release's GitHub notes come from its section below. Before
tagging vx.y.z, add "## [x.y.z] - YYYY-MM-DD — short summary" at the top; the
summary becomes the release title. Start with a one or two line summary (what
the reader has to do in bold), then emoji ### sections with short bullets.
-->

---

## [1.9.3] - 2026-10-10 — tighter HD haptics over Bluetooth

HD haptics reach the controller about **15–25 ms sooner** over Bluetooth.
**Update as usual.** If controller audio crackles afterwards, see
[If controller audio crackles](https://github.com/Virmin8/OpenDS5#-if-controller-audio-crackles).

### ✨ Added
- **Automatic Audio Buffer Length** — follows your Bluetooth link packet by packet; as low as 13 ms on a clean link (was a fixed 21 ms). On by default.
- **Haptics-only packets** while the speaker is silent — half the Bluetooth airtime, fewer late packets.

### 🔧 Changed
- **Lower PipeWire latency** on the controller's audio: 2.7 ms blocks instead of 5.3 ms.

### 🐛 Fixed
- **No standing backlog** in vdsd's send queue, which could add up to ~85 ms of delay.
- **Audio Buffer Length control** fits in the Speaker card again; the Automatic switch sits in its header.

---

## [1.9.2] - 2026-10-10 — pacman and AUR packages; delete the Default profile

OpenDS5 now installs on Arch and CachyOS as a real pacman package.
**Arch users:** download the `.pkg.tar.zst` below and run `sudo pacman -U` on the file, then **log out and back in once**.

### ✨ Added
- **pacman package on every release** (`opends5-bin`) — installs the app, vdsd and the DKMS module, then loads the module, starts vdsd and adds you to the `vds` group.
- **AUR recipes** in `packaging/aur/`: `opends5-bin` and build-from-source `opends5`.
- **Delete the Default profile** once you have another one.
- **Permission hint** on the Bluetooth tab when you're not (yet) in the `vds` group.

### 🔧 Changed
- **Profile dropdown removed** from the System tab; use the sidebar.
- **Package installs** hide the setup wizard and in-app uninstaller.

### 🐛 Fixed
- **Bluetooth tab** no longer overlaps the page when Auto switch is on.
- **Launch at startup** works for package installs.

### 🛠️ Developer
- **nix-flake CI** updates `npmDepsHash` itself when the lockfile changes.

---

## [1.9.1] - 2026-10-10 — speaker and haptics tuning; controller shortcuts

Speaker and haptics tuning for Bluetooth, controller shortcuts, and more settings supported over vds.
**Update from inside the app.**

### 🔊 Audio
- **Speaker encoding** — band-limited resampler and full-quality Opus.
- **Speaker boost** — bass filter plus up to +18 dB with a limiter.
- **Mono for the built-in speaker**; headphones stay stereo.
- **Even volume steps** on the speaker slider; default preamp gain is 1.

### 📳 HD haptics
- **Haptics filter** — a band-limited filter tuned to the actuator range.

### ✨ Added
- **Mute-button shortcuts**: Mute + D-pad Up/Down (volume), Left/Right (profile), Triangle (turn off).
- **Turn Off Controller** (renamed from Sleep) powers the controller off.
- **Lights restored** when a native DualSense game exits.
- **More settings over vds**: Audio Buffer Length, Classic Rumble V1, Volume Shortcut, Idle Disconnect, PC Sleep Disconnect.
- **Audio diagnostics** under System → Diagnostics.
- **More Idle Disconnect timeouts**: 1 minute, 1 hour, 2 hours.

### 🔧 Changed
- **Mute light** stays off, as there's no microphone over vds.
- **Settings dialog** layout fits its frame.

### 🗑️ Removed (Linux)
- **Settings vds can't support** are hidden: Polling Rate, microphone controls, Mute Button Behavior, Emergency Device Repair.

### 🛠️ Developer
- **Measurement tools** for Bluetooth vs USB audio and real vibration (`vds/tools/`).
- **New tests** for audio, haptics, rumble, shortcuts and idle handling.

---

## [1.9.0] - 2026-10-10 — first fork release: DualShock 4 and Xbox 360 personas, Bluetooth tab

First release of this fork of [LordVicky/OpenDS5](https://github.com/LordVicky/OpenDS5), based on 1.8.1.
**Switching from LordVicky/OpenDS5:** install this AppImage and run it once.

### ✨ Added
- **Controller personas** — appear as a DualShock 4 or Xbox 360 controller.
- **Bluetooth tab** — OpenDS5 / normal mode, auto switching, attach and detach controllers.
- **Heroic and Lutris games** in Add Game, with search.
- **Profile when playing** — link a game to one of your profiles.
- **Launch with profile** and **Start minimized** settings.
- **Diagnostics** — vdsd log and input/output tracing.
- **Test Triggers** quick action.
- **Full uninstall** from Settings or `--uninstall-system [--purge]`.
- **Speaker gain** setting (1–7).

### 🔧 Changed
- **Speaker pacing and buffering** for Bluetooth*.
- **Controller mic stays muted** while audio plays*.
- **Game speaker volume** is kept as set*.
- **Plain 4-channel output** in PipeWire/WirePlumber*.
- **Faster game scan** on large folders.
- **Kernel module rebuilt** on app updates.
- **Update checks** follow this fork ([Virmin8/OpenDS5](https://github.com/Virmin8/OpenDS5)).
- **Ko-fi badges** removed.

<sub>* From [djanice1980/DS5_Bridge](https://github.com/djanice1980/DS5_Bridge).</sub>
