// Reads a PDF so one of its pages can become the image under the plan.
//
// This is the only module that imports pdf.js, and the planner only loads it
// with import() once somebody picks a PDF, so opening the planner stays as
// light as it was. The legacy build is used because it also runs in browsers
// that are a few years old.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// pdf.js normally parses in a worker it loads from a URL of its own. When it
// finds its worker module here it parses on the main thread instead, so there
// is no extra file to serve and nothing is fetched: it also works offline.
globalThis.pdfjsWorker ??= pdfWorker;

// Failures carry a code the planner has a message for: 'password' for a PDF
// that only opens with a password, 'pdf' for anything else that cannot be
// opened or drawn.
const problem = code => Object.assign(new Error(`PDF ${code}`), { code });
export const pdfProblem = error => error?.code === 'pdf' ? error : problem(error?.name === 'PasswordException' ? 'password' : 'pdf');

// A page that comes out completely white has no floor plan to trace. That is
// also what a page looks like whose only image could not be decoded.
function blank(canvas) {
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    return data.every(value => value > 250);
}

// Opens a PDF from its bytes. The result has the number of pages, render(),
// which draws a page on a new canvas whose longest side is maxSide pixels,
// and close(), which must be called when the PDF is no longer needed.
// render() can also draw only a part of the page, given in shares of its
// width and height ({ x, y, width, height } from 0 to 1). That part then
// fills the canvas, so a detail of a large sheet comes out sharp.
export async function openPdf(data) {
    const task = getDocument({ data, isEvalSupported: false, verbosity: 0 });
    let pdf;
    try {
        pdf = await task.promise;
    } catch (error) {
        await task.destroy().catch(() => {});
        throw pdfProblem(error);
    }
    return {
        pages: pdf.numPages,
        async render(number, maxSide, part = null) {
            try {
                const page = await pdf.getPage(number);
                const size = page.getViewport({ scale: 1 });
                const { x, y, width, height } = part ?? { x: 0, y: 0, width: 1, height: 1 };
                const scale = maxSide / Math.max(size.width * width, size.height * height);
                // The page is shifted so the part starts in the corner of the canvas.
                const viewport = page.getViewport({ scale, offsetX: -x * size.width * scale, offsetY: -y * size.height * scale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(size.width * width * scale));
                canvas.height = Math.max(1, Math.round(size.height * height * scale));
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                // An empty part of a page that has a drawing is the user's own choice.
                if (!part && blank(canvas)) throw problem('pdf');
                return canvas;
            } catch (error) {
                throw pdfProblem(error);
            }
        },
        close() {
            task.destroy().catch(() => {});
        },
    };
}
