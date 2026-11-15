const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const tapStep = .24;
const speed = 1.8;
const holdDelay = 135;

export function createWalkControls(dock, activeWalker, move, onIdle, render) {
    const held = new Map();
    const idleTimers = new Map();
    let frame = 0;
    let previousTime = 0;

    function updateButtons() {
        const keys = new Set([...held.values()].filter(control => control.walker === activeWalker()).map(control => control.key));
        dock.querySelectorAll('[data-person-move]').forEach(button => {
            button.toggleAttribute('data-held', keys.has(button.dataset.personMove));
        });
    }

    function advance(walker, keys, distance) {
        let x = 0, y = 0;
        for (const key of new Set(keys)) {
            const [dx, dy] = directions[key];
            x += dx;
            y += dy;
        }
        const length = Math.hypot(x, y);
        return length ? move(walker, x / length, y / length, distance) : onIdle(walker);
    }

    function tick(now) {
        const elapsed = Math.min(.05, Math.max(0, (now - previousTime) / 1000));
        previousTime = now;
        const ready = new Map();
        for (const { walker, key, started } of held.values()) {
            if (now - started < holdDelay) continue;
            if (!ready.has(walker)) ready.set(walker, []);
            ready.get(walker).push(key);
        }
        let changed = false;
        for (const [walker, keys] of ready) {
            if (advance(walker, keys, speed * elapsed)) changed = true;
        }
        if (changed) render();
        frame = held.size ? requestAnimationFrame(tick) : 0;
    }

    function press(source, key, walker) {
        if (held.has(source)) return;
        clearTimeout(idleTimers.get(walker));
        idleTimers.delete(walker);
        held.set(source, { key, walker, started: performance.now() });
        updateButtons();
        const keys = [...held.values()].filter(control => control.walker === walker).map(control => control.key);
        if (advance(walker, keys, tapStep)) render();
        if (!frame) {
            previousTime = performance.now();
            frame = requestAnimationFrame(tick);
        }
    }

    function queueIdle(walker) {
        if ([...held.values()].some(control => control.walker === walker)) return;
        clearTimeout(idleTimers.get(walker));
        idleTimers.set(walker, setTimeout(() => {
            idleTimers.delete(walker);
            if (onIdle(walker)) render();
        }, 160));
    }

    function release(source) {
        const control = held.get(source);
        if (!control) return;
        held.delete(source);
        updateButtons();
        queueIdle(control.walker);
        if (!held.size) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    }

    function stop() {
        const walkers = new Set([...held.values()].map(control => control.walker).concat([...idleTimers.keys()]));
        for (const timer of idleTimers.values()) clearTimeout(timer);
        idleTimers.clear();
        held.clear();
        updateButtons();
        cancelAnimationFrame(frame);
        frame = 0;
        let changed = false;
        for (const walker of walkers) if (onIdle(walker)) changed = true;
        if (changed) render();
    }

    dock.addEventListener('pointerdown', event => {
        const button = event.target.closest('[data-person-move]');
        if (!button || event.button !== 0) return;
        button.setPointerCapture(event.pointerId);
        press(event.pointerId, button.dataset.personMove, activeWalker());
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        dock.addEventListener(name, event => release(event.pointerId));
    }
    dock.addEventListener('contextmenu', event => {
        if (event.target.closest('[data-person-move]')) event.preventDefault();
    });
    window.addEventListener('keyup', event => release(event.code || event.key));
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
    });

    return { press, stop, tap(key) {
        const walker = activeWalker();
        if (advance(walker, [key], tapStep)) render();
        queueIdle(walker);
    } };
}
