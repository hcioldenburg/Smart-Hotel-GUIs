---
name: tv-control-wiring
description: How the TV device is wired to Home Assistant in Smart_Home_UI_Rework
metadata:
  type: reference
---

The "TV" device (`id:'tv'`) has three distinct HA entities:
- `binary_sensor.tv_status` — read-only on/off **status** (device `entityId`, used for display).
- `script.new_script` (friendly name "TV_OnOff") — the **control**: firing `script.turn_on` on it toggles TV power. Wired via the device's `toggleAction` field in `src/data/devices.ts`.
- `switch.socket_tv` — the separate "TV Socket" device (`id:'tvsock'`), a normal switch.

`media_player.tv` does **not** exist on this HA instance (the reference in `src/hooks/logbookCacheProvider.tsx` is stale/harmless — do not target it). `media_player.fire_tv_192_168_178_22` (androidtv/ADB, entry `01KTY47X2MHPXEPJGJ1998E52J`) does exist, but **cannot report playback**: its `apps` and `state_detection_rules` options are both empty, so streaming apps collapse to `idle`. Over all retained history it has only ever been `off`/`idle`/`unavailable`/`unknown` — never `playing`, including while the morning routine's SomaFM stream was audibly running. Do not build a "media playing" indicator on it without first adding a `state_detection_rule` for the streaming app's package. A "TV & Media" playback tile was considered on 2026-07-21 and deliberately **not** added for this reason.

Gotcha: calling `switch.turn_on` on a `binary_sensor` returns HTTP 200 with body `[]` (zero entities affected) — a silent no-op. That was the original "clicking the TV does nothing" bug; the general `control:'toggle'` path did exactly that. Fixed by the `toggleAction` override in `DeviceTile.toggleSwitch` and `DeviceDetailPanel.toggle`.

`binary_sensor.tv_status` is not a real sensor — it's a **template helper** ("TV State", config entry `01K1D8D2WTAM0WFWBBTZFFN3WE`) thresholding `sensor.socket_tv_power`. Standby draw is ~7–11 W, "on" is ~14–42 W and varies with what's on screen. The threshold was `> 25` and silently broke on 2026-07-21 when the TV's on-draw dropped to ~22 W: every press toggled the set correctly but the sensor stayed `off`, so the portal looked dead. Lowered to `> 15`. Edit it via the options flow (`POST /api/config/config_entries/options/flow`) — the REST states API can't see it.

Diagnosis trick: correlate `script.new_script` last_triggered against `sensor.socket_tv_power` history. If power moves ~3s after each fire, the IR path is fine and the fault is in the threshold, not the control.

The Zigbee plug reports power every ~10s, which bounds how fast any TV command can be confirmed. The pending TTL in `src/hooks/usePending.ts` must stay above that interval (now 15s) — when the two were both 10s, identical presses randomly confirmed or timed out.

HA is proxied at `http://localhost:8123` (see `vite.config.ts`); long-lived token + headers in `src/config.ts`. You can read/verify entity state directly against that REST API.
