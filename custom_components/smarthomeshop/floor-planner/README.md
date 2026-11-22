# Floor planner

The 2D/3D floor planner behind the Room Designer, Live Home and the Live Home
card. This folder is its source; Home Assistant serves the build in
`../www/floor-planner`.

## Layout

- `src/js`, `src/css`: the planner itself. Plain ES modules with no Home
  Assistant code in them: drawing, the 3D model, radar coverage, the walk
  test, imports, the coverage map.
  - `floor-planner-pdf.mjs` turns a page of an uploaded PDF into the image
    under the plan. It is the only module that uses pdf.js (`pdfjs-dist`), and
    the planner only loads it once somebody picks a PDF.
  - `floor-planner-underlay.mjs` holds the uploaded image under the plan.
    After an upload the planner asks which part of the image to use, so one
    floor can be kept from a sheet that shows more. The part is cut from the
    original image, or drawn again from the PDF, so it stays sharp.
  - `floor-planner-sight.mjs` decides what a radar can see: walls stop it, an
    open door lets it through up to the door frame, and a closed door is a
    wall until a test person stands at it. Detection, the coverage map and
    the drawn ranges all use it.
  - `floor-planner-trace.mjs` finds the rooms on an uploaded floor plan
    from its pixels: dark, uncoloured parts thick enough to be a wall are
    walls, openings up to a door wide are closed, and every space they close
    off is a room. It runs in the browser and needs the image's scale. A
    recognised room that covers about the same space takes the traced outline.
    On a drawing with solid walls, a stretch of wall drawn open with lines or
    a light band in it is a window, or a door where a door swings at it.
  - `floor-planner-vacuum.mjs` reads the map of a robot vacuum. On an image of
    such a map the rooms are areas of one colour each; the editor tries that
    when an image has no walls to trace. A Valetudo robot puts the map itself
    in its picture, in a text chunk of the PNG: that gives the rooms with
    their names and the scale, without tracing.
  - `floor-planner-sheet.mjs` draws a plan as pages to keep or print, one for
    every floor, each an SVG with its own colours, and writes them into a PDF
    file. The editor turns a page into pixels for *Save as image* and *Save as
    PDF*.
  - `floor-planner-recognise.mjs` turns rooms recognised on an uploaded floor
    plan into a draft that lies on that image. The recognition itself runs in
    an account service: Home Assistant passes its own (`recognise` on the
    host), and `floor-planner-account.js` is the place where a site that
    offers the planner on its own plugs in one. Without either, the button is
    not shown. The same module is where such a site plugs in a place to keep
    plans that are shared with a link (`sharing`).
- `src/ha`: everything that ties the planner to Home Assistant.
  - `editor-entry.js` starts the editor inside the panel's iframe.
  - `host.js` is the `shs-floor-planner-page` element: it loads rooms and
    radars over the websocket API, saves changes and draws live presence.
  - `card-scene.js` is the `shs-floor-card-scene` element used by the Live
    Home card.
  - `ha-rooms.js` and `ha-save.js` turn stored rooms into a planner project
    and back. `ha-live.js` works out live presence, `fusion.js` combines
    several radars, `safety.js` holds the zone and validation rules.
  - `ha-vacuum.js` finds the map pictures of robot vacuums in Home Assistant
    and fetches one. `ha-automation.js` makes the automation that lets the
    lights of a room's area follow the presence in that room.
  - `shells/*.html` are the editor pages in five languages, with their text.
  - `static/` holds the product images the editor shows.
- `test/`: node tests for the planner, with the Home Assistant parts in
  `test/ha`.

## Build

```bash
npm install
npm run build   # writes ../www/floor-planner
npm run check   # fails when ../www/floor-planner does not match the source
npm test
```

The build is bundled with esbuild but not minified, so what Home Assistant
serves stays readable. Files the pages load are versioned by content hash, so
browsers never keep an old copy after an update.

`pdf.js` in the build is the exception: it holds `floor-planner-pdf.mjs`
together with the pdf.js library, minified because it is a library from npm,
with its licence in `pdf.LICENSE.txt`. The editor loads it by itself when a
PDF is opened. Nothing is fetched from the internet for it, so it also works
on a Home Assistant without a connection.

Rebuild after every change in `src`, and commit the source together with the
build.
