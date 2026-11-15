# SmartHomeShop.io Integration for Home Assistant

[![HACS Default](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/default/pull/9476)

Custom integration for Home Assistant to integrate SmartHomeShop.io devices.

## Installation

### HACS (Recommended)

SmartHomeShop.io is included in the default HACS store. You no longer need to
add this repository as a custom repository.

1. Open **HACS** in Home Assistant.
2. Search for **SmartHomeShop.io**.
3. Open the integration and click **Download**.
4. Restart Home Assistant.
5. Go to **Settings > Devices & services > Add integration** and search for
   **SmartHomeShop.io**.

You can also use this button to open the repository directly in HACS:

[![Open your Home Assistant instance and open the SmartHomeShop.io repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=smarthomeshop&repository=home-assistant-integration&category=integration)

The repository was [approved and merged into the HACS default repository
list](https://github.com/hacs/default/pull/9476) on August 1, 2026.

## See SmartHomeShop.io in action

WaterP1MeterKit, WaterMeterKit and P1MeterKit include purpose-built Lovelace
cards. The Smart Energy panel adds live grid, solar and battery flow, source
mapping, Home Assistant Energy sync, ready-to-use automations and complete home
battery planning. The demo below walks through the cards and the full energy
management experience.

[![Watch the SmartHomeShop.io utility card demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-utility-cards-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-utility-cards-demo.mp4)

[Watch the full-quality demo video](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-utility-cards-demo.mp4)

### WaterFlowKit

[![Watch the SmartHomeShop.io WaterFlowKit demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-waterflowkit-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-waterflowkit-demo.mp4)

### CeilSense

[![Watch the SmartHomeShop.io CeilSense demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-ceilsense-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-ceilsense-demo.mp4)

### UltimateSensor and UltimateSensor Mini

[![Watch the SmartHomeShop.io UltimateSensor demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-ultimatesensor-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-ultimatesensor-demo.mp4)

### Manual Installation

1. Download the latest release
2. Copy the `custom_components/smarthomeshop` folder to your Home Assistant `custom_components` directory
3. Restart Home Assistant

## Configuration

1. Go to **Settings** > **Devices & Services**
2. Click **Add Integration**
3. Search for "SmartHomeShop.io"
4. Follow the configuration steps

## Migration notes

### Water in HA Energy

- When the Energy sync moves the water source to **Water Total
  Consumption** (`water_total_consumption`), Home Assistant creates a new
  cost entity for it and leaves the old
  `sensor.<device>_water_meter_total_cost` behind as unavailable. Nothing
  uses it any more: remove it under **Settings > Devices & services >
  Entities** by searching for `water_meter_total_cost`, opening it and
  choosing **Delete**.
- Water Total Consumption counts the pulses measured since the kit last
  started, so it goes back to 0 after a restart or firmware update. That is
  on purpose: Home Assistant treats the drop as the start of a new meter
  cycle and keeps counting. Water Meter Total is the calibrated meter
  reading, which jumps when you enter the reading of your water meter, so
  Energy does not use it. The name cannot change: the firmware sensor name
  sets the entity ID, and renaming it would break existing entity IDs,
  dashboards and statistics.
- Use Water Total Consumption as the water source in HA Energy; the Energy
  sync selects it for you. The **Usage (CC)** sensors start again every day,
  week, month or year and report when that happened (`last_reset`), so their
  own statistics count each new period instead of a drop.

### Water usage units

**Usage today (CC)**, **Usage this week (CC)**, **Usage this month (CC)** and
**Usage this year (CC)** have the water device class, so you can pick a
display unit for each in its entity settings. New installations show all four
in litres. Existing installations keep their current units (this year in m³)
until you change them, so dashboards, automations and long-term statistics
keep their numbers.

These four sensors, **Water cost today (CC)** and the P1 sensors **Energy used
today (CC)**, **Energy cost today (CC)** and **Energy cost this month (CC)**
report the start of their period. The first hour after updating, the long-term
statistics of these sensors can show a single step, because Home Assistant
then starts counting from the reported period start.

### Rooms and radars (1.17)

- The first start of 1.17 upgrades the room storage. A copy of the old data is
  kept in `.storage/smarthomeshop.rooms.backup_1_1`. Version 1.16 can still
  read the upgraded file if you need to go back.
- A room with one damaged field is no longer hidden. Only the broken part (for
  example one zone with invalid points) is removed, the room and its entities
  stay, and **Settings > Repairs** lists the room. The original is kept until
  you confirm there.
- Earlier versions allowed one radar in two rooms. A radar cannot tell which of
  those rooms it sees, so both rooms report presence as unknown and Repairs
  names the radar and the rooms. Unlink it from all but one room in the
  Floorplan Designer. Until then, saving other changes keeps working.
- ESPHome radars without SmartHomeShop firmware metadata stay selectable as long
  as they expose target X and Y sensors.

### Homes without gas

Without a gas meter, **Gas consumption (CC)** is unavailable and no gas
helpers are created. **Gas Daily/Weekly/Monthly/Yearly (CC)** helpers made by
earlier versions can be deleted under **Settings > Devices & services >
Helpers**. They are created again automatically once the meter reports gas.

## Languages

SmartHomeShop.io automatically follows the language selected by the current
Home Assistant user, including regional variants such as `nl-NL`, `de-DE` and
`fr-FR`. The integration setup, entity and service descriptions, SmartHomeShop
panel, Floorplan Designer, Smart Energy pages, Lovelace cards and card editors are
fully available in:

- English
- Dutch
- German
- French
- Spanish

If Home Assistant uses another language, the interface falls back to English.

## Dynamic energy and battery planning

The Energy page combines live contract prices with an hourly outlook. Stored
market prices are treated as confirmed; missing future hours can be supplied
as predictions with a confidence score and conservative lower/upper bounds.

The home battery planner is **advice only by default** and offers three clear
execution modes: advice, simulation/shadow mode and guarded automatic
execution. Configure it from the Energy page with:

- the battery state-of-charge sensor, usable capacity and protected reserve;
- maximum charge/discharge power and round-trip efficiency;
- optional solar and house-load forecast sensors;
- battery wear cost, grid import/export limits and a minimum confidence level.
- an optional live P1 grid/fuse guard with a safety margin and stale-data
  fail-safe;
- optional capacity-tariff peak protection using configurable tariff tiers;
- local self-learning for usable capacity, efficiency, observed power and the
  normal hourly house-load profile.

It exposes a recommendation, target power, target state of charge, expected
plan savings and confidence as Home Assistant entities. Charge and discharge
recommendations are also available as binary sensors for your own automations.
The Energy page includes an explainable local decision journal showing what
was advised, simulated, applied, limited or blocked and why. Learning samples
and journal entries remain in Home Assistant.

Automatic execution is opt-in. It supports a grid-charge switch, a signed
battery-power number entity or a battery-mode select. Every command is checked
again against the fresh live grid measurement immediately before it is sent;
number controls can be reduced to the safe power, while switches and selects
fall back to hold when they cannot express a limited value. Keep automatic
execution disabled until the simulated actions and configured limits have been
verified for your specific inverter or battery system.

In automatic mode the current recommendation can also be applied manually or
from an automation:

```yaml
action: smarthomeshop.apply_battery_recommendation
data: {}
```

Use `action: charge`, `hold` or `discharge` in `data` only when deliberately
overriding the current recommendation. Advice and simulation modes never write
to battery hardware; the same service call is recorded in the decision journal
instead.

### Smart Loads

The Energy settings include a native **Smart Loads** planner for flexible
household devices such as a washing machine, dishwasher, heat pump, boiler,
pool pump, relay or custom Home Assistant action. It plans every load around a
ready-by time using the same quarter-hour price, solar, battery, EV and grid-
capacity picture as the rest of Smart Energy.

Each load can use existing Home Assistant entities for control, readiness,
running state, power, energy, door state and remote-start permission. Weekday
deadlines, an optional earliest start, price/solar preference and interruptible
operation are configurable per load. Completed runs remain local and teach the
planner the measured duration and peak power after enough successful samples.
The configured duration remains the safety minimum; learning can lengthen a
plan but never shorten it from a few noisy measurements.
The Planning and Runs views explain the selected periods, expected cost, solar
use, savings, live state and every meaningful control decision.

Automatic execution is opt-in. Start with **Advice only**, verify the proposed
times, continue with **Shadow mode**, and only then enable **Automatic**. A new
start always requires live feedback plus fresh P1 import and phase-headroom
data; this protection cannot be disabled. Smart Loads records ownership before starting and
only stops controls it started itself. External/manual starts are observed but
never claimed. Non-interruptible cycles are allowed to finish; interruptible
loads retain their completed runtime between planned periods and can pause when
the live safety limit changes. A completed **Run now** request is latched until
the user selects a new mode, preventing accidental restart loops. Failed
start/stop feedback is shown as a visible problem instead of being assumed
successful; an uncertain non-interruptible start is never stopped automatically.

Smart Loads, Smart EV and the battery planner exchange both planned demand and
freshly dispatched power that may not yet be visible in P1, so the same live
headroom cannot be promised twice. The live P1 guard is checked again after
ownership is saved and immediately before the hardware command. A two-minute
polling tolerance can finish a cycle seconds after its requested time only when
it starts immediately; it never schedules an intentionally late cycle.
Existing device-page deadline schedules stay available, but none of a load's
start, stop, control or custom-action entities can simultaneously be used by an
enabled legacy schedule and automatic Smart Loads. Disable the old schedule
before migrating that device.

### Smart EV charging

The Energy settings also include a native **Smart EV** planner. It works with
existing Home Assistant vehicle and charger entities, so it is not tied to one
car or wallbox brand. Every configured vehicle can use:

- a daily or weekday-specific ready-by time and target state of charge;
- an optional Home Assistant calendar event as the next departure deadline;
- live dynamic prices, the solar forecast, expected household load and the
  home-battery plan in one charging decision;
- a protected minimum charge level, price-first/solar-first/balanced planning,
  a continuous-session preference and shared-charger scheduling for multiple
  cars;
- advice, simulation/shadow and guarded automatic execution modes;
- a live P1 import and main-fuse guard, charger-state verification, immediate
  rollback of an unconfirmed new start, plus a verified stop before one fresh
  start attempt after a failed owned adjustment
  to an already confirmed session;
- one shared live power budget across every configured car and planned home-
  battery charge, including phase-aware main-fuse headroom;
- local learning of real charging power and charge speed, plus an explainable
  decision journal.

Automatic execution is opt-in. Start with **Advice only**, verify the proposed
windows, continue with **Simulation / shadow mode**, and only then select
**Automatic execution**. Missing or stale safety measurements stop an automatic
charge command instead of estimating available grid capacity. Smart EV exposes
a plan sensor plus charging-plan and problem binary sensors for each vehicle.
Guarded automatic mode also requires a live charging-power entity for every
enabled vehicle. That feedback lets the shared P1 budget distinguish existing
EV load from new load and reduce safely during a real overload without making
an active charger oscillate on and off. A separate start hysteresis and a
five-minute safety-stop cooldown prevent rapid relay chatter when available
headroom fluctuates around the charger's minimum usable power.
When the remaining safe price horizon is shorter than the time needed to reach
the target, Smart EV still uses every allowed slot and reports the plan as
partial instead of discarding useful charging time.
Select the number of phases the connected vehicle actually uses while charging,
not only the wallbox capability, before enabling automatic execution. An
incorrect 1-phase/3-phase setting makes the calculated current and main-fuse
headroom unsafe. Smart EV observes externally started sessions, but
never claims or stops them; only a session it started and recorded itself is
eligible for automatic stopping.
If a user turns an owned charger off outside Smart EV, that manual stop is
stored and automatic restart remains paused across Home Assistant restarts.
Unplugging the car or explicitly changing its mode or charger configuration
clears that pause. A charger that confirms a lower current while its measured
power stays unsafe is stopped and placed in a visible safety lockout instead
of entering a stop/start loop.
When home-battery support is disabled and an owned EV session makes an
autonomous home battery discharge, Smart EV stops once and keeps a visible
lockout. It does not restart every five minutes; unplugging the car or an
explicit mode/configuration change clears the pause.
For a charger controlled by a current-number entity, configure a separate stop
switch whenever that number cannot accept a real `0 A` value. Automatic mode
will refuse to start such a charger until a verified stop route exists.
When a new start is not confirmed, Smart EV sends a verified stop and waits
five minutes before considering the same start again. If an adjustment to an
already confirmed owned session fails, Smart EV first stops that session
safely. It may then make one fresh start attempt after checking the live safety
conditions and stop route again. Safety reductions and confirmed stop routes
remain available during that wait.
If a number entity loses its real `0 A` capability during an owned session,
Smart EV can still reduce it to the live minimum but keeps ownership until a
complete stop is confirmed. Configure a separate stop switch to restore a
verifiable full stop route.
Home Assistant's stop event also releases every Smart EV-owned charger while
normal entity services are still available. If a stop cannot be confirmed,
ownership remains stored so the next startup can retry safely.

## Floorplan Designer and Live Home

The **Floorplan Designer** replaces Room Designer and the Live Home page of
earlier versions. It is one 2D/3D editor for the whole home: draw or import
rooms, place them on floors, add doors, windows, mirrors and furniture, and
link each UltimateSensor, UltimateSensor Mini, CeilSense or WallSense radar.
Administrators edit; other users see the live view of the saved plan.

- LD2450, LD2460 and LD6002B targets appear at their measured position.
- Presence-only radars such as LD2412 are shown honestly at room level instead
  of displaying a made-up coordinate.
- Unavailable and `NaN` target slots disappear immediately.
- Room exclusion polygons also suppress reflected targets in the live view.
- Rooms can be hidden from the live view without deleting them.
- **Radar settings** on a selected sensor opens the hardware settings,
  calibration, sensor fusion and Z mapping of that radar.

Open **SmartHomeShop.io > Floorplan Designer** to get started.

The live view is also available as a normal Lovelace card (**Live Home**)
through the card picker, or in YAML:

```yaml
type: custom:smarthomeshop-home-presence-card
title: Live Home
floor: all
view: 3d
height: 430
show_room_names: true
show_empty_rooms: true
show_summary: true
```

Use `floor: 0` (or another floor number) for one floor, or `room_id` for a
single room. `view` is `2d` or `3d`. The visual editor offers the same
choices.

### Multiple sensors in one room

The Floorplan Designer can place multiple CeilSense, UltimateSensor and
UltimateSensor Mini devices in the same room. Every source keeps its own stable identity,
physical position, orientation, radar capabilities and live diagnostics.

- **Combined presence** becomes occupied when any selected source reports a
  positive signal. It only becomes clear when every selected source is
  available, reports clear and the configured clear delay has passed. An
  unavailable or missing source produces an unknown/degraded result instead
  of a false clear. Steady ESPHome values remain valid while Home Assistant
  still reports the entity as available.
- **Room temperature, humidity and CO2** can independently use the average of
  available readings, one selected primary sensor, or remain separate. The
  original device entities always remain available.
- Home Assistant creates stable room occupancy, room temperature, room
  humidity and room CO2 entities for dashboards and automations.
- Positioning tracks stay bound to their source and local track ID. The new
  room-wide 3D layer can retain one stable room-track identity while a person
  crosses from one calibrated radar range into another.
- Cross-radar fusion is experimental and disabled by default. A built-in walk
  test verifies neighbouring overlap in three well-separated positions. Large
  rooms can be calibrated as a chain (for example A to B first and then B to C), so
  every radar does not need to see the same spot. Moving, rotating, relinking
  or changing the mounting of a sensor invalidates the result immediately.
- Even after alignment, two nearby source tracks are only merged after several
  fresh reports show consistent shared movement. During an ambiguous overlap
  both tracks remain visible and the people count is explicitly unknown. The
  2D and 3D views use the same confirmed room tracks.
- Only real Home Assistant coordinate reports participate; browser polling
  never manufactures a newer timestamp. Missing, `NaN`, unavailable and
  future-dated target slots are removed. A stationary coordinate stays exact
  only while Home Assistant continues to report both its X and Y axes within
  the configured freshness window. If presence remains positive but either
  coordinate stops reporting, the
  person stays visible as position unknown and the count is no longer claimed
  as exact. A short browser-only hold smooths a confirmed handover and is never
  uploaded.
- LD6002B firmware can report a Z axis. Because that axis is not automatically
  a person's height above the floor, it is shown as raw Z by default.
  Installers may explicitly select and confirm a physically tested floor-up or
  sensor-down mapping. The 3D view then draws a measured **target point**, never
  a claimed body height. LD2450 and LD2460 remain honest X/Y tracking sources
  when no Z entity exists.

Configure these choices from the **Floorplan Designer**: select the room, open
**Radar settings**, then use **Room-wide results**.
The clear delay is stored with the room and survives Home Assistant restarts.

## Universal radar support

The Floorplan Designer reads the mounting and coordinate contract published by current
SmartHomeShop ESPHome firmware. It discovers the metadata through Home
Assistant's device and entity registries, so renamed devices and entity-ID
prefixes remain supported.

- LD2450, LD2460 and LD6002B coordinates are normalized to millimetres before
  room geometry is calculated.
- Wall-mounted `forward_xy` and ceiling-mounted `floor_xy` projections are
  handled explicitly.
- LD2412 and PIR entities remain supplementary occupancy sources and are never
  treated as positioning targets.
- A `top_or_side` radar reports a visible mismatch when its hardware mode does
  not suit the mounting profile. Changing that mode always requires explicit
  user confirmation.
- Wall-mounted LD2460 devices expose their radar-stored mounting height and
  downward angle directly in the radar settings. Values are written through Home
  Assistant and only shown as saved after the radar reports them back.
- The LD2460 hardware detection sector is drawn separately from room polygons.
  Distance and left/right angles are debounced and confirmed by the radar
  before another change is sent.
- LD2460 calibration checks the reported side mode, live height and angle, then
  verifies a forward-Y and sideways-X walk. A physically rotated module is
  never hidden with a software X/Y swap.
- Missing or unavailable target slots are removed immediately, so a previous
  coordinate cannot remain visible while the radar applies a setting.
- The device Overview for LD2450, LD2460 and LD6002B includes a live 2D/3D
  diagnostic view with selectable range, a bounded movement trail and the
  radar's physical detection sector. It uses the same registry-discovered
  profile and millimetre coordinate system as the Floorplan Designer.
- The device view shows an explicit installation warning for configurable
  radars until mounting mode, height and angle are confirmed. A Z value is
  shown only when the firmware really supplies one; an X/Y-only target is not
  presented as a measured body height.
- Detection and exclusion polygons use integer millimetres and enforce the
  firmware limit of 20 vertices per polygon.
- Mirrors can be placed on their physical wall. Optional reflection protection
  previews a sensor-specific wedge behind the mirror, filters matching ghost
  targets from the Floorplan Designer and the UltimateSensor room view, and synchronizes
  that wedge to the radar as an exclusion polygon. Each protected mirror uses
  one of the two firmware exclusion slots; synchronization is blocked
  instead of silently replacing or dropping a manual exclusion. Raw diagnostic
  target entities stay unchanged so installers can still troubleshoot radar
  behaviour.
- Existing saved rooms keep their range, field of view, height and projection
  until the user chooses to adopt new firmware defaults.
- Coverage measurement uses near/far and left/right from the radar's own
  viewpoint. "Measure again" starts with four fresh points without deleting the
  saved area until Save is pressed. Moving or rotating the sensor placement
  keeps that measured coverage attached to the sensor.
- Polygon services are matched through the Home Assistant device registry, so
  ESPHome node suffixes such as `_a2799c` are retained and zones cannot be sent
  to another similarly named sensor.
- Older firmware continues to work through a clearly identified legacy
  profile; diagnostics list the metadata needed for a firmware upgrade.

The shared firmware contract lives in the
[radar-mounting repository](https://github.com/smarthomeshop/radar-mounting).

## Support

- [Documentation](https://docs.smarthomeshop.io)
- [Issue Tracker](https://github.com/smarthomeshop/home-assistant-integration/issues)

## License

Copyright (c) 2025-2026 SmartHomeShop.io.

The integration source code is licensed under the
[GNU Affero General Public License v3.0](LICENSE). Modified versions and
network-accessible derivatives must remain available under the AGPL.

The SmartHomeShop.io name, logos, product names and brand assets are not
licensed under the AGPL. See [TRADEMARKS.md](TRADEMARKS.md). A separate
commercial license is available for organizations that want to incorporate
this software without the AGPL obligations; contact info@smarthomeshop.io.
