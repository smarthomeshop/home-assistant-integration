// Generated from floor-planner/src by floor-planner/build.mjs. Edit the source, then rebuild.

// inline-css:src/css/floor-planner.css
var floor_planner_default = '.fp {\n    --fp-bg: #f4f6f8;\n    --fp-panel: #fff;\n    --fp-stage: #20252c;\n    --fp-stage-bar: #292f38;\n    --fp-stage-border: #414a57;\n    --fp-border: #dce2ea;\n    --fp-text: #151e30;\n    --fp-muted: #526178;\n    --fp-accent: #4034bf;\n    --fp-selected: #f1efff;\n    --fp-ceiling: #4e43bb;\n    --fp-wall: #08765c;\n    margin: 0;\n    color: var(--fp-text);\n    background: var(--fp-bg);\n    font-size: 14px;\n    line-height: 1.45;\n    accent-color: var(--fp-accent);\n}\n.fp [hidden] { display: none !important; }\n.fp ::selection { background: #ddd8ff; color: #201768; }\n.fp :is(button, input, select):not(:where(.fp-header-locale *)) { font: inherit; color: inherit; }\n.fp button:not(:where(.fp-header-locale *)) { border: 1px solid transparent; border-radius: 7px; background: transparent; cursor: pointer; }\n.fp button:not(:where(.fp-header-locale *)):hover { background: #f1f3f7; }\n.fp button[aria-pressed="true"] { color: var(--fp-accent); border-color: #d8d2fb; background: var(--fp-selected); }\n.fp button:not(:where(.fp-header-locale *)):disabled { opacity: .54; cursor: default; }\n.fp a { color: var(--fp-accent); text-underline-offset: .22em; }\n.fp :focus-visible:not(:where(.fp-header-locale *)) { outline: 2px solid #6657e5; outline-offset: 2px; }\n.fp summary { cursor: pointer; }\n.fp button svg:not(:where(.fp-header-locale *)), .fp-project svg, .fp-drawing-menu summary svg, .fp-device-icon svg { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.55; stroke-linecap: round; stroke-linejoin: round; }\n.fp-shell { max-width: 1696px; padding: 0 clamp(16px, 3vw, 46px); margin-inline: auto; }\n.fp-header { padding: 22px 0 18px; }\n.fp h1 { margin: 0; font-size: clamp(27px, 3vw, 36px); font-weight: 760; letter-spacing: -.035em; line-height: 1.12; }\n.fp-intro { margin: 5px 0 0; color: var(--fp-muted); }\n.fp .fp-primary, .fp .fp-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; padding: 7px 12px; font-size: 13px; font-weight: 700; }\n.fp .fp-primary { color: #fff; background: var(--fp-accent); }\n.fp .fp-primary:hover { background: #3426a5; }\n.fp .fp-secondary { border-color: var(--fp-border); color: var(--fp-text); background: var(--fp-panel); }\n.fp .fp-secondary:hover { border-color: #aaa2de; background: var(--fp-selected); }\n.fp-start { display: grid; grid-template-columns: minmax(315px, .85fr) minmax(0, 1.3fr); overflow: hidden; border: 1px solid var(--fp-border); border-radius: 14px; background: var(--fp-panel); }\n.fp-start-copy { align-self: center; padding: clamp(22px, 4vw, 60px); }\n.fp .fp-start-copy h2 { margin: 0; font-size: clamp(27px, 3vw, 42px); line-height: 1.07; letter-spacing: -.035em; }\n.fp-start-copy > p { max-width: 40ch; margin: 12px 0 21px; color: var(--fp-muted); font-size: 15px; }\n.fp-start-actions { display: flex; align-items: start; flex-wrap: wrap; gap: 7px; }\n.fp-start-import { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 8px; margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--fp-border); color: var(--fp-muted); font-size: 13px; }\n.fp-start-import > span { flex-basis: 100%; }\n.fp .fp-start-import button { min-height: 44px; padding: 4px; color: var(--fp-accent); text-align: left; font-weight: 650; }\n#fp-start-status { margin: 5px 0 0; color: #9d2523; font-size: 13px; }\n#fp-start-status[data-busy] { color: var(--fp-muted); }\n#fp-start-status:empty { display: none; }\n.fp-start-preview { --fp-ceiling: #c6bdff; --fp-wall: #87e2be; --fp-label-size: .29px; display: grid; align-content: center; justify-items: center; gap: 6px; min-height: 300px; padding: 20px clamp(12px, 4vw, 52px); background: repeating-linear-gradient(0deg, transparent 0 23px, #8796a41f 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, #8796a41f 23px 24px), var(--fp-stage); }\n.fp-start-preview > svg { width: 100%; max-height: 405px; }\n.fp-demo-controls { display: flex; align-items: center; gap: 12px; width: min(100%, 370px); padding: 4px 4px 4px 12px; border: 1px solid #526171; border-radius: 10px; background: #252d37; color: #f4f7fb; }\n.fp-demo-reading { flex: 1; min-width: 0; }\n.fp-demo-reading strong, #fp-demo-detection { display: block; }\n.fp-demo-reading strong { font-size: 13px; }\n#fp-demo-detection { min-height: 2lh; color: #c6d1df; font-size: 11px; }\n#fp-demo-detection[data-detected] { color: #a4f1dc; }\n.fp .fp-demo-controls button { display: grid; place-items: center; flex: 0 0 44px; min-height: 44px; border-color: #596a7e; color: #eef4fb; background: #303b48; }\n.fp .fp-demo-controls button:hover { background: #435467; }\n.fp-demo-pause, [data-playing] .fp-demo-play { display: none; }\n[data-playing] .fp-demo-pause { display: inline; }\n.fp-start-preview .fp-space-marker[data-detected] { color: #a4f1dc; }\n.fp-start-preview .fp-space-marker[data-detected] circle { fill: #134b40; stroke-width: 2px; }\n.fp-start-preview .fp-stack-beam:not([data-detected]) { opacity: .45; }\n.fp-start-preview .fp-wall-fan:not([data-detected]) { opacity: .47; }\n.fp-start-preview .fp-stack-beam[data-detected] .fp-beam-near { stop-opacity: .56; }\n.fp-start-preview .fp-stack-beam[data-detected] .fp-beam-rim.active { stroke: #a4f1dc; }\n\n.fp-next { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 14px; margin: 8px 0; padding: 8px 11px; border: 1px solid #d8d0f5; border-radius: 9px; background: #f5f2ff; }\n.fp-next-copy { flex: 1 1 220px; }\n.fp-next p { margin: 0; color: #312954; font-size: 14px; font-weight: 580; }\n.fp .fp-next-copy button { min-height: 36px; padding: 3px 0; color: var(--fp-accent); font-size: 12px; font-weight: 680; text-decoration: underline; text-underline-offset: 3px; }\n.fp-next .fp-primary { flex: none; }\n.fp .fp-next [aria-pressed="true"] { border-color: #bb8740; color: #694110; background: #fff3da; }\n.fp-room-form { display: flex; flex-wrap: wrap; align-items: end; gap: 10px 18px; margin: 0 0 8px; padding: 12px; border: 1px solid var(--fp-border); border-radius: 9px; background: var(--fp-panel); }\n.fp-room-form > div:first-child { flex: 1 0 240px; }\n.fp .fp-room-form h2 { margin: 0 0 3px; }\n.fp-room-form p { margin: 0; color: var(--fp-muted); font-size: 13px; }\n.fp-room-form-inputs { display: grid; flex: 1 1 250px; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }\n.fp-room-form-inputs label { display: grid; gap: 3px; color: var(--fp-muted); font-size: 12px; }\n.fp-room-form-inputs input { width: 100%; min-height: 44px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8faff; font-size: 16px; }\n.fp-room-form-actions { display: flex; flex-wrap: wrap; gap: 5px; }\n#fp-room-form-error { flex: 0 0 100%; color: #9d2523; }\n\n.fp-project { position: relative; z-index: 3; display: flex; align-items: center; flex-wrap: wrap; gap: 6px 11px; padding: 7px 10px; margin-bottom: 8px; border: 1px solid var(--fp-border); border-radius: 9px; background: var(--fp-panel); }\n.fp-project-name { min-width: 0; display: flex; align-items: center; gap: 6px; color: var(--fp-muted); }\n.fp-project-name > span { display: none; }\n.fp-project-name input { width: clamp(135px, 18vw, 245px); min-width: 0; min-height: 38px; padding: 0 6px; border: 1px solid transparent; border-radius: 6px; color: var(--fp-text); background: transparent; font-weight: 700; text-overflow: ellipsis; }\n.fp-project-name input:hover, .fp-project-name input:focus { border-color: var(--fp-border); background: var(--fp-bg); }\n.fp-project-menu { position: relative; flex: none; }\n.fp-toolbar-trigger { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 5px 10px; list-style: none; border: 1px solid var(--fp-border); border-radius: 9px; background: var(--fp-panel); font-size: 13px; font-weight: 650; }\n.fp-toolbar-trigger::-webkit-details-marker, .fp-drawing-menu > summary::-webkit-details-marker { display: none; }\n.fp-toolbar-trigger:hover, details[open] > .fp-toolbar-trigger { border-color: #c8bff1; background: var(--fp-selected); }\n.fp-toolbar-trigger > svg { color: var(--fp-accent); }\n.fp-toolbar-trigger > .fp-toolbar-chevron { width: 14px; height: 14px; color: var(--fp-muted); }\ndetails[open] > .fp-toolbar-trigger .fp-toolbar-chevron { transform: rotate(180deg); }\n.fp-toolbar-panel { position: absolute; z-index: 6; inset: calc(100% + 6px) auto auto 0; width: 306px; max-height: min(475px, calc(100dvh - 128px - env(safe-area-inset-top) - env(safe-area-inset-bottom))); padding: 12px; overflow-y: auto; overscroll-behavior: contain; border: 1px solid var(--fp-border); border-radius: 13px; background: var(--fp-panel); box-shadow: 0 12px 32px #16233b29; font-size: 13px; }\n.fp .fp-toolbar-panel button { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 44px; padding: 5px 8px; border-radius: 7px; text-align: start; line-height: 1.25; }\n.fp-project-actions button { font-weight: 650; }\n.fp-project-actions button svg { color: var(--fp-accent); }\n.fp-project-files { margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--fp-border); }\n.fp-project-files h2 { margin: 0 8px 3px; color: var(--fp-muted); font-size: 12px; font-weight: 650; }\n#fp-mobile-project-options:empty { display: none; }\n.fp #fp-open-order { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 5px 11px; margin-left: auto; border-color: var(--fp-border); color: var(--fp-text); background: var(--fp-panel); white-space: nowrap; font-weight: 700; }\n.fp-order-label { display: grid; text-align: left; line-height: 1.12; }\n.fp-order-short { display: none; }\n.fp-order-label small { margin-top: 2px; color: var(--fp-muted); font-size: 10px; font-weight: 550; }\n.fp #fp-open-order[data-empty] { border-color: var(--fp-border); color: var(--fp-muted); background: var(--fp-bg); }\n.fp #fp-open-order:hover { border-color: #aaa2de; background: var(--fp-selected); }\n#fp-open-order .fp-count { min-width: 21px; color: #fff; background: #3a4660; }\n\n.fp-workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(252px, 293px); border: 1px solid var(--fp-border); border-radius: 0 0 14px 14px; }\n.fp-drawing { display: flex; flex-direction: column; min-width: 0; min-height: 0; container-type: inline-size; }\n.fp-viewbar, .fp-toolbar { display: flex; align-items: center; gap: 4px; min-height: 49px; padding: 4px 10px; color: #e3e8ee; background: var(--fp-stage-bar); }\n.fp-viewbar { position: relative; z-index: 2; justify-content: space-between; min-height: 44px; border-bottom: 1px solid var(--fp-stage-border); }\n.fp-view-menu { position: relative; }\n.fp :is(.fp-view-menu, .fp-toolbox) > summary { display: flex; align-items: center; gap: 6px; width: fit-content; min-height: 35px; padding: 3px 8px; border-radius: 6px; list-style: none; color: #e4eaf3; font-size: 12px; font-weight: 650; }\n.fp :is(.fp-view-menu, .fp-toolbox) > summary:hover { background: #414a57; }\n.fp :is(.fp-view-menu, .fp-toolbox) > summary::-webkit-details-marker { display: none; }\n.fp :is(.fp-view-menu, .fp-toolbox) > summary svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }\n.fp-view-options { position: absolute; inset: calc(100% + 5px) auto auto 0; display: grid; width: max-content; min-width: 162px; gap: 3px; padding: 5px; border: 1px solid #596373; border-radius: 8px; background: #282f39; }\n.fp .fp-view-options :is(.fp-view-switch,.fp-view-actions) { display: grid; gap: 3px; }\n.fp .fp-view-options button { justify-content: start; width: 100%; white-space: nowrap; }\n.fp .fp-view-options .fp-view-label { display: inline; }\n.fp-toolbox { position: relative; }\n.fp-toolbox-content { position: absolute; inset: calc(100% + 5px) 0 auto auto; width: min(345px, calc(100vw - 38px)); max-height: min(65dvh, 540px); overflow: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid #596373; border-radius: 8px; background: #282f39; }\n.fp-shortcuts { color: #c0cbdc; font-size: 12px; }\n.fp-shortcuts summary { min-height: 36px; padding: 8px; }\n.fp-shortcuts p { margin: 0; padding: 0 8px 8px; }\n.fp-history { display: flex; gap: 4px; margin-top: 5px; padding-top: 5px; border-top: 1px solid #505c6e; }\n.fp-history button { display: inline-flex; align-items: center; gap: 6px; padding-inline: 8px; font-size: 12px; }\n.fp-view-zoom { display: grid; gap: 3px; padding-top: 4px; border-top: 1px solid #505c6e; }\n.fp-view-zoom button { display: flex; align-items: center; gap: 6px; padding-inline: 8px; font-size: 12px; }\n.fp-space-controls, .fp-shell[data-view="3d"] .fp-flat-controls { display: none; }\n.fp-shell[data-view="3d"] .fp-space-controls { display: grid; }\n.fp-view-switch { display: flex; align-items: center; gap: 3px; }\n.fp-viewbar button, .fp-toolbar button, .fp-stage .fp-place-actions button { min-height: 36px; color: inherit; }\n.fp-view-switch button, .fp-coverage, .fp-heat-toggle, .fp-turn { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; font-size: 12px; font-weight: 650; }\n.fp-view-label { font-weight: 500; }\n.fp :is(.fp-viewbar, .fp-toolbar, .fp-stage) button:hover:not(:disabled) { background: #414a57; }\n.fp :is(.fp-viewbar, .fp-toolbar, .fp-stage) button:hover:disabled { background: transparent; }\n.fp :is(.fp-viewbar, .fp-toolbar, .fp-stage) button[aria-pressed="true"] { color: #fff; border-color: #657286; background: #414a59; }\n.fp .fp-viewbar :is(.fp-coverage, .fp-heat-toggle)[aria-pressed="true"] { color: #eeeaff; border-color: #7068a4; background: #48416b; }\n.fp :is(.fp-viewbar, .fp-toolbar, .fp-stage) :focus-visible { outline-color: #bdb6ff; }\n.fp-turn, .fp-shell[data-view="3d"] .fp-stage-top,\n.fp-shell[data-view="3d"] .fp-scale { display: none; }\n.fp-shell[data-view="3d"] .fp-toolbar :is([data-tool], .fp-drawing-menu) { display: none; }\n.fp-shell[data-view="3d"] .fp-turn { display: inline-flex; }\n\n.fp-stage { --fp-ceiling: #bfb7ff; --fp-wall: #7ee7c1; min-height: 0; flex: 1; position: relative; isolation: isolate; overflow: hidden; color: #e6ebf2; background: var(--fp-stage); }\n.fp-board, #fp-plan, #fp-space { position: absolute; inset: 0; width: 100%; height: 100%; }\n.fp-board:focus-visible { outline: 2px solid #bdb6ff; outline-offset: -3px; }\n.fp-sensor-tip {\n    position: absolute;\n    z-index: 5;\n    width: min(248px, calc(100% - 16px));\n    padding: 11px 13px 12px;\n    border: 1px solid #626e80;\n    border-radius: 9px;\n    background: #29313c;\n    color: #f4f7fb;\n    box-shadow: 0 8px 22px #0b121a6e;\n    font-size: 12px;\n    line-height: 1.45;\n}\n.fp-sensor-tip > strong { display: block; font-size: 14px; }\n.fp-sensor-tip > p { margin: 1px 0 0; color: #bdcad9; overflow-wrap: anywhere; }\n.fp-sensor-options { display: grid; gap: 4px; margin: 8px 0 0; }\n.fp-sensor-options > div { display: grid; grid-template-columns: max-content 1fr; gap: 8px; align-items: baseline; }\n.fp-sensor-options dt { font-weight: 500; }\n.fp-sensor-options dd { margin: 0; font-weight: 690; text-align: end; overflow-wrap: anywhere; }\n.fp-sensor-tip .fp-sensor-options { padding-top: 8px; border-top: 1px solid #526073; }\n.fp-sensor-tip dt { color: #c7d3df; }\n#fp-sensor-config > .fp-sensor-options { margin: 0 0 10px; padding: 8px 10px; border: 1px solid var(--fp-border); border-radius: 7px; background: #f3f6fa; font-size: 12px; }\n#fp-sensor-config dt { color: var(--fp-muted); }\n.fp [data-sensor-marker]:focus { outline: none; }\n.fp .fp-stage [data-sensor-marker] > .fp-sensor-focus {\n    fill: none;\n    stroke: #e3dcff;\n    stroke-width: 2px;\n    vector-effect: non-scaling-stroke;\n    pointer-events: none;\n    visibility: hidden;\n}\n.fp .fp-stage [data-sensor-marker]:focus-visible > .fp-sensor-focus { visibility: visible; }\n.fp-space-marker > .fp-sensor-focus { r: calc(var(--fp-space-pin, .29px) + .075px); }\n#fp-plan { touch-action: pan-y; user-select: none; cursor: crosshair; }\n#fp-plan[data-tool="edit"] { cursor: default; }\n#fp-plan[data-tool="edit"] [data-item], #fp-plan:is([data-tool="pan"], [data-tool="move_item"]) { cursor: grab; }\n#fp-plan:not([data-tool="edit"]), .fp-shell[data-simulation] #fp-plan { touch-action: none; }\n#fp-plan:active, #fp-plan[data-tool="edit"] [data-item]:active { cursor: grabbing; }\n.fp-stage-top { position: absolute; inset: 12px 12px auto; pointer-events: none; }\n.fp-stage-instructions { display: grid; justify-items: start; gap: 5px; }\n.fp-undo-notice { position: absolute; z-index: 2; inset: 8px auto auto 8px; display: flex; align-items: center; gap: 7px; padding: 3px 5px 3px 9px; border: 1px solid #6d648e; border-radius: 7px; color: #e9e3fa; background: #37314c; font-size: 12px; }\n.fp .fp-undo-notice button { min-height: 36px; padding: 3px 7px; color: #f8f5ff; text-decoration: underline; text-underline-offset: 3px; }\n.fp-shell[data-placing-object] .fp-stage-top { display: none; }\n.fp-placement-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 7px 14px; padding: 8px 12px; border-bottom: 1px solid #5c5481; background: #302c46; color: #f0edff; }\n.fp-placement-copy { display: grid; gap: 2px; }\n.fp-placement-copy strong { font-size: 14px; }\n.fp-placement-copy span { color: #d4cce9; font-size: 12px; }\n.fp-opening-dimensions { display: flex; flex: 1 0 100%; flex-wrap: wrap; gap: 8px; }\n.fp-opening-dimensions label { display: grid; gap: 3px; flex: 1 1 90px; color: #e0d8f4; font-size: 12px; }\n.fp .fp-opening-dimensions input { width: 100%; min-height: 39px; padding: 4px 8px; border: 1px solid #82789f; border-radius: 6px; background: #242037; color: #f4efff; font-size: 16px; }\n.fp .fp-placement-bar button { min-height: 39px; padding: 4px 9px; border-color: #81779e; color: #f3efff; font-size: 12px; font-weight: 680; }\n.fp .fp-placement-bar button:hover { background: #494163; }\n.fp .fp-placement-bar .fp-placement-primary { color: #221a41; border-color: #dfd5ff; background: #e6ddff; }\n.fp .fp-placement-bar .fp-placement-primary:hover { background: #fff8ff; }\n.fp .fp-selection-jump { display: none; }\n.fp .fp-touch-move { display: none; }\n#fp-inspector-title { scroll-margin-block-start: 100px; }\n.fp-hint { max-width: 43ch; margin: 0; padding: 5px 8px; border-radius: 5px; color: #d9e0e9; background: #282e37; font-size: 12px; }\n.fp-draw-keys { margin: 0; padding: 0 8px; color: #b8c4d6; background: var(--fp-stage); font-size: 11px; }\n@media (pointer: coarse) { .fp-draw-keys { display: none; } }\n.fp-stage:has(#fp-plan[data-tool="edit"]) .fp-hint { background: var(--fp-stage); }\n.fp-place-actions { display: flex; flex-wrap: wrap; gap: 5px; }\n.fp-stage .fp-place-actions button { padding: 4px 9px; border-color: #6b7585; color: #fff; background: #373f4b; pointer-events: auto; font-size: 12px; }\n.fp-stage .fp-place-actions #fp-place-center { background: #48416b; border-color: #8c81c3; }\n.fp-outline-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 6px 10px; background: var(--fp-stage-bar); color: #e3e8ee; border-top: 1px solid var(--fp-stage-border); }\n.fp-outline-tools .fp-place-actions { gap: 4px; }\n.fp .fp-outline-tools button { min-height: 35px; padding: 3px 9px; color: inherit; border-color: #606b7d; font-size: 12px; font-weight: 620; }\n.fp .fp-outline-tools button:hover:not(:disabled) { background: #414a57; }\n.fp .fp-outline-tools button[aria-pressed="true"],\n.fp .fp-outline-tools [data-action="save_outline"]:not(:disabled) { background: #48416b; border-color: #b2a8fa; color: #faf8ff; }\n.fp-outline-tools :focus-visible { outline-color: #bdb6ff; }\n.fp-room-corner-position { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }\n.fp-room-corner-position label { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #c7d0dc; white-space: nowrap; }\n.fp .fp-room-corner-position input { width: 62px; min-height: 35px; padding: 2px 5px; border: 1px solid #606b7d; border-radius: 6px; background: #202630; color: #eef2f8; font-size: 13px; font-variant-numeric: tabular-nums; }\n@media (max-width: 760px) {\n    .fp .fp-outline-tools button { min-height: 44px; padding-inline: 7px; }\n    .fp-outline-tools { padding-inline: 5px; }\n    .fp .fp-room-corner-position input { min-height: 44px; font-size: 16px; }\n}\n.fp-toolbar { display: grid; min-height: 0; gap: 5px; padding: 0; background: transparent; }\n.fp-tool-group { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px; padding-block: 4px; }\n.fp-tool-group + .fp-tool-group { border-top: 1px solid #505c6e; }\n.fp-tool-group > p { grid-column: 1 / -1; margin: 0; padding: 3px 8px; color: #c0cbdc; font-size: 12px; font-weight: 700; }\n.fp-zoom-shortcut { display: none; max-width: 24ch; margin: 0; padding: 3px 8px; color: #c0cbdc; font-size: 11px; }\n.fp-wheel-shortcut { margin: 0; padding: 3px 8px; color: #c0cbdc; font-size: 11px; }\n.fp-shell[data-view="3d"] .fp-wheel-shortcut { display: none; }\n@media (pointer: coarse) {\n    .fp-shortcuts, .fp-wheel-shortcut { display: none; }\n    .fp-shell:not([data-view="3d"]) .fp-zoom-shortcut { display: block; }\n}\n.fp-toolbar :is(button, summary) { display: flex; align-items: center; justify-content: start; gap: 6px; min-height: 36px; padding: 4px 8px; text-align: left; font-size: 12px; font-weight: 650; }\n.fp-drawing-menu { grid-column: 1 / -1; }\n.fp-drawing-menu > summary { list-style: none; border: 1px solid transparent; border-radius: 7px; }\n.fp-drawing-menu:is([open], [data-active]) > summary, .fp-drawing-menu > summary:hover { border-color: #657286; background: #414a59; }\n.fp-drawing-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px; margin-top: 4px; padding: 4px; border: 1px solid #596373; border-radius: 7px; }\n.fp-scale { display: grid; position: absolute; inset: auto auto 12px 15px; min-width: 30px; width: var(--metre, 30px); text-align: center; font-size: 11px; white-space: nowrap; }\n.fp-scale span { height: 6px; border: solid #c6d0dc; border-width: 0 1px 1px; margin-bottom: 2px; }\n\n.fp-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; min-height: 36px; padding: 8px 12px; border-radius: 0 0 0 13px; border-top: 1px solid var(--fp-border); color: var(--fp-muted); background: var(--fp-panel); font-size: 11px; }\n.fp-legend > span { display: flex; align-items: center; gap: 6px; }\n.fp-legend-limit { margin-left: auto; }\n.fp-dot { display: inline-block; width: 8px; height: 8px; flex: none; border-radius: 50%; background: currentColor; }\n.fp .ceiling { color: var(--fp-ceiling); }\n.fp .wall { color: var(--fp-wall); }\n.fp-legend-range { width: 13px; height: 8px; border: 1px dashed currentColor; border-radius: 50%; }\n\n.fp-sidebar { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-left: 1px solid var(--fp-border); border-radius: 0 0 13px; background: var(--fp-panel); }\n.fp-sidebar-nav { display: flex; flex: none; gap: 16px; min-height: 49px; padding: 0 14px; border-bottom: 1px solid var(--fp-border); }\n.fp-sidebar-nav button { position: relative; padding: 0 2px; border-radius: 0; color: var(--fp-muted); font-size: 13px; font-weight: 650; white-space: nowrap; }\n.fp-sidebar-nav button[aria-selected="true"] { color: var(--fp-text); }\n.fp-sidebar-nav button[aria-selected="true"]::after { content: ""; position: absolute; inset: auto 0 -1px; height: 2px; background: var(--fp-accent); }\n.fp-sidebar-content { min-height: 0; scrollbar-color: #bec7d3 transparent; }\n.fp-panel { padding: 14px; }\n.fp-sensors { border-bottom: 1px solid var(--fp-border); }\n.fp h2 { margin: 0 0 10px; font-size: 15px; font-weight: 730; letter-spacing: -.012em; }\n.fp-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 7px; margin-bottom: 8px; }\n.fp-panel-heading h2 { margin: 0; }\n.fp #fp-add-room { display: inline-flex; align-items: center; min-height: 40px; margin-top: 5px; padding: 4px 7px; color: var(--fp-accent); font-size: 12px; font-weight: 650; }\n.fp-count { flex: none; min-width: 22px; padding: 2px 5px; color: var(--fp-muted); background: #edf1f6; text-align: center; border-radius: 20px; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }\n#fp-placements, #fp-objects { display: grid; gap: 3px; }\n.fp-placed, .fp-room-row { display: flex; align-items: center; gap: 9px; min-width: 0; min-height: 44px; padding: 5px 7px; text-align: left; }\n.fp-placed > span:last-child, .fp-room-row span { min-width: 0; overflow-wrap: anywhere; }\n.fp-placed strong { display: block; font-size: 13px; font-weight: 680; }\n.fp-placed small, .fp-room-row small { display: block; color: var(--fp-muted); font-size: 11px; }\n.fp-index { min-width: 27px; padding: 4px; text-align: center; border-radius: 5px; background: #eeecfd; font-size: 11px; font-weight: 740; font-variant-numeric: tabular-nums; }\n.fp-index.wall { background: #e4f4ee; }\n.fp-room-row { min-height: 36px; font-size: 13px; }\n.fp-room-row svg { color: var(--fp-muted); }\n.fp-room-row small { margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }\n#fp-structure { margin-top: 9px; padding-top: 8px; border-top: 1px solid var(--fp-border); }\n#fp-structure summary { min-height: 30px; color: var(--fp-muted); font-size: 12px; }\n#fp-structure-items { display: grid; gap: 3px; }\n#fp-structure-items button { min-height: 38px; padding-inline: 7px; text-align: left; font-size: 13px; }\n\n.fp-sidebar[data-library] > :not(#fp-library) { display: none; }\n.fp-sidebar:has(#fp-library[data-mode="sheet"]:popover-open) > :not(#fp-library) { visibility: hidden; }\n.fp-library-panel { --fp-catalog-ink: #edf1f7; --fp-catalog-muted: #b6c3d7; padding: 14px; overflow-y: auto; overscroll-behavior: contain; color: var(--fp-catalog-ink); background: #252c37; }\n.fp-library-panel[data-mode="dock"] { flex: 1; min-height: 0; border-radius: 0 0 13px; }\n.fp-library-panel[data-mode="quick"] { position: absolute; inset: auto; width: min(315px, calc(100vw - 20px)); max-height: min(470px, calc(100dvh - 20px)); margin: 0; border: 1px solid #606b7d; border-radius: 10px; }\n.fp-library-panel[data-mode="sheet"] { position: fixed; inset: auto 0 0; width: min(100%, 540px); max-height: min(69dvh, 530px); margin: 0 auto; padding: 14px 14px max(16px, env(safe-area-inset-bottom)); border: 1px solid #606b7d; border-radius: 16px 16px 0 0; }\n.fp-library-panel[data-mode="sheet"]::backdrop { background: #10162129; }\n.fp-library-header { display: flex; justify-content: space-between; gap: 9px; align-items: start; margin-bottom: 10px; overflow-wrap: anywhere; }\n.fp .fp-library-header h2 { margin: 2px 0 3px; }\n.fp-library-header button { flex: none; width: 38px; height: 38px; font-size: 23px; line-height: 1; }\n#fp-library-context { margin: 0; color: var(--fp-catalog-muted); font-size: 12px; }\n#fp-search { display: block; width: 100%; min-height: 41px; padding: 5px 9px; border: 1px solid #667183; border-radius: 6px; color: var(--fp-catalog-ink); background: #1d2430; }\n#fp-search::placeholder { color: var(--fp-catalog-muted); }\n.fp-library-filters { display: flex; flex-wrap: wrap; gap: 4px; padding: 9px 0 5px; }\n.fp .fp-library-filters button { min-height: 36px; padding: 3px 8px; border-color: #555f72; color: var(--fp-catalog-ink); font-size: 12px; }\n.fp .fp-catalog-advice { display: flex; align-items: center; justify-content: space-between; gap: 6px; width: 100%; min-height: 40px; margin: 3px 0 2px; padding: 5px 8px; border-color: #635982; color: #ede5ff; background: #37314c; font-size: 12px; font-weight: 700; }\n.fp .fp-library-panel button:hover { background: #3a4455; }\n.fp .fp-library-panel button[aria-pressed="true"] { color: #f4f0ff; border-color: #a293d1; background: #443b68; }\n.fp .fp-library-panel :focus-visible { outline-color: #c4b6ff; }\n#fp-search-empty { margin-top: 10px; }\n.fp .fp-library-panel :is(#fp-search-empty, .fp-device-group p, .fp-add) { color: var(--fp-catalog-muted); }\n#fp-catalog { display: grid; gap: 8px; padding-top: 7px; }\n.fp-device-group p { display: flex; align-items: center; gap: 6px; margin: 3px 0 3px 4px; color: var(--fp-muted); font-size: 11px; font-weight: 700; }\n.fp-device-group button { display: flex; align-items: center; gap: 8px; min-height: 44px; width: 100%; padding: 3px 5px; text-align: left; font-size: 13px; }\n.fp-device-group + .fp-device-group { border-top: 1px solid #495465; padding-top: 6px; }\n.fp-device-icon { display: grid; place-items: center; min-width: 25px; }\n.fp-library-panel .ceiling { color: #d2c6ff; }\n.fp-library-panel .wall { color: #94e4c6; }\n.fp-device-icon img { object-fit: contain; }\n.fp-add { margin-left: auto; font-size: 16px; color: var(--fp-muted); }\n\n#fp-inspector { display: grid; gap: 9px; }\n#fp-inspector label { display: grid; gap: 4px; min-width: 0; color: var(--fp-muted); font-size: 12px; }\n#fp-inspector input, #fp-inspector select { width: 100%; min-width: 0; min-height: 37px; padding: 4px 7px; border: 1px solid #ccd5e1; border-radius: 7px; color: var(--fp-text); background: #f7f9fc; font-size: 13px; }\n.fp-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.fp-note { margin: 0; color: var(--fp-muted); font-size: 12px; }\n.fp-warning { color: #84510f; }\n.fp-inspector-actions { display: flex; flex-wrap: wrap; gap: 5px; }\n.fp-inspector-actions button { min-height: 37px; border-color: var(--fp-border); padding: 4px 8px; font-size: 12px; }\n.fp-inspector-actions [data-action="delete"] { color: #a12227; }\n.fp-product { justify-self: start; padding: 3px 0; font-size: 12px; font-weight: 680; }\n.fp-save-notice { position: absolute; z-index: 6; inset: auto 16px calc(86px + env(safe-area-inset-bottom)) auto; max-width: min(360px, calc(100% - 32px)); margin: 0; padding: 9px 12px; border: 1px solid var(--fp-border); border-radius: 8px; background: var(--fp-panel); color: var(--fp-text); font-size: 12px; }\n.fp-save-notice:empty { display: none; }\n#fp-save { text-align: right; }\n.fp-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }\n\n/* Floor plan geometry */\n.fp-room-floor { fill: #282f38; stroke: #a9b5c2; stroke-width: 2.4px; vector-effect: non-scaling-stroke; }\n.fp-room.selected > .fp-room-floor, .fp-room-outline { stroke: #c5bdff; stroke-width: 2.8px; }\n.fp-room-outline { pointer-events: none; fill: none; vector-effect: non-scaling-stroke; }\n.fp-room-label { pointer-events: none; fill: #eaf0f5; font-size: var(--fp-label-size, .238px); font-weight: 680; paint-order: stroke; stroke: #272e36; stroke-width: .028px; }\n.fp-room-size { fill: #c1ccd8; font-size: var(--fp-room-size, .17px); font-weight: 450; }\n.fp-window { fill: none; stroke: #8eb9d0; stroke-width: 3.3px; vector-effect: non-scaling-stroke; }\n.fp-opening { color: #96dbf7; }\n.fp-opening.mirrors { color: #e2b4ff; }\n.fp-opening :is(line, path) { fill: none; stroke: currentColor; stroke-width: 3px; vector-effect: non-scaling-stroke; }\n.fp-opening .fp-opening-hit { stroke: transparent; stroke-width: 19px; pointer-events: stroke; }\n.fp-opening.selected :is(line:not(.fp-opening-hit), path) { stroke: #fff0bb; }\n.fp-wall-measure { fill: #dce5ff; stroke: #212731; stroke-width: .035px; paint-order: stroke; font-size: .175px; font-weight: 650; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }\n.fp-plan-zone { color: #73ddb0; }\n.fp-plan-zone.exclusion { color: #ff9c9a; }\n.fp-plan-zone.interference { color: #f4c272; }\n.fp-plan-zone.entry { color: #91edda; }\n.fp-plan-zone :is(polygon, polyline) { fill: currentColor; fill-opacity: .14; stroke: currentColor; stroke-width: 1.5px; vector-effect: non-scaling-stroke; }\n.fp-plan-zone.entry polyline { fill: none; stroke-width: 3px; stroke-dasharray: 6 3; }\n.fp-entry-arrow { fill: none; stroke: currentColor; stroke-width: 1.8px; vector-effect: non-scaling-stroke; }\n.fp-plan-zone.selected :is(polygon, polyline) { fill-opacity: .25; stroke-width: 2.5px; }\n.fp-space-opening { fill: #8ec8e7; fill-opacity: .48; stroke: #c7eaff; stroke-width: 1.2px; vector-effect: non-scaling-stroke; }\n.fp-space-opening.mirrors { fill: #c7a3ed; stroke: #e7cfff; }\n.fp-space-opening.selected { stroke: #fff0bb; stroke-width: 2px; }\n.fp-building-label { fill: #e6eaf7; font-size: var(--fp-space-label, .29px); font-weight: 700; stroke: #25313c; stroke-width: .045px; paint-order: stroke; }\n.fp-shell[data-all-floors]:not([data-stair-crossing]) .fp-building-label { cursor: pointer; }\n.fp-furniture { pointer-events: none; }\n.fp-furniture rect { fill: #38414d; stroke: #687584; stroke-width: .85px; vector-effect: non-scaling-stroke; }\n.fp-range { pointer-events: none; }\n.fp-range ellipse, .fp-range path { fill: currentColor; fill-opacity: .08; stroke: currentColor; stroke-width: 1.15px; stroke-dasharray: 5 5; vector-effect: non-scaling-stroke; }\n.fp-range.selected ellipse, .fp-range.selected path { fill-opacity: .15; stroke-width: 1.35px; }\n.fp-range .fp-secondary-range { fill: none; stroke-dasharray: 1.5 4; }\n.fp-wall line { stroke: #acb9c6; stroke-width: 4px; vector-effect: non-scaling-stroke; }\n.fp-wall .fp-wall-hit { stroke: transparent; stroke-width: 16px; }\n.fp-wall.selected line:last-child { stroke: #c5bdff; }\n.fp-door-gap { stroke: #282f38; stroke-width: 5px; vector-effect: non-scaling-stroke; }\n.fp-door-leaf { fill: none; stroke: #cab18d; stroke-width: 1.2px; vector-effect: non-scaling-stroke; }\n.fp-door.selected .fp-door-leaf { stroke: #ffdfaa; stroke-width: 2px; }\n.fp-door rect { fill: transparent; }\n.fp-sensor { fill: #242b35; stroke: currentColor; stroke-width: .025px; }\n.fp-sensor-halo { fill: currentColor; fill-opacity: .14; stroke: none; }\n.fp-sensor.selected .fp-sensor-halo { fill-opacity: .31; }\n.fp-sensor-eye { fill: currentColor; stroke: none; }\n.fp-sensor text { font-size: .17px; font-weight: 800; fill: currentColor; stroke: none; }\n.fp-cursor { stroke: #f4f8f0; stroke-width: 2px; vector-effect: non-scaling-stroke; }\n#fp-ghost > * { fill: #a6b7ff24; stroke: var(--fp-ceiling); stroke-width: 1.5px; stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }\n#fp-ghost > .fp-placement-preview { fill: none; stroke: none; }\n#fp-ghost > .fp-opening-preview { fill: none; stroke: none; }\n.fp-opening-preview > *, .fp-opening-preview path { fill: none; vector-effect: non-scaling-stroke; stroke-linecap: round; }\n.fp-opening-preview { color: #93ddff; }\n.fp-opening-preview[data-opening="door"] { color: #ffdc9f; }\n.fp-opening-preview[data-opening="mirror"] { color: #dcc3ff; }\n.fp-opening-preview-wall { stroke: currentColor; stroke-width: 3px; opacity: .42; }\n.fp-opening-preview-span { stroke: currentColor; stroke-width: 6px; stroke-dasharray: 7px 4px; }\n.fp-opening-preview-ends, .fp-opening-preview-swing { stroke: currentColor; stroke-width: 2px; }\n.fp-placement-preview .fp-range :is(path, ellipse) { fill-opacity: .22; stroke-width: 1.8px; }\n.fp-placement-marker > * { fill: var(--fp-stage); stroke: currentColor; stroke-width: 1.6px; vector-effect: non-scaling-stroke; }\n.fp-placement-marker > .fp-placement-ring { fill: none; stroke-dasharray: 3 2; }\n#fp-ghost > .fp-draft-dimension { fill: #f9f7ff; stroke: #232833; stroke-width: 4px; stroke-dasharray: none; paint-order: stroke; font-size: var(--fp-draft-size, .3px); font-weight: 720; font-variant-numeric: tabular-nums; }\n#fp-ghost > .fp-outline-corner { r: var(--fp-corner-radius, .08px); fill: #332d49; stroke: #ded6ff; stroke-width: 2px; stroke-dasharray: none; }\n#fp-ghost > .fp-outline-corner[data-current="true"] { fill: #efe6ff; stroke: #a596f7; }\n#fp-ghost[data-invalid] > .fp-outline-draft { fill: #ee797229; stroke: #ffab9e; }\n/* Browser focus outlines on SVG groups can scale with the floor plan. */\n.fp :is(.fp-room-handle, .fp-room-midpoint):focus { outline: none; }\n#fp-room-handles circle { vector-effect: non-scaling-stroke; }\n#fp-room-handles :is(.fp-room-handle-hit, .fp-room-handle-dot) { r: var(--fp-corner-radius, .08px); }\n.fp-room-handle-focus {\n    r: calc(var(--fp-corner-radius, .08px) * 1.75);\n    fill: none;\n    stroke: #e3dcff;\n    stroke-width: 2px;\n    visibility: hidden;\n    pointer-events: none;\n}\n.fp-room-handle:focus-visible > .fp-room-handle-focus { visibility: visible; }\n#fp-room-midpoints circle { vector-effect: non-scaling-stroke; }\n#fp-room-midpoints .fp-room-handle-hit, .fp-room-midpoint-ring { r: calc(var(--fp-corner-radius, .08px) * 1.6); }\n.fp-room-midpoint-ring { fill: #5bd3a625; stroke: #85e8bd; stroke-width: 1.4px; stroke-dasharray: 3px 2px; opacity: 0; pointer-events: none; }\n.fp-room-midpoint-dot { r: calc(var(--fp-corner-radius, .08px) * .67); fill: #7de4b6; stroke: #233b39; stroke-width: 1.25px; opacity: .68; pointer-events: none; }\n.fp-room-midpoint:is([data-near], :focus-visible) .fp-room-midpoint-ring, .fp-room-midpoint:is([data-near], :focus-visible) .fp-room-midpoint-dot { opacity: 1; }\n.fp-room-midpoint:focus-visible .fp-room-midpoint-ring { stroke: #e3dcff; stroke-width: 2px; stroke-dasharray: none; }\n[data-room-corner-drag] #fp-room-midpoints { display: none; }\n.fp-room-handle-hit { fill: transparent; stroke: transparent; stroke-width: 16px; pointer-events: all; cursor: grab; }\n.fp-room-handle-dot { fill: #6c69e6; stroke: #f0edff; stroke-width: 1.8px; pointer-events: none; }\n.fp-room-handle:is(:hover, :focus-visible, [data-dragging]) .fp-room-handle-dot { fill: #b5abff; stroke-width: 2.8px; }\n[data-room-corner-drag] .fp-room-handle-hit { cursor: grabbing; }\n#fp-plan[data-room-corner-drag] :is(.fp-room.selected > .fp-room-floor, .fp-room-outline) { stroke-opacity: .35; }\n.fp-room-handle-feedback {\n    position: absolute;\n    z-index: 2;\n    inset: auto auto 194px 16px;\n    max-width: min(350px, calc(100% - 32px));\n    margin: 0;\n    padding: 7px 10px;\n    border: 1px solid #aa7770;\n    border-radius: 7px;\n    background: #3b2d32;\n    color: #ffe2dc;\n    font-size: 12px;\n    pointer-events: none;\n}\n.fp-room-handle-feedback:empty { display: none; }\n@media (pointer: coarse) {\n    .fp-room-handle-hit { stroke-width: 34px; }\n    .fp-room-midpoint .fp-room-handle-hit { stroke-width: 26px; }\n    .fp-room-midpoint .fp-room-midpoint-ring { opacity: .82; }\n    .fp .fp-opening-dimensions input { min-height: 44px; }\n}\n#fp-plan[data-tool="edit_outline"] :is(.fp-room.selected > .fp-room-floor, .fp-room-outline) { stroke-opacity: .35; }\n#fp-plan[data-tool="edit_outline"] .fp-ceiling-marks.active { visibility: hidden; }\n.fp-ceiling-marks { color: #bdc7dc; pointer-events: none; }\n.fp-ceiling-marks.active { color: #e0d9ff; }\n.fp-ceiling-marks path { stroke: currentColor; stroke-width: 1.05px; stroke-dasharray: 5 5; fill: none; vector-effect: non-scaling-stroke; }\n.fp-ceiling-marks text { fill: currentColor; stroke: #242b35; stroke-width: .042px; paint-order: stroke; font-size: .164px; }\n.fp-ceiling-marks .fp-slope-arrow { stroke-dasharray: none; }\n.fp-sensor-height rect { fill: #2b3441; stroke: #a39ccf; stroke-width: .014px; }\n.fp-sensor .fp-sensor-height text { font-size: .16px; stroke: none; }\n\n/* Spatial preview shares the plan coordinates and ceiling profiles. */\n#fp-space { user-select: none; cursor: grab; touch-action: pan-y; }\n#fp-space [data-item] { cursor: pointer; }\n#fp-space[data-orbiting], #fp-space[data-orbiting] [data-item] { cursor: grabbing; }\n.fp-shell[data-view="3d"] .fp-stage { background: radial-gradient(ellipse at 48% 41%, #363b40, #262b30 62%, #20242a); }\n.fp-space-guide { position: absolute; inset: auto 9px 8px; display: flex; align-items: center; justify-content: space-between; gap: 5px; color: #d7e0ea; font-size: 11px; pointer-events: none; }\n.fp-space-guide > span { padding: 5px 7px; border-radius: 5px; background: #28323d; }\n.fp-space-furniture { position: absolute; inset: 8px 10px auto auto; margin: 0; padding: 4px 7px; border-radius: 4px; color: #d7e0ea; background: #28323d; font-size: 11px; pointer-events: none; }\n.fp-space-floor {\n    --fp-floor: #d6cbbc;\n    fill: color-mix(in oklab, color-mix(in oklab, var(--fp-floor), var(--fp-sun, #faf0dd) var(--fp-floor-warm, 0%)), var(--fp-shade, #202631) var(--fp-floor-dim, 0%));\n    stroke: #928679; stroke-width: .5px; vector-effect: non-scaling-stroke;\n}\n.fp-space-floor[data-floor="boards"] { --fp-floor: #bfaa8f; }\n.fp-space-floor[data-floor="tiles"] { --fp-floor: #c9c6bb; }\n.fp-space-floor[data-floor="carpet"] { --fp-floor: #a9a196; }\n.fp-space-floor[data-floor="concrete"] { --fp-floor: #b5b4ae; }\n/* Wall colours a room can pick in the inspector. */\n.fp-space-wall[data-wall="sand"] { --fp-model-top: #f7efdf; --fp-model-face: #e2d2b3; }\n.fp-space-wall[data-wall="sage"] { --fp-model-top: #edf1e6; --fp-model-face: #b9c7ab; }\n.fp-space-wall[data-wall="blue"] { --fp-model-top: #ebf0f5; --fp-model-face: #a9bccd; }\n.fp-space-wall[data-wall="clay"] { --fp-model-top: #f5e9e2; --fp-model-face: #d3a891; }\n.fp-space-wall[data-wall="grey"] { --fp-model-top: #ecedee; --fp-model-face: #a7abb0; }\n/* Light for the time of day (see floor-planner-daylight.mjs). */\n.fp-daylight { --fp-sun: #faf0dd; --fp-shade: #202631; }\n.fp-daylight[data-daylight="morning"] { --fp-sun: #fff0d0; --fp-floor-warm: 5%; }\n.fp-daylight[data-daylight="midday"] { --fp-sun: #ffffff; }\n.fp-daylight[data-daylight="evening"] { --fp-sun: #ffb877; --fp-shade: #2b1f35; --fp-floor-warm: 12%; --fp-floor-dim: 10%; }\n.fp-daylight[data-daylight="night"] { --fp-sun: #a7bbe4; --fp-shade: #0b1322; --fp-floor-warm: 6%; --fp-floor-dim: 44%; }\n.fp-space-floor.selected { stroke: #c5bdff; stroke-width: 1.4px; }\n.fp-model-texture, .fp-model-shadow, .fp-model-base, .fp-model-furniture, .fp-model-rug,\n.fp-model-window, .fp-model-window-frame, .fp-model-window-sill { pointer-events: none; }\n.fp-model-texture[data-floor="boards"] { fill: url(#fp-floor-boards); }\n.fp-model-texture[data-floor="tiles"] { fill: url(#fp-floor-tiles); }\n.fp-model-shadow { fill: #0e1116; opacity: .65; transform: translate(.21px, .29px); filter: url(#fp-model-shadow); }\n.fp-interior-shadow { pointer-events: none; }\n.fp-wall-contact { fill: none; stroke: #49382c; stroke-width: .22px; opacity: .27; filter: url(#fp-contact-shadow); }\n.fp-furniture-shadow { fill: #352921; opacity: .23; filter: url(#fp-cast-shadow); }\n.fp-furniture-contact { fill: #302823; opacity: .28; filter: url(#fp-contact-shadow); }\n.fp-model-base { --fp-model-face: #928d87; }\n.fp-space-wall { --fp-model-top: #f4f0e7; --fp-model-face: #d9d4ca; }\n.fp-space-wall.selected { --fp-model-top: #eee6fc; --fp-model-face: #d6c8eb; }\n.fp-model-furniture { --fp-model-top: #b2afa5; --fp-model-face: #8d9189; }\n.fp-model-furniture[data-material="wood"] { --fp-model-top: #b89a77; --fp-model-face: #927351; }\n.fp-model-furniture[data-material="cabinet"] { --fp-model-top: #a8b3b9; --fp-model-face: #788d9b; }\n.fp-model-furniture[data-material="linen"] { --fp-model-top: #9da9b7; --fp-model-face: #6c8093; }\n.fp-model-furniture[data-material="pillow"] { --fp-model-top: #c0c7c9; --fp-model-face: #9ba8af; }\n.fp-model-furniture[data-material="duvet"] { --fp-model-top: #829b9e; --fp-model-face: #5d7c80; }\n.fp-model-furniture[data-material="counter"] { --fp-model-top: #b8bfbe; --fp-model-face: #84959d; }\n.fp-model-furniture[data-material="screen"] { --fp-model-top: #62798a; --fp-model-face: #415766; }\n.fp-model-rug { fill: #999b8b; stroke: #807d70; stroke-width: .5px; vector-effect: non-scaling-stroke; }\n.fp-model-rug[data-layer="0"] { fill: #c1b7a2; }\n.fp-model-rug[data-layer="1"] { stroke: #b2ac99; stroke-dasharray: 1.5px 1.2px; }\n.fp-model-window, .fp-model-window-frame, .fp-model-window-sill { stroke: #a7c4d6; stroke-width: .8px; vector-effect: non-scaling-stroke; }\n.fp-model-window { fill: #7794a9; }\n.fp-model-window-frame { fill: #a7c4d6; stroke-width: .45px; }\n.fp-model-window-sill { fill: #8db5cc; stroke: #8db5cc; stroke-width: .55px; }\n.fp-model-face, .fp-model-top {\n    --fp-lit: color-mix(in oklab, color-mix(in oklab, var(--fp-pigment), var(--fp-sun, #faf0dd) var(--fp-light, 0%)), var(--fp-shade, #202631) var(--fp-shadow, 0%));\n    fill: var(--fp-lit); stroke: var(--fp-lit); stroke-width: .28px; vector-effect: non-scaling-stroke; stroke-linejoin: round;\n}\n.fp-model-face { --fp-pigment: var(--fp-model-face); }\n.fp-model-top { --fp-pigment: var(--fp-model-top); }\n.fp .fp-depth-fragment { stroke: none; }\n.fp .fp-depth-fragment:is(.fp-model-face, .fp-model-top) { stroke: var(--fp-lit); stroke-width: .42px; }\n.fp .fp-depth-boundary { fill: none; }\n.fp-space-door { stroke: #d1b795; stroke-width: 1.6px; vector-effect: non-scaling-stroke; }\n.fp-space-door.selected { stroke: #ffe0a8; stroke-width: 3px; }\n.fp-space-ceiling { pointer-events: none; }\n.fp-space-ceiling :is(polygon, polyline) { fill: none; stroke: #9babbf; stroke-width: 1px; stroke-dasharray: 4 5; vector-effect: non-scaling-stroke; }\n.fp-space-ceiling.selected :is(polygon, polyline) { stroke: #cbc1ff; stroke-width: 1.5px; }\n.fp-space-room-label { fill: #282522; stroke: #f1e7d7c4; stroke-width: .038px; paint-order: stroke; stroke-linejoin: round; font-size: var(--fp-space-label, .27px); font-weight: 620; text-anchor: middle; pointer-events: none; }\n.fp-space-room-label { transition: opacity .25s ease; }\n.fp-space-room-label[data-near-person] { opacity: .16; }\n.fp-stair-plan { color: #ead4a7; }\n.fp-stairwell { fill: #3a372f; fill-opacity: .88; stroke: currentColor; stroke-width: .028px; }\n.fp-stair-plan line { stroke: #b6a486; stroke-width: .018px; }\n.fp-stair-plan path { fill: none; stroke: #ffe4af; stroke-width: .055px; stroke-linecap: round; stroke-linejoin: round; }\n.fp-stair-plan text { fill: #fff0ca; stroke: #262927; stroke-width: .06px; paint-order: stroke; font-size: var(--fp-label-size, .238px); font-weight: 750; }\n.fp-stair-opening { fill: #222832; stroke: #bcaa89; stroke-width: .032px; }\n.fp-stair-flight :is(.fp-stair-tread, .fp-stair-riser, .fp-stair-side) { stroke: #baa988; stroke-width: .025px; stroke-linejoin: round; }\n.fp-stair-flight .fp-stair-tread { fill: #aa9879; }\n.fp-stair-flight .fp-stair-riser { fill: #695c49; }\n.fp-stair-flight .fp-stair-side { fill: #85745b; }\n.fp-stair-flight :is(line, polyline) { fill: none; stroke: #ded0b6; stroke-width: .049px; stroke-linecap: round; }\n[data-stair-gait] :is(.fp-avatar-shadow, .fp-person-base) { visibility: hidden; }\n.fp-space-marker line { stroke: currentColor; stroke-dasharray: 2 4; stroke-width: 1px; vector-effect: non-scaling-stroke; opacity: .8; }\n.fp-space-marker ellipse { fill: currentColor; opacity: .7; }\n.fp-space-marker .fp-space-puck { fill: #edf1f4; opacity: 1; stroke: currentColor; stroke-width: 1px; vector-effect: non-scaling-stroke; }\n.fp-space-marker .fp-space-puck.side { fill: #82919d; }\n.fp-space-marker circle { r: var(--fp-space-pin, .29px); fill: #242b35; stroke: currentColor; stroke-width: 1.1px; vector-effect: non-scaling-stroke; }\n.fp-space-marker.selected circle { fill: #504878; stroke-width: 2px; }\n.fp-space-marker text { fill: currentColor; font-size: var(--fp-space-number, .19px); font-weight: 770; text-anchor: middle; dominant-baseline: central; }\n.fp-space-empty { position: absolute; inset: 45% 18px auto; margin: 0; text-align: center; color: #d7dfea; }\n\n/* Properties, project recovery and order dialog */\n.fp-handoff { margin-top: 14px; padding: 11px; border: 1px solid #ddd7fa; border-radius: 9px; background: #f7f5ff; }\n.fp-handoff h3 { margin: 0 0 4px; font-size: 13px; }\n.fp-handoff p + p { margin-top: 4px; }\n.fp-handoff a { display: inline-flex; gap: 5px; align-items: center; min-height: 34px; margin-top: 2px; font-size: 13px; font-weight: 700; }\n.fp-range-key { display: grid; gap: 3px; color: var(--fp-muted); font-size: 11px; }\n.fp-range-key[hidden] { display: none; }\n.fp-range-key span { display: flex; align-items: center; gap: 5px; }\n.fp-range-key i { display: inline-block; width: 15px; border-top: 2px dashed #6b61ca; }\n.fp-range-key span + span i { border-top-style: dotted; }\n.fp-ceiling-settings, .fp-mount { min-width: 0; margin: 3px 0 0; padding: 9px; border: 1px solid #d3dcf0; border-radius: 8px; background: #f7f9fe; }\n.fp-ceiling-settings { display: grid; gap: 7px; }\n.fp-ceiling-settings legend { padding: 0 4px; font-size: 12px; font-weight: 720; }\n.fp-mount p { display: flex; align-items: baseline; justify-content: space-between; gap: 5px; margin: 0; color: var(--fp-muted); font-size: 11px; }\n.fp-mount p strong { color: var(--fp-text); white-space: nowrap; font-size: 13px; }\n.fp-mount small { display: block; margin: 4px 0 0; color: var(--fp-muted); font-size: 11px; }\n#fp-inspector #fp-mount-level label { display: flex; align-items: center; min-height: 36px; margin: 3px 0 0; color: var(--fp-text); }\n#fp-inspector #fp-mount-level input { flex: none; width: 17px; min-height: 17px; accent-color: var(--fp-accent); }\n.fp-cross-section { margin: 6px 0 0; }\n.fp-cross-section svg { display: block; width: 100%; max-height: 92px; color: #5f50cf; background: #eef2fc; border-radius: 6px; }\n.fp-cross-section figcaption { display: flex; flex-wrap: wrap; gap: 2px 6px; justify-content: space-between; margin-top: 4px; color: var(--fp-muted); font-size: 10px; }\n.fp-cross-wall, .fp-cross-floor, .fp-cross-roof, .fp-cross-height, .fp-cross-direction { fill: none; stroke: currentColor; stroke-width: 2; }\n.fp-cross-wall, .fp-cross-floor { stroke: #8999b9; stroke-width: 1.25; }\n.fp-cross-height { stroke: #16775d; stroke-width: 1.1; stroke-dasharray: 3 2; }\n.fp-cross-direction { stroke: #16775d; }\n.fp-cross-marker { fill: #16775d; }\n.fp .fp-mount-edit { display: inline-flex; align-items: center; gap: 5px; min-height: 34px; margin-top: 2px; padding: 4px 0; color: var(--fp-accent); font-size: 12px; font-weight: 700; text-decoration: underline; text-underline-offset: .2em; }\n@media (pointer: coarse) { .fp .fp-mount-edit { min-height: 44px; } }\n.fp-cross-sides { display: flex; justify-content: space-between; padding: 2px 1px 0; color: #5a4caf; font-size: 10px; font-weight: 700; }\n.fp-cross-sides + figcaption { padding-top: 4px; border-top: 1px solid #dde4f2; }\n.fp-nudge { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; font-size: 11px; color: var(--fp-muted); }\n.fp-nudge span { margin-right: auto; }\n.fp-nudge button { width: 33px; height: 33px; border-color: var(--fp-border); font-size: 16px; color: var(--fp-text); }\n.fp-recovery { margin-top: 13px; padding: 9px 12px; border: 1px solid #e5c8a7; border-radius: 8px; background: #fff8ee; }\n.fp-recovery p { margin: 0 0 7px; }\n.fp-recovery button { min-height: 44px; border-color: #d9b98a; padding: 5px 9px; }\n.fp-order { width: min(660px, calc(100% - 28px)); max-height: min(760px, calc(100dvh - 32px)); padding: 0; margin: auto; border: 1px solid var(--fp-border); border-radius: 16px; background: var(--fp-panel); color: var(--fp-text); }\n.fp-order[open] { display: flex; flex-direction: column; }\n.fp-order::backdrop { background: #0c152ab8; }\n.fp-order-heading, .fp-order-footer { flex: none; padding: 15px 19px; }\n.fp-order-heading { display: flex; justify-content: space-between; align-items: start; gap: 10px; border-bottom: 1px solid var(--fp-border); }\n.fp-order-heading h2 { margin: 0; font-size: 21px; }\n.fp-order-heading p { margin: 4px 0 0; color: var(--fp-muted); }\n.fp #fp-order-close { flex: none; width: 44px; height: 44px; border-color: var(--fp-border); font-size: 23px; line-height: 1; }\n.fp-order-body { min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 0 19px; }\n.fp-order-room { padding: 13px 0; border-bottom: 1px solid var(--fp-border); }\n.fp-order-room:last-child { border-bottom: 0; }\n.fp-order-room h3 { margin: 0 0 6px; font-size: 13px; font-weight: 720; color: var(--fp-muted); }\n.fp-order-line { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 8px; padding: 6px 0; }\n.fp-order-choice { display: flex; align-items: center; min-height: 30px; gap: 8px; }\n.fp-order-choice input { width: 17px; height: 17px; flex: none; accent-color: var(--fp-accent); }\n.fp-order-price { max-width: 23ch; text-align: right; color: var(--fp-muted); font-size: 12px; }\n.fp-order-options { display: grid; grid-template-columns: minmax(0, 1fr); grid-column: 1 / -1; gap: 4px; padding-left: 25px; color: var(--fp-muted); font-size: 12px; }\n.fp-order-variant { min-width: 0; }\n.fp-order-variant select { max-width: 100%; min-height: 38px; padding: 4px 22px 4px 7px; border: 1px solid var(--fp-border); border-radius: 6px; background: #f8faff; color: var(--fp-text); }\n.fp-order-footer { border-top: 1px solid var(--fp-border); background: #f7f9fe; }\n.fp-order-notice { margin: 0 0 8px; color: var(--fp-muted); font-size: 12px; }\n.fp-order-notice:empty { display: none; }\n.fp-order-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; }\n.fp-order-actions div { margin-right: auto; }\n.fp-order-actions span, .fp-order-actions strong { display: block; }\n.fp-order-actions span { color: var(--fp-muted); font-size: 11px; }\n.fp-order-actions strong { font-size: 19px; }\n.fp #fp-order-add, .fp #fp-order-cart { min-height: 44px; padding: 7px 11px; border-radius: 7px; font-weight: 700; }\n.fp #fp-order-add { color: #fff; background: var(--fp-accent); }\n.fp #fp-order-cart:not([hidden]) { display: inline-flex; align-items: center; color: #fff; background: var(--fp-accent); }\n\n@media (min-width: 761px) {\n    .fp-workspace { height: clamp(520px, calc(100svh - 268px), 840px); }\n    .fp-sidebar-content { overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }\n}\n\n@media (max-width: 920px) {\n    .fp-legend-limit { margin-left: 0; }\n}\n@media (max-width: 760px) {\n    .fp-shell { padding-inline: 10px; }\n    .fp-header { padding: 15px 0 12px; }\n    .fp-intro { max-width: 52ch; font-size: 13px; }\n    .fp-project { gap: 4px; padding: 4px 7px; }\n    .fp-project .fp-floors { flex: 1 1 78px; }\n    #fp-mobile-project-options { margin-bottom: 5px; padding: 2px 4px 9px; border-bottom: 1px solid var(--fp-border); }\n    #fp-mobile-project-options .fp-project-name { display: grid; gap: 5px; font-size: 12px; font-weight: 650; }\n    #fp-mobile-project-options .fp-project-name > svg { display: none; }\n    #fp-mobile-project-options .fp-project-name > span { display: block; }\n    #fp-mobile-project-options .fp-project-name input { width: 100%; padding-inline: 9px; border-color: var(--fp-border); background: var(--fp-bg); font-weight: 500; }\n    .fp :is(.fp-view-menu, .fp-toolbox) > summary { min-height: 44px; }\n    .fp-project-name { flex: 1; gap: 2px; }\n    .fp-project-name input { width: 100%; min-height: 44px; padding-inline: 3px; font-size: 16px; }\n    .fp #fp-open-order { min-height: 44px; padding-inline: 6px; gap: 4px; font-size: 12px; }\n    .fp #fp-open-order > svg { width: 16px; height: 16px; }\n    .fp-order-title { display: none; }\n    .fp-order-short { display: inline; }\n    .fp-workspace { display: block; }\n    .fp-stage { min-height: clamp(285px, calc(100svh - 380px), 485px); }\n    .fp-shell[data-view="3d"] .fp-stage { min-height: clamp(245px, calc(100svh - 530px), 390px); }\n    .fp-stage-top { inset: 7px 7px auto; }\n    .fp-hint { padding: 4px 6px; font-size: 11px; }\n    .fp-viewbar, .fp-toolbar { padding: 3px 5px; }\n    .fp-viewbar button, .fp-toolbar button, .fp-stage .fp-place-actions button { min-height: 44px; }\n    .fp .fp-toolbar :is(button,summary) { min-height: 44px; }\n    .fp .fp-toolbar { padding: 0; }\n    .fp-toolbox-content { max-height: 47dvh; }\n    .fp-scale { left: 9px; bottom: 10px; }\n    .fp-legend { border-radius: 0; }\n    .fp-placement-bar { padding: 7px 8px; }\n    .fp .fp-placement-bar button, .fp .fp-library-filters button, .fp .fp-catalog-advice,\n    .fp .fp-undo-notice button, .fp #fp-add-room { min-height: 44px; }\n    .fp .fp-selection-jump { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 3px 5px; color: #e8eef8; font-size: 12px; white-space: nowrap; }\n    .fp .fp-selection-jump:hover { background: #454f61; }\n    .fp :is(.fp-view-menu, .fp-toolbox) > summary { gap: 4px; padding-inline: 5px; }\n    .fp .fp-toolbox > summary svg:first-child { display: none; }\n    #fp-outline, #fp-inspector-title { scroll-margin-block-start: calc(var(--shs-header-height, 5rem) + 12px); }\n    #fp-placement-bar { scroll-margin-block-start: calc(var(--shs-header-height, 5rem) + 62px); }\n    .fp-sidebar { border-left: 0; border-top: 1px solid var(--fp-border); border-radius: 0 0 13px 13px; }\n    .fp-sidebar-nav { gap: 22px; }\n    .fp-panel { padding: 12px; }\n    .fp-library-header button, .fp-room-row, #fp-search, .fp-device-group button,\n    #fp-structure-items button, .fp-inspector-actions button, #fp-inspector #fp-mount-level label { min-height: 44px; }\n    #fp-inspector input, #fp-inspector select, #fp-search { font-size: 16px; }\n    #fp-inspector input, #fp-inspector select { min-height: 44px; }\n    .fp-nudge button { width: 44px; height: 44px; }\n    .fp-order-heading, .fp-order-footer { padding: 11px 12px; }\n    .fp-order-body { padding-inline: 12px; }\n    .fp-order-choice { min-height: 44px; }\n    .fp-order-variant select { min-height: 44px; font-size: 16px; }\n}\n@media (max-width: 359px) {\n    .fp-view-label { display: none; }\n}\n@media (pointer: coarse) {\n    #fp-plan[data-tool="edit"] .fp-sensor-halo { stroke: transparent; stroke-width: 20px; vector-effect: non-scaling-stroke; pointer-events: all; }\n    .fp .fp-touch-move { display: inline-flex; align-items: center; justify-self: start; min-height: 44px; border-color: var(--fp-border); }\n}\n@media (max-width: 360px) {\n    .fp #fp-open-order > svg { display: none; }\n    .fp-toolbar-trigger > svg:first-child { display: none; }\n    .fp :is(.fp-view-menu, .fp-toolbox) > summary { gap: 2px; padding-inline: 3px; }\n    .fp :is(.fp-view-menu, .fp-toolbox) > summary svg { width: 11px; }\n    .fp .fp-selection-jump { gap: 3px; padding-inline: 3px; }\n}\n\n.fp-view-actions { display: flex; align-items: center; gap: 4px; }\n.fp-turn-label { white-space: nowrap; }\n.fp-shell[data-simulation] :is(.fp-toolbox, .fp-sidebar-nav, #fp-outline, #fp-properties, .fp-stage-top) { display: none; }\n.fp-floors { min-width: 0; max-width: 245px; font-size: 13px; }\n.fp-floor-menu { position: relative; }\n#fp-floor-current { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n.fp-floor-arrow-down { transform: rotate(180deg); }\n.fp-floor-panel h2 { margin: 2px 4px 9px; font-size: 14px; font-weight: 750; }\n.fp-floor-choices { display: grid; gap: 2px; max-height: min(204px, 35dvh); overflow-y: auto; padding: 3px; margin-inline: -3px; }\n.fp .fp-floor-choice[aria-current="true"] { border-color: #ddd5fc; color: var(--fp-accent); background: var(--fp-selected); font-weight: 700; }\n.fp-floor-level { display: grid; flex: 0 0 30px; place-items: center; min-height: 26px; border-radius: 6px; color: var(--fp-muted); background: var(--fp-bg); font-size: 11px; font-weight: 750; font-variant-numeric: tabular-nums; }\n.fp-floor-choice[aria-current="true"] .fp-floor-level { color: inherit; background: #e5dfff; }\n.fp-floor-choice-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }\n.fp-floor-choice:not([aria-current="true"]) .fp-floor-check { visibility: hidden; }\n.fp-floor-field { display: grid; gap: 5px; margin-block: 10px; padding: 10px 4px 0; border-top: 1px solid var(--fp-border); color: var(--fp-muted); font-size: 12px; font-weight: 650; }\n.fp .fp-floor-field input { width: 100%; min-height: 44px; color: var(--fp-text); }\n.fp .fp-floor-field input:not([type="range"]) { padding: 6px 9px; border: 1px solid var(--fp-border); border-radius: 7px; background: var(--fp-bg); font-size: 14px; font-weight: 500; }\n.fp-floor-actions { padding-top: 4px; border-top: 1px solid var(--fp-border); }\n.fp .fp-floor-actions button { color: var(--fp-accent); font-weight: 650; }\n.fp .fp-floor-actions button[data-action="remove_floor"] { color: #9d2523; }\n#fp-zone-options { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }\n#fp-zone-type { min-height: 35px; border-radius: 5px; border: 1px solid #657181; background: #222b36; color: #eef1f6; }\n#fp-room-metrics { padding: 10px; margin-bottom: 2px; border: 1px solid var(--fp-border); border-radius: 8px; background: #f5f7fb; }\n.fp-room-metric-lead { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }\n.fp-room-metric-lead:last-child { margin-bottom: 0; }\n.fp-room-metric-lead strong { font-size: 19px; }\n.fp-inspector-more { border-top: 1px solid var(--fp-border); }\n.fp-inspector-more > summary { min-height: 44px; padding-block: 12px; color: var(--fp-accent); font-size: 13px; font-weight: 650; }\n.fp-inspector-more > div { display: grid; gap: 8px; }\n.fp-room-metric-lead span { color: var(--fp-muted); font-size: 12px; }\n.fp-room-metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; }\n.fp-room-metric-grid strong { font-variant-numeric: tabular-nums; }\n@media (max-width: 760px) {\n    .fp :is(.fp-floor-field input:not([type="range"]), #fp-zone-type) { min-height: 44px; font-size: 16px; }\n    .fp-project-menu, .fp-floor-menu { position: static; }\n    .fp-toolbar-trigger { gap: 5px; padding-inline: 7px; }\n    .fp-toolbar-panel { inset-inline-start: 7px; width: min(306px, calc(100% - 14px)); font-size: 14px; }\n    #fp-floor-current { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; white-space: normal; overflow-wrap: anywhere; line-height: 1.18; }\n}\n.fp-shell[data-simulation] #fp-plan[data-tool="edit"] [data-item] { cursor: default; }\n.fp-shell[data-simulation] :is(#fp-plan .fp-room-floor, #fp-space .fp-space-floor) { cursor: crosshair; }\n\n/* Reach test overlay */\n.fp-sim-guide {\n    --fp-sim-text: #edf1f6;\n    --fp-sim-muted: #b6c1cf;\n    --fp-sim-rule: #414b59;\n    display: grid;\n    padding: 4px 12px;\n    color: var(--fp-sim-text);\n    background: #242b34;\n    font-size: 12px;\n}\n.fp-sim-guide p { margin: 0; }\n.fp-sim-guide :focus-visible { outline-color: #bcb5ff; }\n.fp-sim-people, .fp-sim-overview, .fp-sim-footer {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 6px;\n    min-width: 0;\n}\n.fp-sim-people { padding-bottom: 3px; border-bottom: 1px solid var(--fp-sim-rule); }\n.fp-sim-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; }\n.fp .fp-sim-picker button {\n    display: inline-flex;\n    align-items: center;\n    gap: 5px;\n    min-height: 36px;\n    padding: 4px 7px;\n    color: var(--fp-sim-muted);\n    font-weight: 650;\n}\n.fp-sim-picker i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--fp-avatar-tone, #ffd67d); }\n.fp-sim-picker [data-walker="woman"], [data-avatar="woman"] { --fp-avatar-tone: #8ce4d8; }\n.fp-sim-picker [data-walker="child"], [data-avatar="child"] { --fp-avatar-tone: #d4c1ff; }\n.fp .fp-sim-picker button:hover, .fp .fp-sim-picker button[aria-pressed="true"] { color: var(--fp-sim-text); background: #39434f; }\n.fp .fp-sim-picker button[aria-pressed="true"] { border-color: #626e7e; }\n\n.fp-sim-overview { padding-block: 7px; }\n#fp-sim-at { min-width: 0; padding-inline-start: 4px; overflow-wrap: anywhere; }\n#fp-sim-room-label { display: block; font-size: 15px; font-weight: 730; line-height: 1.25; }\n#fp-sim-floor-label { display: block; margin-top: 2px; color: var(--fp-sim-muted); }\n.fp .fp-sim-reading {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    flex: none;\n    min-height: 48px;\n    max-width: 48%;\n    padding: 3px 5px 3px 9px;\n    color: var(--fp-sim-text);\n    text-align: left;\n    background: #303a46;\n}\n.fp .fp-sim-reading:hover { background: #3d4857; }\n.fp-sim-reading strong { display: block; font-size: 15px; font-weight: 730; line-height: 1.1; font-variant-numeric: tabular-nums; }\n.fp-sim-reading span span { color: var(--fp-sim-muted); font-size: 11px; line-height: 1.2; }\n.fp-sim-guide .fp-sim-reading svg { width: 14px; height: 14px; color: var(--fp-sim-muted); }\n\n.fp-sim-footer { border-top: 1px solid var(--fp-sim-rule); }\n.fp-sim-footer:has(#fp-sim-tools[hidden]) { justify-content: flex-end; }\n#fp-sim-exit { flex: none; }\n.fp-sim-keys { color: var(--fp-sim-muted); text-align: center; line-height: 1.2; }\n.fp .fp-sim-footer [data-action="test_person"] {\n    min-height: 39px;\n    padding: 4px;\n    border-color: transparent;\n    color: var(--fp-sim-muted);\n    background: transparent;\n    font-size: 12px;\n    font-weight: 650;\n}\n.fp .fp-sim-footer [data-action="test_person"]:hover { color: var(--fp-sim-text); background: #39434f; }\n.fp-sim-panel-head button { display: none; }\n\n.fp-sim-menu { position: relative; flex: none; }\n.fp-sim-menu > summary {\n    display: flex;\n    align-items: center;\n    gap: 4px;\n    min-height: 36px;\n    padding: 4px 6px;\n    border-radius: 6px;\n    color: var(--fp-sim-muted);\n    font-weight: 650;\n    list-style: none;\n}\n.fp-sim-menu > summary::-webkit-details-marker { display: none; }\n.fp-sim-menu > summary:hover, .fp-sim-menu[open] > summary { color: var(--fp-sim-text); background: #39434f; }\n.fp-sim-menu > summary svg, .fp-stair-symbol { flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.55; stroke-linecap: round; stroke-linejoin: round; }\n.fp-sim-menu > summary svg:last-child { width: 13px; height: 13px; }\n.fp-sim-menu[open] > summary svg:last-child { transform: rotate(180deg); }\n.fp-sim-options {\n    position: absolute;\n    z-index: 2;\n    inset: calc(100% + 4px) auto auto 0;\n    display: grid;\n    width: max-content;\n    min-width: 172px;\n    max-width: min(240px, calc(100vw - 40px));\n    max-height: min(215px, 40dvh);\n    overflow-y: auto;\n    padding: 4px;\n    border: 1px solid #5a6574;\n    border-radius: 8px;\n    background: #2c3540;\n    box-shadow: 0 8px 16px #141b2580;\n}\n#fp-sim-cast .fp-sim-options { right: 0; left: auto; }\n@media (max-height: 560px) {\n    #fp-sim-tools .fp-sim-options { inset-block: auto calc(100% + 4px); }\n}\n.fp .fp-sim-options button {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    min-height: 39px;\n    padding: 5px 8px;\n    color: var(--fp-sim-text);\n    text-align: left;\n    font-weight: 650;\n}\n.fp .fp-sim-options button:hover { background: #3d4857; }\n.fp .fp-sim-options button[aria-pressed="true"] { color: #ddf6eb; background: #304d43; border-color: #6a9983; }\n.fp-sim-options button svg { color: var(--fp-sim-muted); }\n[data-toggle-walker][data-present] .fp-sim-add-line,\n.fp-sim-auto:not([aria-pressed="true"]) svg path:last-child,\n.fp-sim-auto[aria-pressed="true"] svg path:first-child { display: none; }\n\n.fp-stair-prompt {\n    display: grid;\n    grid-template-columns: auto minmax(0, 1fr) auto auto;\n    align-items: center;\n    gap: 6px;\n    padding: 5px 2px 5px 8px;\n    margin-bottom: 7px;\n    border: 1px solid #8e7451;\n    border-radius: 7px;\n    background: #3a3128;\n    color: #ffedca;\n}\n.fp-stair-prompt p { font-weight: 660; line-height: 1.3; overflow-wrap: anywhere; }\n.fp-stair-prompt[data-direction="down"] .fp-stair-symbol { transform: scaleX(-1); }\n.fp .fp-stair-prompt [data-action="confirm_stair"] {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    min-height: 38px;\n    padding: 4px 8px;\n    background: #ffe5af;\n    color: #30261a;\n    font-weight: 730;\n}\n.fp .fp-stair-prompt [data-action="confirm_stair"]:hover { background: #fff1d2; }\n.fp .fp-stair-prompt [data-action="dismiss_stair"] { display: grid; place-items: center; min-width: 34px; min-height: 38px; padding: 0; }\n.fp .fp-stair-prompt [data-action="dismiss_stair"]:hover { background: #554536; }\n.fp-stair-prompt kbd { padding: 0 4px; border: 1px solid #a88f62; border-radius: 3px; font: inherit; font-size: 10px; }\n@media (pointer: coarse) { .fp-stair-prompt kbd { display: none; } }\n\n.fp-sim-feedback {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 8px;\n    padding: 2px 4px 8px;\n    color: #cdebdc;\n}\n.fp-sim-feedback:not(:has(p:not(:empty), button:not([hidden]))) { display: none; }\n#fp-sim-activity:not(:empty) { color: #ffe5a9; font-weight: 700; }\n#fp-sim-activity[data-alarm="true"] { color: #ffc6c9; }\n.fp-sim-guide[data-stair-travel] :is(.fp-sim-people, .fp-sim-overview, .fp-sim-footer, #fp-sim-activity) { display: none; }\n.fp-sim-guide[data-stair-travel] .fp-sim-feedback { padding: 5px 1px 5px 4px; color: #ffe5af; font-weight: 700; }\n.fp .fp-sim-feedback [data-action="stop_stairs"] {\n    min-height: 44px;\n    padding-inline: 8px;\n    border-color: #8e7451;\n    color: #ffe5af;\n}\n.fp .fp-sim-feedback [data-action="stop_stairs"]:hover { background: #4b4031; }\n.fp-room-alarm {\n    fill: #ff5263;\n    fill-opacity: .15;\n    stroke: #ff7783;\n    stroke-width: 3px;\n    stroke-linejoin: round;\n    vector-effect: non-scaling-stroke;\n    animation: fp-room-alarm 1.6s ease-in-out infinite alternate;\n}\n@keyframes fp-room-alarm { from { opacity: .58; } to { opacity: 1; } }\n.fp-stage .fp-sim-alarm { color: #ff7783; }\n.fp-stage .fp-sim-alarm :is(.fp-sensor-halo, circle) { stroke: #ff7783; fill: #8f303b; }\n.fp-person-flat[data-activity="fall"] .fp-person-base,\n.fp-person-space[data-activity="fall"] .fp-person-base { stroke: #ff7783; }\n\n.fp-fire-glow { fill: #ff923e; opacity: .25; }\n.fp-fire-flicker, .fp-fire-core { transform-origin: 0 0; }\n.fp-fire-flicker { animation: fp-fire-flicker .53s ease-in-out infinite alternate; }\n.fp-fire-core { animation: fp-fire-flicker .37s ease-in-out infinite alternate-reverse; }\n@keyframes fp-fire-flicker {\n    from { transform: scale(.86, .88) skewX(-6deg); }\n    to { transform: scale(1.08, 1.09) skewX(7deg); }\n}\n.fp-smoke-haze {\n    fill: #b7c2cd;\n    opacity: .28;\n    animation: fp-smoke-haze 5.4s ease-out both;\n    animation-delay: var(--fp-smoke-age);\n}\n@keyframes fp-smoke-haze { from { opacity: 0; } to { opacity: .28; } }\n.fp-smoke-spread {\n    animation: fp-smoke-spread 3.6s cubic-bezier(.22, 1, .36, 1) both;\n    animation-delay: calc(var(--fp-smoke-age) + var(--fp-smoke-wait));\n}\n@keyframes fp-smoke-spread {\n    from { opacity: 0; transform: translate(var(--fp-smoke-x), var(--fp-smoke-y)) scale(.30); }\n    to { opacity: 1; transform: translate(0, 0) scale(1); }\n}\n.fp-smoke-wisp { animation: fp-smoke-wisp 3.1s ease-in-out infinite alternate; }\n.fp-room-smoke > g:nth-of-type(2n) .fp-smoke-wisp { animation-direction: alternate-reverse; }\n@keyframes fp-smoke-wisp {\n    from { transform: translate(-.09px, .06px) scale(.94); }\n    to { transform: translate(.14px, -.08px) scale(1.08); }\n}\n.fp-fall-impact {\n    fill: none;\n    stroke: #ffd496;\n    stroke-width: 2.2px;\n    vector-effect: non-scaling-stroke;\n    animation: fp-fall-impact .65s ease-out both;\n}\n@keyframes fp-fall-impact { from { opacity: .9; transform: scale(.42); } to { opacity: 0; transform: scale(1.36); } }\n@media (prefers-reduced-motion: reduce) {\n    .fp-room-alarm, .fp-fire-flicker, .fp-fire-core, .fp-smoke-haze,\n    .fp-smoke-spread, .fp-smoke-wisp, .fp-fall-impact { animation: none; }\n}\n.fp-sim-dock { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 4px 8px; border-top: 1px solid var(--fp-stage-border); background: var(--fp-stage-bar); color: #e6ebf2; }\n.fp-sim-dock :is(.fp-sim-poses, .fp-sim-arrows) { display: flex; align-items: center; gap: 3px; }\n.fp-sim-dock button { display: grid; place-items: center; min-height: 39px; padding: 2px 9px; font-size: 12px; font-weight: 650; }\n.fp-sim-dock button:hover { background: #414a57; }\n.fp .fp-sim-dock button[aria-pressed="true"] { background: #4a402e; border-color: #958159; color: #ffe5a9; }\n.fp-sim-arrows button { min-width: 39px; padding-inline: 3px; background: #363e4a; touch-action: none; user-select: none; -webkit-touch-callout: none; }\n.fp-sim-arrows button[data-held] { color: #151e30; background: #ffe5a9; }\n.fp-sim-arrows button[data-held]:hover { background: #ffe5a9; }\n.fp-sim-arrows [data-person-move="ArrowLeft"] svg { transform: rotate(-90deg); }\n.fp-sim-arrows [data-person-move="ArrowDown"] svg { transform: rotate(180deg); }\n.fp-sim-arrows [data-person-move="ArrowRight"] svg { transform: rotate(90deg); }\n.fp-sim-dock :focus-visible { outline-color: #ffe5a9; }\n\n.fp-person-flat, .fp-person-space { pointer-events: visiblePainted; cursor: pointer; }\n.fp-person-base { fill: #453923; stroke: var(--fp-avatar-tone, #ffd67d); stroke-width: 1.45px; vector-effect: non-scaling-stroke; }\n.fp-person-space .fp-person-base { fill-opacity: .08; stroke-opacity: .55; }\n/* The diamond above a person: green when a radar sees them, amber when only\n   furniture hides them, red when no radar covers the spot. */\n.fp-plumbob { pointer-events: none; }\n.fp-plumbob-gem { transform-box: fill-box; transform-origin: center; animation: fp-plumbob 2.4s ease-in-out infinite; }\n.fp-plumbob-edge { fill: none; stroke: #ffffff8c; stroke-width: .9px; vector-effect: non-scaling-stroke; }\n.fp-plumbob :is(.fp-plumbob-lit, .fp-plumbob-shade) { stroke: #10291b66; stroke-width: .6px; stroke-linejoin: round; vector-effect: non-scaling-stroke; }\n.fp-plumbob[data-status="clear"] { --fp-gem-lit: #7ce08a; --fp-gem-shade: #2f9d4a; }\n.fp-plumbob[data-status="shadow"] { --fp-gem-lit: #ffd36b; --fp-gem-shade: #c98a1d; }\n.fp-plumbob[data-status="none"] { --fp-gem-lit: #ff8a7d; --fp-gem-shade: #bd3d33; }\n.fp-plumbob-lit { fill: var(--fp-gem-lit); }\n.fp-plumbob-shade { fill: var(--fp-gem-shade); }\n@keyframes fp-plumbob {\n    0%, 100% { transform: translateY(0) scaleX(1); }\n    50% { transform: translateY(-.06px) scaleX(.82); }\n}\n@media (prefers-reduced-motion: reduce) {\n    .fp-plumbob-gem { animation: none; }\n    .fp-space-room-label { transition: none; }\n}\n.fp-person-space:is([data-active], :hover) .fp-person-base { stroke-opacity: 1; }\n.fp-person-body { fill: none; stroke: #ffdc91; stroke-linecap: round; stroke-linejoin: round; }\n.fp-person-body :is(path, circle, polyline) { stroke-width: 1.9px; vector-effect: non-scaling-stroke; }\n.fp-person-body circle { fill: #ffdc91; }\n[data-avatar="woman"] .fp-person-base { fill: #213b3d; }\n[data-avatar="child"] .fp-person-base { fill: #3d3452; }\n:is([data-avatar="woman"], [data-avatar="child"]) .fp-person-body { stroke: var(--fp-avatar-tone); }\n:is([data-avatar="woman"], [data-avatar="child"]) .fp-person-body circle { fill: var(--fp-avatar-tone); }\n:is(.fp-person-flat, .fp-person-space):is([data-active], :hover) .fp-person-base { stroke: #fff4d5; stroke-width: 2.7px; }\n.fp-avatar-shadow { fill: #30271e; opacity: .32; filter: url(#fp-contact-shadow); }\n.fp-avatar-mesh polygon { stroke-width: .003px; stroke-linejoin: round; }\n.fp-stage .fp-sim-seen { color: #ffe5a9; }\n.fp-sensor.fp-sim-seen .fp-sensor-halo { fill-opacity: .26; }\n.fp-space-marker.fp-sim-seen circle { fill: #4a402e; stroke-width: 1.8px; }\n\n.fp-walk-trail, .fp-walk-link { fill: none; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; }\n.fp-walk-trail { stroke: #9de4bf; stroke-width: 3px; }\n.fp-walk-trail[data-covered="false"] { stroke: #ffbf75; stroke-dasharray: 5 4; }\n.fp-walk-link { stroke: #d5ccff; stroke-width: 1.6px; stroke-dasharray: 2 5; }\n.fp-route-key { display: inline-block; width: 16px; border-top: 2px solid #18835e; }\n.fp-route-gap { border-top-color: #a95d17; border-top-style: dashed; }\n.fp-route-link { border-top-color: var(--fp-accent); border-top-style: dotted; }\n.fp-shell[data-simulation] .fp-legend > span:not([data-walk-legend]) { display: none; }\n\n.fp-sim-panel-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }\n.fp-simulation h2 { margin: 0 0 4px; font-size: 16px; scroll-margin-block-start: 12px; }\n#fp-sim-summary { margin: 0 0 13px; color: #365a4c; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }\n#fp-sim-dual-note { margin: -5px 0 10px; }\n.fp-simulation label { display: block; margin-bottom: 4px; color: var(--fp-muted); font-size: 12px; }\n#fp-sim-room { width: 100%; min-height: 38px; padding: 4px 7px; border: 1px solid var(--fp-border); border-radius: 6px; background: #f7f9fc; color: var(--fp-text); }\n.fp-route-summary { margin-top: 14px; padding: 8px 0 10px; border-block: 1px solid var(--fp-border); }\n.fp-route-heading { display: flex; align-items: center; gap: 6px; }\n.fp-route-heading h3 { margin: 0; font-size: 13px; font-weight: 690; }\n.fp-route-heading svg { width: 17px; height: 17px; flex: none; fill: none; stroke: #267656; stroke-width: 1.5; }\n.fp-route-heading button { min-height: 32px; margin-left: auto; padding: 2px 4px; color: var(--fp-accent); font-size: 12px; font-weight: 650; }\n.fp-route-heading button:disabled { color: var(--fp-muted); }\n.fp-route-meter { height: 5px; margin: 3px 0 6px; overflow: hidden; border-radius: 4px; background: #f5cca8; }\n.fp-route-meter span { display: block; height: 100%; background: #248768; }\n.fp-sim-position { margin: 9px 0 0; color: var(--fp-muted); font-size: 12px; font-variant-numeric: tabular-nums; }\n#fp-sim-sensors { margin: 5px 0 13px; padding: 0; list-style: none; }\n#fp-sim-sensors li { padding: 9px 0; border-bottom: 1px solid var(--fp-border); }\n.fp-sim-device { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; font-size: 13px; }\n.fp-sim-light { flex: none; width: 7px; height: 7px; margin-left: auto; border-radius: 50%; background: #98a4b6; }\n.fp-sim-light[data-seen="true"] { background: #16835f; }\n.fp-sim-signal { display: flex; align-items: baseline; justify-content: space-between; gap: 7px; padding: 2px 0; color: var(--fp-muted); font-size: 11px; }\n.fp-sim-signal [data-seen] { text-align: right; }\n.fp-sim-signal [data-seen="true"], .fp-sim-height { color: #087052; font-weight: 700; }\n.fp-sim-height { margin: 2px 0 4px; font-size: 11px; }\n.fp-sim-explanation { margin-top: 9px; color: var(--fp-text); font-size: 12px; }\n.fp-sim-explanation p { margin-top: 4px; }\n\n@container (max-width: 550px) {\n    .fp-view-label { display: none; }\n}\n@container (max-width: 355px) {\n    .fp-turn-label { display: none; }\n    .fp-turn { min-width: 44px; justify-content: center; }\n}\n@media (max-width: 760px) {\n    .fp-shell[data-simulation] .fp-stage { min-height: clamp(255px, calc(100svh - 510px), 475px); }\n    .fp-shell[data-simulation][data-view="3d"] .fp-stage { min-height: clamp(235px, calc(100svh - 545px), 385px); }\n    .fp .fp-sim-guide :is(.fp-sim-picker button, .fp-sim-menu summary, .fp-sim-options button, .fp-sim-footer [data-action="test_person"], .fp-stair-prompt button) { min-height: 44px; }\n    .fp .fp-stair-prompt [data-action="dismiss_stair"] { min-width: 44px; }\n    .fp-sim-panel-head button { display: inline-block; min-height: 44px; color: var(--fp-accent); font-size: 12px; font-weight: 650; }\n    .fp-sim-dock { gap: 8px; padding-inline: 4px; }\n    .fp-sim-dock button { min-height: 44px; }\n    .fp-sim-arrows button { min-width: 44px; }\n    .fp-route-heading button { min-height: 44px; }\n    #fp-sim-room { min-height: 44px; font-size: 16px; }\n}\n@media (pointer: coarse) { .fp-sim-guide .fp-sim-keys { display: none; } }\n@media (max-width: 389px) {\n    .fp-sim-dock { flex-wrap: wrap; gap: 4px 9px; }\n    .fp-sim-poses button { padding-inline: 7px; }\n}\n\n.fp-radar-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding: 8px 11px; border-top: 1px solid var(--fp-stage-border); background: #272d35; color: #e6ebf2; font-size: 12px; }\n.fp-radar-choice { display: grid; gap: 3px; min-width: 0; flex: 1 1 200px; max-width: 265px; }\n.fp-radar-choice label { color: #d7e0ea; font-weight: 650; }\n#fp-radar-focus { width: 100%; min-height: 34px; padding: 4px 7px; border: 1px solid #657286; border-radius: 6px; color: #f1f4f8; background: #363e4a; }\n.fp-radar-radii { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; flex: 1 1 280px; max-width: 375px; }\n.fp-radar-radius { display: grid; gap: 1px; min-width: 0; padding: 4px 6px; border: 1px solid transparent; border-radius: 6px; color: #d7e0ea; }\n.fp-radar-radius.active { border-color: #657286; background: #333b47; }\n.fp-radar-radius > span { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; }\n.fp-radar-radius i { width: 10px; height: 0; flex: none; border-top: 2px solid var(--fp-profile-color); }\n.fp-radar-radius[data-profile="standing"] i { border-top-style: dashed; }\n.fp-radar-radius[data-profile="moving"] i { border-top-style: dotted; }\n.fp-radar-radius strong { font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }\n#fp-beam-note { flex: 1 1 168px; max-width: 29ch; margin: 0; color: #c4cfda; font-size: 11px; }\n.fp-radar-panel :focus-visible { outline-color: #bdb6ff; }\n\n.fp [data-profile="seated"] { --fp-profile-color: #ffd28b; --fp-profile-dash: none; }\n.fp [data-profile="standing"] { --fp-profile-color: #b2baff; --fp-profile-dash: 7 4; }\n.fp [data-profile="moving"] { --fp-profile-color: #8be3d8; --fp-profile-dash: 2 4; }\n.fp .fp-range .fp-profile-rim { fill: none; stroke: var(--fp-profile-color); stroke-width: 1.3px; stroke-dasharray: var(--fp-profile-dash); }\n.fp .fp-range .fp-profile-rim.active { stroke-width: 1.9px; }\n#fp-cone-space, .fp-stack-beam { --fp-beam-color: #a1aaff; }\n#fp-cone-space[data-detected="true"] { --fp-beam-color: #92ecd5; }\n#fp-cone-space[data-detected="true"].fp-beam-pulse { animation: fp-beam-detected .42s cubic-bezier(.22, 1, .36, 1) both; }\n.fp-wall-sector {\n    fill: #7ee7c1;\n    fill-opacity: .17;\n    stroke: #88e8c5;\n    stroke-opacity: .78;\n    stroke-width: 1.45px;\n    vector-effect: non-scaling-stroke;\n}\n.fp-wall-sector[data-secondary="true"] { fill-opacity: .035; stroke-dasharray: 3 4; }\n.fp-wall-fan[data-plane="height"] .fp-wall-sector { fill-opacity: .12; stroke-width: 2px; stroke-opacity: 1; }\n#fp-cone-space[data-wall][data-detected="true"] .fp-wall-sector { fill-opacity: .25; stroke: #bcf6dc; }\n.fp-beam-near { stop-color: var(--fp-beam-color); stop-opacity: .46; }\n.fp-beam-far { stop-color: var(--fp-beam-color); stop-opacity: .07; }\n.fp-beam-shell { stroke: var(--fp-beam-color); stroke-opacity: .5; stroke-width: 1px; vector-effect: non-scaling-stroke; }\n.fp-beam-shell[data-height-estimate] { stroke-dasharray: 2 4; stroke-opacity: .85; }\n.fp .fp-range[data-height-estimate] :is(ellipse, path) { stroke-dasharray: 2 4; }\n.fp-stack-beam .fp-beam-near { stop-opacity: .31; }\n.fp-stack-beam[data-secondary="true"] .fp-beam-shell { opacity: .55; }\n.fp-stack-beam[data-detected] { --fp-beam-color: #92ecd5; }\n.fp-stack-beam[data-detected] .fp-beam-shell { stroke-opacity: .9; }\n.fp-wall-fan[data-detected] .fp-wall-sector { fill-opacity: .23; stroke: #bcf6dc; }\n.fp-shell[data-all-floors][data-simulation]:not([data-stair-preview]) [data-building-floor]:not([data-sim-floor]) { opacity: .64; }\n.fp-shell[data-stair-preview] [data-building-floor]:not([data-stair-target]) { opacity: .68; }\n.fp-shell[data-stair-preview] [data-stair-target] { filter: brightness(1.11); }\n.fp-beam-band, .fp-beam-rim { fill: none; stroke: var(--fp-beam-color); stroke-width: 1px; vector-effect: non-scaling-stroke; }\n.fp-beam-band { opacity: .38; stroke-dasharray: 2 5; }\n.fp-beam-rim { stroke: var(--fp-profile-color, var(--fp-beam-color)); stroke-dasharray: var(--fp-profile-dash, none); opacity: .8; }\n.fp-beam-rim.active { stroke-width: 2px; opacity: 1; }\n@keyframes fp-beam-detected {\n    0% { opacity: .48; }\n    45% { opacity: .98; }\n    70% { opacity: .83; }\n    100% { opacity: 1; }\n}\n@media (prefers-reduced-motion: reduce) {\n    #fp-cone-space[data-detected="true"].fp-beam-pulse { animation: none; }\n}\n@container (max-width: 580px) {\n    .fp-shell[data-view="3d"] :is(.fp-turn-label, .fp-coverage-label) { display: none; }\n    .fp-shell[data-view="3d"] :is(.fp-turn, .fp-coverage) { min-width: 44px; justify-content: center; }\n}\n@media (max-width: 760px) {\n    .fp-radar-panel { gap: 5px 9px; padding: 7px 8px; }\n    .fp-radar-choice { max-width: none; flex-basis: 100%; }\n    #fp-radar-focus { min-height: 44px; font-size: 16px; }\n    .fp-radar-radii { max-width: none; flex-basis: 100%; }\n    .fp-radar-radius { padding-inline: 4px; }\n    #fp-beam-note { max-width: none; }\n    .fp-space-guide { inset: auto 5px 5px; }\n}\n\n.fp-shell[data-simulation] [data-action="furniture_library"] { display: none; }\n.fp-space-placement { position: absolute; z-index: 2; inset: 8px auto auto 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 3px 7px; max-width: calc(100% - 16px); padding: 5px 7px; border: 1px solid #627489; border-radius: 7px; background: #273440; color: #e9edf2; font-size: 12px; }\n.fp-space-placement button { min-height: 34px; padding: 2px 6px; }\n#fp-space[data-furnishing] .fp-space-floor { cursor: crosshair; }\n.fp-furniture-add-button { min-height: 37px; width: 100%; padding: 5px 8px; border-color: var(--fp-border) !important; color: var(--fp-accent) !important; font-size: 13px !important; font-weight: 700 !important; }\n#fp-furniture-items { display: grid; gap: 3px; max-height: 220px; margin-top: 7px; overflow: auto; }\n.fp-furniture-row { display: grid; gap: 1px; min-height: 38px; padding: 4px 6px; text-align: left; font-size: 12px !important; }\n.fp-furniture-row small { color: var(--fp-muted); font-size: 11px; }\n.fp-furniture-dialog { width: min(720px, calc(100% - 24px)); max-height: min(760px, calc(100dvh - 28px)); margin: auto; padding: 0; border: 1px solid var(--fp-border); border-radius: 14px; color: var(--fp-text); background: #fff; }\n.fp-furniture-dialog[open] { display: flex; flex-direction: column; }\n.fp-furniture-dialog::backdrop { background: #142034aa; }\n.fp-furniture-heading { display: flex; justify-content: space-between; gap: 12px; padding: 15px 17px 10px; }\n.fp-furniture-heading h2 { margin-bottom: 4px; font-size: 20px; }\n.fp-furniture-heading p { margin: 0; color: var(--fp-muted); }\n.fp-furniture-heading button { flex: none; align-self: start; width: 44px; height: 44px; font-size: 22px; }\n.fp-sensor-edit { width: min(480px, calc(100% - 24px)); }\n.fp-sensor-edit .fp-furniture-heading { padding-bottom: 12px; border-bottom: 1px solid var(--fp-border); }\n.fp-sensor-edit .fp-furniture-heading p { font-size: 13px; overflow-wrap: anywhere; }\n#fp-sensor-edit-form { display: flex; flex-direction: column; min-height: 0; }\n.fp-sensor-edit-body { display: grid; gap: 12px; min-height: 0; padding: 14px 17px 16px; overflow: auto; }\n.fp-sensor-edit-model { display: flex; align-items: end; gap: 10px; }\n.fp-sensor-edit-model img { flex: none; padding: 4px; border-radius: 7px; background: #f3f6fa; object-fit: contain; }\n.fp-sensor-edit-model label { flex: 1; }\n.fp-sensor-edit-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.fp-sensor-edit label { display: grid; gap: 4px; min-width: 0; color: var(--fp-muted); font-size: 13px; font-weight: 650; }\n.fp-sensor-edit :is(select, input[type="number"]) {\n    width: 100%;\n    min-height: 44px;\n    padding: 5px 7px;\n    border: 1px solid var(--fp-border);\n    border-radius: 7px;\n    background: #f7f9fc;\n    color: var(--fp-text);\n    font-size: 14px;\n}\n.fp-sensor-edit .fp-sensor-edit-check { display: flex; align-items: center; gap: 8px; min-height: 44px; color: var(--fp-text); }\n.fp-sensor-edit-check input { width: 17px; height: 17px; flex: none; accent-color: var(--fp-accent); }\n.fp-sensor-edit .fp-note { margin: 0; }\n.fp-sensor-edit-footer { display: flex; justify-content: end; gap: 8px; padding: 10px 17px; border-top: 1px solid var(--fp-border); }\n.fp-sensor-edit-footer button { min-height: 44px; padding: 5px 11px; }\n@media (max-width: 520px) {\n    .fp-sensor-edit-fields { grid-template-columns: minmax(0, 1fr); }\n    .fp-sensor-edit :is(select, input[type="number"]) { font-size: 16px; }\n}\n.fp-furniture-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 6px 17px 12px; border-bottom: 1px solid var(--fp-border); }\n.fp-furniture-filters label { display: grid; gap: 3px; min-width: 0; color: var(--fp-muted); font-size: 12px; }\n.fp-furniture-filters :is(input, select) { width: 100%; min-height: 40px; padding: 3px 7px; border: 1px solid var(--fp-border); border-radius: 6px; color: var(--fp-text); background: #f8fafc; }\n.fp-furniture-catalog { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; gap: 4px 10px; min-height: 90px; padding: 10px 17px 15px; overflow: auto; }\n.fp-furniture-catalog button { display: flex; gap: 9px; align-items: center; min-height: 52px; padding: 4px; border-bottom-color: var(--fp-border); border-radius: 4px; text-align: left; }\n.fp-furniture-catalog button svg { width: 40px; height: 33px; padding: 2px; border-radius: 4px; background: #edf1f6; }\n.fp-furniture-catalog button span { display: grid; min-width: 0; }\n.fp-furniture-catalog button strong { font-size: 13px; }\n.fp-furniture-catalog button small { color: var(--fp-muted); font-size: 11px; }\n.fp-furniture-hit { fill: transparent; stroke: none; }\n.fp-furniture-part { fill: #8297a6; fill-opacity: .42; stroke: #a6b6c4; stroke-width: .8px; vector-effect: non-scaling-stroke; }\n.fp-plan-furniture[data-material="wood"] .fp-furniture-part { fill: #ad9477; stroke: #bdab93; }\n.fp-plan-furniture[data-material="textile"] .fp-furniture-part { fill: #839a91; stroke: #9fb4ac; }\n.fp-plan-furniture[data-material="glass"] .fp-furniture-part { fill: #84afc4; stroke: #a9d3e9; }\n.fp-plan-furniture.selected .fp-furniture-part { stroke: #cbc1ff; stroke-width: 2px; }\n.fp-furniture-catalog .fp-furniture-part { stroke: #5b7185; stroke-width: .75px; }\n#fp-ghost .fp-furniture-part { fill-opacity: .25; stroke: #cbc1ff; stroke-dasharray: 3 3; }\n#fp-space :is(.fp-model-furniture, .fp-model-rug)[data-item] { pointer-events: auto; }\n.fp-shell[data-simulation] #fp-space :is(.fp-model-furniture, .fp-model-rug)[data-item] { pointer-events: none; }\n#fp-space[data-furnishing] :is(.fp-model-furniture, .fp-model-rug)[data-item] { pointer-events: none; }\n.fp-model-furniture[data-material="textile"] { --fp-model-top: #b6b4a0; --fp-model-face: #8d9381; }\n.fp-model-furniture[data-material="glass"] { --fp-model-top: #b9ceca; --fp-model-face: #9dbdb6; opacity: .72; }\n.fp-model-furniture[data-material="metal"] { --fp-model-top: #a9b1bc; --fp-model-face: #68788b; }\n.fp-model-furniture[data-surface="pillow"] { --fp-model-top: #d2d9d7; --fp-model-face: #aebfbb; }\n.fp-model-furniture[data-surface="duvet"] { --fp-model-top: #829ba3; --fp-model-face: #64808b; }\n.fp-model-furniture:is([data-surface="ceramic"], [data-surface="appliance"]) {\n    --fp-model-top: #e7e8e2; --fp-model-face: #c1c9cc;\n}\n.fp-model-furniture[data-surface="ceramic-rim"] { --fp-model-face: #ecf0ed; }\n.fp-model-furniture[data-surface="basin"] { --fp-model-face: #b2c7d0; }\n.fp-model-furniture[data-surface="basin-floor"] { --fp-model-top: #cedee3; }\n.fp-model-furniture[data-surface="chrome"] {\n    --fp-model-top: #e4eaf0; --fp-model-face: #98aabb;\n}\n.fp-model-furniture:is([data-surface="cloth"], [data-surface="cloth-light"], [data-surface="cloth-shadow"], [data-surface="cloth-hem"]) {\n    --fp-model-face: #b4aca1;\n}\n.fp-model-furniture[data-surface="cloth-light"] { --fp-model-face: #c4baac; }\n.fp-model-furniture[data-surface="cloth-shadow"] { --fp-model-face: #a9a092; }\n.fp-model-furniture[data-surface="cloth-hem"] { --fp-model-face: #a49786; }\n.fp-model-furniture[data-surface="rail"] {\n    --fp-model-top: #92a4ad; --fp-model-face: #526571;\n}\n.fp-model-furniture[data-surface="planter"] { --fp-model-top: #b99d85; --fp-model-face: #ab886c; }\n.fp-model-furniture[data-surface="soil"] { --fp-model-top: #5b4d41; }\n.fp-model-furniture[data-surface="leaf"] { --fp-model-face: #3b6b57; }\n.fp-model-furniture[data-surface="leaf-light"] { --fp-model-face: #649377; }\n.fp-model-furniture:is([data-surface="bezel"], [data-surface="gasket"]) {\n    --fp-model-top: #4e616c; --fp-model-face: #374956;\n}\n.fp-model-furniture[data-surface="display"] { --fp-model-top: #425d70; --fp-model-face: #293e50; }\n.fp-model-furniture[data-surface="porthole"] { --fp-model-face: #526c7b; }\n.fp-model-furniture[data-surface="drum"] { --fp-model-face: #82979d; }\n.fp-model-furniture[data-surface="appliance-door"] { --fp-model-top: #e0e7e7; --fp-model-face: #d1d9dc; }\n.fp-model-furniture[data-surface="countertop"] { --fp-model-top: #c6c4b9; --fp-model-face: #aaa99e; }\n.fp-model-furniture[data-surface="panel"] { --fp-model-top: #b49c7d; --fp-model-face: #907a62; }\n.fp-model-furniture[data-surface="screen-panel"] { --fp-model-top: #b9a491; --fp-model-face: #ac977d; }\n.fp-model-furniture[data-surface="pane"] { opacity: .48; }\n.fp-model-furniture[data-surface="book"] { --fp-model-top: #788b8c; --fp-model-face: #647a7f; }\n.fp-model-furniture[data-surface="book-light"] { --fp-model-top: #b69778; --fp-model-face: #a07f66; }\n.fp-model-furniture.selected :is(.fp-model-top, .fp-model-face):not(.fp-depth-fragment), .fp-model-rug.selected { stroke: #cbc1ff; stroke-width: 2px; }\n.fp [data-occlusion="shadow"] :is(.fp-model-top, .fp-model-face, .fp-furniture-part):not(.fp-depth-fragment) { stroke: #ffd38b; stroke-width: 1.5px; }\n.fp [data-occlusion="blocked"] :is(.fp-model-top, .fp-model-face, .fp-furniture-part):not(.fp-depth-fragment) { stroke: #ff958b; stroke-width: 1.6px; }\n.fp-walk-link[data-status="shadow"] { stroke: #ffcc83; stroke-width: 2.2px; }\n.fp-walk-link[data-status="blocked"] { stroke: #ff958b; stroke-width: 2.2px; }\n.fp-obstruction-hit { fill: #ffcc83; stroke: #2a3039; stroke-width: 1px; vector-effect: non-scaling-stroke; }\n.fp-obstruction-hit[data-status="blocked"] { fill: #ff958b; }\n.fp-walk-trail[data-status="shadow"] { stroke: #ffe29c; stroke-dasharray: 2 4; }\n.fp-sim-signal [data-status="shadow"], .fp-obstacle-name[data-status="shadow"] { color: #7e4b03; font-weight: 680; }\n.fp-sim-signal [data-status="blocked"], .fp-obstacle-name[data-status="blocked"] { color: #9b3f35; font-weight: 680; }\n.fp-obstacle-name { margin: 4px 0 0; font-size: 11px; overflow-wrap: anywhere; }\n.fp-simulation .fp-obstruction-toggle { display: flex; align-items: center; gap: 6px; min-height: 38px; margin-bottom: 0; color: var(--fp-text); font-size: 13px; font-weight: 650; }\n.fp-obstruction-toggle input { width: 16px; height: 16px; }\n.fp-obstruction-note { margin-bottom: 11px; }\n.fp-route-risk { border-top-color: #987126; border-top-style: dotted; }\n#fp-inspector .fp-climate-field { display: flex; align-items: center; min-height: 37px; }\n#fp-inspector .fp-climate-field input { width: 16px; min-height: 16px; flex: none; accent-color: var(--fp-accent); }\n@media (max-width: 760px) {\n    .fp-furniture-filters { grid-template-columns: 1fr; }\n    .fp-furniture-filters :is(input, select) { min-height: 44px; font-size: 16px; }\n    .fp-furniture-catalog { grid-template-columns: 1fr; }\n    .fp-furniture-add-button, .fp-furniture-row, .fp-space-placement button { min-height: 44px; }\n}\n\n.fp-header { display: flex; align-items: end; justify-content: space-between; gap: 10px; }\n.fp button.fp-advisor-open, .fp :is(#fp-advisor-place, #fp-advisor-place-all) { min-height: 42px; padding: 5px 12px; color: #fff; background: var(--fp-accent); font-size: 13px; font-weight: 700; }\n.fp-advisor-open { flex: none; white-space: nowrap; }\n.fp-advisor { width: min(820px, calc(100% - 24px)); }\n.fp-advisor-body { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.65fr); overflow: auto; border-top: 1px solid var(--fp-border); }\n.fp-advisor-body section { min-width: 0; padding: 12px 15px; }\n.fp-advisor-overview { border-right: 1px solid var(--fp-border); background: #f6f8fb; }\n.fp-advisor h3 { margin: 0 0 8px; font-size: 14px; font-weight: 740; }\n#fp-advisor-rooms { display: grid; gap: 3px; }\n#fp-advisor-rooms button { display: grid; gap: 2px; width: 100%; min-height: 44px; padding: 4px 7px; text-align: left; overflow-wrap: anywhere; }\n#fp-advisor-rooms small { color: var(--fp-muted); font-size: 11px; }\n.fp-advisor-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-bottom: 10px; }\n.fp-advisor-controls label { display: grid; gap: 3px; min-width: 0; color: var(--fp-muted); font-size: 12px; }\n.fp-advisor-controls :is(select, input[type="number"]) { width: 100%; min-height: 37px; padding: 3px 6px; border: 1px solid var(--fp-border); border-radius: 6px; color: var(--fp-text); background: #f8fafc; }\n.fp-advisor-controls .fp-advisor-check { display: flex; align-items: center; gap: 5px; min-height: 36px; }\n.fp-advisor-controls .fp-advisor-existing { grid-column: 1 / -1; }\n.fp-advisor-existing span { max-height: 54px; overflow: auto; overflow-wrap: anywhere; }\n.fp-advisor-alternatives { display: grid; gap: 4px; margin-bottom: 8px; color: var(--fp-muted); font-size: 12px; }\n.fp-advisor-alternatives select { width: 100%; min-height: 44px; border: 1px solid var(--fp-border); border-radius: 6px; background: #f8fafc; color: var(--fp-text); font-size: 16px; }\n.fp-advisor-result { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; border-top: 1px solid var(--fp-border); }\n.fp-advisor-result p { margin: 3px 0; }\n.fp-advisor-result h4 { margin: 0; font-size: 15px; }\n.fp-advisor-result h4 small { display: inline-block; margin-left: 4px; color: var(--fp-muted); font-size: 11px; font-weight: 650; }\n.fp-advisor-positions { color: var(--fp-muted); font-size: 12px; }\n.fp-advisor-positions summary { min-height: 34px; padding-block: 6px; }\n.fp-advisor-rank { color: var(--fp-accent); font-size: 11px; font-weight: 700; }\n.fp-advisor-preview { flex: none; width: clamp(80px, 18vw, 145px); height: 108px; padding: 4px; border-radius: 6px; background: #273440; }\n.fp-advice-floor { fill: #41576a; stroke: #a8b6c5; stroke-width: 1px; vector-effect: non-scaling-stroke; }\n.fp-advice-object { fill: #798e9e; stroke: #9faab5; stroke-width: .5px; vector-effect: non-scaling-stroke; }\n.fp-advisor-preview circle { fill: #ffe0a3; }\n.fp-advisor-preview text { fill: #172537; dominant-baseline: central; text-anchor: middle; font-weight: 750; }\n.fp-advisor-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 10px 15px; border-top: 1px solid var(--fp-border); }\n.fp-advisor-footer .fp-note { flex: 1 1 250px; }\n.fp-advisor-method { flex: 1 1 170px; min-width: 0; color: var(--fp-muted); font-size: 12px; }\n.fp-advisor-method summary { padding-block: 6px; }\n.fp-advisor-method p { margin: 5px 0 2px; }\n.fp-advisor-actions { display: flex; flex: 1 1 auto; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }\n.fp #fp-advisor-place-all { margin-left: 0; color: var(--fp-accent); background: #f3f1ff; border-color: #dcd5fa; }\n#fp-advisor-status { margin: 0; color: #794619; font-size: 12px; }\n#fp-advisor-status:empty { display: none; }\n#fp-advisor-place-all { margin-left: auto; }\n.fp-underlay-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 10px; padding: 6px 10px; border: 1px solid var(--fp-border); border-bottom: 0; background: #f8faff; }\n.fp-underlay-controls label { display: inline-flex; align-items: center; gap: 5px; color: var(--fp-muted); font-size: 12px; }\n.fp-underlay-controls button { min-height: 36px; padding: 2px 7px; border-color: var(--fp-border); color: var(--fp-accent); background: #fff; }\n.fp-underlay-controls input[type="number"] { width: 75px; min-height: 36px; padding-inline: 4px; border: 1px solid var(--fp-border); border-radius: 5px; background: #fff; }\n.fp-underlay-controls input[type="range"] { width: 110px; accent-color: var(--fp-accent); }\n.fp .fp-underlay-controls .fp-recognise { border-color: var(--fp-accent); color: #fff; background: var(--fp-accent); font-weight: 650; }\n.fp .fp-underlay-controls .fp-recognise:hover:not(:disabled) { background: color-mix(in srgb, var(--fp-accent), #000 14%); }\n.fp .fp-underlay-controls .fp-recognise:disabled { opacity: .6; cursor: progress; }\n/* Beside the buttons when there is room, on its own line when there is not. */\n.fp-underlay-controls .fp-recognise-note { flex: 1 1 280px; max-width: 78ch; }\n/* While the plan is being read: an estimate of how far it is, and a light that sweeps over the image. */\n.fp-recognise-meter { display: inline-flex; align-items: center; gap: 8px; color: var(--fp-text); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }\n.fp-recognise-meter progress { width: 150px; height: 8px; border: 0; border-radius: 4px; overflow: hidden; appearance: none; -webkit-appearance: none; color: var(--fp-accent); background: var(--fp-border); }\n.fp-recognise-meter progress::-webkit-progress-bar { background: var(--fp-border); }\n.fp-recognise-meter progress::-webkit-progress-value { border-radius: 4px; background: var(--fp-accent); transition: width .25s linear; }\n.fp-recognise-meter progress::-moz-progress-bar { border-radius: 4px; background: var(--fp-accent); }\n.fp-recognise-meter span { min-width: 4ch; }\n#fp-underlay[hidden] + .fp-underlay-scan { display: none; }\n.fp-underlay-scan stop { stop-color: var(--fp-accent); }\n.fp-underlay-scan-tint { fill: var(--fp-accent); opacity: .07; }\n/* The light is a sixth of the image wide and travels from just outside one edge to just outside the other. */\n.fp-underlay-scan-beam { transform-box: fill-box; animation: fp-underlay-scan 1.9s ease-in-out infinite alternate; }\n@keyframes fp-underlay-scan { from { transform: translateX(-100%); } to { transform: translateX(625%); } }\n@media (prefers-reduced-motion: reduce) {\n    .fp-underlay-scan-beam { display: none; }\n    .fp-underlay-scan-tint { opacity: .14; }\n}\n#fp-underlay { pointer-events: none; }\n/* Rooms drawn on the reference image let it show through. Only the floor fades: outlines, labels, openings and sensors stay solid.\n   The outline and the label keep an edge in the floor colour, so they also read on a light plan. */\n.fp-shell[data-underlay] #fp-plan .fp-room-floor { fill-opacity: var(--fp-room-fill, 1); }\n.fp-room-casing { pointer-events: none; fill: none; stroke: #20262e; stroke-width: 6px; vector-effect: non-scaling-stroke; }\n.fp-shell[data-underlay] #fp-plan .fp-room-label { stroke-width: calc(var(--fp-label-size, .238px) * .15); }\n.fp-shell[data-underlay] #fp-plan .fp-room-size { stroke-width: calc(var(--fp-room-size, .17px) * .2); }\n.fp-pdf-preview { display: grid; place-items: center; min-height: 150px; border: 1px solid var(--fp-border); border-radius: 7px; background: #eef2f7; overflow: hidden; }\n.fp-pdf-preview canvas { display: block; max-width: 100%; max-height: min(44dvh, 320px); }\n#fp-pdf-status:empty { display: none; }\n/* Choosing the part of an uploaded image to use. The stage has the shape of the image, so the box is placed in shares of it. */\n.fp-furniture-dialog.fp-crop { width: min(940px, calc(100% - 24px)); }\n.fp-crop-stage { position: relative; justify-self: center; width: min(100%, calc(min(56dvh, 520px) * var(--fp-crop-ratio, 1))); aspect-ratio: var(--fp-crop-ratio, 1); border: 1px solid var(--fp-border); border-radius: 7px; background: #eef2f7; overflow: hidden; cursor: crosshair; touch-action: none; user-select: none; -webkit-user-select: none; }\n.fp-crop-stage:focus-visible { outline: 2px solid var(--fp-accent); outline-offset: 2px; }\n.fp-crop-stage > :is(canvas, img) { display: block; width: 100%; height: 100%; pointer-events: none; }\n.fp-crop-box { position: absolute; box-sizing: border-box; border: 2px solid var(--fp-accent); box-shadow: 0 0 0 100vmax #1420348c; cursor: move; }\n.fp-crop-box[hidden] { display: none; }\n.fp-crop-box span { position: absolute; width: 14px; height: 14px; border: 2px solid var(--fp-accent); border-radius: 50%; background: #fff; }\n/* A corner is easier to grab than it looks. */\n.fp-crop-box span::after { content: ""; position: absolute; inset: -13px; }\n.fp-crop-box span[data-corner^="n"] { top: -10px; }\n.fp-crop-box span[data-corner^="s"] { bottom: -10px; }\n.fp-crop-box span[data-corner$="w"] { left: -10px; }\n.fp-crop-box span[data-corner$="e"] { right: -10px; }\n.fp-crop-box span:is([data-corner="nw"], [data-corner="se"]) { cursor: nwse-resize; }\n.fp-crop-box span:is([data-corner="ne"], [data-corner="sw"]) { cursor: nesw-resize; }\n.fp-crop .fp-sensor-edit-footer { flex-wrap: wrap; }\n@media (max-width: 760px) {\n    .fp-start { grid-template-columns: 1fr; }\n    .fp-start-preview { min-height: 0; padding: 13px 15px; }\n    .fp-start-preview > svg { max-height: 235px; }\n    .fp-next { padding: 8px 9px; }\n    .fp-next-copy { flex-basis: 145px; }\n    .fp-next p { font-size: 12px; }\n    .fp .fp-next-copy button, .fp-shortcuts summary { min-height: 44px; }\n    .fp-room-form > div:first-child { flex-basis: 100%; }\n    .fp-header { align-items: start; flex-wrap: wrap; }\n    .fp button.fp-advisor-open, .fp :is(#fp-advisor-place, #fp-advisor-place-all) { min-height: 44px; }\n    .fp-advisor-body { grid-template-columns: minmax(0, 1fr); }\n    .fp-advisor-overview { border-right: 0; border-bottom: 1px solid var(--fp-border); }\n    .fp-advisor-result { align-items: start; }\n    .fp-advisor-preview { height: 76px; }\n    #fp-advisor-rooms { display: flex; overflow-x: auto; }\n    #fp-advisor-rooms button { flex: 0 0 135px; }\n    .fp-advisor-controls :is(select, input[type="number"]) { min-height: 44px; font-size: 16px; }\n    .fp-underlay-controls button { min-height: 44px; }\n}\n\n/* The planner is a focused workspace, with its own navigation and canvas controls. */\nbody.fp-design-body { margin: 0; padding: 0; overflow: hidden; background: #20252c; }\n.fp-design-body #main-content { height: 100dvh; outline: none; }\n.fp-design-center { height: 100%; }\n.fp-design-center .fp-shell { height: 100%; max-width: none; padding: env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left); position: relative; display: flex; flex-direction: column; }\n.fp-design-center .fp-header { position: relative; z-index: 13; flex: none; display: flex; justify-content: space-between; align-items: center; min-height: 54px; padding: 10px 18px; background: #fcfcfe; border-bottom: 1px solid var(--fp-border); }\n.fp-breadcrumbs { display: flex; gap: 13px; align-items: center; min-width: 0; }\n.fp-shop-back { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding-inline: 8px; border-radius: 7px; color: var(--fp-accent); font-size: 13px; font-weight: 650; text-decoration: none; }\n.fp-shop-back:hover { background: var(--fp-selected); }\n.fp-shop-back svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }\n.fp-shop-back-short { display: none; }\n.fp-breadcrumbs > span { color: var(--fp-muted); }\n.fp-design-center h1 { font-size: 17px; font-weight: 650; letter-spacing: -.02em; white-space: nowrap; }\n.fp-header-actions { display: flex; flex: none; align-items: center; gap: 12px; }\n.fp-breadcrumbs a { flex: none; }\n.fp-breadcrumbs h1 { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.fp-header-locale { color: initial; font-size: 1rem; line-height: 1.5; accent-color: auto; }\n.fp-header-locale [role="dialog"] { max-height: calc(100dvh - 80px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); overflow-y: auto; }\n.fp-design-center #fp-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }\n.fp-design-center .fp-project { flex: none; min-height: 54px; margin: 0; border: 0; border-bottom: 1px solid var(--fp-border); border-radius: 0; padding: 6px 16px; gap: 7px 16px; z-index: 12; }\n.fp-design-center .fp-project-name input { width: clamp(125px, 19vw, 260px); }\n.fp-design-center .fp-workspace { flex: 1; min-height: 0; height: auto; position: relative; display: block; border: 0; border-radius: 0; }\n.fp-design-center .fp-drawing { position: absolute; inset: 0; display: block; }\n.fp-design-center .fp-stage { position: absolute; inset: 0; min-height: 0; }\n.fp-design-center #fp-plan { touch-action: none; }\n.fp-design-center .fp-viewbar { position: absolute; z-index: 9; inset: auto auto 28px 50%; transform: translateX(-50%); display: flex; width: max-content; max-width: calc(100% - 24px); gap: 4px; padding: 5px; min-height: 50px; border: 1px solid #515a69; border-radius: 10px; box-shadow: 0 8px 24px #10162150; }\n.fp-design-center .fp-view-options { inset: auto auto calc(100% + 12px) 0; max-height: min(70dvh, 560px); overflow-y: auto; }\n.fp-design-center .fp-toolbox-content { inset: auto 0 calc(100% + 12px) auto; max-height: min(70dvh, 560px); }\n.fp-quick-tools { display: flex; gap: 3px; padding-inline: 4px; border-inline: 1px solid #4c5664; }\n.fp-design-center .fp-quick-tools button { display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 4px 9px; font-size: 12px; font-weight: 650; }\n.fp-design-center .fp-selection-jump { display: flex; align-items: center; gap: 5px; min-height: 40px; padding: 4px 9px; color: #e8eef8; font-size: 12px; white-space: nowrap; }\n.fp-control-short { display: none; }\n.fp-design-center .fp-sidebar { display: none; position: absolute; z-index: 7; inset: 14px 14px auto auto; width: 320px; max-height: calc(100% - 126px); border: 1px solid var(--fp-border); border-radius: 12px; box-shadow: 0 10px 32px #10162138; background: var(--fp-panel); overflow: hidden; }\n.fp-design-center [data-panel] .fp-sidebar { display: flex; flex-direction: column; }\n.fp-design-center .fp-sidebar-nav { padding-right: 42px; gap: 18px; }\n.fp .fp-close-panel { position: absolute; top: 2px; right: 3px; z-index: 3; width: 44px; height: 44px; font-size: 24px; line-height: 1; }\n.fp-design-center .fp-sidebar-content { overflow-y: auto; min-height: 0; overscroll-behavior: contain; }\n.fp-design-center .fp-library-panel[data-mode="dock"] { border-radius: 11px; }\n.fp-design-center .fp-device-group button small { display: block; margin-top: 2px; color: var(--fp-catalog-muted); font-size: 11px; }\n.fp-design-center .fp-sidebar:has(#fp-library:popover-open) { border-color: transparent; background: transparent; box-shadow: none; }\n.fp-design-center .fp-next { position: absolute; z-index: 4; top: 14px; left: 16px; width: min(450px, calc(100% - 374px)); min-width: 260px; margin: 0; padding: 10px 12px; border-radius: 10px; box-shadow: 0 4px 18px #10162120; }\n.fp-design-center .fp-next p { font-size: 13px; }\n.fp-design-center .fp-next-copy { flex-basis: 200px; }\n.fp-design-center .fp-room-form { position: absolute; z-index: 10; top: 14px; left: 16px; width: min(430px, calc(100% - 32px)); max-height: calc(100% - 166px); overflow-y: auto; margin: 0; box-shadow: 0 12px 34px #1016213b; }\n.fp-design-center .fp-room-form > div:first-child { flex-basis: 100%; }\n.fp-design-center .fp-room-form-inputs { flex-basis: 100%; }\n.fp-design-center .fp-placement-bar { position: absolute; z-index: 5; top: 14px; left: 16px; width: min(370px, calc(100% - 32px)); max-height: calc(100% - 120px); overflow-y: auto; border: 1px solid #72669d; border-radius: 10px; padding: 12px; }\n.fp-design-center .fp-placement-copy { width: 100%; }\n.fp-design-center .fp-placement-copy label { display: grid; gap: 4px; margin-top: 9px; font-size: 12px; }\n.fp-design-center .fp-placement-copy select { width: 100%; min-height: 44px; border: 1px solid #8b82a6; border-radius: 6px; padding: 5px 8px; background: #242435; color: #f6f2ff; font-size: 16px; }\n.fp-design-center .fp-stage-top { top: 16px; left: 16px; max-width: min(390px, calc(100% - 32px)); }\n.fp-design-center .fp-undo-notice { inset: auto auto 142px 16px; }\n.fp-design-center svg.fp-room-label > text:first-child { y: calc(var(--fp-label-size, .238px) + .04px); }\n.fp-design-center svg.fp-room-label > .fp-room-size { y: calc(var(--fp-label-size, .238px) + var(--fp-room-size, .17px) + .12px); }\n.fp-design-center .fp-legend { position: absolute; left: 16px; bottom: 90px; width: auto; max-width: 42%; border: 0; background: #252b34; color: #cbd3df; border-radius: 6px; font-size: 11px; }\n.fp-design-center .fp-legend-limit { display: none; }\n.fp-design-center .fp-scale { bottom: 30px; left: 18px; }\n.fp-design-center .fp-sim-guide {\n    position: absolute;\n    z-index: 5;\n    top: 14px;\n    left: 16px;\n    width: min(368px, calc(100% - 32px));\n    border: 1px solid #515d6e;\n    border-radius: 10px;\n    box-shadow: 0 6px 18px #141b2540;\n}\n.fp-design-center .fp-sim-guide:has(.fp-sim-menu[open]) { z-index: 10; }\n.fp-design-center [data-stair-crossing] :is(.fp-sim-dock, .fp-legend, .fp-space-guide, .fp-space-furniture) { display: none; }\n.fp-design-center :is(.fp-outline-tools, .fp-sim-dock) { position: absolute; z-index: 8; bottom: 89px; left: 50%; transform: translateX(-50%); width: max-content; max-width: calc(100% - 20px); border: 1px solid #515a69; border-radius: 9px; }\n.fp-design-center .fp-radar-details { flex: none; border-top: 1px solid var(--fp-border); }\n.fp-design-center .fp-radar-details summary { padding: 11px 14px; min-height: 42px; color: var(--fp-muted); font-weight: 650; font-size: 12px; }\n.fp-design-center .fp-radar-details .fp-radar-panel { max-height: 24dvh; overflow-y: auto; }\n.fp-design-center .fp-sim-panel-head { padding-right: 32px; }\n.fp-design-center [data-simulation] .fp-quick-tools { display: none; }\n.fp-design-center .fp-start { flex: 1; min-height: 0; margin: 0; border: 0; border-radius: 0; grid-template-columns: minmax(340px, 40%) minmax(0, 1fr); }\n.fp-design-center .fp-start-copy { padding: clamp(24px, 4vw, 66px); align-self: center; }\n.fp-design-center .fp-start-copy h2 { font-size: clamp(30px, 3vw, 46px); line-height: 1.1; letter-spacing: -.03em; max-width: 12ch; }\n.fp-design-center .fp-start-copy p { max-width: 40ch; }\n.fp-design-center .fp-start-preview { height: 100%; min-height: 0; border-left: 1px solid #515a69; }\n.fp-design-center .fp-start-preview > svg { width: 100%; max-height: calc(100dvh - 170px); }\n.fp-design-center .fp-start-actions { gap: 10px; margin-block: 26px; }\n.fp-design-center .fp-start-import { align-items: start; }\n.fp-design-center .fp-recovery { position: absolute; z-index: 20; inset: 65px 12px auto; background: var(--fp-panel); }\n@media (max-width: 1100px) and (min-width: 761px) {\n    .fp-design-center .fp-project-name input { width: 135px; }\n    .fp-design-center .fp-project { gap: 6px; padding-inline: 10px; }\n    .fp-design-center .fp-sidebar { width: 290px; }\n    .fp-design-center .fp-next { width: min(390px, calc(100% - 332px)); }\n}\n@media (max-width: 760px) {\n    .fp-design-center .fp-header { min-height: 45px; flex-wrap: nowrap; gap: 6px; padding: 8px 10px; }\n    .fp-breadcrumbs { gap: 8px; font-size: 12px; }\n    .fp-design-center h1 { font-size: 14px; }\n    .fp-shop-back { padding-inline: 3px; gap: 4px; }\n    .fp-shop-back-label { display: none; }\n    .fp-shop-back-short { display: inline; }\n    .fp-design-center .fp-project { min-height: 54px; gap: 4px; padding: 4px 7px; }\n    .fp-design-center .fp-viewbar { bottom: calc(28px + env(safe-area-inset-bottom)); gap: 1px; padding: 3px; }\n    .fp-design-center .fp-viewbar :is(summary, button) { min-height: 50px; }\n    .fp-design-center .fp-viewbar > :is(button, details) { flex: none; }\n    .fp-design-center .fp-view-menu > summary { width: 41px; padding: 3px 2px; gap: 3px; }\n    .fp-design-center .fp-view-menu .fp-control-label { display: none; }\n    .fp-design-center .fp-quick-tools { padding-inline: 1px; gap: 0; }\n    .fp-design-center .fp-quick-tools button { width: 45px; padding: 3px 1px; gap: 2px; flex-direction: column; justify-content: center; font-size: 10px; }\n    .fp-design-center .fp-selection-jump { width: 48px; padding: 3px 1px; white-space: normal; line-height: 1.15; text-align: center; font-size: 10px; justify-content: center; }\n    .fp-design-center .fp-selection-jump > span:last-child { display: none; }\n    .fp-design-center .fp-toolbox > summary { width: 43px; padding: 3px 2px; justify-content: center; gap: 2px; font-size: 11px; }\n    .fp-design-center .fp-toolbox .fp-control-label { display: none; }\n    .fp-design-center .fp-toolbox .fp-control-short { display: inline; }\n    .fp-design-center .fp-next { top: 12px; left: 10px; width: calc(100% - 20px); min-width: 0; max-width: 460px; padding: 8px 10px; }\n    .fp-design-center .fp-next-copy { flex-basis: 150px; }\n    .fp-design-center .fp-next p { font-size: 12px; }\n    .fp-design-center .fp-next .fp-primary { font-size: 12px; }\n    .fp-design-center .fp-sidebar { inset: auto 8px calc(94px + env(safe-area-inset-bottom)); width: calc(100% - 16px); max-height: min(55dvh, 480px); border-radius: 12px; }\n    .fp-design-center .fp-next:has(+ .fp-room-form:not([hidden])) { display: none; }\n    .fp-design-center .fp-room-form { top: 12px; left: 8px; width: calc(100% - 16px); max-height: calc(100% - 166px); }\n    .fp-design-center .fp-placement-bar { top: 14px; left: 8px; width: calc(100% - 16px); }\n    .fp-design-center .fp-stage-top { left: 10px; top: 14px; }\n    .fp-design-center .fp-undo-notice { inset: auto 10px calc(150px + env(safe-area-inset-bottom)) auto; max-width: calc(100% - 20px); }\n    .fp-design-center .fp-sim-guide { top: 12px; left: 10px; width: min(368px, calc(100% - 20px)); padding-inline: 8px; }\n    .fp-design-center [data-simulation] .fp-space-furniture { display: none; }\n    .fp-design-center :is(.fp-outline-tools, .fp-sim-dock) { bottom: calc(92px + env(safe-area-inset-bottom)); }\n    .fp-design-center .fp-legend { bottom: 94px; left: 10px; max-width: calc(100% - 20px); padding: 3px 5px; font-size: 10px; }\n    .fp-design-center [data-simulation] .fp-legend { bottom: 155px; }\n    .fp-design-center .fp-scale { left: 11px; bottom: calc(155px + env(safe-area-inset-bottom)); }\n    .fp-design-center [data-simulation] .fp-scale { bottom: calc(215px + env(safe-area-inset-bottom)); }\n    .fp-design-center .fp-start { grid-template-columns: 1fr; overflow-y: auto; }\n    .fp-design-center .fp-start-copy { padding: 30px 24px; }\n    .fp-design-center .fp-start-copy h2 { font-size: 34px; max-width: 14ch; }\n    .fp-design-center .fp-start-preview { height: clamp(315px, 53dvh, 470px); border-left: 0; border-top: 1px solid #515a69; }\n    .fp-design-center .fp-start-preview > svg { max-height: calc(clamp(315px, 53dvh, 470px) - 92px); }\n    .fp-demo-controls { grid-row: 1; }\n    .fp-design-center .fp-view-options { max-height: 65dvh; }\n    .fp-design-center .fp-toolbox-content { max-height: 65dvh; }\n}\n@media (max-width: 360px) {\n    .fp-design-center .fp-breadcrumbs { gap: 6px; font-size: 11px; }\n}\n\n/* Coverage map: dead zones red, one radar amber-green, two or more green. */\n.fp-heat-cells { stroke: none; opacity: .42; }\n.fp-heat-cells[data-seen="none"] { fill: #e5483b; }\n.fp-heat-cells[data-seen="shadow"] { fill: #ef9f2f; }\n.fp-heat-cells[data-seen="one"] { fill: #b9d64f; }\n.fp-heat-cells[data-seen="many"] { fill: #2fa35a; }\n#fp-space .fp-heat-cells { opacity: .5; mix-blend-mode: multiply; }\n.fp-heat-legend { position: absolute; right: 10px; top: 92px; z-index: 3; display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 0; padding: 5px 9px; border-radius: 7px; background: #20252ce6; color: #eef2f7; font-size: 11.5px; font-weight: 600; pointer-events: none; }\n.fp-heat-legend span::before { content: ""; display: inline-block; width: 9px; height: 9px; margin-right: 5px; border-radius: 2px; vertical-align: -1px; }\n.fp-heat-legend [data-seen="none"]::before { background: #e5483b; }\n.fp-heat-legend [data-seen="one"]::before { background: #b9d64f; }\n.fp-heat-legend [data-seen="many"]::before { background: #2fa35a; }\n\n/* Fans, pets and heaters. */\n.fp-model-furniture[data-surface="fur"] { --fp-model-top: #c99d67; --fp-model-face: #a07547; }\n.fp-model-furniture[data-surface="fur-dark"] { --fp-model-top: #876240; --fp-model-face: #62462c; }\n.fp-model-furniture[data-surface="fan-rim"] { --fp-model-top: #f1f3f5; --fp-model-face: #c9cfd6; }\n.fp-model-furniture[data-surface="fan-grill"] { --fp-model-face: #dfe4e9; opacity: .78; }\n.fp-model-furniture[data-surface="radiator"] { --fp-model-top: #f3f4f2; --fp-model-face: #d3d7d5; }\n.fp-model-furniture[data-surface="radiator-fin"] { --fp-model-top: #eceeec; --fp-model-face: #c1c7c5; }\n';

// inline-css:src/ha/editor-ha.css
var editor_ha_default = ':root {\n    color-scheme: light;\n    --ha-page: light-dark(#f1f5f9, #171c23);\n    --ha-panel: light-dark(#fbfcfe, #222832);\n    --ha-input: light-dark(#f2f5fa, #1b222c);\n    --ha-ink: light-dark(#172338, #edf1f7);\n    --ha-muted: light-dark(#4b5b72, #b9c5d6);\n    --ha-border: light-dark(#ccd6e3, #465161);\n    --ha-accent: light-dark(#4638b9, #c9beff);\n    --ha-action: light-dark(#4939c1, #6a55d9);\n    --ha-hover: light-dark(#e8eef6, #303949);\n    --ha-selected: light-dark(#ece8ff, #3c3458);\n    --ha-focus: light-dark(#604be2, #c5b5ff);\n    --ha-danger: light-dark(#a52b38, #ffb1b4);\n    --ha-warn: light-dark(#79470f, #ffd09a);\n    --ha-ceiling: light-dark(#5940be, #c9beff);\n    --ha-wall: light-dark(#087359, #8ce1bd);\n    --ha-map: light-dark(#e8eef5, #20252c);\n    --ha-room: light-dark(#f9fbfd, #282f38);\n    --ha-room-edge: light-dark(#8091a5, #a9b5c2);\n    --ha-grid: light-dark(#d9e2ed, #2b3037);\n    --ha-grid-major: light-dark(#bbc9d9, #3a4149);\n    --ha-shadow: 0 8px 22px light-dark(#17274322, #11172273);\n}\n:root[data-ha-theme="dark"] { color-scheme: dark; }\n*, *::before, *::after { box-sizing: border-box; }\nbody.fp-design-body { margin: 0; color: var(--ha-ink); background: var(--ha-page); font: 16px/1.45 system-ui, sans-serif; }\nbutton, input, select { font: inherit; }\nbutton, summary { cursor: pointer; }\n\n.fp-design-center {\n    --fp-bg: var(--ha-page);\n    --fp-panel: var(--ha-panel);\n    --fp-text: var(--ha-ink);\n    --fp-muted: var(--ha-muted);\n    --fp-accent: var(--ha-accent);\n    --fp-selected: var(--ha-selected);\n    --fp-border: var(--ha-border);\n    --fp-stage: var(--ha-map);\n    --fp-stage-bar: var(--ha-panel);\n    --fp-stage-border: var(--ha-border);\n    --fp-ceiling: var(--ha-ceiling);\n    --fp-wall: var(--ha-wall);\n}\n\n#floor-planner :is(#fp-open-order, [data-action="next_order"], .fp-library-filters, [data-action="catalog_advice"],\n    [data-action="open_advisor"], [data-action="start_example"], [data-action="example"], [data-action="test_person"],\n    [data-action="preview_walk"], [data-action="repeat_test"], .fp-sensor-edit-model label, label:has([name="radar"])) { display: none !important; }\n[data-ha-live] :is(#fp-project-menu, .fp-quick-tools, #fp-toolbox, #fp-sidebar, #fp-next, #fp-room-form, #fp-underlay-controls,\n    .fp-floor-actions, #fp-floor-rename, .fp-selection-jump) { display: none !important; }\n[data-ha-live] #fp-project-name { pointer-events: none; }\n\n#floor-planner .fp-project { gap: 6px 10px; min-height: 52px; padding: 5px 12px; }\n.fp-ha-actions { display: flex; flex: 1 1 auto; align-items: center; justify-content: flex-end; gap: 6px; margin-inline-start: auto; }\n.fp-ha-status { min-width: 0; margin-inline-end: 5px; color: var(--ha-muted); font-size: 11px; line-height: 1.25; text-align: end; }\n.fp-ha-status p { margin: 0; }\n.fp-ha-status p + p { margin-top: 2px; }\n.fp-ha-status .save-status[data-error] { color: var(--ha-danger); }\n#floor-planner .fp-ha-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 42px; min-height: 42px; padding: 4px 9px; border-color: var(--ha-border); font-size: 12px; font-weight: 680; }\n#floor-planner .fp-ha-actions .save:not(:disabled) { color: #fff; border-color: transparent; background: var(--ha-action); }\n#floor-planner .fp-ha-actions .save:disabled { opacity: 1; color: var(--ha-muted); background: var(--ha-input); }\n@media (max-width: 850px) {\n    .fp-ha-actions button span { display: none; }\n}\n@media (max-width: 600px) {\n    #floor-planner .fp-project { display: grid; grid-template-columns: max-content minmax(0, 1fr) 42px 42px; gap: 5px; padding-inline: 8px; }\n    #floor-planner .fp-project .fp-floors { min-width: 0; }\n    #floor-planner .fp-project :is(#fp-floor-current, .fp-ha-status .detections) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n    #floor-planner .fp-project .fp-toolbar-trigger { gap: 5px; padding-inline: 7px; }\n    .fp-ha-actions { display: contents; }\n    .fp-ha-status { display: flex; grid-column: 1 / -1; grid-row: 2; justify-content: space-between; gap: 8px; margin: 0; padding-inline: 2px; text-align: start; }\n    #floor-planner .fp-ha-actions button { grid-row: 1; min-width: 40px; min-height: 44px; padding: 4px; }\n    #floor-planner .fp-ha-actions .secondary { grid-column: 3; }\n    #floor-planner .fp-ha-actions .save { grid-column: 4; }\n    .fp-ha-status p { min-width: 0; margin: 0; }\n    .fp-ha-status .save-status { margin-inline-start: auto; text-align: end; }\n    .fp-ha-status .save-status[data-error] { text-wrap: pretty; }\n}\n\n#floor-planner .fp-stage { --fp-ceiling: var(--ha-ceiling); --fp-wall: var(--ha-wall); color: var(--ha-ink); }\n#floor-planner[data-view="3d"] .fp-stage { background: radial-gradient(ellipse at 48% 42%, var(--ha-page) 0%, var(--ha-map) 78%); }\n#floor-planner :is(.fp-viewbar, .fp-view-options, .fp-toolbox-content, .fp-outline-tools, .fp-placement-bar,\n    .fp-sensor-tip, .fp-radar-panel, .fp-space-furniture, .fp-space-guide > span, .fp-hint, .fp-legend, .fp-footer, .fp-footer details[open] p) {\n    color: var(--ha-ink); border-color: var(--ha-border); background: var(--ha-panel);\n}\n#floor-planner :is(.fp-viewbar, .fp-view-options, .fp-toolbox-content, .fp-sensor-tip, .fp-footer details[open] p) { box-shadow: var(--ha-shadow); }\n#floor-planner :is(.fp-drawing-options, .fp-history, .fp-view-zoom, .fp-tool-group + .fp-tool-group,\n    .fp-quick-tools, .fp-sensor-tip .fp-sensor-options, .fp-device-group + .fp-device-group) { border-color: var(--ha-border); }\n#floor-planner :is(.fp-viewbar summary, .fp-viewbar button, .fp-toolbar button, .fp-outline-tools button, .fp-placement-bar button,\n    .fp-selection-jump, .fp-stage .fp-place-actions button) { color: var(--ha-ink); }\n#floor-planner :is(.fp-outline-tools button, .fp-placement-bar button, .fp-stage .fp-place-actions button) { border-color: var(--ha-border); }\n#floor-planner .fp-stage .fp-place-actions button { background: var(--ha-input); }\n#floor-planner :is(.fp-viewbar, .fp-toolbar, .fp-stage, .fp-library-panel, .fp-sidebar, .fp-toolbar-panel, .fp-furniture-dialog, .fp-ha-actions) button:hover:not(:disabled),\n#floor-planner .fp-viewbar summary:hover { background: var(--ha-hover); }\n#floor-planner :is(button[aria-pressed="true"], .fp-drawing-menu[open] > summary, .fp-drawing-menu[data-active] > summary,\n    .fp-stage .fp-place-actions #fp-place-center, .fp-outline-tools [data-action="save_outline"]:not(:disabled)) {\n    color: var(--ha-accent); border-color: var(--ha-focus); background: var(--ha-selected);\n}\n#floor-planner :is(.fp-primary, .fp-placement-bar .fp-placement-primary) { color: #fff; border-color: transparent; background: var(--ha-action); }\n#floor-planner :is(.fp-primary, .fp-placement-bar .fp-placement-primary, .fp-ha-actions .save):hover:not(:disabled) { color: #fff; background: color-mix(in srgb, var(--ha-action), #111827 16%); }\n#floor-planner :focus-visible { outline-color: var(--ha-focus); }\n#floor-planner :is(.fp-tool-group > p, .fp-shortcuts, .fp-zoom-shortcut, .fp-wheel-shortcut, .fp-draw-keys, .fp-space-empty,\n    .fp-placement-copy span, .fp-opening-dimensions label, .fp-sensor-tip > p, .fp-sensor-tip dt, #fp-beam-note, .fp-room-corner-position label) { color: var(--ha-muted); }\n#floor-planner .fp-scale span { border-color: var(--ha-muted); }\n\n#floor-planner .fp-library-panel { --fp-catalog-ink: var(--ha-ink); --fp-catalog-muted: var(--ha-muted); border-color: var(--ha-border); background: var(--ha-panel); }\n#floor-planner .fp-library-panel :is(.ceiling, .wall) { color: var(--ha-ceiling); }\n#floor-planner .fp-library-panel .wall { color: var(--ha-wall); }\n#floor-planner #fp-search-empty { margin: 0; padding: 11px; border-radius: 7px; color: var(--ha-ink); background: var(--ha-input); line-height: 1.5; }\n#floor-planner #fp-catalog button[data-ha-device] { min-height: 44px; }\n#floor-planner #fp-catalog button[data-ha-device]:disabled { opacity: .8; }\n#floor-planner #fp-catalog button[data-ha-device]:disabled .fp-add { color: var(--ha-wall); }\n.fp-ha-area-filter { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 10px; padding: 9px 10px; border: 1px solid var(--ha-border); border-radius: 8px; color: var(--ha-ink); background: var(--ha-selected); font-size: 12px; }\n#floor-planner .fp-ha-area-filter button { flex: 0 0 auto; min-height: 34px; padding: 5px 9px; border-color: var(--ha-border); color: var(--ha-ink); background: var(--ha-panel); }\n.fp-ha-room-link { display: grid; gap: 9px; margin: 14px 0 4px; padding: 12px; border: 1px solid var(--ha-border); border-radius: 9px; background: var(--ha-input); }\n.fp-ha-room-link legend { padding: 0 5px; color: var(--ha-ink); font-size: 13px; font-weight: 700; }\n.fp-ha-room-link p { margin: 0; color: var(--ha-muted); font-size: 12px; line-height: 1.45; }\n.fp-ha-room-link label { display: grid; gap: 4px; min-width: 0; color: var(--ha-ink); font-size: 12px; font-weight: 650; }\n.fp-ha-room-link select { width: 100%; min-width: 0; }\n@media (max-width: 520px) {\n    .fp-ha-area-filter { align-items: stretch; flex-direction: column; }\n    #floor-planner .fp-ha-area-filter button { width: 100%; }\n}\n#fp-sensor-edit-ha { display: grid; gap: 4px; }\n#floor-planner :is(.fp-furniture-dialog, .fp-room-form, .fp-underlay-controls, .fp-recovery) { color: var(--ha-ink); border-color: var(--ha-border); background: var(--ha-panel); }\n#floor-planner :is(.fp-pdf-preview, .fp-crop-stage) { background: var(--ha-input); }\n#floor-planner .fp-underlay-controls button { background: var(--ha-input); }\n#floor-planner .fp-underlay-controls .fp-recognise { color: #fff; border-color: transparent; background: var(--ha-action); }\n#floor-planner .fp-underlay-controls .fp-recognise:hover:not(:disabled) { background: color-mix(in srgb, var(--ha-action), #111827 16%); }\n#floor-planner :is(#fp-search, #fp-inspector input, #fp-inspector select, .fp-room-form-inputs input, .fp-floor-field input:not([type="range"]),\n    .fp-room-corner-position input, .fp-placement-copy select, .fp-opening-dimensions input, #fp-zone-type, .fp-sensor-edit select,\n    .fp-sensor-edit input[type="number"], .fp-furniture-dialog input, .fp-furniture-dialog select, .fp-underlay-controls input[type="number"],\n    .fp-radar-panel select) { color: var(--ha-ink); border-color: var(--ha-border); background: var(--ha-input); }\n#floor-planner :is(.fp-count, .fp-ceiling-settings, .fp-mount, .fp-cross-section svg, .fp-sensor-edit-model img,\n    .fp-furniture-controls, #fp-sensor-config > .fp-sensor-options) { border-color: var(--ha-border); background: var(--ha-input); }\n#floor-planner :is(.fp-index, .fp-next, .fp-undo-notice) { color: var(--ha-accent); border-color: var(--ha-border); background: var(--ha-selected); }\n#floor-planner :is(.fp-next p, .fp-undo-notice button) { color: var(--ha-ink); }\n#floor-planner .fp-index.wall { color: var(--ha-wall); background: color-mix(in srgb, var(--ha-wall) 14%, var(--ha-panel)); }\n.fp-saved-placements { margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--ha-border); }\n.fp-saved-placements summary { padding: 7px 2px; color: var(--ha-muted); font-size: 12px; }\n.fp-saved-placements .fp-placed { width: 100%; }\n#floor-planner :is(.fp-warning, .fp-cross-sides) { color: var(--ha-warn); }\n#floor-planner :is(#fp-room-form-error, #fp-start-status, [data-action="delete"], [data-action="remove_floor"]) { color: var(--ha-danger); }\n#floor-planner #fp-start-status[data-busy] { color: var(--ha-muted); }\n\n/* The map shares the same scheme as its controls, including its SVG grid and text. */\n#fp-small-grid path { stroke: var(--ha-grid); }\n#fp-grid path, #fp-space-grid path { stroke: var(--ha-grid-major); }\n#floor-planner .fp-room-floor { fill: var(--ha-room); stroke: var(--ha-room-edge); }\n#floor-planner .fp-room-casing { stroke: var(--ha-room); }\n#floor-planner :is(.fp-room.selected > .fp-room-floor, .fp-room-outline, .fp-wall.selected line:last-child) { stroke: var(--ha-ceiling); }\n#floor-planner :is(.fp-room-label, .fp-wall-measure) { fill: var(--ha-ink); stroke: var(--ha-room); }\n#floor-planner .fp-room-size { fill: var(--ha-muted); }\n#floor-planner .fp-wall line:not(.fp-wall-hit) { stroke: var(--ha-room-edge); }\n#floor-planner .fp-door-gap { stroke: var(--ha-room); }\n#floor-planner .fp-cursor { stroke: var(--ha-ink); }\n#floor-planner :is(.fp-person-flat, .fp-person-space) { pointer-events: none; }\n#floor-planner .fp-person-base { fill: light-dark(#e8f7ef, #2b473f); stroke: var(--ha-wall); }\n\n:root[data-ha-theme="light"] #floor-planner {\n    .fp-space-floor.selected { stroke: var(--ha-ceiling); }\n    .fp-model-shadow { fill: #384e66; opacity: .19; }\n    .fp-space-marker circle, .fp-sensor { fill: var(--ha-room); }\n    .fp-space-marker.selected circle { fill: var(--ha-selected); }\n    .fp-building-label { fill: var(--ha-ink); stroke: var(--ha-map); }\n    :is(.fp-door-leaf, .fp-space-door) { stroke: #91612d; }\n    .fp-opening { color: #216d99; }\n    .fp-opening.mirrors { color: #864cb2; }\n    .fp-plan-zone { color: #217956; }\n    .fp-plan-zone.exclusion { color: #ac464c; }\n    .fp-plan-zone.interference { color: #986019; }\n    .fp-plan-zone.entry { color: #187d73; }\n    :is(#fp-cone-space, .fp-stack-beam) { --fp-beam-color: #6454d1; }\n    .fp-wall-sector { fill: var(--ha-wall); stroke: var(--ha-wall); }\n}\n';

// src/js/floor-planner-furniture.mjs
var entries = {
  living: {
    sofa: [2.25, 0.9, 0.85, "textile", "sofa"],
    corner: [2.8, 1.65, 0.85, "textile", "corner"],
    armchair: [0.85, 0.85, 0.85, "textile", "sofa"],
    coffee: [1.15, 0.6, 0.43, "wood", "table"],
    rug: [2.5, 1.7, 0.02, "ignore", "solid"],
    tv: [1.2, 0.12, 0.68, "mixed", "solid", 0.8],
    plant: [0.55, 0.55, 1.25, "mixed", "solid"]
  },
  work: {
    dining: [1.8, 0.85, 0.76, "wood", "table"],
    chair: [0.48, 0.52, 0.86, "wood", "chair"],
    desk: [1.45, 0.7, 0.76, "wood", "table"],
    island: [1.8, 0.9, 0.92, "wood", "solid"],
    fridge: [0.62, 0.67, 1.85, "metal", "solid"],
    washer: [0.6, 0.65, 0.85, "metal", "solid"]
  },
  sleep: {
    bed: [1.65, 2.1, 0.62, "textile", "bed"],
    nightstand: [0.43, 0.42, 0.52, "wood", "solid"],
    cabinet: [1.25, 0.42, 1.05, "wood", "solid"],
    wardrobe: [1.8, 0.62, 2.25, "wood", "solid"],
    shelves: [1.1, 0.35, 1.85, "wood", "shelves"],
    bath: [1.7, 0.76, 0.56, "stone", "bath"]
  },
  // Things a radar notices: a turning fan or a pet can look like a person,
  // and warm air from a heater moves the air the radar sees.
  motion: {
    fan: [0.42, 0.32, 1.15, "plastic", "solid"],
    pet: [0.8, 0.38, 0.42, "textile", "solid"],
    radiator: [1, 0.1, 0.6, "metal", "solid", 0.12],
    heater: [0.42, 0.26, 0.62, "metal", "solid"]
  },
  divide: {
    screen: [1.5, 0.08, 1.8, "wood", "solid"],
    glass: [1.25, 0.024, 2, "glass", "solid"],
    curtain: [1.8, 0.06, 2.25, "textile", "solid", 0.04],
    custom: [1, 0.5, 1, "mixed", "solid"]
  }
};
var furnitureCatalog = Object.fromEntries(Object.entries(entries).flatMap(([category, models]) => Object.entries(models).map(([kind, [width, depth, height, material, shape, base = 0]]) => [kind, { category, width, depth, height, material, shape, base }])));
var furnitureCategories = Object.keys(entries);
var furnitureMaterials = ["wood", "textile", "metal", "glass", "stone", "plastic", "mixed", "ignore"];
var maxFurniture = 160;
var shapeParts = {
  solid: [[0, 0, 1, 1, 0, 1, "body"]],
  sofa: [
    [0, 0, 1, 1, 0, 0.42, "body"],
    [0.09, 0.19, 0.82, 0.74, 0.42, 0.15, "seat"],
    [0, 0, 1, 0.18, 0.42, 0.58, "body"],
    [0, 0.18, 0.09, 0.82, 0.42, 0.32, "body"],
    [0.91, 0.18, 0.09, 0.82, 0.42, 0.32, "body"]
  ],
  corner: [
    [0, 0, 1, 0.56, 0, 0.42, "body"],
    [0, 0.56, 0.32, 0.44, 0, 0.42, "body"],
    [0.05, 0.12, 0.9, 0.4, 0.42, 0.15, "seat"],
    [0.05, 0.52, 0.24, 0.43, 0.42, 0.15, "seat"],
    [0, 0, 1, 0.12, 0.42, 0.58, "body"]
  ],
  table: [
    [0, 0, 1, 1, 0.89, 0.11, "top"],
    ...[0.08, 0.85].flatMap((x) => [0.08, 0.85].map((y) => [x, y, 0.07, 0.07, 0, 0.89, "frame"]))
  ],
  chair: [
    [0.04, 0.05, 0.92, 0.9, 0.47, 0.09, "seat"],
    [0.06, 0, 0.88, 0.11, 0.56, 0.44, "body"],
    ...[0.1, 0.82].flatMap((x) => [0.1, 0.82].map((y) => [x, y, 0.08, 0.08, 0, 0.47, "frame"]))
  ],
  bed: [
    [0, 0, 1, 1, 0, 0.57, "body"],
    [0.02, 0.02, 0.96, 0.96, 0.57, 0.2, "seat"],
    [0.04, 0.29, 0.92, 0.68, 0.77, 0.07, "duvet"],
    [0.08, 0.06, 0.36, 0.18, 0.77, 0.09, "pillow"],
    [0.56, 0.06, 0.36, 0.18, 0.77, 0.09, "pillow"],
    [0, 0, 1, 0.06, 0.57, 0.43, "body"]
  ],
  shelves: [
    [0, 0, 0.07, 1, 0, 1, "frame"],
    [0.93, 0, 0.07, 1, 0, 1, "frame"],
    ...[0, 0.28, 0.56, 0.79, 0.96].map((z) => [0.07, 0, 0.86, 1, z, 0.04, "top"])
  ],
  bath: [
    [0, 0, 1, 1, 0, 0.22, "body"],
    [0, 0, 0.08, 1, 0.22, 0.78, "body"],
    [0.92, 0, 0.08, 1, 0.22, 0.78, "body"],
    [0.08, 0, 0.84, 0.09, 0.22, 0.78, "body"],
    [0.08, 0.91, 0.84, 0.09, 0.22, 0.78, "body"]
  ]
};
function furnitureParts(item) {
  return shapeParts[furnitureCatalog[item.kind].shape].map(([x, y, w, d, base, height, surface]) => ({
    x: (x - 0.5) * item.width,
    y: (y - 0.5) * item.depth,
    w: w * item.width,
    d: d * item.depth,
    low: item.base + base * item.height,
    high: item.base + (base + height) * item.height,
    surface
  }));
}
function furnitureProjection(item) {
  const radians = item.angle * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  return ([x, y]) => [item.x + x * cos - y * sin, item.y + x * sin + y * cos];
}
function furnitureFootprint(item) {
  const x = item.width / 2, y = item.depth / 2;
  return [[-x, -y], [x, -y], [x, y], [-x, y]].map(furnitureProjection(item));
}
var windows = {
  living: [[0.13, 0, 0.42, 0], [0.54, 0, 0.82, 0]],
  kitchen: [[0.17, 0, 0.64, 0]],
  office: [[0, 0.39, 0, 0.74]],
  bedroom: [[0.3, 1, 0.76, 1]],
  "main-bedroom": [[0.13, 0, 0.36, 0], [0.61, 0, 0.83, 0]],
  "child-bedroom": [[0.21, 0, 0.65, 0]],
  bathroom: [[0, 0.2, 0, 0.43]],
  study: [[0.32, 1, 0.75, 1]]
};
var exampleWindows = (room) => Object.hasOwn(windows, room.id) ? windows[room.id] : [];
function exampleFloor(room) {
  if (["living", "bedroom", "office", "main-bedroom", "child-bedroom", "study"].includes(room.id)) return "boards";
  if (["kitchen", "hall", "landing", "bathroom"].includes(room.id)) return "tiles";
  return "";
}

// src/js/ceilsense-room-model.mjs
var roomLimits = { width: [2, 15], depth: [2, 12], height: [2, 4] };
var mountingRanges = { ld2412: [2, 3], ld2460: [2, 3], ld6002b: [2, 3] };
var plannerRadars = [...Object.keys(mountingRanges), "combined"];
var slots = [0.5, 0.25, 0.75, 1 / 6, 5 / 6];
var scale = (height, reference, radii) => {
  const factor = Math.min(height / reference, reference / height);
  return radii.map((radius) => radius * factor);
};
function radarFootprint(radar, height) {
  if (radar === "combined") return radarFootprint("ld6002b", height);
  if (radar === "ld2412") {
    return {
      moving: scale(height, 2.8, [4.8, 6.4]),
      standing: scale(height, 2.8, [4.4, 5.6]),
      seated: scale(height, 2.8, [3, 4.2])
    };
  }
  const radii = radar === "ld2460" ? scale(height, 2.8, [4, 2.8]) : height < 2.7 ? scale(height, 2.7, [2.5, 1.5]) : height <= 3 ? [1.5 + (3 - height) / 0.3, 1.5] : scale(height, 3, [1.5, 1.5]);
  return { moving: radii, standing: radii, seated: radii };
}
function supportedMounting(radar, height) {
  const range = mountingRange(radar);
  return Boolean(range && height >= range[0] && height <= range[1]);
}
function mountingRange(radar) {
  if (radar !== "combined") return mountingRanges[radar];
  const [presenceMin, presenceMax] = mountingRanges.ld2412;
  const [positionMin, positionMax] = mountingRanges.ld6002b;
  return [Math.max(presenceMin, positionMin), Math.min(presenceMax, positionMax)];
}

// src/js/floor-planner-ceiling.mjs
var ceilingHeightLimits = [1, 12];
var ceilingDirections = ["x+", "x-", "y+", "y-"];
var isHeight = (height) => Number.isFinite(height) && height >= ceilingHeightLimits[0] && height <= ceilingHeightLimits[1];
function validCeiling(room) {
  if (!isHeight(room.height)) return false;
  if (room.ceiling == null) return true;
  const { type, high, direction } = room.ceiling;
  return (type === "slope" || type === "gable") && isHeight(high) && high > room.height && ceilingDirections.includes(direction) && (type !== "gable" || direction.endsWith("+"));
}
var activeCeiling = (room) => validCeiling(room) ? room.ceiling : null;
function ceilingPosition(room, point2) {
  const alongX = activeCeiling(room)?.direction.startsWith("x");
  const position = alongX ? (point2.x - room.x) / room.width : (point2.y - room.y) / room.depth;
  return Math.max(0, Math.min(1, position));
}
function ceilingHeightAt(room, point2) {
  const ceiling = activeCeiling(room);
  if (!ceiling) return room.height;
  const position = ceilingPosition(room, point2);
  const { type, direction, high } = ceiling;
  const proportion = type === "gable" ? 1 - Math.abs(2 * position - 1) : direction.endsWith("+") ? position : 1 - position;
  return Number((room.height + (high - room.height) * proportion).toFixed(6));
}
function ceilingPitch(room) {
  const ceiling = activeCeiling(room);
  if (!ceiling) return 0;
  const span = ceiling.direction.startsWith("x") ? room.width : room.depth;
  const run = ceiling.type === "gable" ? span / 2 : span;
  return Math.atan2(ceiling.high - room.height, run) * 180 / Math.PI;
}

// src/js/floor-planner-geometry.mjs
var epsilon = 1e-7;
var maxRoomCorners = 64;
var defaultWindowSill = 1.15;
var rectangle = (room) => [
  [room.x, room.y],
  [room.x + room.width, room.y],
  [room.x + room.width, room.y + room.depth],
  [room.x, room.y + room.depth]
];
var roomCorners = (room) => room.outline?.map(([x, y]) => [x + room.x, y + room.y]) ?? rectangle(room);
var polygonEdges = (points) => points.map((point2, index) => [point2, points[(index + 1) % points.length]]);
var cross = (ax, ay, bx, by) => ax * by - ay * bx;
function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  const half = (ordered) => {
    const edge = [];
    for (const point2 of ordered) {
      while (edge.length > 1) {
        const [ax, ay] = edge.at(-2), [bx, by] = edge.at(-1);
        if (cross(bx - ax, by - ay, point2[0] - ax, point2[1] - ay) > 0) break;
        edge.pop();
      }
      edge.push(point2);
    }
    return edge.slice(0, -1);
  };
  return [...half(sorted), ...half(sorted.reverse())];
}
var signedArea = (points) => polygonEdges(points).reduce((area, [[ax, ay], [bx, by]]) => area + ax * by - ay * bx, 0) / 2;
var roomArea = (room) => room.outline ? Math.abs(signedArea(room.outline)) : room.width * room.depth;
var samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < epsilon;
var onSegment = ([x, y], [ax, ay], [bx, by]) => Math.abs(cross(bx - ax, by - ay, x - ax, y - ay)) < epsilon && x >= Math.min(ax, bx) - epsilon && x <= Math.max(ax, bx) + epsilon && y >= Math.min(ay, by) - epsilon && y <= Math.max(ay, by) + epsilon;
function polygonContains(vertices, x, y, includeEdge = true) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[j], b = vertices[i];
    if (onSegment([x, y], a, b)) return includeEdge;
    if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function roomContains(room, point2, includeEdge = true) {
  const x = point2.x - room.x, y = point2.y - room.y;
  if (!room.outline) return includeEdge ? point2.x >= room.x && point2.y >= room.y && point2.x <= room.x + room.width && point2.y <= room.y + room.depth : x > epsilon && y > epsilon && x < room.width - epsilon && y < room.depth - epsilon;
  if (x < -epsilon || y < -epsilon || x > room.width + epsilon || y > room.depth + epsilon) return false;
  return polygonContains(room.outline, x, y, includeEdge);
}
function crossing(a, b, c, d) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]], [ex, ey] = [d[0] - c[0], d[1] - c[1]];
  const determinant = cross(dx, dy, ex, ey);
  if (Math.abs(determinant) < epsilon) return null;
  const [x, y] = [c[0] - a[0], c[1] - a[1]];
  const t = cross(x, y, ex, ey) / determinant, u = cross(x, y, dx, dy) / determinant;
  return t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon ? Math.max(0, Math.min(1, t)) : null;
}
function outlineBounds(points, { maxCorners = maxRoomCorners, minSpan = 0.5, maxSpan = 60, minArea = 0.1 } = {}) {
  if (points.length < 3 || points.length > maxCorners || points.some((point2) => !Array.isArray(point2) || point2.length !== 2 || !point2.every(Number.isFinite))) return null;
  const xs = points.map(([x2]) => x2), ys = points.map(([, y2]) => y2);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(...xs) - x, depth = Math.max(...ys) - y;
  const area = signedArea(points);
  if (width < minSpan || depth < minSpan || width > maxSpan || depth > maxSpan || Math.abs(area) < minArea) return null;
  const edges = polygonEdges(points);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    if (samePoint(a, b)) return null;
    const c = edges[(i + 1) % edges.length][1];
    if (onSegment(c, a, b) || onSegment(a, b, c)) return null;
    for (let j = i + 2; j < edges.length; j++) {
      if (i === 0 && j === edges.length - 1) continue;
      const [c2, d] = edges[j];
      if (crossing(a, b, c2, d) !== null || onSegment(a, c2, d) || onSegment(b, c2, d) || onSegment(c2, a, b) || onSegment(d, a, b)) return null;
    }
  }
  const outline = (area > 0 ? points : [points[0], ...points.slice(1).reverse()]).map(([px, py]) => [px - x, py - y]);
  return { x, y, width, depth, outline };
}
function validRoomOutline(room) {
  if (!Array.isArray(room.outline)) return false;
  const bounds = outlineBounds(room.outline);
  return Boolean(bounds && Math.abs(bounds.x) < epsilon && Math.abs(bounds.y) < epsilon && Math.abs(bounds.width - room.width) < epsilon && Math.abs(bounds.depth - room.depth) < epsilon && signedArea(room.outline) > 0);
}
function roomLineSpans(room, from, to, includeEdge = true) {
  const a = [from.x, from.y], b = [to.x, to.y];
  const cuts = [0, 1];
  for (const [c, d] of polygonEdges(roomCorners(room))) {
    const t = crossing(a, b, c, d);
    if (t !== null) cuts.push(t);
  }
  cuts.sort((a2, b2) => a2 - b2);
  const spans = [];
  for (let i = 1; i < cuts.length; i++) {
    const start2 = cuts[i - 1], end2 = cuts[i];
    if (end2 - start2 < epsilon) continue;
    const middle = (start2 + end2) / 2;
    if (roomContains(room, { x: a[0] + (b[0] - a[0]) * middle, y: a[1] + (b[1] - a[1]) * middle }, includeEdge)) {
      if (spans.length && start2 - spans.at(-1)[1] < epsilon) spans.at(-1)[1] = end2;
      else spans.push([start2, end2]);
    }
  }
  return spans;
}
var roomContainsLine = (room, from, to) => {
  const spans = roomLineSpans(room, from, to);
  return spans[0]?.[0] < epsilon && spans[0][1] > 1 - epsilon;
};
function roomRayEnd(room, origin, target, edges = polygonEdges(roomCorners(room))) {
  const a = [origin.x, origin.y], b = [target.x, target.y];
  let limit = 1;
  if (!roomContains(room, { x: origin.x + (target.x - origin.x) * 1e-5, y: origin.y + (target.y - origin.y) * 1e-5 })) limit = 0;
  else for (const [c, d] of edges) {
    const t = crossing(a, b, c, d);
    if (t !== null && t > epsilon) limit = Math.min(limit, t);
  }
  return [a[0] + (b[0] - a[0]) * limit, a[1] + (b[1] - a[1]) * limit];
}
function roomVisibility(room, origin) {
  const corners = roomCorners(room);
  const edges = polygonEdges(corners);
  const distance = Math.hypot(room.width, room.depth) + 1;
  const angles2 = corners.flatMap(([x, y]) => {
    const angle2 = Math.atan2(y - origin.y, x - origin.x);
    return [angle2 - 1e-5, angle2, angle2 + 1e-5];
  }).map((angle2) => (angle2 + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
  return angles2.map((angle2) => roomRayEnd(room, origin, {
    x: origin.x + Math.cos(angle2) * distance,
    y: origin.y + Math.sin(angle2) * distance
  }, edges));
}
function roomInteriorPoint(room, preferred = { x: room.x + room.width / 2, y: room.y + room.depth / 2 }) {
  if (!room.outline || roomContains(room, preferred, false)) return preferred;
  const levels = [...new Set(room.outline.map(([, y]) => y))].sort((a, b) => a - b);
  let best = preferred, score = 0;
  for (let i = 1; i < levels.length; i++) {
    const y = room.y + (levels[i - 1] + levels[i]) / 2;
    for (const [left, right] of roomLineSpans(room, { x: room.x, y }, { x: room.x + room.width, y })) {
      const weight = (right - left) * (levels[i] - levels[i - 1]);
      if (weight <= score) continue;
      best = { x: room.x + (left + right) * room.width / 2, y };
      score = weight;
    }
  }
  return best;
}
function edgePosition([ax, ay], [bx, by], point2) {
  const dx = bx - ax, dy = by - ay;
  const length = Math.hypot(dx, dy);
  const along = Math.max(0, Math.min(length, ((point2.x - ax) * dx + (point2.y - ay) * dy) / length));
  const angle2 = Math.atan2(dy, dx) * 180 / Math.PI;
  return {
    x: ax + dx * along / length,
    y: ay + dy * along / length,
    along,
    length,
    facing: (angle2 + 540) % 360,
    angle: (angle2 + 360) % 360,
    a: [ax, ay],
    b: [bx, by]
  };
}
var doorsOnPlan = (plan) => plan.doors.map((door) => {
  const angle2 = door.angle * Math.PI / 180;
  return [[door.x, door.y], [door.x + door.width * Math.cos(angle2), door.y + door.width * Math.sin(angle2)]];
});
function wallSegments(a, b, doors) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = Math.hypot(dx, dy);
  const position = ([x, y]) => ((x - a[0]) * dx + (y - a[1]) * dy) / length ** 2;
  const onLine = ([x, y]) => Math.abs((x - a[0]) * dy - (y - a[1]) * dx) / length < 0.04;
  const openings = doors.filter((door) => door.every(onLine)).map((door) => door.map(position).sort((a2, b2) => a2 - b2)).filter(([from, to]) => to > 0 && from < 1).sort(([a2], [b2]) => a2 - b2);
  const at = (fraction) => [a[0] + dx * fraction, a[1] + dy * fraction];
  const segments = [];
  let end2 = 0;
  for (const [from, to] of openings) {
    if (from > end2) segments.push([at(end2), at(from)]);
    end2 = Math.max(end2, to);
  }
  if (end2 < 1) segments.push([at(end2), b]);
  return segments;
}

// src/js/floor-planner-underlay.mjs
var bound = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
var maxImageData = 32e4;
var wholeImage = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
function validUnderlay(image) {
  return image && typeof image.data === "string" && image.data.length <= maxImageData && /^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(image.data) && bound(image.ratio, 0.04, 25) && bound(image.width, 0.5, 220) && bound(image.x, -250, 250) && bound(image.y, -250, 250) && bound(image.opacity, 10, 85) && (image.roomTransparency === void 0 || bound(image.roomTransparency, 0, 100));
}

// src/js/floor-planner-model.mjs
var devices = {
  "ceilsense-mini": { name: "CeilSense Mini", image: "/images/ceilsense/final/mini-iso.webp", mount: "ceiling", defaultRadar: "ld2412", coming: true },
  "ceilsense-v2": { name: "CeilSense V2", image: "/images/ceilsense/final/v2-iso.webp", mount: "ceiling", defaultRadar: "ld2412" },
  "ceilsense-pro": { name: "CeilSense Pro", image: "/images/ceilsense/final/pro-iso.webp", mount: "ceiling", defaultRadar: "ld2412", coming: true },
  ceilsense: { name: "CeilSense V1", mount: "ceiling" },
  ultimatesensor: { name: "UltimateSensor", mount: "wall" },
  "ultimatesensor-mini": { name: "UltimateSensor Mini", mount: "wall" },
  "ultimatesensor-v2": { name: "UltimateSensor V2", image: "/assets/ultimatesensor-v2-white-hero.webp", mount: "wall", defaultRadar: "ld2450" },
  "ultimatesensor-mini-v2": { name: "UltimateSensor Mini V2", image: "/assets/ultimatesensor-mini-v2-white-hero.webp", mount: "wall", defaultRadar: "ld2450" },
  wallsense: { name: "WallSense", image: "/images/wallsense/hero-2026-09-22-512.webp", mount: "wall", defaultRadar: "ld2450", coming: true }
};
function installationsFor(model) {
  if (model === "wallsense") return ["wall-recessed"];
  if (devices[model]?.mount === "ceiling") return ["ceilsense-mini", "ceilsense-pro"].includes(model) ? ["ceiling-recessed", "ceiling-surface"] : ["ceiling-recessed"];
  return ["ultimatesensor-v2", "ultimatesensor-mini-v2"].includes(model) ? ["freestanding", "wall-bracket"] : ["freestanding"];
}
function radarsFor(model) {
  const device = devices[model];
  if (!device.defaultRadar) return ["none"];
  if (model === "wallsense") return ["ld2450"];
  if (device.mount === "wall") return ["ld2450", "ld2460"];
  return model === "ceilsense-v2" ? ["none", ...plannerRadars] : plannerRadars.filter((radar) => radar !== "combined");
}
function validSensorRadar(item) {
  if (!item.haDevice) return radarsFor(item.model).includes(item.radar);
  return item.radar === "none" || (devices[item.model].mount === "wall" ? ["ld2450", "ld2460"].includes(item.radar) : plannerRadars.includes(item.radar));
}
var contains = roomContains;
function wallVector(angle2) {
  const radians = angle2 * Math.PI / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}
function roomForDevice(rooms, item) {
  const facing = wallVector(item.angle);
  const point2 = devices[item.model].mount === "wall" ? { x: item.x + facing.x * 0.08, y: item.y + facing.y * 0.08 } : item;
  return rooms.find((room) => contains(room, point2));
}
function ceilingCoverageStatus(room, item) {
  if (!room) return "missing";
  if (room.ceiling && item.levelMountRoom !== room.id) return "tilted";
  return supportedMounting(item.radar, ceilingHeightAt(room, item)) ? "reference" : "height";
}
var numberBetween = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
var validRoomDimensions = (room) => numberBetween(room.width, 0.5, 60) && numberBetween(room.depth, 0.5, 60) && validCeiling(room);
var point = (value) => value && numberBetween(value.x, -100, 100) && numberBetween(value.y, -100, 100);
var angle = (value) => Number.isFinite(value) && value >= 0 && value < 360;
var validName = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 48;
var validMirrorProtection = (item) => (item.protectionEnabled === void 0 || typeof item.protectionEnabled === "boolean") && (item.reflectionDepthM === void 0 || numberBetween(item.reflectionDepthM, 0.25, 6));
var list = (value, check, maximum = 80) => Array.isArray(value) && value.length <= maximum && value.every((item) => item && typeof item.id === "string" && /^[a-z\d-]{1,48}$/i.test(item.id) && check(item));
var floorFinishes = ["boards", "tiles", "carpet", "concrete", "plain"];
var wallColors = ["white", "sand", "sage", "blue", "clay", "grey"];
var validFinish = (room) => (room.floorFinish === void 0 || floorFinishes.includes(room.floorFinish)) && (room.wallColor === void 0 || wallColors.includes(room.wallColor));
function validPlan(plan) {
  if (!plan || ![1, 2, 3].includes(plan.version) || !validName(plan.name)) return false;
  if (plan.underlay !== void 0 && !validUnderlay(plan.underlay)) return false;
  if (!list(plan.rooms, (item) => point(item) && validName(item.name) && validRoomDimensions(item) && validFinish(item) && (item.useSampleName === void 0 || typeof item.useSampleName === "boolean") && (item.outline === void 0 || plan.version >= 2 && validRoomOutline(item)) && (item.obstacles === void 0 || typeof item.obstacles === "boolean") && (item.priority == null || numberBetween(item.priority.x, 0.05, 0.95) && numberBetween(item.priority.y, 0.05, 0.95)))) return false;
  if (!list(plan.walls, (item) => point(item) && point({ x: item.endX, y: item.endY }) && (item.x !== item.endX || item.y !== item.endY))) return false;
  if (!list(plan.doors, (item) => point(item) && angle(item.angle) && numberBetween(item.width, 0.5, 2))) return false;
  if (!list(plan.sensors, (item) => point(item) && angle(item.angle) && Object.hasOwn(devices, item.model) && validSensorRadar(item) && (item.installation === void 0 || installationsFor(item.model).includes(item.installation)) && (item.climate === void 0 || item.model === "ceilsense-v2" && typeof item.climate === "boolean") && (item.mountHeight === void 0 || devices[item.model].mount === "wall" && numberBetween(item.mountHeight, 0.15, 6)) && (item.levelMountRoom == null || plan.rooms.some((room) => room.id === item.levelMountRoom && room.ceiling)))) return false;
  if (plan.furniture !== void 0 && !list(plan.furniture, (item) => point(item) && angle(item.angle) && validName(item.name) && Object.hasOwn(furnitureCatalog, item.kind) && furnitureMaterials.includes(item.material) && numberBetween(item.width, 0.02, 12) && numberBetween(item.depth, 0.02, 12) && numberBetween(item.height, 0.01, 6) && numberBetween(item.base, 0, 6), maxFurniture)) return false;
  const roomIds = new Set(plan.rooms.map((room) => room.id));
  for (const key of ["windows", "mirrors"]) {
    if (plan[key] !== void 0 && (plan.version !== 3 || !list(plan[key], (item) => point(item) && angle(item.angle) && roomIds.has(item.roomId) && numberBetween(item.width, 0.1, 8) && numberBetween(item.height, 0.1, 6) && numberBetween(item.base, 0, 6) && (key !== "mirrors" || validMirrorProtection(item))))) return false;
  }
  const sensorIds = new Set(plan.sensors.map((sensor) => sensor.id));
  if (plan.zones !== void 0 && (plan.version !== 3 || !list(plan.zones, (zone) => {
    if (!roomIds.has(zone.roomId) || !validName(zone.name) || !zoneTypes.includes(zone.type) || zone.direction !== void 0 && !["left", "right"].includes(zone.direction) || zone.sensorId != null && !sensorIds.has(zone.sensorId) || !Array.isArray(zone.parts) || !zone.parts.length || zone.parts.length > 12) return false;
    const room = plan.rooms.find((room2) => room2.id === zone.roomId);
    return zone.parts.every((part) => Array.isArray(part) && part.length >= 2 && part.length <= 64 && part.every((p) => Array.isArray(p) && p.length === 2 && point({ x: p[0], y: p[1] }) && contains(room, { x: p[0], y: p[1] })) && (zone.type === "entry" ? part.length === 2 && Math.hypot(part[1][0] - part[0][0], part[1][1] - part[0][1]) >= 0.1 : Boolean(outlineBounds(part, { minSpan: 0.1, minArea: 0.025 }))) && part.every(([x, y], i) => {
      if (zone.type === "entry" && i === 1) return true;
      const [endX, endY] = part[(i + 1) % part.length];
      return !room.outline || roomContainsLine(room, { x, y }, { x: endX, y: endY });
    }));
  }))) return false;
  const items = ["rooms", "walls", "doors", "sensors", "furniture", "windows", "mirrors", "zones"].flatMap((key) => plan[key] ?? []);
  return new Set(items.map((item) => item.id)).size === items.length;
}
var zoneTypes = ["detection", "exclusion", "entry", "interference"];
function blankPlan(name) {
  return { version: 1, name, rooms: [], walls: [], doors: [], sensors: [] };
}
var sampleRoomLayout = [
  ["living", 0, 0, 6.5, 4.5],
  ["kitchen", 6.5, 0, 4, 4.5],
  ["office", 0, 4.5, 4, 3.5],
  ["hall", 4, 4.5, 3, 3.5],
  ["bedroom", 7, 4.5, 3.5, 3.5]
];
var upperRoomLayout = [
  ["main-bedroom", 0, 0, 5, 4.5],
  ["child-bedroom", 5, 0, 5.5, 4.5],
  ["bathroom", 0, 4.5, 4, 3.5],
  ["landing", 4, 4.5, 3, 3.5],
  ["study", 7, 4.5, 3.5, 3.5]
];
var sampleRoomIds = new Set([...sampleRoomLayout, ...upperRoomLayout].map(([id]) => id));

// src/js/wall-radar-profiles.mjs
var derate = 0.8;
var wallPresence = { half: 75, range: 9 * derate };
var wallTrackers = {
  ld2450: { half: 60, range: 6 * derate, still: 6 * derate, max: 3, maxStill: 3 },
  ld2460: { half: 60, range: 6 * derate, still: 5 * derate, max: 5, maxStill: 3 }
};

// src/js/floor-planner-radar.mjs
var ceilingProfiles = ["seated", "standing", "moving"];
function wallSector({ half, range }) {
  const radians = half * Math.PI / 180;
  const x = range * Math.sin(radians);
  const y = -range * Math.cos(radians);
  return `M0 0 ${-x} ${y} A${range} ${range} 0 0 1 ${x} ${y}Z`;
}
function radarOrigin(item) {
  if (devices[item.model].mount === "ceiling") return item;
  const facing = wallVector(item.angle);
  return { x: item.x + facing.x * 0.08, y: item.y + facing.y * 0.08 };
}
function sensorMountHeight(item, room) {
  return devices[item.model].mount === "wall" ? item.mountHeight ?? 1.4 : room ? ceilingHeightAt(room, item) : 0;
}
function radarFields(room, item, { allowHeightEstimate = false } = {}) {
  if (!room || item.radar === "none") return [];
  if (devices[item.model].mount === "wall") {
    return [
      { ...wallPresence, radar: "ld2412", mode: "presence", secondary: true },
      { ...wallTrackers[item.radar], radar: item.radar, mode: "xy" }
    ];
  }
  if (!plannerRadars.includes(item.radar)) return [];
  const status = ceilingCoverageStatus(room, item);
  const height = ceilingHeightAt(room, item);
  const [minHeight, maxHeight] = roomLimits.height;
  const estimatedHeight = status === "height" && allowHeightEstimate && height >= minHeight && height <= maxHeight;
  if (status !== "reference" && !estimatedHeight) return [];
  const radars = item.radar === "combined" ? ["ld6002b", "ld2412"] : [item.radar];
  return radars.map((radar, index) => {
    const footprint = radarFootprint(radar, height);
    return {
      radii: footprint.seated,
      profiles: radar === "ld2412" ? footprint : null,
      radar,
      mode: { ld2412: "presence", ld2460: "xy", ld6002b: "xyz" }[radar],
      secondary: index > 0,
      estimatedHeight
    };
  });
}

// src/js/floor-planner-drawing.mjs
var escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[character]);
var rectangle2 = (x, y, width, depth, radius = 0) => `<rect x="${x}" y="${y}" width="${width}" height="${depth}" rx="${radius}"/>`;
function paintRoomSurface(room, attributes = "", local = false) {
  if (!room.outline) return `<rect ${attributes} x="${local ? 0 : room.x}" y="${local ? 0 : room.y}" width="${room.width}" height="${room.depth}"/>`;
  const points = local ? room.outline : roomCorners(room);
  return `<polygon ${attributes} points="${points.map((point2) => point2.join(",")).join(" ")}"/>`;
}
function paintZone(item, project, active) {
  return `<g class="fp-plan-zone ${item.type}${active ? " selected" : ""}" data-item="${item.id}">
        ${item.parts.map((part) => {
    const entry = item.type === "entry";
    const shape = `<${entry ? "polyline" : "polygon"} points="${part.map(project).map((point2) => point2.join(",")).join(" ")}"/>`;
    if (!entry) return shape;
    const [[ax, ay], [bx, by]] = part;
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
    const x = (ax + bx) / 2, y = (ay + by) / 2;
    const side = item.direction === "left" ? -1 : 1;
    const normalX = -dy / length * side, normalY = dx / length * side;
    const arrow = [[x - normalX * 0.07, y - normalY * 0.07], [x + normalX * 0.23, y + normalY * 0.23]].map(project);
    const left = project([x + normalX * 0.13 + dx / length * 0.09, y + normalY * 0.13 + dy / length * 0.09]);
    const right = project([x + normalX * 0.13 - dx / length * 0.09, y + normalY * 0.13 - dy / length * 0.09]);
    return shape + `<path class="fp-entry-arrow" d="M${arrow[0].join(" ")}L${arrow[1].join(" ")}M${left.join(" ")}L${arrow[1].join(" ")}L${right.join(" ")}"/>`;
  }).join("")}
    </g>`;
}
function paintWindows(room) {
  if (room.outline) return "";
  return exampleWindows(room).map(([x, y, endX, endY]) => `<path class="fp-window" d="M${x * room.width} ${y * room.depth}L${endX * room.width} ${endY * room.depth}"/>`).join("");
}
function paintFurniture(item, selected = false, interactive = true) {
  const shape = furnitureParts(item).map((part) => `<rect class="fp-furniture-part" x="${part.x}" y="${part.y}" width="${part.w}" height="${part.d}"/>`).join("");
  return `<g class="fp-plan-furniture${selected ? " selected" : ""}" ${interactive ? `data-item="${item.id}" data-furniture-id="${item.id}"` : ""} data-material="${item.material}"
        transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
        <rect class="fp-furniture-hit" x="${-item.width / 2}" y="${-item.depth / 2}" width="${item.width}" height="${item.depth}"/>${shape}</g>`;
}
function coverage(item, room, isSelected, focus, radarOptions) {
  const fields = radarFields(room, item, radarOptions);
  if (!fields.length) return "";
  const ceiling = devices[item.model].mount === "ceiling";
  const shape = fields.map((field) => {
    const style = field.secondary ? ' class="fp-secondary-range"' : "";
    if (!field.radii) return `<path${style} d="${wallSector(field)}"/>`;
    if (field.profiles && focus?.item.id === item.id && focus.field.radar === field.radar) {
      return [...ceilingProfiles].reverse().map((name) => {
        const [rx2, ry2] = field.profiles[name];
        return `<ellipse class="fp-profile-rim${name === focus.profile ? " active" : ""}" data-profile="${name}" rx="${rx2}" ry="${ry2}"/>`;
      }).join("");
    }
    const [rx, ry] = field.radii;
    return `<ellipse${style} rx="${rx}" ry="${ry}"/>`;
  }).join("");
  const clipId = room.outline ? "fp-sight-" + item.id : "clip-" + room.id;
  const clip = room.outline ? `<defs><clipPath id="${clipId}">
        <polygon points="${roomVisibility(room, radarOrigin(item)).map((point2) => point2.join(",")).join(" ")}"/>
    </clipPath></defs>` : "";
  return `${clip}<g class="fp-range ${ceiling ? "ceiling" : "wall"} ${isSelected ? "selected" : ""}"
        ${fields.some((field) => field.estimatedHeight) ? "data-height-estimate" : ""} clip-path="url(#${clipId})">
        <g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">${shape}</g></g>`;
}
function ceilingMarks(room, number, active) {
  if (!room.ceiling) return "";
  const { direction, type, high } = room.ceiling;
  const alongX = direction.startsWith("x");
  const slopeSize = alongX ? room.width : room.depth;
  const crossSize = alongX ? room.depth : room.width;
  const center = crossSize / 2;
  const low = direction.endsWith("+") ? 0.2 * slopeSize : 0.8 * slopeSize;
  const top = type === "gable" ? slopeSize / 2 : slopeSize - low;
  const path = alongX ? `M${low} ${center}H${top}` : `M${center} ${low}V${top}`;
  const labels = alongX ? [[low, center + 0.24], [top, center - 0.1]] : [[center + 0.12, low], [center + 0.12, top]];
  const ridge = type !== "gable" ? "" : alongX ? `M${top} 0V${crossSize}` : `M0 ${top}H${crossSize}`;
  const sideMarks = alongX ? [[0.13, center - 0.14], [room.width - 0.13, center - 0.14]] : [[center - 0.16, 0.24], [center - 0.16, room.depth - 0.13]];
  return `<g class="fp-ceiling-marks${active ? " active" : ""}">
        ${active ? sideMarks.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${index ? "B" : "A"}</text>`).join("") : ""}
        ${ridge ? `<path d="${ridge}"/>` : ""}
        <path class="fp-slope-arrow" d="${path}" marker-end="url(#fp-slope-tip)"/>
        ${labels.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${number.format(index === 0 ? room.height : high)} m</text>`).join("")}
    </g>`;
}
var heightTag = { x: 0.27, y: -0.48, width: 0.8, height: 0.27 };
var roomLabelPosition = (room) => roomInteriorPoint(room, { x: room.x + room.width * 0.32, y: room.y + room.depth * 0.22 });
function ceilingMask(rooms, sensors, heightTagSensor) {
  const x = Math.min(...rooms.map((room) => room.x)) - 1;
  const y = Math.min(...rooms.map((room) => room.y)) - 1;
  const width = Math.max(...rooms.map((room) => room.x + room.width)) - x + 1;
  const height = Math.max(...rooms.map((room) => room.y + room.depth)) - y + 1;
  const sensorsCutout = sensors.map((item) => `<g transform="translate(${item.x} ${item.y})" fill="black">
        <circle r=".39"/>
        <rect class="fp-number-cutout" x=".29" y="-.19" width=".39" height=".34"/>
        ${item === heightTagSensor ? `<rect class="fp-height-cutout" x="${heightTag.x - 0.06}" y="${heightTag.y - 0.06}"
                width="${heightTag.width + 0.12}" height="${heightTag.height + 0.12}"/>` : ""}
    </g>`).join("");
  const labelsCutout = rooms.filter((room) => room.outline).map((room) => {
    const label = roomLabelPosition(room);
    const width2 = Math.min(room.width, Math.min(24, room.name.length) * 0.15 + 0.45);
    return `<rect x="${label.x - width2 / 2}" y="${label.y - 0.27}" width="${width2}" height=".66" fill="black"/>`;
  }).join("");
  return `<mask id="fp-slope-clearance" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
        x="${x}" y="${y}" width="${width}" height="${height}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>${sensorsCutout}${labelsCutout}
    </mask>`;
}
var sensorMarkerAttributes = (item, index) => `data-sensor-marker="" tabindex="0" role="button" aria-haspopup="dialog" aria-label="${String(index + 1).padStart(2, "0")} · ${devices[item.model].name}"`;
function paintPlan(plan, showCoverage, selected, number, focus = null, { measures = false, interactiveSensors = false, radarOptions, casing = false } = {}) {
  const selectedClass = (item) => selected === item.id ? " selected" : "";
  const activeSensor = plan.sensors.find((item) => item.id === selected);
  const activeRoom = plan.rooms.find((room) => room.id === selected) ?? (activeSensor && roomForDevice(plan.rooms, activeSensor));
  const rooms = plan.rooms.map((room) => `<g data-item="${room.id}" class="fp-room${selectedClass(room)}" transform="translate(${room.x} ${room.y})">
        ${casing ? paintRoomSurface(room, 'class="fp-room-casing"', true) : ""}
        ${paintRoomSurface(room, 'class="fp-room-floor"', true)}
        ${plan.windows?.some((window) => window.roomId === room.id) ? "" : paintWindows(room)}
    </g>`).join("");
  const roomLabels = plan.rooms.map((room) => {
    const measures2 = room.outline ? `${number.format(roomArea(room))} m²` : `${number.format(room.width)} × ${number.format(room.depth)} m`;
    const label = room.outline ? roomLabelPosition(room) : null;
    const name = room.name.length > 24 && label ? room.name.slice(0, 23) + "..." : room.name;
    return `<g pointer-events="none" transform="translate(${room.x} ${room.y})">
            ${label ? `<g class="fp-room-label" text-anchor="middle" transform="translate(${label.x - room.x} ${label.y - room.y})">
                <text>${escapeText(name)}</text><text class="fp-room-size" y=".28">${measures2}</text>
            </g>` : `<svg class="fp-room-label" x=".23" y=".17" width="${room.width - 0.31}" height="1.5" overflow="hidden">
                <text y=".34">${escapeText(room.name)}</text>
                <text class="fp-room-size" y=".64">${measures2}</text>
            </svg>`}
        </g>`;
  }).join("");
  const ceilingRooms = plan.rooms.filter((room) => room.ceiling);
  const heightTagSensor = activeRoom?.ceiling && activeSensor && devices[activeSensor.model].mount === "ceiling" ? activeSensor : null;
  const slopeMask = ceilingRooms.length && (plan.sensors.length || ceilingRooms.some((room) => room.outline)) ? ceilingMask(ceilingRooms, plan.sensors, heightTagSensor) : "";
  const marks = ceilingRooms.map((room) => `<g${room.outline ? ` clip-path="url(#clip-${room.id})"` : ""}>
        <g transform="translate(${room.x} ${room.y})">${ceilingMarks(room, number, room.id === activeRoom?.id)}</g>
    </g>`).join("");
  const ceilingLayer = marks ? `<g${slopeMask ? ' mask="url(#fp-slope-clearance)"' : ""}>${marks}</g>` : "";
  const clips = plan.rooms.map((room) => `<clipPath id="clip-${room.id}">${paintRoomSurface(room)}</clipPath>`).join("");
  const ranges = showCoverage ? plan.sensors.map((item) => coverage(item, roomForDevice(plan.rooms, item), selected === item.id, focus, radarOptions)).join("") : "";
  const outline = activeRoom && activeRoom.id === selected ? paintRoomSurface(activeRoom, 'class="fp-room-outline"') : "";
  const walls = plan.walls.map((wall) => `<g class="fp-wall${selectedClass(wall)}" data-item="${wall.id}">
        <line class="fp-wall-hit" x1="${wall.x}" y1="${wall.y}" x2="${wall.endX}" y2="${wall.endY}"/>
        <line x1="${wall.x}" y1="${wall.y}" x2="${wall.endX}" y2="${wall.endY}"/></g>`).join("");
  const doors = plan.doors.map((door) => `<g data-item="${door.id}" class="fp-door${selectedClass(door)}" transform="translate(${door.x} ${door.y}) rotate(${door.angle})">
        <path class="fp-door-gap" d="M0 0h${door.width}"/>
        <path class="fp-door-leaf" d="M0 0v-${door.width}a${door.width} ${door.width} 0 0 1 ${door.width} ${door.width}"/>
        ${rectangle2(-0.12, -door.width - 0.12, door.width + 0.24, door.width + 0.24)}
    </g>`).join("");
  const sensors = plan.sensors.map((item, index) => {
    const mount = devices[item.model].mount;
    const icon = mount === "ceiling" ? '<circle r=".2"/><circle class="fp-sensor-eye" r=".072"/>' : '<rect x="-.2" y="-.16" width=".4" height=".32" rx=".06"/><path d="M-.07 .025 0-.06.07 .025" fill="none"/>';
    const mountHeight = item === heightTagSensor ? `<g class="fp-sensor-height" transform="translate(${heightTag.x} ${heightTag.y})">
                <rect x="0" y="0" width="${heightTag.width}" height="${heightTag.height}" rx=".05"/>
                <text x=".4" y=".18" text-anchor="middle">${number.format(ceilingHeightAt(activeRoom, item))} m</text>
            </g>` : "";
    return `<g data-item="${item.id}" class="fp-sensor ${mount}${selectedClass(item)}" transform="translate(${item.x} ${item.y})" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ""}>
            <circle r=".34" class="fp-sensor-halo"/><g transform="rotate(${item.angle})">${icon}</g>
            ${interactiveSensors ? '<circle class="fp-sensor-focus" r=".39"/>' : ""}
            <text x=".36" y=".08">${String(index + 1).padStart(2, "0")}</text>${mountHeight}
        </g>`;
  }).join("");
  const furniture = (plan.furniture ?? []).map((item) => paintFurniture(item, selected === item.id)).join("");
  const openings = ["windows", "mirrors"].flatMap((type) => (plan[type] ?? []).map((item) => `<g class="fp-opening ${type}${selectedClass(item)}" data-item="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            <line class="fp-opening-hit" x2="${item.width}"/><line x2="${item.width}"/>
            <path d="M0 -.075v.15 M${item.width} -.075v.15"/></g>`)).join("");
  const dimensions = measures ? plan.rooms.map((room) => polygonEdges(roomCorners(room)).map(([[ax, ay], [bx, by]]) => {
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
    const x = (ax + bx) / 2 - dy / length * 0.2, y = (ay + by) / 2 + dx / length * 0.2;
    const angle2 = Math.atan2(dy, dx) * 180 / Math.PI;
    const rotation = angle2 > 90 || angle2 < -90 ? angle2 + 180 : angle2;
    return length < 0.35 ? "" : `<text class="fp-wall-measure" x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})">${number.format(length)} m</text>`;
  }).join("")).join("") : "";
  const zones = (plan.zones ?? []).map((item) => paintZone(item, (point2) => point2, selected === item.id)).join("");
  return `<defs>${clips}${slopeMask}<marker id="fp-slope-tip" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2 0 4Z" fill="#b4baff"/></marker></defs>${rooms}${furniture}${ranges}${zones}${ceilingLayer}${walls}${outline}${doors}${openings}${dimensions}${roomLabels}${sensors}`;
}

// src/js/floor-planner-depth.mjs
var epsilon2 = 1e-5;
var dot = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;
function planeFor([a, b, c]) {
  const [x, y, z] = b.map((value, axis) => value - a[axis]);
  const [u, v, w] = c.map((value, axis) => value - a[axis]);
  const normal = [y * w - z * v, z * u - x * w, x * v - y * u];
  const length = Math.hypot(...normal);
  if (length <= epsilon2) return null;
  const unit2 = normal.map((value) => value / length);
  return { normal: unit2, offset: dot(unit2, a) };
}
var planeDistance = (plane, point2) => dot(plane.normal, point2) - plane.offset;
function sideOf(face, plane) {
  const { normal: [x, y, z], offset } = plane;
  let side = 0;
  for (const point2 of face.vertices) {
    const distance = x * point2[0] + y * point2[1] + z * point2[2] - offset;
    if (distance > epsilon2) side |= 1;
    if (distance < -epsilon2) side |= 2;
    if (side === 3) break;
  }
  return side;
}
function choosePlane(faces) {
  let best = faces[0].plane, score = Infinity;
  const stride = Math.max(1, Math.ceil(faces.length / 8));
  for (let index = 0; index < faces.length; index += stride) {
    const plane = faces[index].plane;
    let front = 0, back = 0, split = 0;
    for (const face of faces) {
      const side = sideOf(face, plane);
      if (side === 1) front++;
      if (side === 2) back++;
      if (side === 3 && ++split * 9 >= score) break;
    }
    const cost = split * 9 + Math.abs(front - back);
    if (cost < score) {
      best = plane;
      score = cost;
    }
    if (!score) break;
  }
  return best;
}
function splitFace(face, plane) {
  const front = [], back = [];
  face.vertices.forEach((point2, index) => {
    const next = face.vertices[(index + 1) % face.vertices.length];
    const a = planeDistance(plane, point2), b = planeDistance(plane, next);
    if (a >= -epsilon2) front.push(point2);
    if (a <= epsilon2) back.push(point2);
    if (a > epsilon2 && b < -epsilon2 || a < -epsilon2 && b > epsilon2) {
      const fraction = a / (a - b);
      const intersection = point2.map((value, axis) => value + (next[axis] - value) * fraction);
      front.push(intersection);
      back.push(intersection);
    }
  });
  const boundary = face.boundary ?? face.vertices;
  return [{ ...face, vertices: front, boundary }, { ...face, vertices: back, boundary }];
}
function splitVerticesAtHeight(vertices, height) {
  const face = { vertices };
  const plane = { normal: [0, 0, 1], offset: height };
  const side = sideOf(face, plane);
  if (side === 0 || side === 1) return [[], vertices];
  if (side === 2) return [vertices, []];
  const [above, below] = splitFace(face, plane);
  return [below.vertices, above.vertices];
}
function depthOrder(faces, towardCamera2) {
  const visible = faces.flatMap((face) => {
    const plane = planeFor(face.vertices);
    return plane && dot(plane.normal, towardCamera2) > epsilon2 ? [{ ...face, plane }] : [];
  });
  const ordered = [];
  const depth = (face) => face.vertices.reduce((sum, point2) => sum + dot(point2, towardCamera2), 0) / face.vertices.length;
  function visit(group, level = 0) {
    if (!group.length) return;
    if (group.length === 1) {
      ordered.push(group[0]);
      return;
    }
    if (level > 120) {
      ordered.push(...[...group].sort((a, b) => depth(a) - depth(b)));
      return;
    }
    const plane = choosePlane(group);
    const front = [], back = [], aligned = [];
    for (const face of group) {
      switch (sideOf(face, plane)) {
        case 0:
          aligned.push(face);
          break;
        case 1:
          front.push(face);
          break;
        case 2:
          back.push(face);
          break;
        default: {
          const [near, far] = splitFace(face, plane);
          front.push(near);
          back.push(far);
        }
      }
    }
    const frontFirst = dot(plane.normal, towardCamera2) < 0;
    visit(frontFirst ? front : back, level + 1);
    for (const face of aligned) ordered.push(face);
    visit(frontFirst ? back : front, level + 1);
  }
  visit(visible);
  return ordered;
}
function onFaceEdge(point2, a, b) {
  const edge = b.map((value, axis) => value - a[axis]);
  const offset = point2.map((value, axis) => value - a[axis]);
  const fraction = dot(offset, edge) / dot(edge, edge);
  return fraction >= -epsilon2 && fraction <= 1 + epsilon2 && offset.every((value, axis) => Math.abs(value - fraction * edge[axis]) < epsilon2);
}

// src/js/floor-planner-stairs.mjs
var floorStackHeight = (level, base, separation) => (level - base) * 4.2 * separation;
function validStaircase(staircase, floors) {
  if (!staircase || !Number.isFinite(staircase.width) || staircase.width < 0.6 || staircase.width > 2.4) return false;
  const lower = floors.find((floor) => floor.id === staircase.lower);
  const upper = floors.find((floor) => floor.id === staircase.upper);
  if (!lower || upper?.level !== lower.level + 1) return false;
  const { bottom, top } = staircase;
  if (![bottom, top].every((point2) => point2 && [point2.x, point2.y].every((value) => Number.isFinite(value) && Math.abs(value) <= 100))) return false;
  const run = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  return run >= 1 && run <= 8;
}
function stairPoint({ bottom, top }, fraction, side = 0) {
  const dx = top.x - bottom.x, dy = top.y - bottom.y;
  const length = Math.hypot(dx, dy);
  return { x: bottom.x + dx * fraction - dy / length * side, y: bottom.y + dy * fraction + dx / length * side };
}
var polygon = (points, className) => `<polygon class="${className}" points="${points.map((point2) => point2.join(",")).join(" ")}"/>`;
var steps = 13;
var start = 0.09;
var end = 0.91;
var onTread = (index) => start + (end - start) * index / steps;
var stairSteps = steps + 2;
function paintStairPlan(stair, label, up) {
  const edge = (fraction, side) => {
    const { x: x2, y: y2 } = stairPoint(stair, fraction, side * stair.width / 2);
    return [x2, y2];
  };
  const footprint = [edge(start, -1), edge(start, 1), edge(end, 1), edge(end, -1)];
  const treads = Array.from({ length: steps - 1 }, (_, index) => {
    const [x1, y1] = edge(onTread(index + 1), -1), [x2, y2] = edge(onTread(index + 1), 1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
  const [a, b] = (up ? [0.28, 0.72] : [0.72, 0.28]).map((fraction) => edge(fraction, 0));
  const wing = (side) => stairPoint(stair, up ? 0.59 : 0.41, side * 0.2);
  const [left, right] = [-1, 1].map(wing);
  const [x, y] = edge(up ? 0.98 : 0.025, 0);
  return `<g class="fp-stair-plan" data-staircase pointer-events="none">${polygon(footprint, "fp-stairwell")}${treads}
        <path d="M${a.join(" ")}L${b.join(" ")} M${left.x} ${left.y}L${b.join(" ")}L${right.x} ${right.y}"/>
        <text x="${x}" y="${y}" text-anchor="middle">${label}</text></g>`;
}
function stairOpening(stair, project, height) {
  return [[0.2, -1], [0.2, 1], [end, 1], [end, -1]].map(([fraction, side]) => {
    const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
    return project([x, y], height);
  });
}
function paintStairOpening(stair, project, height = 0) {
  return polygon(stairOpening(stair, project, height), "fp-stair-opening");
}
var stairOcclusionId = (stair) => `fp-stair-occlusion-${stair.upper}`;
function paintStairOcclusion(stair, rooms, project, height, slabDepth, bounds) {
  const slab = rooms.flatMap((room) => {
    const outline = roomCorners(room);
    const top = outline.map((point2) => project(point2, height));
    const bottom = outline.map((point2) => project(point2, height - slabDepth));
    return [top, bottom, ...polygonEdges(top).map(([a, b], index) => [a, b, bottom[(index + 1) % bottom.length], bottom[index]])];
  });
  const { x, y, width, height: viewHeight } = bounds;
  const id = stairOcclusionId(stair);
  const mask = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${viewHeight}">
        <rect x="${x}" y="${y}" width="${width}" height="${viewHeight}" fill="white"/>
        <g fill="black">${slab.map((points) => polygon(points, "")).join("")}</g>
        <g fill="white">${polygon(stairOpening(stair, project, height), "")}</g>
    </mask></defs>`;
  return { id, mask };
}
function paintStairFlight(stair, project, base, rise, towardCamera2, occlusion = null) {
  const vertex = (fraction, side, height) => {
    const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
    return [x, y, base + height];
  };
  const projectVertex = ([x, y, z]) => project([x, y], z);
  const edge = (...args) => projectVertex(vertex(...args));
  const faces = Array.from({ length: steps }, (_, index) => {
    const a = onTread(index), b = onTread(index + 1);
    const lower = rise * index / steps, upper = rise * (index + 1) / steps;
    return [
      { vertices: [vertex(a, 1, lower), vertex(a, -1, lower), vertex(a, -1, upper), vertex(a, 1, upper)], className: "fp-stair-riser" },
      { vertices: [vertex(a, 1, upper), vertex(a, -1, upper), vertex(b, -1, upper), vertex(b, 1, upper)], className: "fp-stair-tread" },
      ...[-1, 1].map((side) => {
        const vertices = [
          vertex(a, side, lower - 0.09),
          vertex(b, side, upper - 0.09),
          vertex(b, side, upper),
          vertex(a, side, upper)
        ];
        return { vertices: side === 1 ? vertices.reverse() : vertices, className: "fp-stair-side" };
      })
    ];
  }).flat();
  const treads = depthOrder(faces, towardCamera2).map(({ vertices, className }) => polygon(vertices.map(projectVertex), className)).join("");
  const line = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const railHeight = 0.77;
  const railSplit = start + (end - start) * (rise - railHeight) / rise;
  const posts = [start, 0.5, end].map((fraction) => {
    const height = rise * (fraction - start) / (end - start);
    return { fraction, height };
  });
  const masked = occlusion ? ` mask="url(#${occlusion.id})"` : "";
  const railUnder = occlusion ? edge(railSplit, 1, rise) : edge(end, 1, rise + railHeight);
  const lowerPosts = posts.map(({ fraction, height }) => line(edge(fraction, 1, height), edge(fraction, 1, occlusion ? Math.min(rise, height + railHeight) : height + railHeight))).join("");
  const upperRail = occlusion ? posts.filter(({ height }) => height + railHeight > rise).map(({ fraction, height }) => line(edge(fraction, 1, rise), edge(fraction, 1, height + railHeight))).join("") + line(railUnder, edge(end, 1, rise + railHeight)) : "";
  return `${occlusion?.mask ?? ""}<g class="fp-stair-flight" data-staircase pointer-events="none">
        <g${masked}>${treads}</g><g data-stair-walkers=""></g><g data-stair-rail=""${masked}>${lowerPosts}${line(edge(start, 1, railHeight), railUnder)}</g>${upperRail}
    </g>`;
}

// src/js/floor-planner-building.mjs
var buildingFormat = "smarthomeshop-building";
var maxFloors = 12;
var validProject = (value) => validPlan(value) || validBuilding(value);
function validBuilding(value) {
  if (value?.format !== buildingFormat || value.version !== 1 || typeof value.name !== "string" || !value.name.trim() || value.name.length > 48 || !Array.isArray(value.floors) || !value.floors.length || value.floors.length > maxFloors) return false;
  const ids = /* @__PURE__ */ new Set(), levels = /* @__PURE__ */ new Set();
  for (const floor of value.floors) {
    if (!floor || typeof floor.id !== "string" || !/^[a-z\d-]{1,48}$/i.test(floor.id) || ids.has(floor.id) || !Number.isInteger(floor.level) || floor.level < -5 || floor.level > 20 || levels.has(floor.level) || !(floor.name === null || typeof floor.name === "string" && floor.name.trim() && floor.name.length <= 32) || !validPlan(floor.plan)) return false;
    ids.add(floor.id);
    levels.add(floor.level);
  }
  return ids.has(value.activeFloor) && (value.staircase === void 0 || validStaircase(value.staircase, value.floors));
}
function roomContents(plan, room) {
  const edgeRoom = (door) => {
    const angle2 = door.angle * Math.PI / 180;
    const middle = { x: door.x + Math.cos(angle2) * door.width / 2, y: door.y + Math.sin(angle2) * door.width / 2 };
    return plan.rooms.find((candidate) => contains(candidate, middle) || polygonEdges(roomCorners(candidate)).some(([a, b]) => {
      const onWall = edgePosition(a, b, middle);
      return Math.hypot(onWall.x - middle.x, onWall.y - middle.y) < 0.02;
    }))?.id;
  };
  return {
    rooms: [room],
    walls: plan.walls.filter((item) => plan.rooms.find((candidate) => contains(candidate, item) && contains(candidate, { x: item.endX, y: item.endY }))?.id === room.id),
    doors: plan.doors.filter((item) => (item.roomId ?? edgeRoom(item)) === room.id),
    sensors: plan.sensors.filter((item) => roomForDevice(plan.rooms, item)?.id === room.id),
    furniture: (plan.furniture ?? []).filter((item) => plan.rooms.find((candidate) => contains(candidate, item))?.id === room.id),
    ...Object.fromEntries(["windows", "mirrors", "zones"].map((key) => [key, (plan[key] ?? []).filter((item) => item.roomId === room.id)]))
  };
}

// src/js/floor-planner-furniture-mesh.mjs
var ring = (width, depth, radius, z, x = 0, y = 0, steps2 = 5) => {
  const r = Math.min(radius, width / 2 - 1e-4, depth / 2 - 1e-4);
  return [[1, -1], [1, 1], [-1, 1], [-1, -1]].flatMap(([sx, sy], corner) => Array.from({ length: steps2 + 1 }, (_, index) => {
    const angle2 = (corner - 1 + index / steps2) * Math.PI / 2;
    return [x + sx * (width / 2 - r) + r * Math.cos(angle2), y + sy * (depth / 2 - r) + r * Math.sin(angle2), z];
  }));
};
var circle = (x, y, z, radius, count = 10) => Array.from({ length: count }, (_, index) => {
  const angle2 = index * 2 * Math.PI / count;
  return [x + Math.cos(angle2) * radius, y + Math.sin(angle2) * radius, z];
});
function bridge(from, to, surface) {
  return from.map((point2, index) => {
    const next = (index + 1) % from.length;
    return { vertices: [point2, from[next], to[next], to[index]], surface, face: "face" };
  });
}
function roundBox(width, depth, radius, low, high, surface, x = 0, y = 0) {
  const bottom = ring(width, depth, radius, low, x, y, 2);
  const top = bottom.map(([x2, y2]) => [x2, y2, high]);
  return [...bridge(bottom, top, surface), { vertices: top, surface, face: "top" }];
}
function cushion({ w, d, low, high, surface, x, y }) {
  const r = Math.min(w, d) * 0.19;
  const center = [x + w / 2, y + d / 2];
  const bevel = Math.min(r * 0.4, (high - low) * 0.25);
  const bottom = ring(w, d, r, low, ...center, 3);
  const shoulder = bottom.map(([x2, y2]) => [x2, y2, high - bevel]);
  const top = ring(w - 2 * bevel, d - 2 * bevel, r - bevel, high, ...center, 3);
  return [...bridge(bottom, shoulder, surface), ...bridge(shoulder, top, surface), { vertices: top, surface, face: "top" }];
}
var block = (x, y, w, d, low, high, surface) => ({ x, y, w, d, low, high, surface });
function bath({ width: w, depth: d, height: h, base: z }) {
  const r = Math.min(w, d) * 0.39;
  const low = ring(w * 0.86, d * 0.78, r * 0.81, z + 0.035 * h);
  const body = ring(w * 0.99, d * 0.98, r, z + 0.76 * h);
  const edge = ring(w, d, r, z + 0.83 * h);
  const rim = ring(w * 0.95, d * 0.9, r * 0.94, z + h * 0.845);
  const inner = ring(w * 0.83, d * 0.73, r * 0.83, z + 0.815 * h);
  const bottom = ring(w * 0.67, d * 0.56, r * 0.66, z + 0.3 * h);
  const drain = circle(-w * 0.21, 0, z + 0.304 * h, Math.min(w, d) * 0.037);
  const tap = circle(-w * 0.44, 0, z + h * 0.83, Math.min(w, d) * 0.024, 8);
  const tapTop = tap.map(([x, y]) => [x, y, z + h]);
  return [
    ...bridge(low, body, "ceramic"),
    ...bridge(body, edge, "ceramic"),
    ...bridge(edge, rim, "ceramic-rim"),
    ...bridge(rim, inner, "ceramic-rim"),
    ...bridge(inner, bottom, "basin"),
    { vertices: bottom, surface: "basin-floor", face: "top" },
    { vertices: drain, surface: "chrome", face: "top" },
    ...bridge(tap, tapTop, "chrome"),
    { vertices: tapTop, surface: "chrome", face: "top" },
    ...roundBox(w * 0.085, d * 0.034, Math.min(w, d) * 0.014, z + h * 0.955, z + h, "chrome", -w * 0.411, 0)
  ];
}
function curtain({ width: w, depth: d, height: h, base: z }) {
  const pleats = Math.max(4, Math.min(8, Math.round(w / 0.26)));
  const segments = pleats * 4;
  const cloth = (index, height, width, amplitude) => {
    const along = index / segments - 0.5;
    return [along * w * width, Math.sin(index / 4 * Math.PI * 2) * d * amplitude, z + h * height];
  };
  const faces = [];
  for (let i = 0; i < segments; i++) {
    for (const [bottom, top, bottomWidth, topWidth, bottomDepth, topDepth] of [
      [0.02, 0.055, 1, 1, 0.48, 0.47],
      [0.055, 0.78, 1, 0.985, 0.47, 0.36],
      [0.78, 0.96, 0.985, 0.95, 0.36, 0.32]
    ]) {
      const surface = bottom === 0.02 ? "cloth-hem" : ["cloth", "cloth-shadow", "cloth", "cloth-light"][i % 4];
      const vertices = [
        cloth(i, bottom, bottomWidth, bottomDepth),
        cloth(i + 1, bottom, bottomWidth, bottomDepth),
        cloth(i + 1, top, topWidth, topDepth),
        cloth(i, top, topWidth, topDepth)
      ];
      const [a, b, c, e] = vertices;
      for (const vertices2 of [[a, b, c], [a, c, e]]) faces.push(
        { vertices: vertices2, surface, face: "face" },
        { vertices: [...vertices2].reverse(), surface, face: "face" }
      );
    }
  }
  return faces.concat(roundBox(w, d * 0.64, d * 0.3, z + h * 0.969, z + h, "rail"));
}
function plant({ width: w, depth: d, height: h, base: z }) {
  const radius = Math.min(w, d) * 0.31;
  const foot = circle(0, 0, z, radius * 0.76), top = circle(0, 0, z + h * 0.3, radius);
  const foliage = Array.from({ length: 9 }, (_, index) => {
    const a = index * 2.39996;
    const point2 = (length, side, y) => [
      Math.cos(a) * w * length - Math.sin(a) * w * side,
      Math.sin(a) * d * length + Math.cos(a) * d * side,
      z + h * y
    ];
    const tip = point2(index > 5 ? 0.31 : 0.46, 0, index > 5 ? 0.91 + 0.022 * (index - 6) : 0.67 + 0.036 * index);
    const root = point2(0.04, 0, 0.27 + index * 0.033), mid = point2(0.3, 0, 0.69 + index * 0.027);
    const leaf = [root, point2(0.23, 0.13, 0.57 + index * 0.03), tip, point2(0.25, -0.12, 0.6 + index * 0.028)];
    return leaf.flatMap((vertex, i) => {
      const vertices = [vertex, leaf[(i + 1) % 4], mid];
      const surface = i % 2 ? "leaf-light" : "leaf";
      return [{ vertices, surface, face: "face" }, { vertices: [...vertices].reverse(), surface, face: "face" }];
    });
  });
  return [...bridge(foot, top, "planter"), { vertices: top, surface: "soil", face: "top" }, ...foliage.flat()];
}
var frontCircle = (x, y, z, rx, rz) => Array.from({ length: 14 }, (_, index) => {
  const angle2 = index * 2 * Math.PI / 14;
  return [x + Math.cos(angle2) * rx, y, z - Math.sin(angle2) * rz];
});
function washer({ width: w, depth: d, height: h, base: z }) {
  const outer = frontCircle(0, d * 0.485, z + h * 0.48, w * 0.35, h * 0.27);
  const bezel = frontCircle(0, d * 0.5, z + h * 0.48, w * 0.35 * 0.94, h * 0.27 * 0.94);
  const glass = frontCircle(0, d * 0.5, z + h * 0.48, w * 0.265, h * 0.203);
  const drum = frontCircle(0, d * 0.501, z + h * 0.48, w * 0.192, h * 0.15);
  const dial = frontCircle(w * 0.25, d * 0.497, z + h * 0.86, w * 0.067, h * 0.053);
  return [
    ...roundBox(w, d * 0.966, Math.min(w, d) * 0.05, z, z + h, "appliance"),
    ...bridge(outer, bezel, "chrome"),
    ...bridge(bezel, glass, "gasket"),
    { vertices: glass, surface: "porthole", face: "face" },
    { vertices: drum, surface: "drum", face: "face" },
    { vertices: dial, surface: "chrome", face: "face" }
  ];
}
function fan({ width: w, depth: d, height: h, base: z }) {
  const centre = z + h * 0.8;
  const rim = frontCircle(0, d * 0.08, centre, w * 0.48, h * 0.19);
  const grill = frontCircle(0, d * 0.08, centre, w * 0.48 * 0.9, h * 0.19 * 0.9);
  const hub = frontCircle(0, d * 0.115, centre, w * 0.08, h * 0.032);
  return [
    ...roundBox(w * 0.64, d * 0.92, Math.min(w, d) * 0.3, z, z + h * 0.04, "appliance"),
    ...roundBox(0.036, 0.036, 0.012, z + h * 0.04, z + h * 0.7, "chrome"),
    ...roundBox(w * 0.22, d * 0.4, Math.min(w, d) * 0.08, centre - h * 0.06, centre + h * 0.06, "appliance", 0, -d * 0.14),
    ...bridge(rim, grill, "fan-rim"),
    { vertices: grill, surface: "fan-grill", face: "face" },
    { vertices: hub, surface: "chrome", face: "face" }
  ];
}
function pet({ width: w, depth: d, height: h, base: z }) {
  return [
    ...cushion({ w: w * 0.7, d: d * 0.82, low: z + h * 0.04, high: z + h * 0.62, surface: "fur", x: -w * 0.44, y: -d * 0.41 }),
    ...cushion({ w: w * 0.27, d: d * 0.6, low: z + h * 0.32, high: z + h, surface: "fur", x: w * 0.2, y: -d * 0.3 }),
    ...roundBox(w * 0.12, d * 0.32, Math.min(w, d) * 0.06, z + h * 0.38, z + h * 0.66, "fur-dark", w * 0.43, 0),
    ...roundBox(w * 0.17, d * 0.12, Math.min(w, d) * 0.04, z + h * 0.26, z + h * 0.38, "fur-dark", -w * 0.5, d * 0.1)
  ];
}
function furnitureMesh(item) {
  const { width: w, depth: d, height: h, base: z, kind } = item;
  if (kind === "bath") return { faces: bath(item), parts: [] };
  if (kind === "curtain") return { faces: curtain(item), parts: [] };
  if (kind === "plant") return { faces: plant(item), parts: [] };
  if (kind === "fan") return { faces: fan(item), parts: [] };
  if (kind === "pet") return { faces: pet(item), parts: [] };
  if (kind === "washer") return { faces: washer(item), parts: [block(-w * 0.34, d * 0.485, w * 0.35, d * 0.015, z + h * 0.82, z + h * 0.9, "display")] };
  const slice = (x, y, width, depth, low, high, surface) => block(w * x, d * y, w * width, d * depth, z + h * low, z + h * high, surface);
  const round = (width, depth, radius, low, high, surface) => roundBox(w * width, d * depth, Math.min(w, d) * radius, z + h * low, z + h * high, surface);
  const parts = furnitureParts(item);
  if (kind === "tv") return { faces: round(0.98, 0.68, 0.042, 0.12, 1, "bezel"), parts: [
    slice(-0.45, 0.34, 0.9, 0.024, 0.19, 0.94, "display"),
    slice(-0.055, -0.12, 0.11, 0.29, 0.025, 0.22, "rail"),
    slice(-0.21, -0.48, 0.42, 0.96, 0, 0.035, "rail")
  ] };
  if (kind === "glass") return { faces: [], parts: [
    slice(-0.46, -0.13, 0.92, 0.26, 0.04, 0.95, "pane"),
    slice(-0.5, -0.5, 0.04, 1, 0, 1, "rail"),
    slice(0.46, -0.5, 0.04, 1, 0, 1, "rail"),
    slice(-0.46, -0.5, 0.92, 1, 0.945, 1, "rail"),
    slice(-0.46, -0.5, 0.92, 1, 0, 0.05, "rail")
  ] };
  if (kind === "screen") return { faces: [], parts: [
    slice(-0.5, -0.44, 1, 0.88, 0, 0.055, "frame"),
    ...Array.from({ length: 3 }, (_, i) => slice(-0.497 + i * 0.339, -0.4 + i % 2 * 0.25, 0.315, 0.54, 0.05, 0.97, "screen-panel")),
    ...[-0.5, -0.17, 0.17, 0.475].map((x) => slice(x, -0.5, 0.025, 1, 0.04, 1, "frame"))
  ] };
  if (kind === "radiator" || kind === "heater") {
    const fins = kind === "radiator" ? 11 : 7;
    const width = 0.92 / fins;
    return { faces: [], parts: [
      ...kind === "heater" ? [slice(-0.42, -0.5, 0.06, 1, 0, 0.08, "chrome"), slice(0.36, -0.5, 0.06, 1, 0, 0.08, "chrome"), slice(0.3, -0.2, 0.16, 0.4, 0.9, 1, "appliance")] : [],
      slice(-0.47, -0.3, 0.94, 0.6, kind === "heater" ? 0.1 : 0.02, 0.98, "radiator"),
      ...Array.from({ length: fins }, (_, index) => slice(
        -0.46 + index * width + width * 0.15,
        -0.5,
        width * 0.7,
        1,
        kind === "heater" ? 0.08 : 0,
        kind === "heater" ? 0.92 : 1,
        "radiator-fin"
      ))
    ] };
  }
  if (kind === "fridge") return { faces: round(1, 0.94, 0.047, 0.015, 1, "appliance"), parts: [
    slice(-0.44, 0.47, 0.88, 0.03, 0.035, 0.295, "appliance-door"),
    slice(-0.44, 0.47, 0.88, 0.03, 0.309, 0.97, "appliance-door"),
    slice(-0.36, 0.493, 0.048, 0.03, 0.38, 0.69, "chrome"),
    slice(-0.36, 0.493, 0.048, 0.03, 0.15, 0.275, "chrome")
  ] };
  if (["island", "cabinet", "wardrobe", "nightstand"].includes(kind)) {
    const drawer = kind === "nightstand";
    const faceCount = drawer ? 2 : kind === "island" ? 3 : 2;
    const inserts = Array.from({ length: faceCount }, (_, index) => {
      const x = drawer ? -0.435 : -0.456 + index * 0.93 / faceCount;
      const low = drawer ? 0.13 + index * 0.38 : 0.1, high = drawer ? low + 0.34 : 0.86;
      const width = drawer ? 0.87 : 0.89 / faceCount;
      return [slice(x, 0.459, width, 0.027, low, high, "panel"), slice(x + width * 0.32, 0.485, width * 0.36, 0.023, high - 0.12, high - 0.092, "chrome")];
    }).flat();
    return { faces: round(1, 1, 0.033, 0.91, 1, kind === "island" ? "countertop" : "top"), parts: [
      slice(-0.45, -0.43, 0.9, 0.86, 0.06, 0.915, "body"),
      slice(-0.4, -0.36, 0.8, 0.72, 0, 0.07, "frame"),
      ...inserts
    ] };
  }
  if (kind === "shelves") return { faces: [], parts: parts.concat([
    slice(-0.37, -0.37, 0.06, 0.62, 0.32, 0.47, "book"),
    slice(-0.295, -0.38, 0.049, 0.6, 0.32, 0.49, "book-light"),
    slice(-0.22, -0.36, 0.067, 0.58, 0.32, 0.46, "book"),
    slice(0.06, -0.32, 0.26, 0.58, 0.59, 0.675, "panel"),
    slice(-0.33, -0.3, 0.25, 0.56, 0.83, 0.875, "book-light")
  ]) };
  if (["coffee", "dining", "desk"].includes(kind)) return { faces: round(1, 1, 0.085, 0.89, 1, "top"), parts: parts.filter((part) => part.surface !== "top") };
  if (["sofa", "corner", "armchair", "chair", "bed"].includes(kind)) {
    const soft = ["seat", "pillow", "duvet"];
    const upholstered = ["sofa", "corner", "armchair"].includes(kind);
    const padded = (part) => soft.includes(part.surface) || upholstered && part.surface === "body" && part.low > z;
    const pads = parts.filter(padded).flatMap((part) => {
      if (kind !== "sofa" || part.surface !== "seat") return cushion(part);
      const seats = w > 2 ? 3 : 2;
      const gap = Math.min(0.024, part.w * 0.025);
      const width = (part.w - (seats - 1) * gap) / seats;
      return Array.from({ length: seats }, (_, index) => cushion({ ...part, w: width, x: part.x + index * (width + gap) })).flat();
    });
    return { faces: pads, parts: parts.filter((part) => !padded(part)) };
  }
  return { faces: [], parts };
}
function rugLayers({ width, depth, height, base }) {
  return [0.998, 0.94].map((factor, index) => ring(
    width * factor,
    depth * factor,
    Math.min(width, depth) * 0.065,
    base + height + index * 2e-3,
    0,
    0,
    2
  ));
}

// src/js/floor-planner-daylight.mjs
var presets = {
  studio: { sun: [-0.42, -0.43, 0.8], cast: [1, 0.83], dim: 0 },
  morning: { sun: [0.82, 0.2, 0.5], cast: [-1.55, -0.35], dim: 0.05 },
  midday: { sun: [0.12, 0.46, 0.88], cast: [-0.22, -0.6], dim: 0 },
  evening: { sun: [-0.8, 0.28, 0.46], cast: [1.6, -0.45], dim: 0.12 },
  night: { sun: [-0.3, -0.35, 0.89], cast: [0.45, 0.4], dim: 0.6 }
};
var daylights = Object.keys(presets);
var daylightFor = (name) => presets[name] ?? presets.studio;
function daylightAt(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 6 || hour >= 21.5) return "night";
  if (hour < 10.5) return "morning";
  return hour < 16.5 ? "midday" : "evening";
}

// src/js/floor-planner-maquette.mjs
var floorSlabDepth = 0.17;
var spacePolygon = (tag, points, attributes = "") => `<${tag} points="${points.map((point2) => point2.join(",")).join(" ")}" ${attributes}/>`;
var midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
var shift = (point2, normal, amount) => [point2[0] + normal[0] * amount, point2[1] + normal[1] * amount];
var inward = (a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
  return [-dy / length, dx / length];
};
var wallColor = (room) => room?.wallColor ? ` data-wall="${room.wallColor}"` : "";
var rectangle3 = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
function cutawayWallHeight(room, depth) {
  const facing = Math.max(0, Math.min(1, depth / 0.3));
  return Math.min(room.height * 0.88, 0.43 + 1.8 * facing * facing * (3 - 2 * facing));
}
function blockFaces(corners, base, top, attributes, drawTop = true) {
  const faces = polygonEdges(corners).map(([a, b]) => ({
    vertices: [[...a, base], [...b, base], [...b, top], [...a, top]],
    className: "fp-model-face",
    attributes
  }));
  if (drawTop) faces.push({ vertices: corners.map((point2) => [...point2, top]), className: "fp-model-top", attributes });
  return faces;
}
function paintFaces(faces, project, towardCamera2, { sun: [sunX, sunY, sunZ], dim } = daylightFor("studio")) {
  return depthOrder(faces, towardCamera2).map(({ vertices, boundary, plane, className, attributes = "" }) => {
    const points = vertices.map(([x, y, z]) => project([x, y], z));
    const [nx, ny, nz] = plane.normal;
    const light = sunX * nx + sunY * ny + sunZ * nz;
    const highlight = Math.round(Math.max(0, light) * 19 * (1 - dim));
    const shadow = Math.round(Math.max(0, 0.55 - light) * 19 + dim * 22);
    const polygon2 = spacePolygon("polygon", points, `class="${className}${boundary ? " fp-depth-fragment" : ""}"`);
    const originalEdges = boundary && polygonEdges(boundary);
    const edges = originalEdges ? polygonEdges(vertices).map(([a, b], index) => {
      if (!originalEdges.some(([start2, end2]) => onFaceEdge(a, start2, end2) && onFaceEdge(b, start2, end2))) return "";
      return `M${points[index].join(" ")}L${points[(index + 1) % points.length].join(" ")}`;
    }).join("") : "";
    return `<g ${attributes} style="--fp-light:${highlight}%;--fp-shadow:${shadow}%">${polygon2}${edges ? `<path class="${className} fp-depth-boundary" d="${edges}"/>` : ""}</g>`;
  }).join("");
}
function paintMaquette(plan, project, depthOf, towardCamera2, selected, floorOverlay = "", sceneId = "single", { draft = false, wallMode = "cutaway", daylight = "studio" } = {}) {
  const light = daylightFor(daylight);
  const doors = doorsOnPlan(plan);
  const objects = [];
  const floors = [];
  const bases = [];
  const shadows = [];
  const floorShadows = [];
  const contactShadows = [];
  const floorClip = [];
  const furniture = plan.furniture ?? [];
  const wallHeight = (room, normal, exterior) => {
    if (wallMode === "up") return room.height;
    if (wallMode === "down" || !exterior) return Math.min(room.height * 0.75, 0.25);
    return cutawayWallHeight(room, depthOf(normal));
  };
  const wallGeometry = (a, b, room, normal) => {
    const [x, y] = shift(midpoint(a, b), normal, -0.045);
    const exterior = room && !plan.rooms.some((other) => other !== room && contains(other, { x, y }));
    const loose = wallMode === "up" ? Math.max(0.42, ...plan.rooms.map((entry) => entry.height)) : wallMode === "down" ? 0.25 : 0.42;
    return {
      height: room ? wallHeight(room, normal, exterior) : loose,
      outside: exterior ? -0.12 : room ? 0 : -0.06,
      inside: exterior ? 0 : 0.055
    };
  };
  const addWall = (a, b, room, id) => {
    const normal = inward(a, b);
    for (const [start2, end2] of wallSegments(a, b, doors)) {
      const { height, outside, inside } = wallGeometry(start2, end2, room, normal);
      const wall = [
        shift(start2, normal, outside),
        shift(end2, normal, outside),
        shift(end2, normal, inside),
        shift(start2, normal, inside)
      ];
      objects.push(...blockFaces(wall, 0, height, `class="fp-space-wall${id === selected ? " selected" : ""}" data-item="${id}"${wallColor(room)}`));
    }
  };
  const addOutsideCorner = (previous, corner, next, room) => {
    const before = inward(previous, corner), after = inward(corner, next);
    if (before[0] * after[1] - before[1] * after[0] <= 1e-4) return;
    const closeToCorner = (point2) => {
      const ratio = Math.min(0.4, 0.09 / Math.hypot(point2[0] - corner[0], point2[1] - corner[1]));
      return corner.map((value, axis) => value + (point2[axis] - value) * ratio);
    };
    const left = closeToCorner(previous), right = closeToCorner(next);
    const first = wallGeometry(left, corner, room, before), second = wallGeometry(corner, right, room, after);
    const thickness = first.outside;
    if (!thickness || second.outside !== thickness) return;
    const touches = (point2) => Math.hypot(point2[0] - corner[0], point2[1] - corner[1]) < 1e-3;
    if (!wallSegments(left, corner, doors).some(([, end2]) => touches(end2)) || !wallSegments(corner, right, doors).some(([start2]) => touches(start2))) return;
    const sum = before.map((value, axis) => value + after[axis]);
    const miter = thickness / (1 + before[0] * after[0] + before[1] * after[1]);
    const joint = [corner, shift(corner, before, thickness)];
    if (Math.hypot(...sum) * Math.abs(miter) < 0.28) joint.push(shift(corner, sum, miter));
    joint.push(shift(corner, after, thickness));
    objects.push(...blockFaces(
      joint,
      0,
      Math.min(first.height, second.height),
      `class="fp-space-wall${room.id === selected ? " selected" : ""}" data-item="${room.id}"${wallColor(room)}`
    ));
  };
  const addWindow = (start2, end2, room, normal, base, top, className, attributes = "", frame = false) => {
    const [nx, ny] = inward(start2, end2);
    const [a, b] = nx * normal[0] + ny * normal[1] > 0 ? [start2, end2] : [end2, start2];
    const { height, outside, inside } = wallGeometry(a, b, room, normal);
    const visibleTop = Math.min(height - 0.035, top);
    if (visibleTop <= base + 4e-3) {
      if (frame) {
        const corners = [
          shift(a, normal, outside + 0.012),
          shift(b, normal, outside + 0.012),
          shift(b, normal, inside - 0.012),
          shift(a, normal, inside - 0.012)
        ];
        objects.push({ vertices: corners.map((point2) => [...point2, height + 2e-3]), className: "fp-model-window-sill" });
      }
      return;
    }
    const pane = (from, to, offset, name) => {
      const left = shift(from, normal, inside + offset);
      const right = shift(to, normal, inside + offset);
      const vertices = [[...left, base], [...left, visibleTop], [...right, visibleTop], [...right, base]];
      objects.push({ vertices, className: name, attributes });
    };
    pane(a, b, 2e-3, className);
    if (frame) {
      const center = midpoint(a, b);
      const direction = [normal[1], -normal[0]];
      pane(shift(center, direction, -0.012), shift(center, direction, 0.012), 4e-3, "fp-model-window-frame");
    }
  };
  for (const room of plan.rooms) {
    const outline = roomCorners(room);
    const points = outline.map((point2) => project(point2));
    const active = room.id === selected ? " selected" : "";
    const floor = room.floorFinish ?? (exampleFloor(room) || "boards");
    floorClip.push(spacePolygon("polygon", points));
    shadows.push("M" + points.map((point2) => point2.join(" ")).join("L") + "Z");
    bases.push(...blockFaces(outline, -floorSlabDepth, 0, 'class="fp-model-base"', false));
    floors.push(spacePolygon("polygon", points, `class="fp-space-floor${active}" data-item="${room.id}" data-floor="${floor}"`));
    if (!draft && (floor === "boards" || floor === "tiles")) floors.push(spacePolygon("polygon", points, `class="fp-model-texture" data-floor="${floor}"`));
    polygonEdges(outline).forEach(([a, b], index) => {
      addWall(a, b, room, room.id);
      addOutsideCorner(outline[(index + outline.length - 1) % outline.length], a, b, room);
    });
    for (const [x, y, endX, endY] of room.outline || plan.windows?.some((window) => window.roomId === room.id) ? [] : exampleWindows(room)) {
      const start2 = [room.x + x * room.width, room.y + y * room.depth];
      const end2 = [room.x + endX * room.width, room.y + endY * room.depth];
      const normal = x === endX ? [x === 0 ? 1 : -1, 0] : [0, y === 0 ? 1 : -1];
      const sill = room.id === "kitchen" ? 1.22 : defaultWindowSill;
      addWindow(start2, end2, room, normal, sill, sill + 0.94, "fp-model-window", "", true);
    }
  }
  for (const item of furniture) {
    const transform = furnitureProjection(item);
    const attributes = `data-item="${item.id}" data-furniture-id="${item.id}" data-material="${item.material}" data-model="${item.kind}"`;
    const active = item.id === selected ? " selected" : "";
    const style = `class="fp-model-furniture${active}" ${attributes}`;
    if (item.kind === "rug") {
      for (const [index, vertices] of rugLayers(item).slice(0, draft ? 1 : void 0).entries()) {
        floors.push(spacePolygon(
          "polygon",
          vertices.map(([x, y, z]) => project(transform([x, y]), z)),
          `class="fp-model-rug${active}" ${attributes} data-layer="${index}"`
        ));
      }
      continue;
    }
    if (draft) {
      objects.push(...blockFaces(furnitureFootprint(item), item.base, item.base + item.height, `${style} data-surface="body"`));
      continue;
    }
    const { parts, faces } = furnitureMesh(item);
    if (item.kind !== "glass" && item.kind !== "curtain") {
      const reach = Math.min(0.32, item.height * 0.19);
      const cast = furnitureFootprint(item).map(([x, y]) => project([x + reach * light.cast[0], y + reach * light.cast[1]]));
      floorShadows.push(spacePolygon("polygon", cast));
      if (item.base <= 0.05) {
        const touches = parts.filter((part) => part.low <= 0.05);
        const contact = touches.length ? touches.map((part) => rectangle3(part.x, part.y, part.w, part.d).map(transform)) : [furnitureFootprint(item)];
        contactShadows.push(...contact.map((outline) => spacePolygon("polygon", outline.map((point2) => project(point2)))));
      }
    }
    for (const part of parts) {
      const corners = rectangle3(part.x, part.y, part.w, part.d).map(transform);
      objects.push(...blockFaces(
        corners,
        part.low,
        part.high,
        `${style} data-surface="${part.surface}"`
      ));
    }
    objects.push(...faces.map(({ vertices, surface, face }) => ({
      vertices: vertices.map(([x, y, z]) => [...transform([x, y]), z]),
      className: `fp-model-${face}`,
      attributes: `${style} data-surface="${surface}"`
    })));
  }
  for (const wall of plan.walls) addWall([wall.x, wall.y], [wall.endX, wall.endY], null, wall.id);
  for (const type of ["windows", "mirrors"]) for (const item of plan[type] ?? []) {
    const room = plan.rooms.find((entry) => entry.id === item.roomId);
    if (!room) continue;
    const angle2 = item.angle * Math.PI / 180;
    const a = [item.x, item.y], b = [item.x + Math.cos(angle2) * item.width, item.y + Math.sin(angle2) * item.width];
    const normal = inward(a, b);
    const [x, y] = shift(midpoint(a, b), normal, 0.025);
    const facing = contains(room, { x, y }) ? normal : normal.map((value) => -value);
    addWindow(
      a,
      b,
      room,
      facing,
      item.base,
      item.base + item.height,
      `fp-space-opening ${type}${item.id === selected ? " selected" : ""}`,
      `data-item="${item.id}"`
    );
  }
  const zones = (plan.zones ?? []).map((item) => paintZone(item, (point2) => project(point2, 0.025), item.id === selected)).join("");
  const openings = doors.map((door, index) => spacePolygon(
    "polyline",
    door.map((point2) => project(point2)),
    `class="fp-space-door${plan.doors[index].id === selected ? " selected" : ""}" data-item="${plan.doors[index].id}"`
  ));
  const shadowId = `fp-floor-clip-${sceneId}`;
  const interiorShadows = floorClip.length && !draft ? `<defs><clipPath id="${shadowId}">${floorClip.join("")}</clipPath></defs>
        <g class="fp-interior-shadow" clip-path="url(#${shadowId})">
            <g class="fp-wall-contact">${floorClip.join("")}</g>
            <g class="fp-furniture-shadow">${floorShadows.join("")}</g>
            <g class="fp-furniture-contact">${contactShadows.join("")}</g>
        </g>` : "";
  return {
    hasFurniture: furniture.length > 0,
    markup: `${draft ? "" : `<path class="fp-model-shadow" d="${shadows.join("")}"/>`}${paintFaces(bases, project, towardCamera2, light)}${floors.join("")}${interiorShadows}${floorOverlay}${zones}
            ${openings.join("")}${paintFaces(objects, project, towardCamera2, light)}`
  };
}

// src/js/floor-planner-space.mjs
var coordinates = (x, y) => ({ x, y });
var baseTilt = Math.asin(0.42 / 0.866);
var defaultSpaceCamera = { yaw: 0, tilt: baseTilt };
function orbitSpaceCamera(camera, dx, dy) {
  return {
    yaw: (camera.yaw + dx * 0.012) % (Math.PI * 2),
    tilt: Math.max(0.22, Math.min(1.23, camera.tilt - dy * 8e-3))
  };
}
function projectSpace([x, y], height, { yaw, tilt }, rounded = true) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const u = x * cos - y * sin, v = x * sin + y * cos;
  const floorDepth = 0.866 * Math.sin(tilt);
  const vertical = 0.88 * Math.cos(tilt) / Math.cos(baseTilt);
  const point2 = [(u - v) * 0.866, (u + v) * floorDepth - height * vertical];
  return rounded ? point2.map((value) => Number(value.toFixed(3))) : point2;
}
function towardCamera({ yaw, tilt }) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const vertical = 0.88 * Math.cos(tilt) / Math.cos(baseTilt);
  return [(cos + sin) * vertical, (cos - sin) * vertical, 2 * 0.866 * Math.sin(tilt)];
}
var sensorRing = Array.from({ length: 32 }, (_, index) => {
  const angle2 = index * Math.PI * 2 / 32;
  return [Math.cos(angle2), Math.sin(angle2)];
});
function paintCeilingSensor(item, room, height, project, towardViewer) {
  const ceiling = room?.ceiling;
  const axis = ceiling?.direction ?? "x+";
  const rise = ceiling?.type === "gable" ? ceilingPosition(room, item) < 0.5 : axis.endsWith("+");
  const pitch = ceiling && item.levelMountRoom !== room.id ? ceilingPitch(room) * Math.PI / 180 : 0;
  const cosine = Math.cos(pitch), sine = Math.sin(pitch) * (rise ? 1 : -1);
  const alongX = axis.startsWith("x");
  const [slopeX, slopeY] = alongX ? [sine, 0] : [0, sine];
  const radius = 0.19, thickness = 0.06;
  const points = sensorRing.map(([u, v]) => [
    item.x + u * radius * (alongX ? cosine : 1),
    item.y + v * radius * (alongX ? 1 : cosine),
    height + radius * (u * slopeX + v * slopeY)
  ]);
  const back = points.map(([x, y, z]) => project([x, y], z));
  const front = points.map(([x, y, z]) => project([x + slopeX * thickness, y + slopeY * thickness], z - cosine * thickness));
  const [vx, vy, vz] = towardViewer;
  const visibleFace = -vx * slopeX - vy * slopeY + vz * cosine >= 0 ? back : front;
  return spacePolygon("polygon", convexHull([...back, ...front]), 'class="fp-space-puck side"') + spacePolygon("polygon", visibleFace, 'class="fp-space-puck face"');
}
function paintWallSense(item, height, project, cutawayHeight) {
  const { x, y } = wallVector(item.angle);
  const facePoint = (side, up, inset = 0.025) => project([item.x + x * inset - y * side, item.y + y * inset + x * side], height + up);
  const plate = [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]].map((point2) => facePoint(...point2));
  const [cx, cy] = facePoint(0, 0);
  const supportTop = 0.23;
  const supportBottom = cutawayHeight - height;
  const support = supportBottom < supportTop ? spacePolygon("polygon", [[-0.32, supportBottom], [0.32, supportBottom], [0.32, supportTop], [-0.32, supportTop]].map(([side, z]) => facePoint(side, z, 0)), 'class="fp-wall-mount-support" fill="#bdb9ac"') : "";
  return support + spacePolygon("polygon", plate, 'class="fp-space-puck wall"') + `<ellipse cx="${cx}" cy="${cy}" rx=".035" ry=".045" fill="#6d8496"/>`;
}
function paintSpace(plan, camera, selected, {
  sensorHeight = sensorMountHeight,
  decorations = true,
  interactiveSensors = false,
  staircase = null,
  upperStair = false,
  coverage: coverage2 = null,
  sceneId,
  showWallMount = false,
  draft = false,
  wallMode,
  daylight = "studio"
} = {}) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const include = ([x, y]) => {
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  };
  const project = (position, height2 = 0) => {
    const point2 = projectSpace(position, height2, camera);
    include(point2);
    return point2;
  };
  const selectedRoom = plan.rooms.find((room) => room.id === selected);
  const floorOverlay = coverage2?.floorOverlay ?? (decorations ? '<g id="fp-wall-coverage-space" pointer-events="none"></g>' : "");
  const direction = towardCamera(camera);
  const model = paintMaquette(
    plan,
    project,
    (normal) => projectSpace(normal, 0, { ...camera, tilt: baseTilt })[1],
    direction,
    selected,
    floorOverlay,
    sceneId,
    { draft, wallMode, daylight }
  );
  const ceilings = plan.rooms.filter((room) => room.ceiling || room === selectedRoom).map((room) => {
    const outline = roomCorners(room);
    const ceilingPoint = (point2) => project(point2, ceilingHeightAt(room, coordinates(...point2)));
    const ridge = room.ceiling?.type === "gable";
    const alongX = room.ceiling?.direction.startsWith("x");
    const ridgeEnds = alongX ? [[room.x + room.width / 2, room.y], [room.x + room.width / 2, room.y + room.depth]] : [[room.x, room.y + room.depth / 2], [room.x + room.width, room.y + room.depth / 2]];
    const [first, last] = ridgeEnds;
    const axis = alongX ? 0 : 1;
    const path = ridge ? polygonEdges(outline).flatMap(([a, b]) => {
      const t = (first[axis] - a[axis]) / (b[axis] - a[axis]);
      return t > 0 && t < 1 ? [a, a.map((value, i) => value + (b[i] - value) * t)] : [a];
    }) : outline;
    const ridges = ridge ? roomLineSpans(room, coordinates(...first), coordinates(...last)).map((span) => span.map((t) => first.map((value, i) => value + (last[i] - value) * t))) : [];
    const dropLines = [outline[0], outline[Math.floor(outline.length / 2)], ...ridges.flat()];
    return `<g class="fp-space-ceiling${room === selectedRoom ? " selected" : ""}">
            ${spacePolygon("polygon", path.map(ceilingPoint))}
            ${ridges.map((line) => spacePolygon("polyline", line.map(ceilingPoint))).join("")}
            ${dropLines.map((point2) => spacePolygon("polyline", [project(point2), ceilingPoint(point2)])).join("")}
        </g>`;
  });
  const labels = plan.rooms.filter((room) => Math.min(room.width, room.depth) >= 2).map((room) => {
    const label = roomInteriorPoint(room, { x: room.x + room.width / 2, y: room.y + room.depth * 0.68 });
    const [x, y] = project([label.x, label.y]);
    return `<text class="fp-space-room-label" x="${x}" y="${y}">${escapeText(room.name.length > 19 ? room.name.slice(0, 18) + "..." : room.name)}</text>`;
  });
  const markers = plan.sensors.map((item, index) => {
    const { mount } = devices[item.model];
    const room = roomForDevice(plan.rooms, item);
    const position = [item.x, item.y];
    const [x, y] = project(position);
    const height2 = sensorHeight(item, room);
    const [, top2] = project(position, height2);
    const badgeX = height2 ? x + 0.48 : x;
    const facing = showWallMount && item.model === "wallsense" ? wallVector(item.angle) : null;
    const wallTop = facing && room ? cutawayWallHeight(room, projectSpace([facing.x, facing.y], 0, { ...camera, tilt: baseTilt })[1]) : Infinity;
    if (height2) include([badgeX, top2]);
    return `<g class="fp-space-marker ${mount}${item.id === selected ? " selected" : ""}" data-item="${item.id}" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ""}>
            ${height2 ? `${facing ? "" : `<line x1="${x}" x2="${x}" y1="${y}" y2="${top2}"/><ellipse class="fp-space-anchor" cx="${x}" cy="${y}" rx=".13" ry=".075"/>`}
                ${mount === "ceiling" ? paintCeilingSensor(item, room, height2, project, direction) : item.model === "wallsense" ? paintWallSense(item, height2, project, wallTop) : `<rect class="fp-space-puck wall" x="${x - 0.18}" y="${top2 - 0.12}" width=".36" height=".24" rx=".045"/>`}` : ""}
            <circle cx="${badgeX}" cy="${top2}" r=".29"/><text x="${badgeX}" y="${top2}">${String(index + 1).padStart(2, "0")}</text>
            ${interactiveSensors ? `<circle class="fp-sensor-focus" cx="${badgeX}" cy="${top2}" r=".37"/>` : ""}
        </g>`;
  });
  const stairs = staircase ? upperStair ? paintStairOpening(staircase, project) : paintStairFlight(staircase, project, 0, 2.7, direction) : "";
  if (!Number.isFinite(left)) return null;
  const width = Math.max(2, right - left);
  const height = Math.max(2, bottom - top);
  const padding = Math.max(0.85, Math.max(width, height) * 0.075);
  const view = { x: left - padding, y: top - padding, width: width + 2 * padding, height: height + 2 * padding };
  return {
    viewBox: Object.values(view).join(" "),
    hasFurniture: model.hasFurniture,
    markup: `${decorations ? spaceGrid(camera, view) : ""}<g class="fp-daylight" data-daylight="${daylight}">${model.markup}
            ${stairs}
            ${ceilings.join("")}</g>${coverage2?.beamOverlay ?? (decorations ? '<g id="fp-cone-space" pointer-events="none"></g>' : "")}
            ${labels.join("")}${markers.join("")}`
  };
}
function spaceGrid(camera, view) {
  const gridMatrix = [...projectSpace([1, 0], 0, camera), ...projectSpace([0, 1], 0, camera), 0, 0].join(" ");
  return `<defs>
        <filter id="fp-model-shadow" x="-20%" y="-25%" width="145%" height="155%"><feGaussianBlur stdDeviation=".30"/></filter>
        <filter id="fp-contact-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".058"/></filter>
        <filter id="fp-cast-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".115"/></filter>
        <pattern id="fp-space-grid" width="1" height="1" patternUnits="userSpaceOnUse"
            patternTransform="matrix(${gridMatrix})">
            <path d="M0 1V0H1" fill="none" stroke="#465563" stroke-width=".75" vector-effect="non-scaling-stroke"/>
        </pattern>
        <pattern id="fp-floor-boards" width="2.64" height=".81" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <path d="M0 .27H2.64V.54H0zM0 .54H.87v.27H0zM1.68 0H2.64V.27H1.68z" fill="#fff8e9" opacity=".13"/>
            <path d="M0 0H2.64M0 .27H2.64M0 .54H2.64M.54 0v.27M1.68 0v.27M.22 .27v.27M1.42 .27v.27M2.4 .27v.27M.87 .54v.27M2 .54v.27" fill="none" stroke="#665440" stroke-opacity=".23" stroke-width=".013"/>
            <path d="M.14 .083q.25 -.023 .32 .004m.31 .076q.35 .03 .68 .001m.32 -.042q.37 -.023 .75 0M.49 .386q.27 -.025 .72 0m.44 .05q.21 .026 .50 0M.14 .649q.22 .016 .55 -.002m.36 .047q.36 -.031 .76 0m.29 -.073q.21 .016 .38 0" fill="none" stroke="#785d42" stroke-opacity=".2" stroke-width=".012"/>
        </pattern>
        <pattern id="fp-floor-tiles" width=".64" height=".64" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <rect x=".018" y=".018" width=".604" height=".604" fill="#fff8ec" opacity=".18"/>
            <path d="M0 0H.64M0 0V.64" fill="none" stroke="#82786d" stroke-opacity=".33" stroke-width=".018"/>
        </pattern>
        </defs><rect x="${view.x}" y="${view.y}" width="${view.width}" height="${view.height}" fill="url(#fp-space-grid)" opacity=".18"/>`;
}
function paintBuilding(floors, camera, separation = 1, staircase = null, paintCoverage = null, {
  selected = null,
  sensorHeight,
  paintForeground,
  draft = false,
  wallMode,
  daylight = "studio"
} = {}) {
  const levels = [...floors].sort((a, b) => a.level - b.level);
  const base = levels[0]?.level ?? 0;
  const scenes = levels.flatMap((floor) => {
    const upperStair = staircase?.upper === floor.id;
    const scene = paintSpace(floor.plan, camera, selected, {
      decorations: false,
      staircase: upperStair ? staircase : null,
      upperStair,
      coverage: paintCoverage?.(floor, camera),
      sensorHeight,
      sceneId: floor.id,
      draft,
      wallMode,
      daylight
    });
    if (!scene) return [];
    const [x2, y2, width2, height2] = scene.viewBox.split(" ").map(Number);
    const [, offset] = projectSpace([0, 0], floorStackHeight(floor.level, base, separation), camera);
    return [{ floor, scene, x: x2, y: y2, width: width2, height: height2, offset }];
  });
  if (!scenes.length) return null;
  const x = Math.min(...scenes.map((scene) => scene.x)) - 0.35;
  const y = Math.min(...scenes.map((scene) => scene.y + scene.offset));
  const width = Math.max(...scenes.map((scene) => scene.x + scene.width)) - x;
  const labels = scenes.map((scene) => ({ floor: scene.floor, x: scene.x + 0.13, y: scene.y + scene.offset + 1.68 })).sort((a, b) => a.y - b.y);
  for (let index = 1; index < labels.length; index++) {
    labels[index].y = Math.max(labels[index].y, labels[index - 1].y + 0.44);
  }
  const height = Math.max(labels.at(-1).y + 0.35, ...scenes.map((scene) => scene.y + scene.offset + scene.height)) - y;
  const lower = scenes.find(({ floor }) => floor.id === staircase?.lower);
  const upper = scenes.find(({ floor }) => floor.id === staircase?.upper);
  const bounds = { x, y, width, height };
  let stairs = "";
  if (lower && upper) {
    const project = (point2, height2) => projectSpace(point2, height2, camera);
    const stairBase = floorStackHeight(lower.floor.level, base, separation);
    const rise = floorStackHeight(upper.floor.level, lower.floor.level, separation);
    const occlusion = paintStairOcclusion(staircase, upper.floor.plan.rooms, project, stairBase + rise, floorSlabDepth, bounds);
    stairs = paintStairFlight(staircase, project, stairBase, rise, towardCamera(camera), occlusion);
  }
  return {
    viewBox: [x, y, width, height].join(" "),
    hasFurniture: scenes.some(({ scene }) => scene.hasFurniture),
    markup: spaceGrid(camera, bounds) + scenes.map(({ floor, scene, offset }) => `<g data-building-floor="${floor.id}" transform="translate(0 ${offset})">${scene.markup}${paintForeground?.(floor) ?? ""}</g>`).join("") + stairs + labels.map(({ floor, x: x2, y: y2 }) => `<text class="fp-building-label" data-floor-label="${floor.id}" x="${x2}" y="${y2}">${escapeText(floor.label)}</text>`).join("")
  };
}

// src/js/floor-planner-live.mjs
function liveFloorFigures(people, rooms) {
  const byId = new Map(rooms.map((room) => [room.haRoom ?? room.id, room]));
  return people.flatMap((person) => {
    const room = byId.get(person.roomId);
    const frame = room?.haFrame;
    if (!room || frame?.visible === false) return [];
    const origin = person.house;
    const turn = (frame?.angle ?? origin.rotationDeg) - origin.rotationDeg;
    const radians = turn * Math.PI / 180;
    const dx = person.x - origin.x / 1e3, dy = person.y - origin.y / 1e3;
    return [{
      ...person,
      x: (frame?.x ?? origin.x / 1e3) + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: (frame?.y ?? origin.y / 1e3) + dx * Math.sin(radians) + dy * Math.cos(radians),
      heading: person.heading + turn
    }];
  });
}
var shiftOf = (node) => Number(node.getAttribute?.("transform")?.match(/^translate\(0 (-?[\d.e+-]+)\)$/)?.[1] ?? 0);
function screenOffset(node, svg) {
  let offset = 0;
  for (let current = node; current && current !== svg; current = current.parentNode) offset += shiftOf(current);
  return offset;
}
function fadeLabelsNear(svg, figures2) {
  if (!svg) return;
  for (const label of svg.querySelectorAll(".fp-space-room-label")) {
    const x = Number(label.getAttribute("x")), y = Number(label.getAttribute("y")) + screenOffset(label.parentNode, svg);
    const near = figures2.some((figure) => Math.abs(figure.x - x) < 0.95 && y > figure.head - 0.35 && y < figure.foot + 0.3);
    if (near !== label.hasAttribute("data-near-person")) label.toggleAttribute("data-near-person", near);
  }
}

// src/js/floor-planner-avatar.mjs
var tones = {
  jacket: [183, 137, 94],
  shoulder: [187, 144, 101],
  hem: [136, 99, 70],
  shirt: [238, 229, 209],
  seam: [123, 89, 61],
  pants: [83, 102, 120],
  shoe: [55, 59, 63],
  toe: [75, 80, 82],
  sole: [208, 201, 182],
  skin: [226, 176, 144],
  warmth: [218, 158, 130],
  skinFold: [176, 121, 100],
  lips: [173, 104, 95],
  eye: [236, 225, 211],
  iris: [83, 101, 93],
  pupil: [46, 43, 42],
  brow: [83, 55, 44],
  hair: [65, 45, 38],
  hairLight: [80, 57, 46]
};
var womanTones = {
  ...tones,
  jacket: [122, 154, 139],
  shoulder: [136, 165, 147],
  hem: [94, 127, 113],
  seam: [99, 135, 119],
  pants: [68, 76, 94],
  shoe: [172, 150, 131],
  toe: [188, 168, 150],
  skin: [205, 150, 115],
  warmth: [197, 137, 105],
  skinFold: [154, 96, 78],
  lips: [153, 86, 83],
  iris: [103, 78, 58],
  hair: [47, 35, 32],
  hairLight: [62, 43, 37]
};
var childTones = {
  ...tones,
  jacket: [141, 128, 182],
  shoulder: [153, 139, 194],
  hem: [110, 97, 150],
  seam: [102, 90, 138],
  pants: [89, 101, 123],
  shoe: [103, 117, 153],
  toe: [125, 138, 170],
  skin: [238, 190, 154],
  warmth: [229, 171, 143],
  hair: [104, 73, 47],
  hairLight: [122, 87, 54]
};
var figures = {
  man: { palette: tones, size: 1, torso: 1, limbs: 1, head: 1, hair: "short" },
  woman: { palette: womanTones, size: 0.94, torso: 0.9, limbs: 0.88, head: 0.96, hair: "long" },
  child: { palette: childTones, size: 0.72, torso: 0.89, limbs: 0.88, head: 1.13, headHeight: 1.14, hair: "wavy" }
};
var mix = ([x, y, z], [a, b, c], t) => [x + (a - x) * t, y + (b - y) * t, z + (c - z) * t];
var add = ([x, y, z], [a, b, c]) => [x + a, y + b, z + c];
var subtract = ([x, y, z], [a, b, c]) => [x - a, y - b, z - c];
var scale2 = ([x, y, z], amount) => [x * amount, y * amount, z * amount];
var dot2 = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;
var cross2 = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
var unit = (vector) => scale2(vector, 1 / (Math.hypot(...vector) || 1));
var angles = (count) => Array.from({ length: count }, (_, index) => {
  const angle2 = index / count * Math.PI * 2;
  return [Math.cos(angle2), Math.sin(angle2)];
});
var limbRing = angles(9);
var bodyRing = angles(12);
var headRing = angles(18);
function crossSection(center, axis, width, depth, ring2) {
  const reference = Math.abs(axis[1]) < 0.93 ? [0, 1, 0] : [0, 0, 1];
  const side = unit(subtract(reference, scale2(axis, dot2(reference, axis))));
  const front = cross2(axis, side);
  return ring2.map(([u, v]) => add(center, add(scale2(side, u * width), scale2(front, v * depth))));
}
function shell(rings, sections, addFace, { start: start2 = true, end: end2 = true } = {}) {
  const normals = rings.map((ring2, row) => {
    const earlier = rings[Math.max(0, row - 1)], later = rings[Math.min(rings.length - 1, row + 1)];
    return ring2.map((_, index) => {
      const around = subtract(ring2[(index + 1) % ring2.length], ring2[(index + ring2.length - 1) % ring2.length]);
      return unit(cross2(around, subtract(later[index], earlier[index])));
    });
  });
  if (start2) addFace([...rings[0]].reverse(), sections[0][3]);
  for (let section = 1; section < rings.length; section++) {
    const a = rings[section - 1], b = rings[section];
    const normalA = normals[section - 1], normalB = normals[section];
    for (let index = 0; index < a.length; index++) {
      const next = (index + 1) % a.length;
      addFace(
        [a[index], a[next], b[next], b[index]],
        sections[section][3],
        [normalA[index], normalA[next], normalB[next], normalB[index]]
      );
    }
  }
  if (end2) addFace(rings.at(-1), sections.at(-1)[3]);
}
function profile(start2, end2, sections, addFace, ring2 = limbRing) {
  const axis = unit(subtract(end2, start2));
  shell(sections.map(([position, width, depth]) => crossSection(mix(start2, end2, position), axis, width, depth, ring2)), sections, addFace);
}
function bentProfile([start2, joint, end2], sections, addFace) {
  const center = (t) => t <= 0.5 ? mix(start2, joint, 2 * t) : mix(joint, end2, 2 * t - 1);
  const rings = sections.map(([t, width, depth]) => {
    const axis = unit(subtract(center(Math.min(1, t + 0.075)), center(Math.max(0, t - 0.075))));
    return crossSection(center(t), axis, width, depth, limbRing);
  });
  shell(rings, sections, addFace);
}
function step(phase, side) {
  const position = (phase + (side < 0 ? 0.5 : 0)) % 1;
  if (position < 0.61) return { reach: 0.315 - position * 1.04, lift: 0 };
  const swing = (position - 0.61) / 0.39;
  return { reach: -0.32 + (0.5 - 0.5 * Math.cos(swing * Math.PI)) * 0.635, lift: 0.105 * Math.sin(swing * Math.PI) ** 1.2 };
}
function standing(phase) {
  const moving = phase !== null;
  const bob = moving ? 0.012 * Math.cos(phase * Math.PI * 4) : 0;
  const sway = moving ? 0.016 * Math.sin(phase * Math.PI * 2) : 0.011;
  return {
    hips: [0, sway, 0.92 + bob],
    shoulders: [0.032, -sway * 0.45, 1.44 + bob],
    chin: [0.052, 0, 1.49 + bob],
    crown: [0.045, 0, 1.73 + bob],
    face: [1, 0, 0],
    leg(side) {
      const { reach, lift } = moving ? step(phase, side) : { reach: side * 0.03, lift: 0 };
      return [
        [0, side * 0.1 + sway, 0.94 + bob],
        [reach * 0.47 + 0.039 + lift * 0.6, side * 0.105, 0.51 + lift * 0.62],
        [reach, side * 0.112, 0.085 + lift]
      ];
    },
    arm(side) {
      const swing = moving ? Math.cos((phase + (side < 0 ? 0.5 : 0)) * Math.PI * 2) : 0;
      return [
        [0.029 - swing * 0.023, side * 0.145 - sway * 0.45, 1.43 + bob],
        [-swing * 0.094 - 0.021, side * 0.194, 1.174 + bob],
        [-swing * 0.164 + 0.042, side * 0.192, 1.004 + bob + Math.max(0, -swing) * 0.038]
      ];
    },
    toes: [1, 0, 0]
  };
}
function kneeFor(hip, ankle) {
  const thigh = 0.463, shin = 0.445;
  const difference = subtract(ankle, hip);
  const distance = Math.hypot(...difference);
  const axis = scale2(difference, 1 / distance);
  const forward = unit([-axis[2], 0, axis[0]]);
  const along = (thigh ** 2 - shin ** 2 + distance ** 2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, thigh ** 2 - along ** 2));
  return add(add(hip, scale2(axis, along)), scale2(forward, bend));
}
function stairStance(phase, feet, size) {
  const body = standing(phase);
  const ankles = feet.map(({ ahead, height }, index) => [ahead / size, (index ? 1 : -1) * 0.109, 0.078 + height / size]);
  const hipHeight = Math.min(
    0.913 + 0.012 * Math.cos(phase * Math.PI * 4),
    ...ankles.map(([ahead, , z]) => z + Math.sqrt(Math.max(0.07, 0.89 ** 2 - (ahead - 0.02) ** 2)))
  );
  const adjust = ([x, y, z], lean = 0.045) => [x + lean, y, z + hipHeight - 0.94];
  return {
    ...body,
    hips: [0.02, 0, hipHeight - 0.018],
    shoulders: adjust(body.shoulders),
    shoeScale: 0.93,
    chin: adjust(body.chin),
    crown: adjust(body.crown),
    leg(side) {
      const hip = [0.02, side * 0.1, hipHeight];
      const ankle = ankles[side > 0 ? 1 : 0];
      return [hip, kneeFor(hip, ankle), ankle];
    },
    arm(side) {
      return body.arm(side).map((point2) => adjust(point2, 0.027));
    }
  };
}
var sitting = {
  hips: [-0.09, 0, 0.48],
  shoulders: [-8e-3, 0, 0.984],
  chin: [0.028, 0, 1.03],
  crown: [0.022, 0, 1.265],
  face: [1, 0, 0],
  leg: (side) => [[-0.08, side * 0.1, 0.48], [0.331, side * 0.129, 0.46], [0.307, side * 0.139, 0.085]],
  arm: (side) => [[-0.02, side * 0.147, 0.975], [0.095, side * 0.206, 0.714], [0.263, side * 0.16, 0.561]],
  toes: [1, 0, 0]
};
function sittingOnCushion(height, size) {
  const lift = height / size - mix(sitting.hips, sitting.shoulders, -0.23)[2];
  const raised = ([x, y, z], amount = lift) => [x, y, z + amount];
  return {
    ...sitting,
    hips: raised(sitting.hips),
    shoulders: raised(sitting.shoulders),
    chin: raised(sitting.chin),
    crown: raised(sitting.crown),
    leg(side) {
      const [hip, knee, ankle] = sitting.leg(side);
      return [raised(hip), raised(knee, lift * 0.55), ankle];
    },
    arm: (side) => sitting.arm(side).map((point2) => raised(point2))
  };
}
function blendPose(from, to, progress) {
  const joint = (name) => (side) => from[name](side).map((point2, index) => mix(point2, to[name](side)[index], progress));
  return {
    ...from,
    hips: mix(from.hips, to.hips, progress),
    shoulders: mix(from.shoulders, to.shoulders, progress),
    chin: mix(from.chin, to.chin, progress),
    crown: mix(from.crown, to.crown, progress),
    face: unit(mix(from.face, to.face, progress)),
    toes: unit(mix(from.toes, to.toes, progress)),
    leg: joint("leg"),
    arm: joint("arm")
  };
}
function smokeStance(phase, time, animate) {
  const neutral = standing(null);
  const reaching = phase === "start" || phase === "fire";
  if (reaching) {
    const reach = {
      ...neutral,
      hips: [-0.08, 0, 0.87],
      shoulders: [0.22, 0, 1.32],
      chin: [0.3, 0, 1.35],
      crown: [0.4, 0, 1.56],
      face: [0.83, 0, -0.55],
      arm: (side) => side > 0 ? [[0.21, 0.145, 1.31], [0.43, 0.19, 1.14], [0.65, 0.12, 1.06]] : [[0.21, -0.145, 1.31], [0.03, -0.23, 1.11], [0.03, -0.23, 0.93]]
    };
    const progress = phase === "start" ? Math.min(1, time / 0.65) : 1 - Math.min(1, (time - 0.85) / 0.68);
    return blendPose(neutral, reach, animate ? progress * progress * (3 - 2 * progress) : 0.65);
  }
  const wave = animate ? time * Math.PI * 4.6 : 0;
  const sway = Math.sin(wave * 0.54) * 0.055;
  const alarm = {
    ...neutral,
    hips: [-0.035, sway * 0.35, 0.9],
    shoulders: [-0.06, sway, 1.42],
    chin: [-0.055, sway * 1.3, 1.48],
    crown: [-0.055, sway * 1.4, 1.72],
    arm(side) {
      const pulse = Math.sin(wave + side * 0.91);
      return [
        [-0.055, side * 0.145 + sway, 1.42],
        [0.027, sway + side * (0.293 + 0.035 * pulse), 1.61 + 0.05 * pulse],
        [0.073, sway + side * (0.29 + 0.11 * pulse), 1.856 + 0.072 * pulse]
      ];
    }
  };
  return blendPose(neutral, alarm, animate ? Math.min(1, (time - 1.65) / 0.26) : 1);
}
var lying = {
  hips: [-0.235, 0, 0.128],
  shoulders: [0.291, 0, 0.143],
  chin: [0.358, 0, 0.123],
  crown: [0.592, 0, 0.145],
  face: [0, 0, 1],
  leg: (side) => [[-0.218, side * 0.096, 0.134], [-0.592, side * 0.13, side === 1 ? 0.17 : 0.092], [-0.938, side * 0.15, 0.078]],
  arm: (side) => [[0.288, side * 0.146, 0.143], [0.031, side * 0.245, 0.092], [-0.121, side * 0.208, 0.081]],
  toes: [-0.61, 0, 0.79]
};
var offBalance = {
  hips: [-0.09, 0, 0.85],
  shoulders: [-0.31, 0, 1.34],
  chin: [-0.31, 0, 1.42],
  crown: [-0.43, 0, 1.63],
  face: [0.88, 0, 0.48],
  leg: (side) => [
    [-0.09, side * 0.1, 0.86],
    [0.2, side * 0.13, 0.5],
    [side > 0 ? 0.22 : -0.24, side * 0.14, 0.085]
  ],
  arm: (side) => [
    [-0.27, side * 0.145, 1.34],
    [-0.12, side * 0.29, 1.22],
    [0.08, side * 0.38, 1.28]
  ],
  toes: [1, 0, 0]
};
var mirror = ([x, y, z]) => [-x, y, z];
var fallen = {
  hips: mirror(lying.hips),
  shoulders: mirror(lying.shoulders),
  chin: mirror(lying.chin),
  crown: mirror(lying.crown),
  face: lying.face,
  toes: mirror(lying.toes),
  leg: (side) => lying.leg(side).map(mirror),
  arm: (side) => lying.arm(side).map(mirror)
};
function fallStance(progress) {
  const buckle = 0.37;
  if (progress <= buckle) return blendPose(standing(null), offBalance, (progress / buckle) ** 1.4);
  return blendPose(offBalance, fallen, ((progress - buckle) / (1 - buckle)) ** 1.6);
}
var skull = [
  [0, 0.039, 0.049, 0.048],
  [0.1, 0.06, 0.066, 0.063],
  [0.24, 0.075, 0.076, 0.08],
  [0.39, 0.084, 0.082, 0.09],
  [0.53, 0.087, 0.079, 0.095],
  [0.65, 0.086, 0.084, 0.096],
  [0.77, 0.084, 0.079, 0.091],
  [0.87, 0.073, 0.065, 0.08],
  [0.95, 0.051, 0.045, 0.058],
  [1, 0.014, 0.014, 0.018]
];
function skullAt(height) {
  const index = Math.max(1, skull.findIndex(([level]) => level >= height));
  const lower = skull[index - 1], upper = skull[index];
  const t = (height - lower[0]) / (upper[0] - lower[0]);
  return [
    height,
    lower[1] + (upper[1] - lower[1]) * t,
    lower[2] + (upper[2] - lower[2]) * t,
    lower[3] + (upper[3] - lower[3]) * t
  ];
}
function buildHead(pose, model, addFace, detailed) {
  const up = unit(subtract(pose.crown, pose.chin));
  const forward = unit(subtract(pose.face, scale2(up, dot2(up, pose.face))));
  const side = cross2(up, forward);
  const headPoint = (height, lateral, depth) => add(
    mix(pose.crown, pose.chin, (1 - height) * (model.headHeight ?? 1)),
    add(scale2(side, lateral * model.head), scale2(forward, depth * model.head))
  );
  const ring2 = detailed ? headRing : bodyRing;
  const hairline = ([u, v]) => {
    const front = Math.max(0, u);
    const sweep = model.hair === "short" ? v * 0.085 : v * 0.053;
    return (model.hair === "long" ? 0.44 : 0.48) + 0.31 * front ** 1.8 + sweep * front;
  };
  const aroundHead = ([u, v], height, fullness = 0, lift = 0) => {
    const [, width, face2, back] = skullAt(height);
    return headPoint(height + lift, v * (width + fullness), u * ((u > 0 ? face2 : back) + fullness));
  };
  const skinBands = [0, 0.16, 0.36, 0.57, 0.72, 0.86, 1];
  const skin = skinBands.map((level) => ring2.map((angle2) => aroundHead(angle2, hairline(angle2) * level)));
  shell(skin, skinBands.map(() => [0, 0, 0, "skin"]), addFace, { end: false });
  const hairBands = [0, 0.25, 0.48, 0.68, 0.84, 1];
  const hair = hairBands.map((level) => ring2.map((angle2) => {
    const line = hairline(angle2);
    const wave = model.hair === "wavy" ? 0.014 + 4e-3 * Math.cos(angle2[1] * 19) : 0.012;
    const volume = wave * Math.sin(level * Math.PI * 0.91);
    return aroundHead(angle2, line + (1 - line) * level, volume, 0.032 * level);
  }));
  shell(hair, hairBands.map(() => [0, 0, 0, "hair"]), addFace, { start: false });
  if (model.hair === "long") {
    for (const direction of [-1, 1]) {
      const roots = headPoint(0.66, direction * 0.062, -0.059);
      const tip2 = add(pose.shoulders, add(scale2(side, direction * 0.112), scale2(forward, -0.051)));
      profile(roots, tip2, [
        [0, 0.052, 0.038, "hairLight"],
        [0.52, 0.06, 0.042, "hair"],
        [0.83, 0.047, 0.033, "hair"],
        [1, 0.016, 0.018, "hair"]
      ], addFace);
    }
  }
  const face = (lateral, height, lift) => {
    const [, width, depth] = skullAt(height);
    return headPoint(height, lateral, depth * Math.sqrt(Math.max(0, 1 - (lateral / width) ** 2)) + lift);
  };
  const patch = (outline, tone) => {
    const vertices = outline.map(([lateral, height, lift = 3e-3]) => face(lateral, height, lift));
    const normal = cross2(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]));
    addFace(dot2(normal, forward) < 0 ? vertices.reverse() : vertices, tone);
  };
  const tip = [0, 0.44, 0.032];
  patch([[0, 0.648, 4e-3], [-0.018, 0.458, 9e-3], tip], "skin");
  patch([[0, 0.648, 4e-3], tip, [0.018, 0.458, 9e-3]], "skin");
  patch([[-0.018, 0.458, 9e-3], [-0.012, 0.405, 0.01], [0, 0.406, 0.019], tip], "warmth");
  patch([tip, [0, 0.406, 0.019], [0.012, 0.405, 0.01], [0.018, 0.458, 9e-3]], "warmth");
  if (!detailed) return;
  patch([
    [-0.025, 0.282],
    [-0.01, 0.301, 6e-3],
    [0, 0.287, 7e-3],
    [0.01, 0.301, 6e-3],
    [0.025, 0.282],
    [0, 0.257, 7e-3]
  ], "lips");
  for (const direction of [-1, 1]) {
    const outer = (value, height, lift) => [direction * value, height, lift];
    patch([
      outer(0.02, 0.565, 5e-3),
      outer(0.034, 0.596, 7e-3),
      outer(0.051, 0.586, 6e-3),
      outer(0.059, 0.569, 4e-3),
      outer(0.038, 0.552, 7e-3)
    ], "eye");
    patch([
      outer(0.034, 0.556, 0.01),
      outer(0.031, 0.575, 0.011),
      outer(0.037, 0.593, 0.01),
      outer(0.043, 0.585, 0.01),
      outer(0.045, 0.562, 0.01)
    ], "iris");
    patch([
      outer(0.035, 0.562, 0.014),
      outer(0.034, 0.582, 0.014),
      outer(0.041, 0.581, 0.014),
      outer(0.041, 0.563, 0.014)
    ], "pupil");
    patch([
      outer(0.019, 0.624, 6e-3),
      outer(0.031, 0.652, 7e-3),
      outer(0.051, 0.651, 7e-3),
      outer(0.063, 0.627, 6e-3),
      outer(0.033, 0.63, 9e-3)
    ], "brow");
    const ear = headPoint(0.41, direction * 0.084, -7e-3);
    profile(ear, add(ear, scale2(up, 0.052)), [
      [0, 6e-3, 7e-3, "skinFold"],
      [0.36, 0.014, 0.012, "warmth"],
      [0.7, 0.013, 0.013, "skin"],
      [1, 6e-3, 7e-3, "skin"]
    ], addFace);
  }
}
function buildBody(pose, addFace, model, detailed) {
  const tube = (a, b, width, depth, endWidth, endDepth, color2) => profile(a, b, [[0, width, depth, color2], [1, endWidth, endDepth, color2]], addFace);
  const widths = (sections, factor) => sections.map(([t, width, depth, tone]) => [t, width * factor, depth * factor, tone]);
  profile(pose.hips, pose.shoulders, widths([
    [0, 0.131, 0.09, "hem"],
    [0.065, 0.153, 0.102, "hem"],
    [0.21, 0.15, 0.105, "jacket"],
    [0.43, 0.138, 0.097, "jacket"],
    [0.7, 0.163, 0.112, "jacket"],
    [0.87, 0.178, 0.104, "jacket"],
    [0.96, 0.134, 0.083, "jacket"],
    [1, 0.101, 0.07, "shoulder"]
  ], model.torso), addFace, bodyRing);
  profile(mix(pose.hips, pose.shoulders, -0.23), mix(pose.hips, pose.shoulders, 0.05), widths([
    [0, 0.089, 0.059, "pants"],
    [0.35, 0.137, 0.087, "pants"],
    [0.72, 0.148, 0.097, "pants"],
    [1, 0.141, 0.092, "pants"]
  ], model.torso), addFace, bodyRing);
  profile(mix(pose.shoulders, pose.chin, -0.13), mix(pose.shoulders, pose.chin, 0.96), [
    [0, 0.066, 0.06, "shirt"],
    [0.25, 0.058, 0.056, "shirt"],
    [0.44, 0.047, 0.045, "skin"],
    [1, 0.047, 0.044, "skin"]
  ], addFace);
  buildHead(pose, model, addFace, detailed);
  if (detailed && model.hair !== "long") {
    const chest = unit(subtract(pose.shoulders, pose.hips));
    const forward = unit(subtract(pose.face, scale2(chest, dot2(chest, pose.face))));
    const lateral = cross2(chest, forward);
    const seam = (height, width, depth) => add(
      mix(pose.hips, pose.shoulders, height),
      add(scale2(forward, depth * model.torso), scale2(lateral, width))
    );
    const zip = [[0.09, 0.103], [0.23, 0.109], [0.42, 0.102], [0.69, 0.117], [0.86, 0.111], [0.99, 0.078]];
    for (let index = 1; index < zip.length; index++) {
      const [bottom, lowerDepth] = zip[index - 1], [top, upperDepth] = zip[index];
      addFace([
        seam(bottom, -4e-3, lowerDepth),
        seam(bottom, 4e-3, lowerDepth),
        seam(top, 4e-3, upperDepth),
        seam(top, -4e-3, upperDepth)
      ], "seam");
    }
  }
  for (const side of [-1, 1]) {
    const leg = pose.leg(side);
    const ankle = leg.at(-1);
    bentProfile(leg, widths([
      [0, 0.088, 0.094, "pants"],
      [0.17, 0.089, 0.093, "pants"],
      [0.4, 0.062, 0.063, "pants"],
      [0.52, 0.055, 0.06, "pants"],
      [0.72, 0.058, 0.059, "pants"],
      [0.9, 0.04, 0.047, "pants"],
      [1, 0.038, 0.043, "pants"]
    ], model.limbs), addFace);
    const foot = add(ankle, [0, 0, -0.032]);
    const shoeScale = (pose.shoeScale ?? 1) * (model.size < 0.9 ? 1.04 : model.torso);
    const heel = add(foot, scale2(pose.toes, -0.065 * shoeScale)), toe = add(foot, scale2(pose.toes, 0.132 * shoeScale));
    profile(add(heel, [0, 0, -0.031]), add(toe, [0, 0, -0.031]), widths([
      [0, 0.042, 0.01, "sole"],
      [0.16, 0.052, 0.014, "sole"],
      [0.83, 0.054, 0.012, "sole"],
      [1, 0.035, 9e-3, "sole"]
    ], shoeScale), addFace);
    profile(heel, toe, widths([
      [0, 0.041, 0.026, "shoe"],
      [0.22, 0.052, 0.043, "shoe"],
      [0.52, 0.055, 0.034, "shoe"],
      [0.83, 0.051, 0.026, "toe"],
      [1, 0.032, 0.014, "toe"]
    ], shoeScale), addFace);
    const arm = pose.arm(side).map(([x, y, z]) => [x, y * model.torso, z]);
    const [, elbow, wrist] = arm;
    bentProfile(arm, widths([
      [0, 0.033, 0.039, "jacket"],
      [0.13, 0.058, 0.061, "jacket"],
      [0.32, 0.051, 0.055, "jacket"],
      [0.51, 0.039, 0.046, "jacket"],
      [0.7, 0.043, 0.044, "jacket"],
      [0.91, 0.035, 0.034, "jacket"],
      [0.96, 0.034, 0.034, "hem"],
      [1, 0.032, 0.031, "hem"]
    ], model.limbs), addFace);
    const hand = unit(subtract(wrist, elbow));
    const palm = add(wrist, scale2(hand, 0.027));
    profile(wrist, add(wrist, scale2(hand, 0.082)), widths([
      [0, 0.024, 0.024, "skin"],
      [0.34, 0.033, 0.024, "skin"],
      [0.72, 0.027, 0.017, "warmth"],
      [1, 0.016, 0.01, "skin"]
    ], model.limbs), addFace);
    if (detailed) {
      const thumb = add(palm, [0, -side * 0.018, 0]);
      const end2 = add(add(thumb, scale2(hand, 0.023)), [0.017, -side * 9e-3, 0]);
      tube(thumb, end2, 0.013 * model.limbs, 0.011, 8e-3, 7e-3, "skin");
    }
  }
}
var color = (tone, light) => "#" + tone.map((value) => Math.min(255, Math.round(value * light)).toString(16).padStart(2, "0")).join("");
function gradientPrefix(person, camera) {
  const key = [person.avatar, person.id, person.x, person.y, person.heading, person.elevation, person.pose, person.seatHeight, camera.yaw, camera.tilt].join("|");
  let hash = 0;
  for (const character of key) hash = Math.imul(hash, 31) + character.charCodeAt(0) | 0;
  return `fp-avatar-light-${(hash >>> 0).toString(36)}-`;
}
function paintAvatar(person, camera, animate, detailed = true, occlusion = null) {
  const model = figures[person.avatar] ?? figures.man;
  const { palette, size } = model;
  const floorHeight = occlusion ? (occlusion.height - (person.elevation ?? 0)) / size : 0;
  const heading = person.heading * Math.PI / 180;
  const sin = Math.sin(heading), cos = Math.cos(heading);
  const project = ([ahead, side, z]) => projectSpace([
    person.x + size * (ahead * sin + side * cos),
    person.y + size * (-ahead * cos + side * sin)
  ], z * size + (person.elevation ?? 0), camera);
  const yaw = camera.yaw + Math.PI / 4;
  const viewX = Math.sin(yaw) * Math.cos(camera.tilt);
  const viewY = Math.cos(yaw) * Math.cos(camera.tilt);
  const view = [viewX * sin - viewY * cos, viewX * cos + viewY * sin, Math.sin(camera.tilt)];
  const light = unit([-0.42 * sin + 0.43 * cos, -0.42 * cos - 0.43 * sin, 0.8]);
  const faces = [];
  const gradients = [];
  const prefix = detailed ? gradientPrefix(person, camera) : "";
  const projected = /* @__PURE__ */ new WeakMap();
  const point2 = (vertex) => {
    if (!projected.has(vertex)) {
      const [x, y] = project(vertex);
      projected.set(vertex, { x, y, xy: `${x},${y}` });
    }
    return projected.get(vertex);
  };
  const intensity = (normal) => 0.79 + Math.max(0, dot2(normal, light)) * 0.25 + 0.05 * Math.max(0, dot2(normal, view));
  const polygon2 = (vertices, fill) => `<polygon points="${vertices.map((vertex) => point2(vertex).xy).join(" ")}" fill="${fill}" stroke="${fill}"/>`;
  const addFace = (vertices, tone, normals) => {
    const normal = unit(cross2(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0])));
    if (!(dot2(normal, view) > 1e-3)) return;
    const points = vertices.map(point2);
    const levels = normals?.map(intensity) ?? [intensity(normal)];
    let fill = color(palette[tone], levels.reduce((sum, value) => sum + value, 0) / levels.length);
    if (detailed && levels.length > 1) {
      const lo = Math.min(...levels), hi = Math.max(...levels);
      const a = points[levels.indexOf(lo)], b = points[levels.indexOf(hi)];
      if (hi - lo >= 0.029 && Math.hypot(b.x - a.x, b.y - a.y) >= 0.016) {
        const id = prefix + gradients.length;
        gradients.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><stop stop-color="${color(palette[tone], lo)}"/><stop offset="1" stop-color="${color(palette[tone], hi)}"/></linearGradient>`);
        fill = `url(#${id})`;
      }
    }
    const [below, above] = occlusion ? splitVerticesAtHeight(vertices, floorHeight) : [[], vertices];
    faces.push({
      depth: vertices.reduce((sum, vertex) => sum + dot2(vertex, view), 0) / vertices.length,
      below: below.length ? polygon2(below, fill) : "",
      above: above.length ? polygon2(above, fill) : ""
    });
  };
  const phase = person.moving && animate ? (person.stride ?? 0) / 1.04 : null;
  const climbing = Boolean(person.feet && animate);
  const onCushion = person.pose === "sitting" && Number.isFinite(person.seatHeight);
  const pose = climbing ? stairStance(person.phase, person.feet, size) : person.fallProgress !== void 0 ? fallStance(animate ? person.fallProgress : Number(person.pose === "lying")) : person.smokePhase ? smokeStance(person.smokePhase, person.smokeTime, animate) : person.sitProgress !== void 0 ? blendPose(standing(null), sitting, person.sitProgress) : person.pose === "standing" ? standing(phase) : onCushion ? sittingOnCushion(person.seatHeight, size) : person.pose === "sitting" ? sitting : lying;
  buildBody(pose, addFace, model, detailed);
  const onFloor = person.pose === "lying";
  const shadowCenter = onFloor ? person.activity === "fall" ? 0.17 : -0.17 : onCushion ? 0.36 : 0.035;
  const shadow = bodyRing.map(([x, y]) => project([
    shadowCenter + x * (onFloor ? 0.86 : 0.35),
    0.04 + y * (onFloor ? 0.29 : 0.23),
    0
  ]).join(",")).join(" ");
  const [floorX, floorY] = project([onCushion ? shadowCenter : 0, 0, 0]);
  const base = `<polygon class="fp-avatar-shadow" points="${shadow}"/>
        <ellipse class="fp-person-base" cx="${floorX}" cy="${floorY}" rx="${0.35 * size}" ry="${0.15 * size}"/>`;
  faces.sort((a, b) => a.depth - b.depth);
  const lowerMesh = faces.map((face) => face.below).join("");
  const upperMesh = faces.map((face) => face.above).join("");
  const belowFloor = occlusion && floorHeight > 0;
  const plumbob = person.plumbob ? paintPlumbob(project([pose.crown[0], 0, pose.crown[2] + 0.36 / size]), person.plumbob) : "";
  return `<g class="fp-person-space" data-avatar="${person.avatar ?? "man"}" data-pose="${person.pose}" data-activity="${person.activity ?? ""}" ${person.active ? "data-active" : ""} ${climbing ? "data-stair-gait" : ""} aria-hidden="true">
        ${gradients.length ? `<defs>${gradients.join("")}</defs>` : ""}
        ${!belowFloor ? base : ""}
        ${belowFloor || lowerMesh ? `<g mask="url(#${occlusion.id})">${belowFloor ? base : ""}<g class="fp-avatar-mesh">${lowerMesh}</g></g>` : ""}
        <g class="fp-avatar-mesh">${upperMesh}</g>${plumbob}
    </g>`;
}
function paintPlumbob([x, y], status) {
  const half = 0.085, tip = 0.15;
  const top = `${x},${y - tip}`, bottom = `${x},${y + tip}`;
  return `<g class="fp-plumbob" data-status="${status}"><g class="fp-plumbob-gem">
        <polygon class="fp-plumbob-lit" points="${top} ${bottom} ${x - half},${y}"/>
        <polygon class="fp-plumbob-shade" points="${top} ${x + half},${y} ${bottom}"/>
        <path class="fp-plumbob-edge" d="M${x - half} ${y}H${x + half}"/></g></g>`;
}

// src/js/floor-planner-person.mjs
function paintPerson(person, camera = null, animate = true, detailed = true, occlusion = null) {
  const { x, y, pose, heading } = person;
  if (camera === null) {
    const wave = animate ? Math.sin((person.smokeTime ?? 0) * Math.PI * 4.6) * 0.075 : 0;
    const reacting = person.smokePhase === "smoke" || person.smokePhase === "reported";
    const reaction = `<circle cy="-.11" r=".085"/><path d="M0 .03v.12M-.22 ${-0.24 + wave}L-.14 .01 0 .07 .14 .01 .22 ${-0.24 - wave}"/>`;
    const figure = reacting ? reaction : {
      standing: '<circle cy="-.13" r=".10"/><path d="M-.17 .16v-.05q.17-.18.34 0v.05"/>',
      sitting: '<circle cy="-.12" r=".09"/><path d="M-.17 .02v.16h.34V.02M-.1 .09h.2"/>',
      lying: '<circle cy="-.20" r=".075"/><path d="M0-.06v.30m-.12-.16L0-.06l.12.14m-.07.16L0 .12l-.07.12"/>'
    }[pose];
    const falling = animate && person.fallProgress !== void 0 && person.fallProgress < 1;
    const progress = falling ? person.fallProgress : 0;
    const body = person.fallProgress === void 0 ? `rotate(${heading})` : `rotate(${heading + (falling ? 75 * progress : 180)}) translate(0 ${progress * 0.13}) scale(1 ${1 + progress * 0.65})`;
    return `<g class="fp-person-flat" data-avatar="${person.avatar ?? "man"}" data-pose="${pose}" data-activity="${person.activity ?? ""}" ${person.active ? "data-active" : ""} transform="translate(${x} ${y})${person.avatar === "child" ? " scale(.82)" : ""}">
            <circle class="fp-person-base" r=".34"/><g class="fp-person-body" transform="${body}">${figure}</g></g>`;
  }
  return paintAvatar(person, camera, animate, detailed, occlusion);
}

// src/ha/ha-rooms.js
import { zoneOwnerIsAvailable } from "./safety.js?v=08fb810078d1";

// ../panel/src/utils/whole-home.ts
var DEFAULT_ROOM_SIZE = 4e3;
var ROOM_GAP = 700;
var finite = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
var roomPolygon = (room) => (Array.isArray(room.walls) ? room.walls : []).filter((wall) => typeof wall === "object" && wall !== null).map((wall) => ({ x: finite(wall.x1), y: finite(wall.y1) })).filter((point2) => Number.isFinite(point2.x) && Number.isFinite(point2.y));
var boundsForPoints = (points) => {
  if (!points.length) {
    return {
      minX: -DEFAULT_ROOM_SIZE / 2,
      minY: -DEFAULT_ROOM_SIZE / 2,
      maxX: DEFAULT_ROOM_SIZE / 2,
      maxY: DEFAULT_ROOM_SIZE / 2,
      width: DEFAULT_ROOM_SIZE,
      height: DEFAULT_ROOM_SIZE
    };
  }
  const xs = points.map((point2) => point2.x);
  const ys = points.map((point2) => point2.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY)
  };
};
var roomBounds = (room) => boundsForPoints(roomPolygon(room));
var normaliseQuarterTurn = (value) => {
  const turns = (Math.round(finite(value) / 90) % 4 + 4) % 4;
  return turns * 90;
};
var normaliseHousePlacement = (placement) => ({
  x: finite(placement?.x),
  y: finite(placement?.y),
  floor: Math.max(-5, Math.min(20, Math.round(finite(placement?.floor)))),
  rotationDeg: normaliseQuarterTurn(placement?.rotationDeg),
  visible: placement?.visible !== false
});
var transformHomePoint = (point2, placement) => {
  const radians = placement.rotationDeg * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: placement.x + point2.x * cos - point2.y * sin,
    y: placement.y + point2.x * sin + point2.y * cos
  };
};
var autoArrangeRooms = (rooms) => {
  const byFloor = /* @__PURE__ */ new Map();
  rooms.forEach((room) => {
    const floor = normaliseHousePlacement(room.house).floor;
    const group = byFloor.get(floor) || [];
    group.push(room);
    byFloor.set(floor, group);
  });
  const arranged = /* @__PURE__ */ new Map();
  for (const [floor, floorRooms] of byFloor) {
    const totalArea = floorRooms.reduce((sum, room) => {
      const bounds = roomBounds(room);
      return sum + bounds.width * bounds.height;
    }, 0);
    const targetRowWidth = Math.max(6e3, Math.sqrt(totalArea) * 1.65);
    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;
    floorRooms.forEach((room) => {
      const bounds = roomBounds(room);
      if (cursorX > 0 && cursorX + bounds.width > targetRowWidth) {
        cursorX = 0;
        cursorY += rowHeight + ROOM_GAP;
        rowHeight = 0;
      }
      const placement = {
        x: cursorX - bounds.minX,
        y: cursorY - bounds.minY,
        floor,
        rotationDeg: 0,
        visible: room.house?.visible !== false
      };
      arranged.set(room.id, { ...room, house: placement });
      cursorX += bounds.width + ROOM_GAP;
      rowHeight = Math.max(rowHeight, bounds.height);
    });
  }
  return rooms.map((room) => arranged.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
};

// ../panel/src/utils/furniture-catalog.ts
var FURNITURE_CATALOG = [
  { id: "bed-single", label: "Single Bed", category: "bedroom", icon: "mdi:bed", defaultWidth: 900, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "bed-double", label: "Double Bed", category: "bedroom", icon: "mdi:bed-double", defaultWidth: 1400, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "bed-king", label: "King Bed", category: "bedroom", icon: "mdi:bed-king", defaultWidth: 1800, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "nightstand", label: "Nightstand", category: "bedroom", icon: "mdi:table-furniture", defaultWidth: 450, defaultDepth: 450, defaultHeight: 500 },
  { id: "wardrobe", label: "Wardrobe", category: "bedroom", icon: "mdi:wardrobe", defaultWidth: 1200, defaultDepth: 600, defaultHeight: 2e3 },
  { id: "sofa-2seat", label: "2-Seat Sofa", category: "living-room", icon: "mdi:sofa", defaultWidth: 1600, defaultDepth: 900, defaultHeight: 800 },
  { id: "sofa-3seat", label: "3-Seat Sofa", category: "living-room", icon: "mdi:sofa", defaultWidth: 2200, defaultDepth: 900, defaultHeight: 800 },
  { id: "armchair", label: "Armchair", category: "living-room", icon: "mdi:seat", defaultWidth: 900, defaultDepth: 900, defaultHeight: 800 },
  { id: "coffee-table", label: "Coffee Table", category: "living-room", icon: "mdi:table", defaultWidth: 1200, defaultDepth: 600, defaultHeight: 400 },
  { id: "tv-stand", label: "TV Stand", category: "living-room", icon: "mdi:television", defaultWidth: 1600, defaultDepth: 450, defaultHeight: 500 },
  { id: "bookshelf", label: "Bookshelf", category: "living-room", icon: "mdi:bookshelf", defaultWidth: 800, defaultDepth: 300, defaultHeight: 1800 },
  { id: "desk", label: "Desk", category: "office", icon: "mdi:desk", defaultWidth: 1400, defaultDepth: 700, defaultHeight: 750 },
  { id: "office-chair", label: "Office Chair", category: "office", icon: "mdi:seat", defaultWidth: 600, defaultDepth: 600, defaultHeight: 1100 },
  { id: "dining-table-4", label: "Dining Table (4)", category: "dining", icon: "mdi:table-chair", defaultWidth: 1200, defaultDepth: 800, defaultHeight: 750 },
  { id: "dining-table-6", label: "Dining Table (6)", category: "dining", icon: "mdi:table-chair", defaultWidth: 1800, defaultDepth: 900, defaultHeight: 750 },
  { id: "dining-chair", label: "Dining Chair", category: "dining", icon: "mdi:chair-rolling", defaultWidth: 450, defaultDepth: 500, defaultHeight: 900 }
];
function getFurnitureById(id) {
  return FURNITURE_CATALOG.find((f) => f.id === id);
}

// src/ha/ha-rooms.js
var defaultProjectName = "My home";
var finite2 = (value) => typeof value === "number" && Number.isFinite(value);
var finitePoint = (value) => value && finite2(value.x) && finite2(value.y);
var metres = (millimetres) => Number((millimetres / 1e3).toFixed(7));
var degrees = (value) => (value % 360 + 360) % 360;
var safeName = (value, fallback) => String(value || fallback).trim().slice(0, 48) || fallback;
var frameMetres = (value) => Math.round(value * 1e3) / 1e6;
var furnitureAliases = {
  table: "dining",
  "coffee-table": "coffee",
  "tv-stand": "cabinet",
  bookshelf: "shelves",
  "office-chair": "chair",
  "dining-chair": "chair"
};
function plannerFurnitureKind(type) {
  if (Object.hasOwn(furnitureCatalog, type)) return type;
  if (typeof type !== "string") return "custom";
  if (type.startsWith("bed-")) return "bed";
  if (type.startsWith("sofa-")) return "sofa";
  if (type.startsWith("dining-table-")) return "dining";
  return furnitureAliases[type] ?? "custom";
}
var roomGap = 700;
var maxRowWidth = 8e4;
function roomsInHouse(rooms) {
  const placed = /* @__PURE__ */ new Map();
  rooms.filter((room) => room.house).forEach((room) => placed.set(room.id, { ...room, house: normaliseHousePlacement(room.house) }));
  const floors = new Set(rooms.map((room) => normaliseHousePlacement(room.house).floor));
  for (const floor of floors) {
    const missing = rooms.filter((room) => !room.house && normaliseHousePlacement(room.house).floor === floor);
    if (!missing.length) continue;
    const existing = [...placed.values()].filter((room) => room.house.floor === floor);
    if (!existing.length) {
      autoArrangeRooms(missing).forEach((room) => placed.set(room.id, room));
      continue;
    }
    const bounds = existing.map((room) => boundsForPoints(roomPolygon(room).map((point2) => transformHomePoint(point2, room.house))));
    const startX = Math.max(...bounds.map((box) => box.maxX)) + roomGap;
    let x = startX;
    let y = Math.min(...bounds.map((box) => box.minY));
    let rowHeight = 0;
    for (const room of missing) {
      const box = roomBounds(room);
      if (x > startX && x + box.width > maxRowWidth) {
        x = startX;
        y += rowHeight + roomGap;
        rowHeight = 0;
      }
      const house = normaliseHousePlacement({ x: x - box.minX, y: y - box.minY, floor, rotationDeg: 0, visible: true });
      placed.set(room.id, { ...room, house });
      x += box.width + roomGap;
      rowHeight = Math.max(rowHeight, box.height);
    }
  }
  return rooms.map((room) => placed.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
}
function roomViews(rooms, profiles = []) {
  const profileByDevice = new Map(profiles.map(({ device_id: id, profile: profile2 }) => [id, profile2]));
  const placed = roomsInHouse(rooms);
  const floors = [...new Set(placed.map((room) => room.house.floor))].sort((a, b) => a - b);
  const views = placed.map((room, index) => {
    const id = "ha-room-" + index;
    const toPlan = (point2) => {
      const home = transformHomePoint(point2, room.house);
      return { x: metres(home.x), y: metres(home.y) };
    };
    const outline = outlineBounds(roomPolygon(room).map((point2) => {
      const { x, y } = toPlan(point2);
      return [x, y];
    }), { maxCorners: 100, minSpan: 0.01, maxSpan: Infinity, minArea: 1e-4 });
    const height = finite2(room.ceilingHeightMm) ? metres(room.ceilingHeightMm) : 2.45;
    const floor = outline ? { id, name: room.name, ...outline, height } : null;
    const opening = (item) => {
      const wall = room.walls?.[item.wallIndex];
      if (!wall || !finite2(item.position) || !finite2(item.width)) return null;
      const start2 = { x: wall.x1, y: wall.y1 }, end2 = { x: wall.x2, y: wall.y2 };
      if (!finitePoint(start2) || !finitePoint(end2)) return null;
      const from = toPlan(start2), to = toPlan(end2);
      const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy);
      if (!length || item.width <= 0) return null;
      const width = Math.min(length, metres(item.width));
      const along = Math.max(0, Math.min(length - width, item.position * length - width / 2));
      return {
        roomId: id,
        x: from.x + dx / length * along,
        y: from.y + dy / length * along,
        width,
        angle: degrees(Math.atan2(dy, dx) * 180 / Math.PI),
        height: item.height > 0 ? metres(item.height) : null
      };
    };
    const doors = (room.doors ?? []).flatMap((door, index2) => {
      const placedDoor = opening(door);
      return placedDoor ? [{ ...placedDoor, id: id + "-door-" + index2 }] : [];
    });
    const openings = (items, kind, base, height2, extras = () => ({})) => (items ?? []).flatMap((item, index2) => {
      const placedItem = opening(item);
      return placedItem ? [{ ...placedItem, id: id + "-" + kind + "-" + index2, base, height: placedItem.height ?? height2, ...extras(item) }] : [];
    });
    const windows2 = openings(room.windows, "window", 1.15, 1.1);
    const mirrors = openings(room.mirrors, "mirror", 0.3, 1.8, (mirror2) => ({
      protectionEnabled: mirror2.protectionEnabled === true,
      reflectionDepthM: finite2(mirror2.reflectionDepthMm) ? Math.max(0.25, Math.min(6, mirror2.reflectionDepthMm / 1e3)) : 2
    }));
    const furniture = (room.furniture ?? []).flatMap((item, index2) => {
      if (!finitePoint(item)) return [];
      const type = item.typeId ?? item.type;
      const kind = plannerFurnitureKind(type);
      const model = furnitureCatalog[kind];
      const designer = getFurnitureById(type);
      return [{
        id: id + "-furniture-" + index2,
        ...toPlan(item),
        kind,
        material: model.material,
        width: item.width > 0 ? metres(item.width) : model.width,
        // The Room Designer calls the depth of a piece its height on the floor plan.
        depth: item.height > 0 ? metres(item.height) : item.depth > 0 ? metres(item.depth) : model.depth,
        height: designer ? metres(designer.defaultHeight) : model.height,
        base: model.base,
        angle: degrees((item.rotationDeg ?? item.rotation ?? 0) + room.house.rotationDeg)
      }];
    });
    const sources = room.sensors?.length ? room.sensors : room.sensor ? [room.sensor] : [];
    const sensors = sources.flatMap((source, index2) => {
      const position = { x: finite2(source.x_m) ? source.x_m * 1e3 : source.x, y: finite2(source.y_m) ? source.y_m * 1e3 : source.y };
      if (!finitePoint(position)) return [];
      const deviceId = source.deviceId ?? source.device_id ?? null;
      const profile2 = profileByDevice.get(deviceId);
      const mount = source.mountingMode ?? profile2?.mounting_mode;
      const product = profile2?.detected_product;
      const model = Object.hasOwn(devices, product) && devices[product].mount === mount ? product : mount === "ceiling" ? "ceilsense" : "ultimatesensor";
      return [{
        id: id + "-sensor-" + index2,
        ...toPlan(position),
        model,
        angle: degrees((source.orientation_deg ?? source.rotation ?? 0) + room.house.rotationDeg),
        radar: "none",
        savedHeight: finite2(source.height_m) ? source.height_m : finite2(source.heightMm) ? metres(source.heightMm) : null,
        sourceId: source.id,
        deviceId,
        source
      }];
    });
    const zones = (room.zones ?? []).map((zone) => {
      const parts = [zone.points, ...Array.isArray(zone.parts) ? zone.parts : []].filter((part) => Array.isArray(part) && part.length >= (zone.type === "entry" ? 2 : 3) && part.every(finitePoint));
      const unique = [...new Map(parts.map((part) => [JSON.stringify(part.map(({ x, y }) => [x, y])), part])).values()];
      return { zone, parts: unique.map((part) => part.map(toPlan)) };
    });
    const calibration = room.calibration;
    const calibrationOutline = calibration?.enabled && Array.isArray(calibration.corners) && calibration.corners.length === 4 && calibration.corners.every(finitePoint) ? calibration.corners.map(toPlan) : [];
    return { id, room, floor, doors, windows: windows2, mirrors, furniture, sensors, sources, zones, calibration, calibrationOutline };
  });
  return { rooms: placed, floors, views };
}
var normalisedProduct = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
var radarProducts = /* @__PURE__ */ new Set(["ceilsense", "wallsense", "ultimatesensor", "ultimatesensormini"]);
var modelsByLength = Object.keys(devices).sort((a, b) => b.length - a.length);
function plannerDevices(profiles, haDevices, areas = []) {
  const deviceById = new Map(haDevices.map((device) => [device.id, device]));
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const profileById = new Map(profiles.map((entry) => [entry.device_id, entry]));
  const ids = /* @__PURE__ */ new Set([
    ...profileById.keys(),
    ...haDevices.filter((device) => radarProducts.has(normalisedProduct(device.product_type))).map((device) => device.id)
  ]);
  return [...ids].flatMap((id) => {
    const device = deviceById.get(id);
    const entry = profileById.get(id);
    const profile2 = entry?.profile;
    if (device?.hidden) return [];
    const product = normalisedProduct(device?.product_type ?? profile2?.detected_product);
    const modelName = normalisedProduct(device?.model ?? entry?.model);
    const mount = profile2?.mounting_mode ?? (product === "ceilsense" ? "ceiling" : "wall");
    const model = modelsByLength.find((name) => modelName.startsWith(normalisedProduct(name)) && devices[name].mount === mount) ?? modelsByLength.find((name) => normalisedProduct(name) === product && devices[name].mount === mount) ?? (mount === "ceiling" ? "ceilsense" : "ultimatesensor");
    const radarModel = profile2?.radar_model?.toLowerCase();
    const radar = (mount === "ceiling" ? ["ld2412", "ld2460", "ld6002b", "combined"] : ["ld2450", "ld2460"]).includes(radarModel) ? radarModel : "none";
    const height = profile2?.installation_height_m ?? profile2?.mounting_height_mm / 1e3;
    const areaId = device?.area_id || null;
    return [{
      id,
      name: device?.name || entry?.name || id,
      model,
      mount,
      radar,
      product: device?.model || device?.product_name || entry?.model || "",
      radarModel: radarModel === "unknown" ? null : radarModel,
      areaId,
      floorId: areaById.get(areaId)?.floorId ?? null,
      mountHeight: mount === "wall" && height >= 0.15 && height <= 6 ? height : void 0,
      online: device?.online,
      aliases: [entry?.entity_prefix, ...entry?.aliases ?? []].filter(Boolean)
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}
var findPlannerDevice = (devices2, id) => id ? devices2.find((device) => device.id === id) ?? devices2.find((device) => device.aliases.includes(id)) : void 0;
var emptyFloorPlan = () => ({ ...blankPlan(defaultProjectName), version: 3, furniture: [], zones: [], windows: [], mirrors: [] });
function projectFromRooms(rooms, profiles, devices2 = []) {
  const layout = roomViews(rooms, profiles);
  const skippedRooms = [];
  const floors = (layout.floors.length ? layout.floors : [0]).map((level) => ({
    id: `floor-${level < 0 ? "b" + -level : level}`,
    level,
    name: null,
    plan: emptyFloorPlan()
  }));
  for (const view of layout.views) {
    if (!view.floor) {
      skippedRooms.push(view.room?.name || view.room?.id || "Room");
      continue;
    }
    const { room, id } = view;
    const { floor: level, x, y, rotationDeg, visible } = room.house;
    const plan = floors.find((floor) => floor.level === level).plan;
    const lengths = Object.fromEntries(["rooms", "doors", "windows", "mirrors", "furniture", "sensors", "zones"].map((key) => [key, plan[key].length]));
    try {
      plan.rooms.push({
        ...view.floor,
        name: safeName(room.name, "Room"),
        haRoom: room.id,
        ...room.haAreaId ? { haAreaId: room.haAreaId } : {},
        ...room.haFloorId ? { haFloorId: room.haFloorId } : {},
        haFrame: { x: frameMetres(x), y: frameMetres(y), angle: rotationDeg, visible }
      });
      for (const key of ["doors", "windows", "mirrors"]) for (const item of view[key]) {
        const index = Number(item.id.split("-").at(-1));
        const record = room[key]?.[index];
        if (!record) continue;
        const { height, angle: angle2, width } = item;
        if (key === "doors" && (width < 0.5 || width > 2) || key !== "doors" && (width < 0.1 || width > 8 || height < 0.1 || height > 6)) continue;
        const inward2 = key === "doors" && record.openDirection === "inward";
        const radians = angle2 * Math.PI / 180;
        plan[key].push({
          ...item,
          haIndex: index,
          haRecord: record.id,
          haRoom: room.id,
          angle: degrees(angle2 + (inward2 ? 180 : 0)),
          x: item.x + (inward2 ? Math.cos(radians) * width : 0),
          y: item.y + (inward2 ? Math.sin(radians) * width : 0)
        });
      }
      for (const item of view.furniture) {
        const index = Number(item.id.split("-").at(-1));
        plan.furniture.push({
          ...item,
          name: safeName(room.furniture[index]?.name, "Furniture"),
          haIndex: index,
          haRecord: room.furniture[index]?.id,
          haRoom: room.id
        });
      }
      for (const sensor of view.sensors) {
        const device = findPlannerDevice(devices2, sensor.deviceId);
        const sameMount = device?.mount === devices[sensor.model].mount;
        const model = sameMount ? device.model : sensor.model;
        const radar = sameMount ? device.radar : "none";
        const { savedHeight, sourceId, deviceId, source, ...item } = sensor;
        plan.sensors.push({
          ...item,
          model,
          radar: deviceId || radarsFor(model).includes(radar) ? radar : radarsFor(model)[0],
          haSource: sourceId,
          haRoom: room.id,
          haDevice: deviceId,
          ...devices[sensor.model].mount === "wall" && savedHeight >= 0.15 && savedHeight <= 6 ? { mountHeight: savedHeight } : {}
        });
      }
      const roomSources = new Set(plan.sensors.filter((sensor) => sensor.haRoom === room.id).map((sensor) => sensor.haSource));
      for (const [index, { zone, parts }] of view.zones.entries()) {
        if (!zoneTypes.includes(zone.type)) continue;
        const owner = zone.sensorId || zone.sensor_id || null;
        if (!zoneOwnerIsAvailable(owner, roomSources)) continue;
        const sensor = plan.sensors.find((item2) => item2.haRoom === room.id && item2.haSource === owner);
        const item = {
          id: `${id}-zone-${index}`,
          roomId: id,
          haRoom: room.id,
          haIndex: index,
          haRecord: zone.id,
          name: safeName(zone.name, "Zone"),
          type: zone.type,
          sensorId: owner ? sensor.id : null,
          parts: parts.map((part) => part.map(({ x: px, y: py }) => [px, py])),
          ...zone.type === "entry" ? { direction: zone.inDirection === "left" ? "left" : "right" } : {}
        };
        if (validProject({ ...plan, zones: [item] })) plan.zones.push(item);
      }
      if (!validProject(plan)) throw new Error("unsafe room");
    } catch {
      for (const [key, length] of Object.entries(lengths)) plan[key].length = length;
      skippedRooms.push(room.name || room.id || "Room");
    }
  }
  const project = {
    format: buildingFormat,
    version: 1,
    name: defaultProjectName,
    floors,
    activeFloor: (floors.find((floor) => floor.level === 0) ?? floors[0]).id
  };
  if (!validProject(project)) throw new Error("A room exceeds the safe editor limits. Nothing was changed.");
  if (skippedRooms.length) Object.defineProperty(project, "skippedRooms", { value: skippedRooms, enumerable: false });
  return project;
}
function haRoomContents(plan, room) {
  const contents = roomContents(plan, room);
  const owner = (item, fallback) => {
    const home = plan.rooms.find((candidate) => item.haRoom && candidate.haRoom === item.haRoom);
    return home && contains(home, item) ? home : fallback();
  };
  contents.sensors = plan.sensors.filter((sensor) => owner(sensor, () => roomForDevice(plan.rooms, sensor))?.id === room.id);
  contents.furniture = (plan.furniture ?? []).filter((item) => owner(item, () => plan.rooms.find((candidate) => contains(candidate, item)))?.id === room.id);
  return contents;
}
function withoutHiddenRooms(project) {
  const floors = project.floors?.map((floor) => {
    const hidden = new Set(floor.plan.rooms.filter((room) => room.haFrame?.visible === false).flatMap((room) => Object.values(haRoomContents(floor.plan, room)).flat().map((item) => item.id)));
    if (!hidden.size) return floor;
    return { ...floor, plan: Object.fromEntries(Object.entries(floor.plan).map(([key, value]) => [key, Array.isArray(value) ? value.filter((item) => !hidden.has(item.id)) : value])) };
  });
  if (!floors) return project;
  const visible = { ...project, floors };
  if (visible.staircase && !validProject(visible)) delete visible.staircase;
  return visible;
}

// src/ha/card-scene.js
function prepareCardPlan(saved, rooms, profiles, haDevices) {
  const devices2 = plannerDevices(profiles, haDevices);
  const project = withoutHiddenRooms(validProject(saved) ? saved : projectFromRooms(rooms, profiles, devices2));
  const floors = project.floors ?? [{ id: "ground", level: 0, plan: project }];
  return {
    staircase: project.staircase,
    floors: floors.map((floor) => ({ ...floor, plan: {
      ...floor.plan,
      sensors: floor.plan.sensors.filter((sensor) => findPlannerDevice(devices2, sensor.haDevice))
    } }))
  };
}
var styles = new CSSStyleSheet();
styles.replaceSync(floor_planner_default + editor_ha_default.replace(/:root(\[[^\]]+\])/g, ":host($1)").replaceAll(":root", ":host") + `
    :host, #floor-planner { display:block; width:100%; height:100%; min-width:0; }
    #floor-planner { background:var(--ha-map); color:var(--ha-ink); overflow:auto; }
    .floor-views { height:100%; display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%, 225px),1fr));
        grid-auto-rows:minmax(148px,1fr); }
    figure { min-width:0; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr); margin:0; }
    .floor-views figure:only-child { grid-template-rows:minmax(0,1fr); }
    .floor-views figure:only-child figcaption { display:none; }
    .floor-views figure { border:1px solid color-mix(in srgb,var(--ha-border) 48%,transparent); }
    figcaption { padding:5px 10px; background:var(--ha-panel); color:var(--ha-muted); font-size:12px; font-weight:650; }
    svg { display:block; width:100%; height:100%; min-height:0; }
    .map-3d { cursor:grab; touch-action:pan-y; }
    .map-3d[data-dragging] { cursor:grabbing; }
    [data-hide-names] :is(.fp-room-label,.fp-space-room-label) { display:none; }
    .live-room { fill:light-dark(#eb950d35,#ffb95232); stroke:light-dark(#9c5808,#ffcc83); stroke-width:1.6px;
        stroke-dasharray:5 3; vector-effect:non-scaling-stroke; }
    .live-trail { fill:none; stroke-width:2px; stroke-linecap:round; stroke-linejoin:round; opacity:.58;
        vector-effect:non-scaling-stroke; pointer-events:none; }
    .live-target, .live-room { pointer-events:none; }
    .empty-map { display:grid; place-items:center; height:100%; margin:0; padding:14px; text-align:center; color:var(--ha-muted); }
`);
var roomKey = (room) => room.haRoom ?? room.id;
var zoomedViewBox = ([x, y, width, height], zoom) => {
  const zoomedWidth = width / zoom, zoomedHeight = height / zoom;
  return [x + (width - zoomedWidth) / 2, y + (height - zoomedHeight) / 2, zoomedWidth, zoomedHeight].join(" ");
};
var planViewBox = ({ rooms }) => {
  const left = Math.min(...rooms.map((room) => room.x)), top = Math.min(...rooms.map((room) => room.y));
  const right = Math.max(...rooms.map((room) => room.x + room.width)), bottom = Math.max(...rooms.map((room) => room.y + room.depth));
  return [left - 0.65, top - 0.65, right - left + 1.3, bottom - top + 1.3];
};
var glideTime = 950;
var longestGlide = 4;
var easing = (t) => t * t * (3 - 2 * t);
function glidePosition(motion, now) {
  const t = Math.max(0, Math.min(1, (now - motion.start) / glideTime));
  const distance = Math.hypot(motion.to.x - motion.from.x, motion.to.y - motion.from.y);
  const progress = easing(t);
  return {
    x: motion.from.x + (motion.to.x - motion.from.x) * progress,
    y: motion.from.y + (motion.to.y - motion.from.y) * progress,
    stride: motion.stride + distance * progress,
    moving: t < 1 && distance >= 0.05
  };
}
function floorWithRooms(floor, keys) {
  const { plan } = floor;
  const rooms = plan.rooms.filter((room) => keys.has(roomKey(room)));
  if (!rooms.length) return [];
  if (rooms.length === plan.rooms.length) return [floor];
  const parts = rooms.map((room) => roomContents(plan, room));
  const contents = Object.fromEntries(Object.keys(parts[0]).map((key) => [key, parts.flatMap((part) => part[key])]));
  return [{ ...floor, plan: { ...plan, ...contents } }];
}
var FloorCardScene = class extends HTMLElement {
  #scene;
  #approximateRooms;
  #camera = { ...defaultSpaceCamera };
  #zoom = 1;
  #drag;
  #frame;
  #tracks = /* @__PURE__ */ new Map();
  #motion = /* @__PURE__ */ new Map();
  #liveFrame = 0;
  #daylight;
  #floors = [];
  #sceneKey = "";
  #people = [];
  #trails = [];
  #root;
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).adoptedStyleSheets = [styles];
    this.shadowRoot.innerHTML = '<div id="floor-planner" class="fp fp-design-center"></div>';
    this.#root = this.shadowRoot.firstElementChild;
    this.#root.addEventListener("pointerdown", (event) => {
      if (this.#scene?.view !== "3d" || event.button !== 0 || !event.target.closest("svg")) return;
      this.#drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: this.#camera };
      this.#root.setPointerCapture(event.pointerId);
      this.#root.querySelector(".map-3d")?.setAttribute("data-dragging", "");
    });
    this.#root.addEventListener("pointermove", (event) => {
      if (this.#drag?.id !== event.pointerId) return;
      this.#drag.moved = true;
      this.#camera = orbitSpaceCamera(this.#drag.camera, event.clientX - this.#drag.x, event.clientY - this.#drag.y);
      this.#frame ||= requestAnimationFrame(() => {
        this.#frame = null;
        this.#render();
      });
    });
    this.#root.addEventListener("lostpointercapture", () => {
      const moved = this.#drag?.moved;
      this.#drag = null;
      this.#root.querySelector(".map-3d")?.removeAttribute("data-dragging");
      if (moved) {
        cancelAnimationFrame(this.#frame);
        this.#frame = null;
        this.#render();
      }
    });
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.#frame);
    cancelAnimationFrame(this.#liveFrame);
    this.#frame = null;
    this.#liveFrame = 0;
    this.#drag = null;
  }
  set scene(scene) {
    const scopeChanged = this.#scene?.scope !== scene.scope || this.#scene?.view !== scene.view;
    const key = JSON.stringify([scene.rooms, scene.focus, scene.spacing, scene.view, scene.locale, scene.labels, scene.floorNames]);
    const changed = this.#scene?.plan !== scene.plan || this.#sceneKey !== key;
    this.#scene = scene;
    this.dataset.haTheme = scene.dark ? "dark" : "light";
    this.#root.toggleAttribute("data-hide-names", !scene.roomNames);
    if (scopeChanged) this.#zoom = 1;
    if (!changed && !scopeChanged) return;
    this.#sceneKey = key;
    const keys = new Set(scene.rooms);
    this.#floors = scene.plan.floors.flatMap((floor) => floorWithRooms(floor, keys)).map((floor) => ({ ...floor, label: scene.floorNames[floor.level] }));
    this.#render();
  }
  // Live positions come in as millimetres in each room's own frame. Only
  // exact positions get a figure; a room that is occupied without one is
  // outlined instead.
  set presence({ people, rooms, houses, trails = [] }) {
    const now = performance.now();
    const tracks = /* @__PURE__ */ new Map();
    const motion = /* @__PURE__ */ new Map();
    for (const person of people) {
      const house = houses[person.roomId];
      if (person.approximate || !house) continue;
      const previous = this.#tracks.get(person.id);
      const x = person.x / 1e3, y = person.y / 1e3;
      const dx = x - (previous?.x ?? x), dy = y - (previous?.y ?? y);
      const moved = previous?.floor === person.floor && Math.hypot(dx, dy) >= 0.05;
      tracks.set(person.id, {
        ...person,
        x,
        y,
        house,
        pose: "standing",
        plumbob: "clear",
        heading: moved ? Math.atan2(dx, -dy) * 180 / Math.PI : previous?.heading ?? 0
      });
      const current = this.#motion.get(person.id);
      if (current && current.to.x === x && current.to.y === y && current.floor === person.floor) {
        motion.set(person.id, current);
        continue;
      }
      const shown = current ? glidePosition(current, now) : null;
      const glide = shown && current.floor === person.floor && Math.hypot(x - shown.x, y - shown.y) <= longestGlide;
      motion.set(person.id, {
        floor: person.floor,
        start: now,
        stride: shown?.stride ?? 0,
        from: glide ? { x: shown.x, y: shown.y } : { x, y },
        to: { x, y }
      });
    }
    this.#tracks = tracks;
    this.#motion = motion;
    this.#trails = trails.flatMap((trail) => {
      const house = houses[trail.roomId];
      if (!house || !Array.isArray(trail.points)) return [];
      const points = trail.points.flatMap((point2, index) => Number.isFinite(point2?.x) && Number.isFinite(point2?.y) ? [{
        ...point2,
        id: `${trail.id}-point-${index}`,
        roomId: trail.roomId,
        floor: trail.floor,
        x: point2.x / 1e3,
        y: point2.y / 1e3,
        approximate: false,
        house,
        heading: 0
      }] : []);
      return points.length > 1 ? [{ ...trail, points }] : [];
    });
    this.#approximateRooms = new Set(rooms.filter((room) => room.occupied && room.approximate).map((room) => room.roomId));
    if (this.#scene?.view === "3d" && this.#daylight && this.#daylight !== daylightAt()) this.#render();
    this.#animateLive();
  }
  #animateLive() {
    cancelAnimationFrame(this.#liveFrame);
    this.#liveFrame = 0;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step2 = () => {
      const now = performance.now();
      let gliding = false;
      this.#people = [...this.#tracks.values()].map((person) => {
        const motion = this.#motion.get(person.id);
        const shown = still ? { ...motion.to, stride: motion.stride, moving: false } : glidePosition(motion, now);
        gliding ||= shown.moving;
        return { ...person, ...shown };
      });
      this.#paintLive();
      this.#liveFrame = gliding ? requestAnimationFrame(step2) : 0;
    };
    step2();
  }
  control(action) {
    if (action === "rotate") this.#camera = orbitSpaceCamera(this.#camera, Math.PI / 0.024, 0);
    if (action === "fit") {
      this.#camera = { ...defaultSpaceCamera };
      this.#zoom = 1;
    }
    if (action === "zoom-in" || action === "zoom-out") {
      this.#zoom = action === "zoom-in" ? Math.min(3.2, this.#zoom * 1.28) : Math.max(1, this.#zoom / 1.28);
      this.#applyZoom();
      return;
    }
    this.#render();
  }
  #applyZoom() {
    for (const svg of this.#root.querySelectorAll("svg[data-view]")) {
      svg.setAttribute("viewBox", zoomedViewBox(svg.dataset.view.split(" ").map(Number), this.#zoom));
    }
  }
  #render() {
    const { view, labels, locale, focus, spacing, scope, plan } = this.#scene;
    const floors = this.#floors;
    if (!floors.length) {
      this.#root.innerHTML = `<p class="empty-map">${escapeText(labels.empty)}</p>`;
      return;
    }
    const liveLayer = (floor) => `<g data-live-floor="${escapeText(floor.id)}"></g>`;
    const selected = floors.flatMap((floor) => floor.plan.rooms).find((room) => roomKey(room) === focus)?.id;
    const staircase = scope.startsWith("room:") ? null : plan.staircase;
    if (view === "2d") {
      const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
      this.#root.innerHTML = `<div class="floor-views">${[...floors].sort((a, b) => b.level - a.level).map((floor, index) => {
        const view2 = planViewBox(floor.plan);
        const lower = staircase?.lower === floor.id;
        const stair = staircase && (lower || staircase.upper === floor.id) ? paintStairPlan(staircase, labels.stairs, lower) : "";
        const drawing = paintPlan(floor.plan, false, selected, number).replaceAll("fp-slope-clearance", `fp-slope-clearance-${index}`);
        return `<figure data-floor="${floor.level}"><figcaption>${escapeText(floor.label)}</figcaption>
                    <svg viewBox="${zoomedViewBox(view2, this.#zoom)}" data-view="${view2.join(" ")}" role="img" aria-label="${escapeText(floor.label)} · 2D">
                        <defs><pattern id="card-grid-${index}" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 1V0H1" fill="none" stroke="var(--ha-grid-major)" stroke-width=".7" vector-effect="non-scaling-stroke"/></pattern></defs>
                        <rect x="-500" y="-500" width="1000" height="1000" fill="url(#card-grid-${index})" opacity=".42"/>${drawing}${stair}${liveLayer(floor)}
                    </svg></figure>`;
      }).join("")}</div>`;
    } else {
      const [first] = floors;
      const stacked = floors.length > 1;
      const ownStair = staircase?.lower === first.id || staircase?.upper === first.id;
      const draft = Boolean(this.#drag?.moved);
      const daylight = this.#daylight = daylightAt();
      const space = stacked ? paintBuilding(floors, this.#camera, spacing, staircase, null, { selected, paintForeground: liveLayer, draft, daylight }) : paintSpace(first.plan, this.#camera, selected, { staircase: ownStair ? staircase : null, upperStair: staircase?.upper === first.id, draft, daylight });
      if (!space) return;
      this.#root.innerHTML = `<svg class="map-3d" ${this.#drag ? "data-dragging" : ""} viewBox="${zoomedViewBox(space.viewBox.split(" ").map(Number), this.#zoom)}"
                data-view="${space.viewBox}" role="img" aria-label="${escapeText(labels.map)} · 3D">${space.markup}${stacked ? "" : liveLayer(first)}</svg>`;
    }
    this.#paintLive();
  }
  // Redraws only the live layers, and only the ones whose markup changed.
  #paintLive() {
    const camera = this.#scene?.view === "3d" ? this.#camera : null;
    const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const faded = [];
    const svg = this.#root.querySelector(".map-3d");
    for (const layer of this.#root.querySelectorAll("[data-live-floor]")) {
      const rooms = this.#floors.find((floor) => floor.id === layer.dataset.liveFloor).plan.rooms;
      const occupied = rooms.filter((room) => this.#approximateRooms?.has(roomKey(room))).map((room) => camera ? `<polygon class="live-room" points="${roomCorners(room).map((corner) => projectSpace(corner, 0.022, camera).join(",")).join(" ")}"/>` : paintRoomSurface(room, 'class="live-room"'));
      const trails = this.#trails.flatMap((trail) => {
        const points = liveFloorFigures(trail.points, rooms);
        if (points.length < 2) return [];
        const projected = points.map((point2) => camera ? projectSpace([point2.x, point2.y], 0.025, camera).join(",") : `${point2.x},${point2.y}`).join(" ");
        const color2 = /^#[\da-f]{6}$/i.test(trail.color || "") ? trail.color : "#4361ee";
        return [`<polyline class="live-trail" stroke="${color2}" points="${projected}"/>`];
      });
      const people = liveFloorFigures(this.#people, rooms);
      const figures2 = people.map((person) => `<g class="live-target">${paintPerson(person, camera, motion)}</g>`);
      const markup = occupied.join("") + trails.join("") + figures2.join("");
      if (layer.liveMarkup !== markup) {
        layer.liveMarkup = markup;
        layer.innerHTML = markup;
      }
      if (camera) {
        const offset = screenOffset(layer, svg);
        faded.push(...people.map(({ x, y }) => {
          const [screenX, foot] = projectSpace([x, y], 0, camera);
          return { x: screenX, foot: foot + offset, head: projectSpace([x, y], 1.8, camera)[1] + offset };
        }));
      }
    }
    if (camera) fadeLabelsNear(svg, faded);
  }
};
if (!customElements.get("shs-floor-card-scene")) customElements.define("shs-floor-card-scene", FloorCardScene);
export {
  prepareCardPlan
};
