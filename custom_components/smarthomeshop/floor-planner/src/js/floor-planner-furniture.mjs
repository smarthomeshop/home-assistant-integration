// Width, depth, height, material and shape. The same parts drive the map and the ray test.
const entries = {
    living: {
        sofa: [2.25, .9, .85, 'textile', 'sofa'],
        corner: [2.8, 1.65, .85, 'textile', 'corner'],
        armchair: [.85, .85, .85, 'textile', 'sofa'],
        coffee: [1.15, .6, .43, 'wood', 'table'],
        rug: [2.5, 1.7, .02, 'ignore', 'solid'],
        tv: [1.2, .12, .68, 'mixed', 'solid', .8],
        plant: [.55, .55, 1.25, 'mixed', 'solid'],
    },
    work: {
        dining: [1.8, .85, .76, 'wood', 'table'],
        chair: [.48, .52, .86, 'wood', 'chair'],
        desk: [1.45, .7, .76, 'wood', 'table'],
        island: [1.8, .9, .92, 'wood', 'solid'],
        fridge: [.62, .67, 1.85, 'metal', 'solid'],
        washer: [.6, .65, .85, 'metal', 'solid'],
    },
    sleep: {
        bed: [1.65, 2.1, .62, 'textile', 'bed'],
        nightstand: [.43, .42, .52, 'wood', 'solid'],
        cabinet: [1.25, .42, 1.05, 'wood', 'solid'],
        wardrobe: [1.8, .62, 2.25, 'wood', 'solid'],
        shelves: [1.1, .35, 1.85, 'wood', 'shelves'],
        bath: [1.7, .76, .56, 'stone', 'bath'],
    },
    // Things a radar notices: a turning fan or a pet can look like a person,
    // and warm air from a heater moves the air the radar sees.
    motion: {
        fan: [.42, .32, 1.15, 'plastic', 'solid'],
        pet: [.8, .38, .42, 'textile', 'solid'],
        radiator: [1, .1, .6, 'metal', 'solid', .12],
        heater: [.42, .26, .62, 'metal', 'solid'],
    },
    divide: {
        screen: [1.5, .08, 1.8, 'wood', 'solid'],
        glass: [1.25, .024, 2, 'glass', 'solid'],
        curtain: [1.8, .06, 2.25, 'textile', 'solid', .04],
        custom: [1, .5, 1, 'mixed', 'solid'],
    },
};

export const furnitureCatalog = Object.fromEntries(Object.entries(entries).flatMap(([category, models]) =>
    Object.entries(models).map(([kind, [width, depth, height, material, shape, base = 0]]) =>
        [kind, { category, width, depth, height, material, shape, base }])));
export const furnitureCategories = Object.keys(entries);
export const furnitureMaterials = ['wood', 'textile', 'metal', 'glass', 'stone', 'plastic', 'mixed', 'ignore'];
export const maxFurniture = 160;

export function furnitureAt(kind, name, { x, y }, angle = 0) {
    const { width, depth, height, base, material } = furnitureCatalog[kind];
    return { kind, name, x, y, angle, width, depth, height, base, material };
}

const shapeParts = {
    solid: [[0, 0, 1, 1, 0, 1, 'body']],
    sofa: [
        [0, 0, 1, 1, 0, .42, 'body'], [.09, .19, .82, .74, .42, .15, 'seat'],
        [0, 0, 1, .18, .42, .58, 'body'], [0, .18, .09, .82, .42, .32, 'body'], [.91, .18, .09, .82, .42, .32, 'body'],
    ],
    corner: [
        [0, 0, 1, .56, 0, .42, 'body'], [0, .56, .32, .44, 0, .42, 'body'],
        [.05, .12, .90, .40, .42, .15, 'seat'], [.05, .52, .24, .43, .42, .15, 'seat'],
        [0, 0, 1, .12, .42, .58, 'body'],
    ],
    table: [
        [0, 0, 1, 1, .89, .11, 'top'],
        ...[.08, .85].flatMap(x => [.08, .85].map(y => [x, y, .07, .07, 0, .89, 'frame'])),
    ],
    chair: [
        [.04, .05, .92, .90, .47, .09, 'seat'], [.06, 0, .88, .11, .56, .44, 'body'],
        ...[.10, .82].flatMap(x => [.10, .82].map(y => [x, y, .08, .08, 0, .47, 'frame'])),
    ],
    bed: [
        [0, 0, 1, 1, 0, .57, 'body'], [.02, .02, .96, .96, .57, .20, 'seat'],
        [.04, .29, .92, .68, .77, .07, 'duvet'], [.08, .06, .36, .18, .77, .09, 'pillow'],
        [.56, .06, .36, .18, .77, .09, 'pillow'], [0, 0, 1, .06, .57, .43, 'body'],
    ],
    shelves: [
        [0, 0, .07, 1, 0, 1, 'frame'], [.93, 0, .07, 1, 0, 1, 'frame'],
        ...[0, .28, .56, .79, .96].map(z => [.07, 0, .86, 1, z, .04, 'top']),
    ],
    bath: [
        [0, 0, 1, 1, 0, .22, 'body'], [0, 0, .08, 1, .22, .78, 'body'], [.92, 0, .08, 1, .22, .78, 'body'],
        [.08, 0, .84, .09, .22, .78, 'body'], [.08, .91, .84, .09, .22, .78, 'body'],
    ],
};

export function furnitureParts(item) {
    return shapeParts[furnitureCatalog[item.kind].shape].map(([x, y, w, d, base, height, surface]) => ({
        x: (x - .5) * item.width, y: (y - .5) * item.depth, w: w * item.width, d: d * item.depth,
        low: item.base + base * item.height, high: item.base + (base + height) * item.height, surface,
    }));
}

export function furnitureProjection(item) {
    const radians = item.angle * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    return ([x, y]) => [item.x + x * cos - y * sin, item.y + x * sin + y * cos];
}

export function furnitureFootprint(item) {
    const x = item.width / 2, y = item.depth / 2;
    return [[-x, -y], [x, -y], [x, y], [-x, y]].map(furnitureProjection(item));
}

const sample = {
    living: [
        ['sofa', .57, 2.12, 270, 2.64, .88],
        ['coffee', 2.05, 2.1, 90, 1.24, .68],
        ['rug', 2.26, 2.13, 0, 3.35, 2.7],
        ['cabinet', 4.85, .31, 0, 2.12, .44, .52],
        ['armchair', 3.85, 2.76, 110],
    ],
    kitchen: [
        ['island', 2, .43, 0, 3.8, .62],
        ['island', 3.59, 1.43, 90, 1.38, .62],
        ['dining', 2.03, 3.03],
        ['chair', 2.03, 2.3, 0],
        ['chair', 2.03, 3.76, 180],
    ],
    office: [
        ['desk', 1.25, .49, 0, 1.8, .7],
        ['chair', 1.25, 1.15, 180],
        ['cabinet', 2.5, 3.15, 0, .95, .6, 1.35],
    ],
    hall: [['nightstand', .29, 2.25, 90, 1.04, .4, .36]],
    bedroom: [['bed', 1.75, 1.16, 0, 1.6, 2.14], ['nightstand', .63, .38], ['nightstand', 2.87, .38]],
    'main-bedroom': [['bed', 2.2, 1.3, 0, 1.85, 2.12], ['nightstand', .97, .53], ['nightstand', 3.42, .53], ['wardrobe', 4.63, 1.8, 90]],
    'child-bedroom': [['bed', 3.97, 1.24, 0, 1.05, 2], ['desk', 1.3, .42], ['chair', 1.3, 1.13, 180], ['shelves', .32, 2.22, 90]],
    bathroom: [['bath', 1.25, .52], ['cabinet', .32, 2.22, 90, 1.08, .43, .86], ['washer', 2.92, .48]],
    study: [['desk', 1.74, .49], ['chair', 1.74, 1.38, 180], ['shelves', 3.15, 1.64, 90], ['armchair', 2.08, 2.76, 172]],
};

export function withFurniture(plan, labels) {
    if (plan.furniture !== undefined) return plan;
    const ids = new Set([...plan.rooms, ...plan.walls, ...plan.doors, ...plan.sensors].map(item => item.id));
    let serial = 0;
    const furniture = plan.rooms.flatMap(room => {
        const items = Object.hasOwn(sample, room.id) ? sample[room.id] : [];
        return items.filter(([, x, y]) => x < room.width && y < room.depth && room.x + x <= 100 && room.y + y <= 100)
            .map(([kind, x, y, angle = 0, width, depth, height]) => {
                let id;
                do { id = 'furniture-example-' + ++serial; } while (ids.has(id));
                const item = furnitureAt(kind, labels[kind], { x: room.x + x, y: room.y + y }, angle);
                return { id, ...item, width: width ?? item.width, depth: depth ?? item.depth, height: height ?? item.height };
            });
    });
    return { ...plan, furniture };
}

const windows = {
    living: [[.13, 0, .42, 0], [.54, 0, .82, 0]],
    kitchen: [[.17, 0, .64, 0]],
    office: [[0, .39, 0, .74]],
    bedroom: [[.3, 1, .76, 1]],
    'main-bedroom': [[.13, 0, .36, 0], [.61, 0, .83, 0]],
    'child-bedroom': [[.21, 0, .65, 0]],
    bathroom: [[0, .20, 0, .43]],
    study: [[.32, 1, .75, 1]],
};

export const exampleWindows = room => Object.hasOwn(windows, room.id) ? windows[room.id] : [];
export function exampleFloor(room) {
    if (['living', 'bedroom', 'office', 'main-bedroom', 'child-bedroom', 'study'].includes(room.id)) return 'boards';
    if (['kitchen', 'hall', 'landing', 'bathroom'].includes(room.id)) return 'tiles';
    return '';
}
