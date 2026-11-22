// A plan as a sheet to keep, print or pass on: one page per floor, with the
// rooms, the sensors and what they cover, a list of those sensors and the
// size of the floor. Every page is an SVG that stands by itself, with its own
// light colours, so it can be drawn to an image without the planner's styles.
//
// pdfDocument puts such pages, as JPEG images, in a PDF file.
import { floorLabel } from './floor-planner-building.mjs';
import { escapeText, paintPlan } from './floor-planner-drawing.mjs';
import { roomArea, roomCorners } from './floor-planner-geometry.mjs';
import { devices, roomForDevice } from './floor-planner-model.mjs';
import { paintStairPlan, stairTrip } from './floor-planner-stairs.mjs';

// A4 at 150 dots an inch.
const long = 1754, short = 1240;
const margin = 64, top = 168, bottom = 92, gap = 40, listWidth = 400, rowHeight = 46;
const ink = '#151e30', muted = '#5b6778', rule = '#dfe4ec', ceiling = '#4e43bb', wall = '#08765c';

// The plan is drawn in metres, so every size here is one.
const planStyles = `
.fp-room-floor{fill:#f2f4f7;stroke:#27303d;stroke-width:.07;stroke-linejoin:round}
.fp-room-label{fill:${ink};font-size:.238px;font-weight:700}
.fp-room-size{fill:${muted};font-size:.17px;font-weight:400}
.fp-window{fill:none;stroke:#6fb1d6;stroke-width:.07}
.fp-opening{color:#2e97d1}
.fp-opening.mirrors{color:#9a55d0}
.fp-opening line,.fp-opening path{fill:none;stroke:currentColor;stroke-width:.07}
.fp-opening .fp-opening-hit,.fp-wall .fp-wall-hit{stroke:none}
.fp-wall line{stroke:#27303d;stroke-width:.07}
.fp-door-gap{stroke:#f2f4f7;stroke-width:.1}
.fp-door-leaf{fill:none;stroke:#a06a1c;stroke-width:.045;stroke-linecap:round}
.fp-door-swing{fill:none;stroke:#c39a5a;stroke-width:.018}
.fp-door-shut{fill:none;stroke:#a06a1c;stroke-width:.06}
.fp-door rect,.fp-furniture-hit{fill:none}
.fp-furniture-part{fill:#e1e6ec;stroke:#aab4c1;stroke-width:.015}
.fp-plan-furniture[data-material="wood"] .fp-furniture-part{fill:#eadfce;stroke:#c2ae92}
.fp-range.ceiling,.fp-sensor.ceiling{color:${ceiling}}
.fp-range.wall,.fp-sensor.wall{color:${wall}}
.fp-range ellipse,.fp-range path{fill:currentColor;fill-opacity:.1;stroke:currentColor;stroke-width:.022;stroke-dasharray:.09 .09}
.fp-range .fp-secondary-range{fill:none;stroke-dasharray:.03 .07}
.fp-range .fp-motion-range{fill:none;stroke:#d9892b;stroke-width:.03;stroke-dasharray:.01 .09;stroke-linecap:round}
.fp-plan-zone{color:#1f9d6b}
.fp-plan-zone.exclusion{color:#d9534f}
.fp-plan-zone.interference{color:#c98a1b}
.fp-plan-zone.entry{color:#128a7a}
.fp-plan-zone polygon,.fp-plan-zone polyline{fill:currentColor;fill-opacity:.12;stroke:currentColor;stroke-width:.025}
.fp-plan-zone.entry polyline{fill:none;stroke-width:.05;stroke-dasharray:.1 .05}
.fp-entry-arrow{fill:none;stroke:currentColor;stroke-width:.03}
.fp-sensor{fill:#fff;stroke:currentColor;stroke-width:.03}
.fp-sensor-halo{fill:currentColor;fill-opacity:.16;stroke:none}
.fp-sensor-eye{fill:currentColor;stroke:none}
.fp-sensor text{font-size:.2px;font-weight:800;fill:currentColor;stroke:#fff;stroke-width:.05;paint-order:stroke}
.fp-wall-measure{fill:#3a465a;stroke:#fff;stroke-width:.045;paint-order:stroke;font-size:.16px;font-weight:600;text-anchor:middle;dominant-baseline:middle}
.fp-ceiling-marks{color:#8793a6}
.fp-ceiling-marks path{fill:none;stroke:currentColor;stroke-width:.015;stroke-dasharray:.08 .08}
.fp-ceiling-marks .fp-slope-arrow{stroke-dasharray:none}
.fp-ceiling-marks text{fill:currentColor;stroke:#f2f4f7;stroke-width:.04;paint-order:stroke;font-size:.164px}
.fp-stairwell{fill:#ece4d3;stroke:#a8946a;stroke-width:.028}
.fp-stair-plan line{stroke:#b9a987;stroke-width:.018}
.fp-stair-plan path{fill:none;stroke:#8a6f3a;stroke-width:.05;stroke-linecap:round;stroke-linejoin:round}
.fp-stair-plan text{fill:#6b5327;stroke:#fff;stroke-width:.05;paint-order:stroke;font-size:.2px;font-weight:700}`;

// The planner's drawing is written for a web page, where an attribute may
// stand without a value. A page here is a file of its own, where it may not.
const wellFormed = markup => markup.replace(/\s(data-[a-z-]+)(?=[\s/>])/g, ' $1=""');

const clipped = (text, most) => {
    const value = String(text ?? '');
    return value.length > most ? value.slice(0, most - 3).trimEnd() + '...' : value;
};

/** The floors of a project that have rooms, lowest first. */
export const sheetFloors = project => (project?.floors ?? [{ id: 'ground', level: 0, name: null, plan: project }])
    .filter(floor => floor.plan?.rooms?.length).sort((a, b) => a.level - b.level);

/** What a plan covers, in metres, with some room around it. */
export function planBounds(plan, around = .5) {
    const points = [
        ...plan.rooms.flatMap(roomCorners),
        ...plan.walls.flatMap(item => [[item.x, item.y], [item.endX, item.endY]]),
        ...plan.sensors.map(item => [item.x, item.y]),
        ...(plan.furniture ?? []).map(item => [item.x, item.y]),
    ];
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const x = Math.min(...xs) - around, y = Math.min(...ys) - around;
    return { x, y, width: Math.max(...xs) + around - x, height: Math.max(...ys) + around - y };
}

// A round length for the scale bar that is between a tenth and a third of the plan box.
function scaleBar(pixelsPerMetre, boxWidth) {
    const lengths = [.5, 1, 2, 5, 10, 20];
    return lengths.find(length => length * pixelsPerMetre >= boxWidth * .12) ?? lengths.at(-1);
}

// The sensors of a floor as rows of a list, in columns that fit the box.
function sensorList(plan, box, columns, copy) {
    if (!plan.sensors.length) return '';
    const rows = Math.max(1, Math.floor((box.height - 56) / rowHeight));
    const most = rows * columns;
    const shown = plan.sensors.length > most ? most - 1 : plan.sensors.length;
    const column = (box.width - (columns - 1) * gap) / columns;
    const letters = Math.floor(column / 11.5);
    const entries = plan.sensors.slice(0, shown).map((item, index) => {
        const device = devices[item.model];
        const room = roomForDevice(plan.rooms, item);
        const x = box.x + Math.floor(index / rows) * (column + gap), y = box.y + 56 + (index % rows) * rowHeight;
        return `<g transform="translate(${x} ${y})" fill="${device?.mount === 'ceiling' ? ceiling : wall}">
            <circle cx="15" cy="15" r="15" fill-opacity=".14"/>
            <text x="15" y="20" font-size="13" font-weight="800" text-anchor="middle">${String(index + 1).padStart(2, '0')}</text>
            <text x="42" y="13" font-size="17" font-weight="700" fill="${ink}">${escapeText(clipped(device?.name ?? item.model, letters))}</text>
            <text x="42" y="32" font-size="14" fill="${muted}">${escapeText(clipped(room?.name ?? copy.sim_outside_rooms ?? '', letters + 6))}</text>
        </g>`;
    });
    const rest = plan.sensors.length - shown;
    if (rest > 0) {
        const x = box.x + Math.floor(shown / rows) * (column + gap), y = box.y + 56 + (shown % rows) * rowHeight;
        entries.push(`<text x="${x + 42}" y="${y + 20}" font-size="15" font-weight="600" fill="${muted}">+ ${rest}</text>`);
    }
    return `<text x="${box.x}" y="${box.y + 22}" font-size="15" font-weight="800" letter-spacing="1.2" fill="${muted}">${escapeText((copy.sheet_sensors ?? 'Sensors').toUpperCase())}</text>
        <line x1="${box.x}" y1="${box.y + 36}" x2="${box.x + box.width}" y2="${box.y + 36}" stroke="${rule}" stroke-width="1.5"/>
        ${entries.join('')}`;
}

/**
 * The pages of a project: one for every floor that has rooms.
 *
 * copy holds the planner's texts and number formats a length; date is the
 * text to print as the date, and radarOptions say how coverage is drawn, as
 * for paintPlan. Returns [{ name, width, height, svg }], where
 * name is the floor's label and the size is in pixels.
 */
export function sheetPages(project, { copy = {}, number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }), date = '', coverage = true, radarOptions } = {}) {
    const floors = sheetFloors(project);
    const whole = new Intl.NumberFormat(number.resolvedOptions().locale, { maximumFractionDigits: 0 });
    return floors.map(floor => {
        const plan = floor.plan;
        const bounds = planBounds(plan);
        // A plan that is clearly taller than wide gets an upright page, with the list under it.
        const upright = bounds.height > bounds.width * 1.2;
        const [width, height] = upright ? [short, long] : [long, short];
        const inner = { x: margin, y: top, width: width - 2 * margin, height: height - top - bottom };
        const listHeight = upright ? Math.min(360, 96 + Math.ceil(Math.max(1, plan.sensors.length) / 2) * rowHeight) : inner.height;
        const box = upright ? { ...inner, height: inner.height - listHeight - gap }
            : { ...inner, width: inner.width - listWidth - gap };
        const list = upright ? { x: inner.x, y: box.y + box.height + gap, width: inner.width, height: listHeight }
            : { x: box.x + box.width + gap, y: inner.y, width: listWidth, height: inner.height - 70 };
        const pixelsPerMetre = Math.min(box.width / bounds.width, box.height / bounds.height);
        const bar = scaleBar(pixelsPerMetre, box.width);
        const label = floorLabel(floor, copy);
        // The stairs, on the two floors they join.
        const trip = project.staircase ? stairTrip({ ...project, activeFloor: floor.id }) : null;
        const area = plan.rooms.reduce((sum, room) => sum + roomArea(room), 0);
        const facts = [[copy.rooms ?? 'Rooms', whole.format(plan.rooms.length)], [copy.sheet_area ?? 'Floor area', `${whole.format(area)} m²`],
            [copy.sheet_sensors ?? 'Sensors', whole.format(plan.sensors.length)]];
        const legendY = upright ? height - bottom + 4 : list.y + list.height + 44;
        const legendX = upright ? width - margin - 330 : list.x;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <style>${planStyles}</style>
    <rect width="${width}" height="${height}" fill="#fff"/>
    <text x="${margin}" y="${margin + 34}" font-size="38" font-weight="800" fill="${ink}">${escapeText(clipped(project.name ?? plan.name ?? '', 44))}</text>
    <text x="${margin}" y="${margin + 70}" font-size="18" fill="${muted}">${escapeText([floors.length > 1 ? label : '', ...facts.map(([name, value]) => `${name} ${value}`)].filter(Boolean).join('  ·  '))}</text>
    <text x="${width - margin}" y="${margin + 34}" font-size="16" fill="${muted}" text-anchor="end">${escapeText(date)}</text>
    <line x1="${margin}" y1="${top - 28}" x2="${width - margin}" y2="${top - 28}" stroke="${rule}" stroke-width="1.5"/>
    <svg x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet">
        ${wellFormed(paintPlan(plan, coverage, null, number, null, { radarOptions })
            + (trip ? paintStairPlan(trip.stair, escapeText(copy.staircase ?? ''), trip.up) : ''))}
    </svg>
    <g transform="translate(${margin} ${height - bottom + 30})" fill="${muted}">
        <path d="M0 0v10h${bar * pixelsPerMetre}V0" fill="none" stroke="${muted}" stroke-width="2"/>
        <text x="${bar * pixelsPerMetre + 10}" y="11" font-size="14">${number.format(bar)} m</text>
    </g>
    ${sensorList(plan, list, upright ? 2 : 1, copy)}
    ${plan.sensors.length ? `<g transform="translate(${legendX} ${legendY})" font-size="14" fill="${muted}">
        <circle cx="7" cy="-5" r="7" fill="${ceiling}"/><text x="22">CeilSense</text>
        <circle cx="127" cy="-5" r="7" fill="${wall}"/><text x="142">WallSense / UltimateSensor</text>
    </g>` : ''}
    <text x="${width - margin}" y="${height - 34}" font-size="14" fill="${muted}" text-anchor="end">${escapeText(copy.sheet_credit ?? '')}</text>
</svg>`;
        return { name: label, width, height, svg };
    });
}

/** A file name for a project: its name with only letters, digits and dashes. */
export const sheetFileName = (project, extension) =>
    (String(project?.name ?? '').replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'sensor-plan') + '.' + extension;

const text = value => new TextEncoder().encode(value);

// A PDF text string, as UTF-16 in hexadecimal so any name can be in it.
const pdfText = value => '<FEFF' + [...String(value)].flatMap(character => {
    const code = character.codePointAt(0);
    const units = code > 0xffff ? [0xd800 + ((code - 0x10000) >> 10), 0xdc00 + ((code - 0x10000) & 0x3ff)] : [code];
    return units.map(unit => unit.toString(16).padStart(4, '0'));
}).join('').toUpperCase() + '>';

/**
 * A PDF file with one A4 page for every image: upright or on its side as the
 * image is, with the image filling the page as far as its shape allows.
 * images is [{ jpeg: Uint8Array, width, height }]; returns the file's bytes.
 */
export function pdfDocument(images, { title = '', creator = '' } = {}) {
    const [a4Short, a4Long] = [595.28, 841.89];
    const objects = [];
    const add = (...parts) => objects.push(parts.map(part => typeof part === 'string' ? text(part) : part)) - 1;
    const catalog = add(''), pages = add('');
    const kids = images.map(({ jpeg, width, height }) => {
        const [pageWidth, pageHeight] = width >= height ? [a4Long, a4Short] : [a4Short, a4Long];
        const scale = Math.min(pageWidth / width, pageHeight / height);
        const [drawnWidth, drawnHeight] = [width * scale, height * scale];
        const image = add(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream');
        const drawing = `q ${drawnWidth.toFixed(2)} 0 0 ${drawnHeight.toFixed(2)} ${((pageWidth - drawnWidth) / 2).toFixed(2)} ${((pageHeight - drawnHeight) / 2).toFixed(2)} cm /Im0 Do Q`;
        const content = add(`<< /Length ${drawing.length} >>\nstream\n${drawing}\nendstream`);
        return add(`<< /Type /Page /Parent ${pages + 1} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${image + 1} 0 R >> >> /Contents ${content + 1} 0 R >>`);
    });
    objects[catalog] = [text(`<< /Type /Catalog /Pages ${pages + 1} 0 R >>`)];
    objects[pages] = [text(`<< /Type /Pages /Kids [${kids.map(kid => `${kid + 1} 0 R`).join(' ')}] /Count ${kids.length} >>`)];
    const info = add(`<< /Title ${pdfText(title)} /Creator ${pdfText(creator)} >>`);

    const chunks = [text('%PDF-1.4\n%âãÏÓ\n')];
    let size = chunks[0].length;
    const offsets = objects.map((parts, index) => {
        const offset = size;
        for (const part of [text(`${index + 1} 0 obj\n`), ...parts, text('\nendobj\n')]) {
            chunks.push(part);
            size += part.length;
        }
        return offset;
    });
    chunks.push(text(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('')}`
        + `trailer\n<< /Size ${objects.length + 1} /Root ${catalog + 1} 0 R /Info ${info + 1} 0 R >>\nstartxref\n${size}\n%%EOF\n`));
    const file = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    let at = 0;
    for (const chunk of chunks) {
        file.set(chunk, at);
        at += chunk.length;
    }
    return file;
}
