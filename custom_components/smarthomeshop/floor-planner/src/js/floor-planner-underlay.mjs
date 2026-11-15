const bound = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
export const maxImageData = 320000;

export function validUnderlay(image) {
    return image && typeof image.data === 'string' && image.data.length <= maxImageData
        && /^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(image.data)
        && bound(image.ratio, .04, 25) && bound(image.width, .5, 220)
        && bound(image.x, -250, 250) && bound(image.y, -250, 250)
        && bound(image.opacity, 10, 85);
}

export async function loadUnderlay(file) {
    if (file.size > 12_000_000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Image format');
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const ratio = image.naturalWidth / image.naturalHeight;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        let scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        let data;
        do {
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            data = canvas.toDataURL('image/jpeg', .82);
            scale *= .76;
        } while (data.length > maxImageData && canvas.width > 100 && canvas.height > 100);
        const result = { data, ratio, x: 0, y: 0, width: 10, opacity: 45 };
        if (!validUnderlay(result)) throw new Error('Image size');
        return result;
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
