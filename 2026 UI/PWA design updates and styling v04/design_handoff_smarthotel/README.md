# Handoff: SmartHotel In-Room Control Dashboard (Study Build, 2 Conditions)

> **For the developer using Claude Code.** This document is self-sufficient — you should be able to
> build the app from this README alone, using the design references and reusable code in this bundle.

---

## 1. Overview

**SmartHotel** is a guest-facing, in-room tablet dashboard for monitoring and controlling every
connected device in a hotel room, and for understanding the automation rules that wire those devices
together. It is the apparatus for an HCI thesis experiment (HA study tag `Psanei_Thesis_Experiment`).

The app talks to a real **Home Assistant (HA)** instance over WebSocket + REST. Participants use the
tablet to complete tasks; **all of their interactions are logged** for later analysis.

This is a **redesign / rework** of an existing React app (`home-assistance-ui`, in the
`experiment-ui/` folder you provided). The job is:

- **Rebuild the UI** to match the new design references in `design-reference/` (a new visual system
  and a cleaner information architecture).
- **Keep and reuse the working plumbing** from the old app — the Home-Assistant data layer, the
  service-call patterns, the interaction recorder, and the build/deploy setup. Those are provided in
  `reusable-code/` and described in §8.

> The new design does **not** need to change to fit the old code. Where they differ, the **new design
> wins on visuals and layout**; the **old code wins on data/logging/deploy**. Pick the reusable pieces
> and wire the new UI on top of them.

### The two conditions

The study compares two UI conditions. The new design ships both behind a single prop/flag
(`condition` in the prototype). They share the same shell, data, and logging — they differ only in how
the **"Your Room"** screen is presented:

| Condition | Name | "Your Room" presentation | Closest old page |
|---|---|---|---|
| **1** | **Cards only** | Grouped device cards (Lights / Appliances / Media / Sensors), each card is a live control. No spatial or graph view. | `BaselineUI.tsx` |
| **2** | **Devices + Graph** | A view-switcher with three sub-views over a floor-plan photo: **Devices** (floor map), **Dependencies** (rule graph), **Connections** (hub graph). | `StructualUI.tsx` + `ContextualUI.tsx` network |

Everything else — top bar, left nav rail, the **All Devices** table, the **All Rules** catalogue, the
device-detail and rule-detail panels, the category filter — is **identical across both conditions.**

The condition must be selectable at launch (build flag, URL param, or env var — see §7). A participant
session runs in exactly one condition.

---

## 2. About the design files (read this first)

The files in `design-reference/` are **design references built in HTML** — a high-fidelity interactive
prototype showing the intended look and behaviour. **They are not production code to copy line-for-line.**

- `SmartHotel.dc.html` — the full interactive prototype. **Both conditions** are in here; switch with
  the `condition` prop (default is Condition 2). Open it in a browser to click through every screen,
  panel, control, the floor map, and the dependency/connection graph. This is the source of truth for
  layout, spacing, colour, type, states, and interactions.
- `SmartHotel UI Spec.html` — a printable spec sheet: information architecture, app frame, colour,
  typography, components, the graph-view feature spec, the rule grammar, and states/motion. Open in a
  browser.
- `support.js` — runtime used only so the `.dc.html` prototype renders in a browser. **Ignore it for
  the build** — it is not part of the app.
- `assets/floor-map.png` — the room floor-plan photo used as the background for the Devices/Graph views.

**Your task:** recreate these designs in the target codebase (see §7 for the recommended stack — the
existing app is React 19 + TypeScript + Vite + Tailwind 4, and you should stay on it) using its
established patterns. Reproduce the visuals **pixel-faithfully** (it's a hi-fi design) while replacing
the old app's visuals entirely.

### Fidelity: **High-fidelity.**
Final colours, typography, spacing, radii, shadows and interactions are all specified. Match them. Exact
tokens are in §10; every value is also live in the prototype.

---

## 3. Tech stack

Stay on the existing stack (it already solves the HA integration):

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS 4** (`@tailwindcss/vite`) for styling
- **lucide-react** for icons (the prototype's line-icons map cleanly to lucide)
- **axios** + native `fetch` for HA REST; native **WebSocket** for HA real-time events
- **home-assistant-js-websocket** is available but the existing hooks use a hand-rolled singleton
  WebSocket — keep that (see `reusable-code/hooks/useDevices.ts`)

**Dependencies you can DROP** (the old app used them for visuals the new design replaces with custom
inline SVG): `konva`, `react-konva`, `vis-network`, `react-force-graph`, `react-force-graph-2d`, and
the MUI packages (`@mui/material`, `@mui/icons-material`, `@emotion/*`) unless you find a residual use.
The new floor map is a `<img>` + absolutely-positioned bubbles; the new graphs are a single inline
`<svg>` of `<line>`s + positioned nodes (see §6.4). No graph library is needed.

`reusable-code/package.json` is the old dependency list for reference.

---

## 4. App shell (shared by both conditions)

A fixed three-zone frame; only the centre content scrolls.

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR · 64px — logo (left)            live clock (right)  │
├──────────┬──────────────────────────────────────────────────┤
│ NAV RAIL │  CONTENT (scrolls)                                │
│  90px    │   ├ page title                                    │
│  dark    │   ├ category filter pills (Room & Devices only)   │
│ Your Room│   └ screen body:                                  │
│ All Dev. │        • flexible stage (left)                    │
│ All Rules│        • fixed 360–380px detail panel (right)     │
└──────────┴──────────────────────────────────────────────────┘
```

- **Canvas:** designed at **1366 × 1024** (tablet landscape, the in-room iPad). Build it responsive but
  optimise for that size.
- **Top bar — 64px:** left = amber logo mark + `SmartHotel` wordmark (Space Grotesk 700, 21px). Right =
  pill with a clock icon + **live time** (`h:mm AM/PM`), refreshing every 10s.
- **Nav rail — 90px, charcoal `#3E3D44`:** three full-width vertical buttons, icon over label
  (10.5px). Active item = cream fill `#F4F1EA` + ink text + amber icon; inactive = muted `#C7C3BB`.
  Items: **Your Room** (home icon), **All Devices** (grid icon), **All Rules** (rules icon).
- **Content padding:** `26px 30px 40px`. **Stage/panel gap:** 24px. Only this zone scrolls; bar + rail
  are fixed.
- **Page title:** Space Grotesk 600, 30px, letter-spacing −0.6px.
- **Category filter pills** (shown on **Your Room** and **All Devices** only): `All · Lights ·
  Appliances · Media · Sensors`. `All` is the cleared state; the others are multi-select toggles.
  Selected pill gains a check glyph + warm fill (`#F6E6C9` bg / `#9A6A1E` text / `#EAD3A4` border);
  unselected = white bg / `#6F6A60` text / `#E7E1D5` border. The filter applies to the room
  cards/map/graph **and** to the All Devices table (it dims/excludes non-matching items).

---

## 5. Screens

### 5.1 Your Room — Condition 1 (Cards only)

- Stage shows **grouped panels**, 2-column grid, in this order: **Lights**, **Appliances**, **TV &
  Media**, **Sensors**. Lights and Appliances panels span full width (`grid-column: 1 / -1`); a group
  with a single remaining category also spans full width.
- Each panel: white card, `#ECE6D9` border, 20px radius, soft shadow; header row = round icon chip +
  group name (Space Grotesk 600, 16px) + device count (e.g. "5 devices").
- Inside a panel, each device is a centred tile (≈126px wide): a **live control** on top, the device
  name (bold 13px) below, then a status line (11.5px muted). Control archetypes:
  - **Lights** → circular **arc dial** (drag the arc = brightness 0–100; tap centre = on/off). Active =
    amber arc + amber centre + glow; off = grey. Status line shows `NN%` or `Off`.
  - **Heater** → arc dial showing target °C in the centre (range 15–28°C, 0.5° steps).
  - **Curtain** → horizontal bar slider; **Roller Shutter** → vertical bar slider. Both report `NN%
    open`, amber fill.
  - **Fan / TV / sockets** (toggles) → rounded square tile, amber when on.
  - **Sensors** → read-only circular badge with a teal ring + animated "sense" pulse; status line shows
    the reading (e.g. `Closed`, `Presence`, `23°C · 63.5%`) or last-activity time.
- No floor map, no graph, no view-switcher in this condition.
- Tapping a device still opens the right-hand **device-detail panel** (§5.4).

### 5.2 Your Room — Condition 2 (Devices + Graph)

- A vertical **view-switcher** (172px column on the left of the stage) with three options:
  **Devices**, **Dependencies**, **Connections**. Active item = white chip + amber border + shadow;
  inactive = flat `#F0EBDF`.
- The stage to its right is a **square (`aspect-ratio: 1/1`, max 700px)** panel containing the
  floor-plan photo (`assets/floor-map.png`) with a warm darkening scrim + vignette so overlays pop.
- **Devices view:** every device is a circular **bubble** positioned at its real floor-plan coordinates
  (`x`,`y` as percentages — see device table §9). Toggle devices glow amber when on; sensors show the
  teal ring + pulse; a selected bubble gets a 3px amber ring and pins its name label. Sockets render as
  smaller secondary bubbles. Tap → device-detail panel.
- **Dependencies view:** same bubbles + the **automation network**. Each rule is a "gear" node placed
  at the centroid of the devices it touches. **Sensors → gear** = dashed lines; **gear → controlled
  device** = solid amber arrow. Tapping a gear enters *trace mode* (only that rule's sensors +
  controlled devices stay lit, everything else dims to ~28%) and opens the rule-detail panel. Tapping a
  device highlights the rules wired to it and the other devices those rules touch. Re-tapping the active
  gear clears trace mode.
- **Connections view:** every device draws a live spoke to a central dark **room hub** node — a simple
  "what's paired / online" topology read.
- Power links: sockets that power a device (`fan socket → fan`, `tv socket → tv`) draw an extra
  dependency/connection edge.

### 5.3 All Devices (both conditions)

- Full-width white card; a table with columns **Device · Category · State · Last activity · ⌄**.
- Row = round avatar + icon, name, category, a **state pill** (amber-tinted when on/open, neutral
  otherwise), last-activity time, chevron. Selected row = warm tint `#FBF4E6`.
- Honours the category filter pills. Selecting a row opens the device-detail panel.

### 5.4 Device-detail panel (right, 360px)

White card, header (category eyebrow + device name + close ✕). Body:
- For a **toggle** device: a status row with a big amber switch.
- For a **slider** device: a Position row with `%` and a range slider (amber fill).
- **Parameters** list: State, Last activity, Category, and Battery (with low-battery red `#C0552F` when
  ≤20%) where the device reports one.
- **Attached Rules:** tappable rows for each automation the device participates in → opens the
  rule-detail panel (jumps to All Rules / graph trace as appropriate). "No rules attached." when empty.

### 5.5 All Rules (both conditions) + Rule-detail panel (right, 380px)

- Table: **Rule name · Status · Last run · ⌄**. Status dot + `Enabled`/`Disabled` pill (green when
  enabled). Selecting a row opens the rule-detail panel.
- Rule-detail renders the automation as a **three-part stacked sentence** (the "rule grammar"):
  - **Triggers** block (amber-tint) — each line prefixed `WHEN`.
  - **Conditions** block (optional, lighter) — each line prefixed `AND`. Time-only rules skip this.
  - A down-arrow, then the **Actions** block (solid amber) — bulleted action lines, or "No actions
    configured yet." when empty.
  - A **Summary** (plain-language) + last-triggered timestamp.
- The 9 study rules, their triggers/conditions/actions/summaries and `enabled` flags are in the
  prototype's `rules` array and fully specified in `data/ha_study_automations.yaml`.

---

## 6. Interactions & behaviour

1. **Live clock** — top-bar time refreshes every 10s. On any control action, that device's
   "last activity" stamp becomes "just now".
2. **Optimistic control** — toggles/sliders/dials update local state immediately, then fire the HA
   service call; revert on failure. (See the old `BaselineUI` handlers and §8.4 for the exact endpoints
   and the optimistic+revert pattern to reuse.)
3. **Selection** — selecting a device or rule opens the right panel; selecting another swaps it; ✕
   closes it. 3px amber ring on bubbles, amber border + lift on cards, warm row tint in tables.
4. **Graph trace mode** (Condition 2, Dependencies) — tap a gear → isolate that rule; tap a device →
   highlight its rules; re-tap active gear → clear. Dimmed elements go to opacity ~0.28.
5. **Category filter** — dims/excludes non-matching devices across room views and the All Devices
   table while keeping the spatial map intact.
6. **Transitions** — 0.12–0.2s ease on colour, shadow, transform. Sensor "sense" pulse is a 2.6s
   ease-out ring animation (`@keyframes`).
7. **Activity recording** runs the whole time (see §8.3).

---

## 7. Project setup & condition selection

Start from a fresh Vite React-TS app (or keep the old project shell and gut `src/`):

```bash
npm create vite@latest smart-hotel -- --template react-ts
# add: tailwindcss @tailwindcss/vite lucide-react axios home-assistant-js-websocket
```

- Copy `reusable-code/vite.config.ts` — it proxies `/api` → `http://localhost:8123` (HA) and sets
  `server.host = true` so the tablet can reach the dev server over the LAN.
- Copy `reusable-code/config.ts` for `TOKEN` and `RECORDER_PASSWORD` (see §8.1 — **rotate the token**).
- Tailwind 4 via the Vite plugin; global resets + the two `@keyframes` (sense pulse) + fonts in
  `index.css`. Fonts: **Manrope** (body/UI) and **Space Grotesk** (titles/brand/numerals), plus
  **JetBrains Mono** if you reproduce the spec sheet. Load from Google Fonts.

**Condition selection** — expose it as a single source of truth so a session is locked to one condition:

```tsx
// e.g. read from URL (?condition=1) or VITE_CONDITION env, default to 1
const condition = new URLSearchParams(location.search).get("condition") === "2" ? 2 : 1;
```

The deploy setup builds **one bundle per condition** if you prefer (the old `baseline.containerfile`
pattern); a URL param is simplest for a within-subjects study. Confirm the study design (between- vs
within-subjects) with the researcher before locking this in.

### Production / on-tablet deploy
`reusable-code/deploy/` has the old nginx container setup: an nginx image serving the built `dist/`
and proxying `~/api` to the HA box (`192.168.178.28:8123` on the lab LAN). Reuse it — just point the
`proxy_pass` at the correct HA IP and rebuild. The tablet opens the nginx host in a browser/kiosk.

---

## 8. Reusable code (lift these — they already work)

All in `reusable-code/`. These solve the HA integration and the study logging; do not rewrite them.

### 8.1 `config.ts` — credentials
- `TOKEN` — a long-lived HA access token (bearer) used by every request.
- `RECORDER_PASSWORD` — gate for starting/stopping the activity recorder (currently `"shhub"`).
> ⚠️ **Security:** the committed token is a real, long-lived credential. **Rotate it** and prefer a
> `.env` (`VITE_HA_TOKEN`) over committing it. It is fine for the lab but should not leak.

### 8.2 Data layer — `hooks/`
- **`useDevices.ts`** (the core):
  - A **singleton WebSocket** to `ws://localhost:8123/api/websocket` that authenticates with `TOKEN`
    and subscribes to `state_changed`, `call_service`, `automation_triggered`.
  - `useDevices()` → live array of room devices. Initial load via `GET /api/states`, then patched in
    real time from `state_changed`. Filtering is done by **`shouldIncludeDevice(entityId, friendlyName)`**
    — a curated allow/deny regex that keeps the ~16 room devices and drops the ~120 noise entities
    (batteries, voltages, diagnostics). Reuse this verbatim; it is the bridge between HA's 135 entities
    and the design's device list.
  - `useLogbook(entityIds)` → recent activity per entity (polls `/api/logbook`).
  - `mapDevicesToAutomations()`, `fetchAutomationsViaWS()`, `getAutomationsForDevice()`,
    `getAutomationCount()` → resolve which automations reference which devices (powers "Attached Rules"
    and the dependency graph).
- **`useAutomation.ts`**:
  - `useAutomationsEXP()` → the **9 study rules** (`automation.exp_*`). This is the rule set the
    All Rules screen and the Dependencies graph render.
  - `useAutomationsPS()` → the button automations (`automation.ps_*`).
  - `useLogbook(...)` → last-run timestamps for rules.
  - `useAutomationConfigs()` → full rule configs via WebSocket (triggers/conditions/actions).
- **`sendNewAutomationToHomeAssistant.ts`** — `sendAutomationToHA()` POSTs a new automation config
  (`POST /api/config/automation/config/<id>`). Only needed if you keep rule-creation; the note says
  "No new rules yet, maybe later", so this can stay dormant.
- **`AutomationMapper.tsx`** — the `HAAutomation` type + simple↔HA automation mapping helpers.
- **`logbookCacheProvider.tsx`** — a context that prefetches 24h of logbook for a fixed entity list.
  Wrap the app in `<LogbookCacheProvider>` (as the old `main.tsx` did) only if you surface logbook
  history; otherwise optional.
- **`useWeatherData.ts`** — `weather.forecast_home` temp/condition. Optional (the new design has no
  weather card unless you add one — don't add it without asking).

### 8.3 `RecordActivity.tsx` — the study interaction logger (KEY DELIVERABLE)
This satisfies the study's logging requirement (`note.txt`: *"Have a recording of where the
participants clicked and how they navigate the UI… enabled/disabled through a click… exported to a
directory for later analysis"*). It is a floating panel that:
- **Password-gates** Start/Stop (uses `RECORDER_PASSWORD`).
- On Start, attaches global capture-phase listeners for `mousedown`, `keydown`, `scroll`, `input`,
  `change`, `submit` and timestamps every event with a rich **element label + parent context +
  breadcrumb path** (so a click reads as e.g. *"Toggle · Floor Lamp · Lights panel"* rather than a bare
  tag). It even maps floor-map canvas clicks to device shapes.
- Privacy: skips password/email/search inputs and its own UI.
- **Export** downloads the whole session as timestamped JSON (`user-activity-log-<ISO>.json`); Clear
  resets.

**Reuse it as-is**, but update two things for the new design:
1. The recorder skips its own clicks via a `[data-recorder-component]` wrapper and some text matching —
   keep the `data-recorder-component` attribute on the panel.
2. Its `shapeData` array maps **old Konva floor-map pixel coordinates** to device labels. The new floor
   map is an `<img>` with **percentage-positioned DOM bubbles**, so canvas-coordinate matching no longer
   applies — instead, ensure each interactive element carries a stable label (an `aria-label` or
   `data-device-id`) so the existing label/parent-context logic captures the device cleanly. Drop or
   rewrite the `matchShapeData`/canvas branch accordingly.

Mount it once in the shell (top-right), in **both** conditions.

### 8.4 HA service-call patterns (reuse these endpoints)
From the old `BaselineUI.tsx`, the working control calls (all `POST /api/services/...` with the bearer
token, plus optimistic local update + revert on failure):
- **Light on/off:** `light/turn_on` · `light/turn_off`, body `{ entity_id: "light.<id>" }`
- **Brightness:** `light/turn_on`, body `{ entity_id, brightness: 0–255 }` (UI 0–100 → ×2.55)
- **Light colour:** `light/turn_on`, body `{ entity_id, rgb_color: [r,g,b] }`
- **Cover position:** `cover/set_cover_position`, body `{ entity_id, position: 0–100 }`
- **Heater target:** `climate/set_temperature`, body `{ entity_id: "climate.heater", temperature }`
- **Socket/switch:** `switch/turn_on` · `switch/turn_off`, body `{ entity_id: "switch.<id>" }`
- **Read a state:** `GET /api/states/<entity_id>` (used to poll positions/levels every ~2s as a fallback
  to the WebSocket).
- **TV:** status is read-only via `binary_sensor.tv_status`; actual TV control in the lab goes through
  Fire-TV scripts (`script.tv_on`, `script.tv_off`, `script.tv_volup`, …) — only wire these if the
  study tasks require controlling the TV.

---

## 9. Device map — design IDs → real HA entities

The prototype uses friendly device IDs; a few differ from the live HA entity IDs. **Reconcile to the
right column** (verified against `data/ha_devices_with_automations.yaml`). `x`/`y` are floor-map
positions in % (used by Condition 2). Battery values come from the matching `sensor.*_battery` entity.

| Design id | Name | Category | Control type | **Real HA entity** | x,y % | Battery src |
|---|---|---|---|---|---|---|
| `wld` | Door Light | Lights | toggle+brightness | `light.doorlight` | 11,75 | — |
| `wlw` | Window Light | Lights | toggle+brightness | `light.windowlight` | 43,9 | — |
| `bll` | Bedlight L | Lights | toggle+brightness | `light.bedlight_l` | 84,28 | — |
| `blr` | Bedlight R | Lights | toggle+brightness | `light.bedlight_r` | 85,59 | — |
| `flr` | Floor Lamp | Lights | toggle+brightness | `light.floorlamp` | 17,27 | — |
| `cur` | Curtain | Appliances | slider (position) | **`cover.0x54ef441000c939e0`** (design says `cover.curtain`) | 72,12 | `sensor.0x54ef441000c939e0_battery` (66%) |
| `rsh` | Roller Shutter | Appliances | slider (position) | `cover.rollo` | 25,8 | `sensor.rollerblind_0004_battery` (86%) |
| `fan` | SmartFan | Appliances | toggle | `fan.smartfan` | 84,15 | — |
| `fansock` | Fan Socket | Appliances | toggle | **`switch.socket_fan`** (design says `switch.fan_socket`) | 88,9 | — |
| `htr` | Heater | Appliances | toggle + target °C | `climate.heater` (target 21.5°, current 22°) | 6,42 | `sensor.heater_battery` (81%) |
| `tv` | TV | Media | toggle (status) | `binary_sensor.tv_status` (control via Fire-TV scripts) | 15,52 | — |
| `tvsock` | TV Socket | Media | toggle | **`switch.socket_tv`** (design says `switch.tv_socket`) | 7,47 | — |
| `pres` | Presence Sensor | Sensors | read-only | `binary_sensor.presencesensor_presence` | 72,38 | — |
| `door` | Door Contact | Sensors | read-only | `binary_sensor.sensor_door_contact` | 13,91 | `sensor.sensor_door_battery` (100%) |
| `win` | Window Contact | Sensors | read-only | `binary_sensor.sensor_window_contact` | 33,7 | `sensor.sensor_window_battery` (100%) |
| `th` | Temp / Humidity | Sensors | read-only | `sensor.temp_humid_temperature` + `sensor.temp_humid_humidity` | 13,5 | `sensor.temp_humid_battery` (100%) |

> The old `BaselineUI` also showed a bedlight socket (`switch.socket_bedlightl`); it is not in the new
> design. Add only if the researcher asks.

The 9 study automations (`automation.exp_*`) and exactly which devices each references are in
`data/ha_study_automations.yaml` (human-readable `*_summary` fields + full `raw_config`). The
prototype's `ruleLinks` map encodes the source/destination devices per rule for the graph.

---

## 10. Design tokens

**Colour**
- Amber / active: `#E0992F` · amber hover `#E7A53A` · amber deep text `#5C3F12` / `#2A2008`
- Charcoal rail: `#3E3D44` · darker hub/cover `#24242A` / `#2A2A30` · ink text `#25242A`
- Surfaces: app bg `#DCD6CA` · panel `#F4F1EA` · card `#FFFFFF` · warm chip `#ECE6D9` · selected row
  `#FBF4E6`
- Neutrals (text): `#57534B` · `#6F6A60` · `#8A857A` · `#9A958C` · `#A39E93` · borders `#ECE6D9` /
  `#E5DFD2`
- Sensor dots: nominal/safe `#5BAE7A` · teal sensor ring `rgba(47,158,150,…)` · attention `#E0992F` ·
  idle `#9A958C`
- Status: rule enabled `#2E7D52` on `#E3F1E8`; battery low `#C0552F`
- Warm rule blocks: trigger `#FBF1DE`/`#F2E3C4` · condition `#FBF6EC`/`#F0E4CC` · action solid `#E0992F`

**Type**
- **Space Grotesk** — titles, brand, numerals (600/700). Page title 30/600 (−0.6px); brand 21/700;
  panel heads 16–18/600.
- **Manrope** — body & UI (400/600/700). Body 15/400; labels & controls 13.5/600; eyebrow 11.5/700
  uppercase +0.4px.
- **JetBrains Mono** — mono captions on the spec sheet only.

**Radii:** bubbles 50% · cards 16px · panels 18px · pills 999px · chips 9–13px.
**Shadows:** cards `0 2px 8px rgba(40,38,32,.05)`; panels `0 10px 30px rgba(40,38,32,.10)`; active amber
glow `0 0 22px rgba(224,153,47,.55)`.
**Transitions:** 0.12–0.2s ease on colour/shadow/transform.

> Every token above is also live in `SmartHotel.dc.html` / `SmartHotel UI Spec.html` — when in doubt,
> read the value off the prototype.

**Icons:** lucide-react. The prototype draws its own line icons (bulb, floor-lamp, fan, tv, curtains,
shutter, thermometer, motion, door, window, plug, radiator/heater, home/grid/rules, gear, clock,
check, chevron, close, arrow-down) — map each to the nearest lucide icon. Old PNG/SVG device art lives
in `experiment-ui/.../src/images/` if you want raster device art instead, but the new design uses line
icons.

---

## 11. Assets

- `design-reference/assets/floor-map.png` — floor-plan photo (background for Condition 2 views).
- `data/ha_devices_with_automations.yaml` — all 135 HA entities, live states, study involvement.
- `data/ha_study_automations.yaml` — the 9 study automations with readable + raw configs.
- (Optional) old device/furniture art + floor-map vector JSON in
  `experiment-ui/home-assistance-ui/src/images/` and `src/assets/` if you prefer raster art or want the
  original device coordinates.

---

## 12. Files in this bundle

```
design_handoff_smarthotel/
├─ README.md                              ← this document
├─ design-reference/
│  ├─ SmartHotel.dc.html                  ← interactive prototype, BOTH conditions
│  ├─ SmartHotel UI Spec.html             ← printable spec sheet
│  ├─ support.js                          ← prototype runtime (ignore for the build)
│  └─ assets/floor-map.png
├─ reusable-code/                         ← lift these from the old app (they work)
│  ├─ config.ts                           ← TOKEN + RECORDER_PASSWORD (rotate token!)
│  ├─ vite.config.ts                      ← /api proxy → HA, host:true
│  ├─ package.json                        ← old dependency list (reference)
│  ├─ AutomationMapper.tsx                ← HAAutomation type + mappers
│  ├─ RecordActivity.tsx                  ← study interaction logger
│  ├─ hooks/
│  │  ├─ useDevices.ts                    ← HA WS singleton + device/logbook hooks + filter
│  │  ├─ useAutomation.ts                 ← exp/ps rule hooks + configs
│  │  ├─ sendNewAutomationToHomeAssistant.ts
│  │  ├─ logbookCacheProvider.tsx
│  │  └─ useWeatherData.ts
│  └─ deploy/
│     ├─ nginx.conf                       ← serves dist/, proxies /api → HA box
│     └─ baseline.containerfile           ← nginx container
└─ data/
   ├─ ha_devices_with_automations.yaml
   └─ ha_study_automations.yaml
```

---

## 13. Build order (suggested)

1. Scaffold Vite + React-TS + Tailwind 4; drop in `vite.config.ts` and `config.ts` (move token to
   `.env`). Add fonts + global resets + the sense-pulse keyframes.
2. Build the **shell**: top bar (live clock), nav rail, content frame, category-filter pills. Add a
   `condition` source of truth (§7).
3. Wire the **data layer**: copy the `hooks/` and confirm `useDevices()` returns the 16 room devices
   against the live HA box. Reconcile entity IDs per §9.
4. Build **All Devices** (table + device-detail panel) and **All Rules** (table + rule-detail panel) —
   shared by both conditions; gets you full data coverage early.
5. Build **Your Room — Condition 1** (grouped card panels + the dial/slider/toggle/sensor controls).
6. Build **Your Room — Condition 2** (floor-map bubbles, then the Dependencies + Connections SVG graph
   and trace mode).
7. Drop in **`RecordActivity.tsx`**; adapt its element-labelling to the new DOM (§8.3) and verify the
   exported JSON captures device-level clicks.
8. Match tokens against the prototype; QA at 1366×1024 on the actual tablet; wire the nginx/container
   deploy and point `proxy_pass` at the HA box.

---

*Built from the SmartHotel prototype (`SmartHotel.dc.html`) and the existing `home-assistance-ui`
React app. The prototype and spec sheet are the visual source of truth; the reusable code is the
working HA/logging/deploy plumbing to build on.*
