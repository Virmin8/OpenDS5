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

## [1.9.14] - Unreleased — More from the tray

**Update as usual.**

### ✨ Added
- **Tray menu** — right-click the tray icon for the controller's battery and charging state, switch profile or controller mode (DualSense / DualShock 4 / Xbox 360), turn the microphone on or off, and turn off the controller, without opening the window.
- **Pair New Controller** (Linux) on the **Bluetooth** tab — put the controller in pairing mode and press **Start**. OpenDS5 switches Bluetooth to Normal mode, pairs the controller, switches back and attaches it; no trip to your desktop's Bluetooth settings. A controller that was paired before is forgotten and paired fresh.
- **Battery time left** — the sidebar, tray menu and tray tooltip estimate how long the controller will last (for example *Battery 80% · ~4 h*). OpenDS5 learns it from how long each 10% lasts while you play, so the estimate appears after the first few drops and improves over time.
- **Weak Signal** notification (bell menu) — a toast when the controller's Bluetooth link stays weak enough to make haptics and audio stutter for a minute, with what to try. Brief dips don't count, and it won't repeat for 15 minutes. Off by default.
- **Steam Input warning** (Linux) on the **Game Profile** page — when Steam's PlayStation Controller Support is set to **Enabled**, Steam Input takes over the controller even in games with native DualSense support, which then lose adaptive triggers and haptics. OpenDS5 says so and how to fix it. Dismiss it with **Don't show again** if you use Steam Input on purpose.
- **Copy Support Report** in **System → Diagnostics** — copies versions, controller state, key settings and the end of the `vdsd` log for a bug report. Bluetooth addresses and your home folder are hidden, and your SteamGridDB key is never included.

---

## [1.9.13] - 2026-10-17 — Clearer when the controller isn't connected

Every page now says when the controller isn't connected, and the test buttons
wait for it. **Update as usual.**

### 🔧 Changed
- **"Controller not connected"** on the status badges of the Haptics, Audio, Lighting, Overview and System pages, like the Triggers page already had. Before, Haptics and Audio said **Ready** whenever the bridge was running, even with no controller.
- **Test buttons are disabled without a controller** — Test Haptics, Test Rumble, Test Speaker and Test Mic, on their pages and in Overview's Quick Actions.

### 🛠️ Developer
- `DS5_BRIDGE_MOCK_CONTROLLER_DISCONNECTED=1` makes the mock bridge report no controller, for UI checks.

---

## [1.9.12] - 2026-10-17 — Battery warning, settings backup and Electron 44

A low-battery warning on the lightbar, a one-file settings backup, a switch for
crackling controller audio, and an up-to-date Electron. **Update as usual.**

### ✨ Added
- **Battery Warning** on the **Lighting** page — the lightbar turns amber at 20% and red at 10% while the controller isn't charging, then goes back to your colour. Off by default.
- **Fully Charged** notification (bell menu) — a toast when the controller finishes charging. Off by default.
- **Back Up / Restore** in **System → About** — saves your settings, trigger profiles and game artwork to one file. Restore asks first, then restarts OpenDS5 to load it. Settings that belong to this PC are kept.
- **Larger Audio Blocks** (Linux) on the **Audio** page — turn it on if controller audio crackles. It switches to PipeWire's usual block size and restarts PipeWire for you; before, this meant editing a config file by hand.
- **Restart after a pacman update** — when pacman installs a new `opends5-bin`, OpenDS5 offers **Restart now** instead of running the old version until you quit from the tray. It works from the update after this one.

### 🔧 Changed
- **Electron 44** (was 39, which no longer gets security fixes). The NixOS package uses the same version.
- **Uses less CPU in the tray** — no longer scans every USB/Bluetooth HID device twice a second while the controller is connected, and the hidden window stops updating.
- **Smaller download** — only the English Chromium language pack is included (the app is English-only).

### 🐛 Fixed
- **Overlapping layout on small windows** — at the smallest window size the sidebar ran over Settings / Chords, the Audio page's header controls squeezed into each other, and System cards drew over each other. Pages now scroll instead.
- **Long config file paths** in **System → About** are cut off with "…" instead of running over the label.

### 🛠️ Developer
- **No more `npmDepsHash`** — the Nix package reads dependency hashes from `package-lock.json`, so releases need no follow-up commit and tagged versions build with Nix.
- **vds is built and tested only in the release workflow**, on Linux and Windows; vds and OpenDS5 no longer have separate build workflows.
- **`App.tsx` split up** — state in `app/useAppState.tsx`, one file per tab in `tabs/`, shared helpers in `app/`.

---

## [1.9.11] - 2026-10-14 — About card on the System page

**Check for updates** has moved to a new **About** card on the System page,
and you can now turn automatic update checks off. **Update as usual.**

### ✨ Added
- **About card** under the Device card on the System page: the app version, a **Check now** button, and where your settings file is saved.
- **Check for updates automatically** — untick it to stop OpenDS5 checking at launch and every two days. **Check now** still works.

### 🔧 Changed
- **Check for updates** is no longer in the settings menu; it's in the About card.

---

## [1.9.10] - 2026-10-14 — Update checks on every launch, and a Check for updates button

OpenDS5 now looks for a new version **every time it starts**, and you can check
by hand from the settings menu. **Update as usual.** If you are on 1.9.9 or
older, this update may take up to two days to appear; install it from the
Releases page to get it now.

### ✨ Added
- **Check for updates** in the settings menu, under About. It says whether you're up to date, shows the update if there is one (even a version you skipped), or tells you it couldn't reach GitHub.

### 🐛 Fixed
- **Updates not showing up** — OpenDS5 only checked once every two days, even across restarts, so a release that came out soon after a check stayed hidden. It now checks on every launch, and still every two days while it keeps running in the tray.

---

## [1.9.9] - 2026-10-14 — Signal strength in the Device card

The **Device card** now shows how strong the controller's Bluetooth signal is.
**Update as usual.**

### ✨ Added
- **Signal strength in the Device card** — signal bars and a reading such as "Signal Excellent · 0 dBm" under the battery. The bars turn amber when the signal is weak enough to risk audio dropouts, and red when it is poor. Shown on Linux and with the DS5 Bridge dongle; Windows does not report signal strength over plain Bluetooth.

### 🔧 Changed
- **Wireless card** on the Overview shows the dBm reading next to the signal quality, instead of only when you hover over it.
- **Device card** — the controller image sits at the top, next to the controller name.

---

## [1.9.8] - 2026-10-12 — Start Minimized works again

**Start Minimized** keeps OpenDS5 in the tray even if you last closed it
maximized. **Update as usual.**

### 🐛 Fixed
- **Start Minimized** — if the window was maximized when you last closed it, the next launch opened it anyway. It now stays in the tray and opens maximized when you open it. Starting at login was affected the same way.

---

## [1.9.7] - 2026-10-12 — Smoother audio on Linux, clearer speaker

Linux audio reaches the controller more evenly, the speaker boost is now a
setting with a cleaner default, and the app tells you about new releases.
**Update as usual.**

### 🐛 Fixed
- **Audio timing on Linux** — `vdsd` paused for a few ms every time the app asked it something (every 50 ms), so some audio arrived late and Auto set a larger audio buffer (48–56). It no longer waits on the app, and Auto now settles at 40–41, like on Windows.
- **A stuck app connection can't freeze `vdsd`** — a connection that sends nothing is dropped after a second instead of holding up controller input and audio.

### ✨ Added
- **Speaker Boost** on the **Audio** page — 1–18 dB of extra loudness for the built-in speaker; headphones bypass it.
- **Limiter** row under **System → Diagnostics** — shows how much the speaker limiter turns the sound down, and suggests a lower Speaker Boost when it's cutting a lot.
- **Update notifications** — a desktop notification when a new release is out. Arch package installs (`opends5-bin`) now hear about updates too, with a link to the release.

### 🔧 Changed
- **Speaker Boost defaults to 6 dB** (was 18). With the system volume up, 18 dB kept the limiter working all the time, which dulled the highs for almost no extra loudness. If you prefer the old level, pick 18 dB.
- **Daemon Log** in **System → Diagnostics** fills the rest of the card.

---

## [1.9.6] - 2026-10-11 — Windows: controller reconnects on its own

On Windows, a controller that is turned back on attaches to vds again by
itself. **Update from inside the app.** Nothing changes on Linux.

### 🐛 Fixed
- **Reconnecting on Windows** — `vdsd` missed a controller that was turned back on while the app was open, so it stayed unattached until you detached and attached it again on the Bluetooth tab.

---

## [1.9.5] - 2026-10-11 — OpenDS5 on Windows

OpenDS5 now runs on Windows 10 and 11, with no kernel driver of its own: vds
uses USB/IP and HidHide. **Windows:** download
`OpenDS5-Companion-Setup-1.9.5.exe` and run it; the setup wizard installs the
rest (see [Windows](https://github.com/Virmin8/OpenDS5#windows)). **Linux:**
update as usual.

### 🪟 Windows
- **Installer and setup wizard** — installs USB/IP (usbip-win2), HidHide and the `vdsd` service, asking for administrator rights once.
- **Wired DualSense over Bluetooth** — triggers, haptics, speaker, mic, lighting, battery, shortcuts and remapping, like on Linux.
- **DualShock 4 and Xbox 360 personas.**
- **Game profiles** — finds Steam, Epic and Heroic games and watches for running games.
- **Updates inside the app** — download, verify and restart into the new version.
- **Uninstall** from Windows Settings also removes the `vdsd` service.
- **Tray icon** stays readable on a light taskbar.
- **PC Sleep Disconnect** turns the controller off when Windows sleeps.

Not on Windows yet: trigger modifiers and state switch rules (they need
controller input the app can only read on Linux), signal strength (Windows
does not report it for the DualSense), touchpad as mouse and Bluetooth modes.

### ✨ Added
- **System** shows the vds version next to Bridge.
- **Browse for a game's executable** when adding a game profile.

### 🔧 Changed
- **vdsd** runs each controller through one shared bridge core on Linux and Windows, so both get the same features and fixes.
- **Personas** offer only what the daemon can present; a saved persona it can't is reapplied as DualSense.

---

## [1.9.4] - 2026-10-11 — controller microphone on Linux

The controller's mic now works in Linux, with one switch to turn it on and off.
**Update as usual**, then run `systemctl --user restart wireplumber` (or log out
and back in) so **Wireless Controller Mic** appears. See
[Microphone](https://github.com/Virmin8/OpenDS5#%EF%B8%8F-microphone).

### 🎙️ Microphone
- **Controller and headset mic** in Linux as **Wireless Controller Mic**, from vds's new microphone support.
- **Microphone switch** on **Audio → Mic** and in Quick Controls; **Mute** on the controller flips it too. Off by default.
- **Off** closes the controller's mic, mutes it in Linux and lights the mute light, like on a PS5.
- **Instant start** — while the mic is on, the controller's mic stays open, so recordings don't lose their first seconds.
- **Mic Processing** — Echo (default), Noise, Noise + Echo or none. Noise cancelling distorts the speaker, so it's off by default.
- **Mic-On Gain** next to Speaker Gain — the speaker gain used while the mic is on.
- **Mute Light** switch, to keep the mute light dark.

### ✨ Added
- **Leanest Bluetooth packets** — haptics only, haptics + speaker, haptics + mic, or all three, depending on what's live.
- **Diagnostics** show the packet kind and the controller's mic packets.

### 🔧 Changed
- **Shortcuts start with a touchpad click** instead of Mute, which now turns the mic on and off.
- **Mute Button settings** moved from System to **Audio → Mic**.
- **Diagnostics** take the whole System page; the profile summary sits below.
- **vds** updated with [hurryman2212/vds](https://github.com/hurryman2212/vds) 0.3.0-rc3 (microphone and headset support).

### 🐛 Fixed
- **Speaker stays clean with the mic off** — the controller's mic is only opened while the mic is on.

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
