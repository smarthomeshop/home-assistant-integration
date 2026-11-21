import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateRawSync } from 'node:zlib';
import { validBuilding } from '../src/js/floor-planner-building.mjs';
import { homeFromXml, importSweetHome, isSweetHome, parseXml, zipEntry } from '../src/js/floor-planner-sh3d.mjs';

const copy = { room: 'Room', import_room_name: 'Imported rooms', furniture_items: { sofa: 'Sofa', dining: 'Dining table', chair: 'Chair' } };

// A ZIP archive as Sweet Home 3D writes one: deflated entries, sizes in the
// central directory.
function zip(entries) {
    const parts = [], directory = [];
    let offset = 0;
    for (const { name, text, stored = false } of entries) {
        const data = Buffer.from(text), packed = stored ? data : deflateRawSync(data), title = Buffer.from(name);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(stored ? 0 : 8, 8);
        local.writeUInt32LE(packed.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(title.length, 26);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(stored ? 0 : 8, 10);
        central.writeUInt32LE(packed.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(title.length, 28);
        central.writeUInt32LE(offset, 42);
        parts.push(local, title, packed);
        directory.push(central, title);
        offset += 30 + title.length + packed.length;
    }
    const listing = Buffer.concat(directory), end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(listing.length, 12);
    end.writeUInt32LE(offset, 16);
    return new Blob([Buffer.concat([...parts, listing, end])]);
}

const box = (left, top, right, bottom) => `<point x='${left}' y='${top}'/><point x='${right}' y='${top}'/><point x='${right}' y='${bottom}'/><point x='${left}' y='${bottom}'/>`;
const walls = level => [[100, 100, 900, 100, 20], [900, 100, 900, 600, 20], [900, 600, 100, 600, 20], [100, 600, 100, 100, 20], [500, 100, 500, 600, 10]]
    .map(([xStart, yStart, xEnd, yEnd, thickness], i) => `<wall id='${level}-w${i}' level='${level}' xStart='${xStart}' yStart='${yStart}' xEnd='${xEnd}' yEnd='${yEnd}' thickness='${thickness}' height='250'/>`).join('\n  ');

// A two storey house: a living room and a kitchen with a door between them,
// a window, furniture (some in a group) and a lamp downstairs, and upstairs
// only walls.
const house = `<?xml version='1.0'?>
<!DOCTYPE home PUBLIC "-//eTeks//DTD Sweet Home 3D 7.0//EN" "http://www.sweethome3d.com/dtd/SweetHome3D.dtd">
<home version='7200' name='/Users/someone/Documents/Our house.sh3d' wallHeight='250'>
  <!-- Saved by Sweet Home 3D -->
  <level id='level0' name='Ground floor' elevation='0' floorThickness='12' height='260'/>
  <level id='level1' name='Upper floor' elevation='272' floorThickness='12' height='250' elevationIndex='0'/>
  <pieceOfFurniture level='level0' name='Sofa' catalogId='eTeks#sofa' x='250' y='300' width='200' depth='90' height='80' angle='1.5707964'/>
  <furnitureGroup level='level0' name='Dining set' x='700' y='350' width='160' depth='150' height='74'>
    <pieceOfFurniture name='Table' catalogId='eTeks#table' x='700' y='350' width='160' depth='90' height='74'/>
    <pieceOfFurniture name='Chair' catalogId='eTeks#chair' x='700' y='400' width='45' depth='50' height='90' angle='3.1415927'/>
  </furnitureGroup>
  <doorOrWindow level='level0' name='Door' catalogId='eTeks#door' x='500' y='300' width='91.5' depth='68.5' height='208.5' angle='1.5707964'>
    <sash xAxis='0' yAxis='0' width='91.5' startAngle='0' endAngle='-1.5707964'/>
  </doorOrWindow>
  <doorOrWindow level='level0' name='Window' catalogId='eTeks#window' x='300' y='100' width='120' depth='25' height='120' elevation='90'/>
  <light level='level0' name='Ceiling light' catalogId='eTeks#ceilingLight' x='250' y='300' width='30' depth='30' height='10' elevation='240' power='0.5'/>
  ${walls('level0')}
  <wall id='free' level='level0' xStart='200' yStart='450' xEnd='350' yEnd='450' thickness='10' height='120'/>
  <room level='level0' name='Living &amp; dining' areaVisible='true'>${box(110, 110, 495, 590)}</room>
  <room level='level0' name='Kitchen'>${box(505, 110, 890, 590)}</room>
  ${walls('level1')}
</home>`;

test('a Sweet Home 3D house becomes floors with rooms, a door, a window, furniture and the wall inside a room', async () => {
    const file = zip([{ name: 'Home', text: 'serialised home' }, { name: 'Home.xml', text: house }, { name: '0', text: 'texture' }]);
    const { project, review } = await importSweetHome(Object.assign(file, { name: 'Our house.sh3d' }), copy);

    assert.equal(validBuilding(project), true);
    assert.equal(project.name, 'Our house');
    assert.deepEqual(project.floors.map(floor => [floor.level, floor.name]), [[0, 'Ground floor'], [1, 'Upper floor']]);
    const [ground, upper] = project.floors.map(floor => floor.plan);

    // Centimetres become metres, with the home moved to the top left.
    const [living, kitchen] = ground.rooms;
    assert.equal(living.name, 'Living & dining');
    assert.deepEqual([living.x, living.y, living.width, living.depth, living.height], [.1, .1, 3.85, 4.8, 2.6]);
    assert.equal(kitchen.name, 'Kitchen');
    assert.equal(kitchen.x, 4.05);

    assert.equal(ground.doors.length, 1);
    const [door] = ground.doors;
    assert.equal(door.width, .915);
    assert.ok(Math.abs(door.x - 3.95) < .06 || Math.abs(door.x - 4.05) < .06, `door on the wall between the rooms: ${door.x}`);
    assert.ok([90, 270].includes(Math.round(door.angle)), `door along that wall: ${door.angle}`);

    assert.equal(ground.windows.length, 1);
    assert.deepEqual([ground.windows[0].width, ground.windows[0].base, ground.windows[0].height], [1.2, .9, 1.2]);

    // The lamp is left out; the group's table and chair come along.
    assert.deepEqual(ground.furniture.map(item => item.kind).sort(), ['chair', 'dining', 'sofa']);
    const sofa = ground.furniture.find(item => item.kind === 'sofa');
    assert.deepEqual([sofa.x, sofa.y, sofa.width, sofa.depth, Math.round(sofa.angle)], [1.5, 2, 2, .9, 90]);

    // Only the free-standing wall is a wall: the others lie between rooms.
    assert.deepEqual(ground.walls.map(wall => [wall.x, wall.y, wall.endX, wall.endY]), [[1, 3.5, 2.5, 3.5]]);

    // Upstairs has walls and no rooms: the rooms come from the walls.
    assert.equal(upper.rooms.length, 2);
    const spans = upper.rooms.map(room => [room.x, room.x + room.width]).sort((a, b) => a[0] - b[0]);
    assert.ok(Math.abs(spans[0][0] - .1) < .06 && Math.abs(spans[0][1] - 3.95) < .06, `left room upstairs ${spans[0]}`);
    assert.ok(Math.abs(spans[1][0] - 4.05) < .06 && Math.abs(spans[1][1] - 7.9) < .06, `right room upstairs ${spans[1]}`);
    assert.ok(upper.rooms.every(room => room.height === 2.5));
    assert.equal(review, false);
});

test('a house on one level opens as a plan, also from an archive that stores Home.xml unpacked', async () => {
    const single = `<home name='flat.sh3d' wallHeight='265'>${walls('x').replaceAll(" level='x'", '')}
        <room name='Studio'>${box(110, 110, 890, 590)}</room></home>`;
    const { project } = await importSweetHome(zip([{ name: 'Home.xml', text: single, stored: true }]), copy);

    assert.equal(project.format, undefined, 'one floor is a plain plan');
    assert.deepEqual(project.rooms.map(room => [room.name, room.height]), [['Studio', 2.65]]);
    assert.equal(project.name, 'flat');
});

test('a project from before Sweet Home 3D 5.3, or no project at all, is refused with a reason', async () => {
    await assert.rejects(importSweetHome(zip([{ name: 'Home', text: 'serialised home' }]), copy), { code: 'sh3d_old' });
    await assert.rejects(importSweetHome(new Blob(['{"not":"a zip"}']), copy), { code: 'zip' });
    assert.throws(() => homeFromXml('<home></home>', copy), { code: 'sh3d_empty' });
    assert.throws(() => homeFromXml('<plan/>', copy), { code: 'sh3d' });
});

test('a Sweet Home 3D file is known by its name or by the start of a ZIP archive', async () => {
    assert.equal(await isSweetHome(Object.assign(new Blob(['x']), { name: 'House.SH3D' })), true);
    assert.equal(await isSweetHome(Object.assign(zip([{ name: 'Home.xml', text: '<home/>' }]), { name: 'house' })), true);
    assert.equal(await isSweetHome(Object.assign(new Blob(['{"version":1}']), { name: 'plan.json' })), false);
    assert.equal(await zipEntry(zip([{ name: 'Other', text: 'x' }]), 'Home.xml'), null);
});

test('XML attributes keep their characters, also a > inside a value', () => {
    const document = parseXml(`<?xml version='1.0'?><home a="1 &gt; 0" b='Tom &amp; Jerry &#233;&#x00e9;'><room name="x > y"><point x='1' y='2'/></room></home>`);
    const [home] = document.children;
    assert.deepEqual(home.attributes, { a: '1 > 0', b: 'Tom & Jerry éé' });
    assert.equal(home.children[0].attributes.name, 'x > y');
    assert.deepEqual(home.children[0].children[0].attributes, { x: '1', y: '2' });
});

test('floors are numbered from the ground floor on, with a basement below it and no gap for a level without rooms', () => {
    const level = (id, elevation) => `<level id='${id}' name='${id}' elevation='${elevation}' floorThickness='12' height='250'/>`;
    const room = (id, name) => `<room level='${id}' name='${name}'>${box(100, 100, 500, 400)}</room>`;
    const home = `<home wallHeight='250'>${level('cellar', -250)}${level('terrain', 0)}${level('ground', 10)}${level('first', 270)}${level('attic', 540)}
        ${room('cellar', 'Gym')}${room('ground', 'Living')}${room('attic', 'Study')}</home>`;
    const { project } = homeFromXml(home, copy, 'Levels.sh3d');

    assert.deepEqual(project.floors.map(floor => [floor.level, floor.name, floor.plan.rooms[0].name]),
        [[-1, 'cellar', 'Gym'], [0, 'ground', 'Living'], [1, 'attic', 'Study']]);
    assert.equal(project.floors.find(floor => floor.id === project.activeFloor).level, 0);
});
