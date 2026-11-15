export function liveFloorFigures(people, rooms) {
    const byId = new Map(rooms.map(room => [room.haRoom ?? room.id, room]));
    return people.flatMap(person => {
        const room = byId.get(person.roomId);
        const frame = room?.haFrame;
        if (!room || frame?.visible === false) return [];
        const origin = person.house;
        const turn = (frame?.angle ?? origin.rotationDeg) - origin.rotationDeg;
        const radians = turn * Math.PI / 180;
        const dx = person.x - origin.x / 1000, dy = person.y - origin.y / 1000;
        return [{ ...person,
            x: (frame?.x ?? origin.x / 1000) + dx * Math.cos(radians) - dy * Math.sin(radians),
            y: (frame?.y ?? origin.y / 1000) + dx * Math.sin(radians) + dy * Math.cos(radians),
            heading: person.heading + turn,
        }];
    });
}

// Room names fade while someone stands in front of them, so a label never
// hides the person it is about. Figures are screen points ({ x, foot, head })
// in the coordinates of the svg itself; screenOffset converts a point drawn
// inside a floor group, which stacked buildings shift with translate(0 y).
const shiftOf = node => Number(node.getAttribute?.('transform')?.match(/^translate\(0 (-?[\d.e+-]+)\)$/)?.[1] ?? 0);

export function screenOffset(node, svg) {
    let offset = 0;
    for (let current = node; current && current !== svg; current = current.parentNode) offset += shiftOf(current);
    return offset;
}

export function fadeLabelsNear(svg, figures) {
    if (!svg) return;
    for (const label of svg.querySelectorAll('.fp-space-room-label')) {
        const x = Number(label.getAttribute('x')), y = Number(label.getAttribute('y')) + screenOffset(label.parentNode, svg);
        const near = figures.some(figure => Math.abs(figure.x - x) < .95 && y > figure.head - .35 && y < figure.foot + .3);
        if (near !== label.hasAttribute('data-near-person')) label.toggleAttribute('data-near-person', near);
    }
}
