const bound = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
export const maxImageData = 320000;
// How wide a new image is drawn, in metres, until it gets a real scale.
export const startingWidth = 10;
export const maxUnderlayFile = 12_000_000;
// The longest side of the stored image, in pixels.
const maxUnderlaySide = 1600;
// How see-through the drawn rooms are while they lie on the image, in percent.
// Plans saved before this existed have no value and use the default.
export const defaultRoomTransparency = 60;
export const roomTransparency = image => image?.roomTransparency ?? defaultRoomTransparency;

// A part of an image is written in shares of its width and height, from 0 to
// 1: x and y are its top left corner. This one is the whole image.
export const wholeImage = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
// A chosen part is at least this share of the image on each side. Anything
// smaller is a slip of the hand, not a floor plan.
export const smallestPart = .05;
// Room for the rounding of sums such as .3 + .05.
const rounding = 1e-9;
const share = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * The part of an image between two opposite corners, kept inside the image.
 * Returns null when it is smaller than least on a side.
 */
export function imagePart(from, to, least = smallestPart) {
    const x = share(Math.min(from.x, to.x)), y = share(Math.min(from.y, to.y));
    const width = share(Math.max(from.x, to.x)) - x, height = share(Math.max(from.y, to.y)) - y;
    return width > 0 && height > 0 && width >= least - rounding && height >= least - rounding ? { x, y, width, height } : null;
}

/** A part moved by dx and dy, stopped at the edges of the image. */
export const movedPart = (part, dx, dy) => ({ ...part,
    x: Math.min(1 - part.width, Math.max(0, part.x + dx)), y: Math.min(1 - part.height, Math.max(0, part.y + dy)) });

/**
 * Whether a part of an image with the given ratio (width divided by height)
 * can be the image under a plan: inside the image, large enough and not a
 * thin strip.
 */
export function usablePart(part, ratio) {
    return Boolean(part) && [part.x, part.y, part.width, part.height].every(Number.isFinite)
        && part.x >= 0 && part.y >= 0 && part.x + part.width <= 1 + rounding && part.y + part.height <= 1 + rounding
        && part.width >= smallestPart - rounding && part.height >= smallestPart - rounding
        && bound(ratio * part.width / part.height, .04, 25);
}

export function validUnderlay(image) {
    return image && typeof image.data === 'string' && image.data.length <= maxImageData
        && /^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(image.data)
        && bound(image.ratio, .04, 25) && bound(image.width, .5, 220)
        && bound(image.x, -250, 250) && bound(image.y, -250, 250)
        && bound(image.opacity, 10, 85)
        && (image.roomTransparency === undefined || bound(image.roomTransparency, 0, 100));
}

// A failed upload carries a code: 'format' (not an image or PDF, or over
// 12 MB) and 'size' (it does not fit the plan) from here, 'password' and 'pdf'
// from floor-planner-pdf.mjs.
const problem = code => Object.assign(new Error(`Underlay ${code}`), { code });

// The text to show for a failed upload, as its name in the planner's copy.
export const underlayMessage = error => ({ password: 'underlay_pdf_password', pdf: 'underlay_pdf_error' })[error?.code] ?? 'underlay_error';

// 'image' or 'pdf' for a file the planner can open, null for anything else.
// Not every system knows the type of a PDF, so its name counts as well.
export function underlayKind(file) {
    if (!file || file.size > maxUnderlayFile) return null;
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'image';
    const unknown = !file.type || file.type === 'application/octet-stream';
    return file.type === 'application/pdf' || (unknown && /\.pdf$/i.test(file.name ?? '')) ? 'pdf' : null;
}

// source is an image or a canvas of width by height pixels. Only the given
// part of it is kept, so a small part of a large image stays sharp.
function underlayFrom(source, width, height, part = wholeImage) {
    const left = part.x * width, top = part.y * height;
    const across = part.width * width, down = part.height * height;
    const ratio = across / down;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let scale = Math.min(1, maxUnderlaySide / Math.max(across, down));
    let data;
    do {
        canvas.width = Math.max(1, Math.round(across * scale));
        canvas.height = Math.max(1, Math.round(down * scale));
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, left, top, across, down, 0, 0, canvas.width, canvas.height);
        data = canvas.toDataURL('image/jpeg', .82);
        scale *= .76;
    } while (data.length > maxImageData && canvas.width > 100 && canvas.height > 100);
    const result = { data, ratio, x: 0, y: 0, width: startingWidth, opacity: 45, roomTransparency: defaultRoomTransparency };
    if (!validUnderlay(result)) throw problem('size');
    return result;
}

// Turns an uploaded image or PDF into an underlay. A PDF with several pages
// asks choosePage(pdf) which page to use; it resolves to a page number.
// choosePart(picture, ratio) then asks which part of the image to keep, for a
// sheet that shows more than one floor plan: picture is an image or canvas to
// show, ratio its width divided by its height, and it resolves to a part of
// the image. When either resolves to nothing the upload is cancelled, and
// this function resolves to nothing as well.
export async function loadUnderlay(file, choosePage = () => 1, choosePart = () => wholeImage) {
    const kind = underlayKind(file);
    if (!kind) throw problem('format');
    // What was chosen, or the whole image when that is not a usable part.
    const chosen = async (picture, ratio) => {
        const part = await choosePart(picture, ratio);
        return part && (usablePart(part, ratio) ? part : wholeImage);
    };
    if (kind === 'pdf') {
        // pdf.js is large, so it only loads once a PDF is chosen.
        const { openPdf } = await import('./floor-planner-pdf.mjs');
        const pdf = await openPdf(await file.arrayBuffer());
        try {
            const page = pdf.pages > 1 ? await choosePage(pdf) : 1;
            if (!page) return null;
            const whole = await pdf.render(page, maxUnderlaySide);
            const part = await chosen(whole, whole.width / whole.height);
            if (!part) return null;
            // A part is drawn again from the PDF itself, as sharp as a whole page.
            const canvas = part === wholeImage ? whole : await pdf.render(page, maxUnderlaySide, part);
            return underlayFrom(canvas, canvas.width, canvas.height);
        } finally {
            pdf.close();
        }
    }
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const part = await chosen(image, image.naturalWidth / image.naturalHeight);
        return part ? underlayFrom(image, image.naturalWidth, image.naturalHeight, part) : null;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function calibrateUnderlay(image, start, length, actual) {
    const scale = actual / length;
    const next = { ...image, width: image.width * scale,
        x: start.x + (image.x - start.x) * scale, y: start.y + (image.y - start.y) * scale };
    return validUnderlay(next) ? next : null;
}
