import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleBuilding } from '../src/js/floor-planner-building.mjs';
import { samplePlan } from '../src/js/floor-planner-model.mjs';
import { pdfDocument, planBounds, sheetFileName, sheetFloors, sheetPages } from '../src/js/floor-planner-sheet.mjs';

// A name for every room of the example home: each is asked for by its own key.
const names = new Proxy({ sample: 'Demo home' }, { get: (given, key) => given[key] ?? `Room ${String(key)}` });
const copy = { rooms: 'Rooms', sheet_area: 'Floor area', sheet_sensors: 'Sensors', sheet_credit: 'Made with the planner', floor_ground: 'Ground floor',
    floor_upper: 'Floor :level', floor_lower: 'Basement :level' };
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

test('a plan on one floor becomes one page with its rooms, its sensors and what the floor holds', () => {
    const plan = samplePlan(names);
    const [page, ...more] = sheetPages(plan, { copy, number, date: '22 November 2026' });

    assert.equal(more.length, 0);
    assert.deepEqual([page.width, page.height], [1754, 1240], 'a plan wider than tall lies on its side');
    assert.match(page.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    for (const room of plan.rooms) assert.ok(page.svg.includes(`>${room.name}<`), `the room ${room.name}`);
    assert.equal(page.svg.match(/class="fp-sensor /g).length, plan.sensors.length, 'every sensor on the plan');
    assert.equal(page.svg.match(/class="fp-range /g).length, plan.sensors.length, 'and what it covers');
    assert.ok(page.svg.includes(`Rooms ${plan.rooms.length}`) && page.svg.includes(`Sensors ${plan.sensors.length}`));
    assert.ok(page.svg.includes('22 November 2026') && page.svg.includes('Made with the planner'));
    // The page brings its own colours: nothing in it leans on the planner's styles.
    assert.ok(!page.svg.includes('var(--'));
    assert.ok(page.svg.includes('.fp-room-floor{'));
});

test('a home with floors gets a page for each floor that has rooms, lowest first, named after the floor', () => {
    const home = sampleBuilding(names, {});
    const empty = { ...home, floors: [...home.floors, { id: 'attic', level: 2, name: 'Attic', plan: { ...home.floors[0].plan, rooms: [], sensors: [], doors: [], walls: [] } }] };
    const pages = sheetPages(empty, { copy, number });

    assert.deepEqual(pages.map(page => page.name), ['Ground floor', 'Floor 1']);
    // The stairs are on both floors they join.
    for (const page of pages) assert.ok(page.svg.includes('class="fp-stair-plan"'), page.name);
    assert.ok(pages[1].svg.includes('Floor 1  ·  Rooms'), 'the floor is named on its page');
    assert.deepEqual(sheetFloors(empty).map(floor => floor.level), [0, 1]);
    assert.deepEqual(sheetPages({ version: 3, name: 'Empty', rooms: [], walls: [], doors: [], sensors: [] }, { copy, number }), []);
    // A floor without sensors has no list of them.
    assert.ok(pages[0].svg.includes('SENSORS') && pages[0].svg.includes('CeilSense'));
    const bare = sheetPages({ ...home.floors[0].plan, sensors: [] }, { copy, number })[0].svg;
    assert.ok(!bare.includes('SENSORS') && !bare.includes('WallSense'));
});

test('a plan taller than wide stands upright, and names cannot break the page', () => {
    const plan = { version: 3, name: 'Tall <house> & "more"', walls: [], doors: [],
        rooms: [{ id: 'a', name: 'A <b>room</b>', x: 0, y: 0, width: 4, depth: 5, height: 2.6 }, { id: 'b', name: 'Below', x: 0, y: 5, width: 4, depth: 5, height: 2.6 }],
        sensors: [{ id: 's', model: 'ceilsense-v2', radar: 'ld2412', x: 2, y: 2, angle: 0 }] };
    const [page] = sheetPages(plan, { copy, number });

    assert.deepEqual([page.width, page.height], [1240, 1754]);
    assert.ok(page.svg.includes('Tall &lt;house&gt; &amp; &quot;more&quot;'));
    assert.ok(!page.svg.includes('<b>room'));
    const bounds = planBounds(plan);
    assert.ok(bounds.x < 0 && bounds.y < 0 && bounds.width > 4 && bounds.height > 10, 'the drawing leaves room around the plan');
});

test('a page is a file of its own: every attribute in it has a value', () => {
    // The stairs and a ceiling sensor above its measured height carry attributes that stand alone in the planner.
    const home = sampleBuilding(names, {});
    home.floors[0].plan.rooms[0].height = 3.6;
    const pages = sheetPages(home, { copy, number, radarOptions: { allowHeightEstimate: true } });
    const drawn = pages.map(page => page.svg).join('');

    assert.ok(drawn.includes('data-staircase=""') && drawn.includes('data-height-estimate=""'));
    for (const { svg } of pages) {
        for (const [tag] of svg.matchAll(/<[a-zA-Z][^>]*>/g)) {
            const bare = tag.replace(/"[^"]*"/g, '""').match(/\s[a-zA-Z:-]+(?=[\s/>])/);
            assert.equal(bare, null, `an attribute without a value in ${tag.slice(0, 80)}`);
        }
        // And nothing in it is left open.
        const opened = [...svg.matchAll(/<([a-zA-Z]+)(?:\s[^>]*[^/])?>/g)].length;
        const closed = [...svg.matchAll(/<\/[a-zA-Z]+>/g)].length;
        assert.equal(opened, closed);
    }
});

test('a long list of sensors ends with how many more there are', () => {
    const sensors = Array.from({ length: 40 }, (_, index) => ({ id: 's' + index, model: 'ceilsense-v2', radar: 'ld2412', x: 1 + index % 5, y: 1 + index % 3, angle: 0 }));
    const plan = { version: 3, name: 'Many', walls: [], doors: [], sensors,
        rooms: [{ id: 'a', name: 'Hall', x: 0, y: 0, width: 8, depth: 5, height: 2.6 }] };
    const [page] = sheetPages(plan, { copy, number });
    const listed = page.svg.match(/font-size="17" font-weight="700"/g).length;

    assert.ok(listed < 40);
    assert.ok(page.svg.includes(`>+ ${40 - listed}<`));
});

test('a file is named after the project', () => {
    assert.equal(sheetFileName({ name: 'Ons huis (2026)' }, 'pdf'), 'Ons-huis-2026.pdf');
    assert.equal(sheetFileName({ name: '...' }, 'png'), 'sensor-plan.png');
});

test('pages go into a PDF that says where each of its parts is', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9, 10, 13, 0, 255]);
    const file = pdfDocument([{ jpeg, width: 1754, height: 1240 }, { jpeg, width: 1240, height: 1754 }], { title: 'Ons huis', creator: 'Planner' });
    const read = Buffer.from(file).toString('latin1');

    assert.ok(read.startsWith('%PDF-1.4\n'));
    assert.ok(read.endsWith('%%EOF\n'));
    assert.equal(read.match(/\/Type \/Page /g).length, 2);
    assert.ok(read.includes('/Count 2'));
    assert.ok(read.includes('/MediaBox [0 0 841.89 595.28]') && read.includes('/MediaBox [0 0 595.28 841.89]'), 'each page lies as its image does');
    // The table at the end points at the start of every object.
    const start = Number(/startxref\n(\d+)\n%%EOF/.exec(read)[1]);
    assert.ok(read.slice(start).startsWith('xref\n'));
    const offsets = [...read.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)].map(match => Number(match[1]));
    assert.equal(offsets.length, Number(/\/Size (\d+)/.exec(read)[1]) - 1);
    offsets.forEach((offset, index) => assert.ok(read.slice(offset).startsWith(`${index + 1} 0 obj\n`), `object ${index + 1}`));
    // The image is in it byte for byte, with its length.
    assert.ok(read.includes(`/Length ${jpeg.length} >>\nstream\n${Buffer.from(jpeg).toString('latin1')}\nendstream`));
    // The title is UTF-16, so any name can be in it.
    assert.ok(read.includes('/Title <FEFF004F006E007300200068007500690073>'));
});
