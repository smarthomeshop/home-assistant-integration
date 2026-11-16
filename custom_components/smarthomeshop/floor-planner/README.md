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
  - `floor-planner-recognise.mjs` turns rooms recognised on an uploaded floor
    plan into a draft that lies on that image. The recognition itself runs in
    an account service: Home Assistant passes its own (`recognise` on the
    host), and `floor-planner-account.js` is the place where a site that
    offers the planner on its own plugs in one. Without either, the button is
    not shown.
- `src/ha`: everything that ties the planner to Home Assistant.
  - `editor-entry.js` starts the editor inside the panel's iframe.
  - `host.js` is the `shs-floor-planner-page` element: it loads rooms and
    radars over the websocket API, saves changes and draws live presence.
  - `card-scene.js` is the `shs-floor-card-scene` element used by the Live
    Home card.
  - `ha-rooms.js` and `ha-save.js` turn stored rooms into a planner project
    and back. `ha-live.js` works out live presence, `fusion.js` combines
    several radars, `safety.js` holds the zone and validation rules.
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
