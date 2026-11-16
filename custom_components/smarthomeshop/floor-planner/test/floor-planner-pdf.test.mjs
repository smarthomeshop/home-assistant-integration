// Opening PDFs for the image under the plan. Drawing a page needs a browser
// canvas, so these tests cover what happens before that: reading the file,
// the pages it has and the failures that get a message of their own.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { openPdf, pdfProblem } from '../src/js/floor-planner-pdf.mjs';
import { loadUnderlay, underlayMessage } from '../src/js/floor-planner-underlay.mjs';

const text = value => new TextEncoder().encode(value);
const join = parts => Buffer.concat(parts.map(part => typeof part === 'string' ? text(part) : part));
const md5 = (...parts) => createHash('md5').update(join(parts)).digest();
const padding = Buffer.from('28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A', 'hex');
const padded = password => join([password, padding]).subarray(0, 32);

function rc4(key, data) {
    const state = Array.from({ length: 256 }, (_, index) => index);
    for (let i = 0, j = 0; i < 256; i += 1) {
        j = (j + state[i] + key[i % key.length]) % 256;
        [state[i], state[j]] = [state[j], state[i]];
    }
    let i = 0, j = 0;
    return Buffer.from(data.map(byte => {
        i = (i + 1) % 256;
        j = (j + state[i]) % 256;
        [state[i], state[j]] = [state[j], state[i]];
        return byte ^ state[(state[i] + state[j]) % 256];
    }));
}

// A small PDF with one outlined room per page. With a user password (an empty
// one included) it is encrypted the way PDF 1.4 does it, with 40 bit RC4.
function pdf({ pages = 1, userPassword = null } = {}) {
    const id = md5('floor plan');
    const permissions = Buffer.from([0xc0, 0xf0, 0xff, 0xff]);
    const objects = new Map([
        [1, '<< /Type /Catalog /Pages 2 0 R >>'],
        [2, `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages} >>`],
    ]);
    let key = null, encrypt = '';
    if (userPassword !== null) {
        const owner = rc4(md5(padded('owner')).subarray(0, 5), padded(userPassword));
        key = md5(padded(userPassword), owner, permissions, id).subarray(0, 5);
        const number = 3 + pages * 2;
        objects.set(number, `<< /Filter /Standard /V 1 /R 2 /O <${owner.toString('hex')}> /U <${rc4(key, padding).toString('hex')}> /P ${permissions.readInt32LE()} >>`);
        encrypt = ` /Encrypt ${number} 0 R`;
    }
    for (let index = 0; index < pages; index += 1) {
        const page = 3 + index * 2, content = page + 1;
        const drawing = text(`2 w 60 60 ${200 + index * 40} 300 re S`);
        const stream = key ? rc4(md5(key, Buffer.from([content, 0, 0, 0, 0])).subarray(0, 10), drawing) : drawing;
        objects.set(page, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 420] /Contents ${content} 0 R >>`);
        objects.set(content, join([`<< /Length ${stream.length} >>\nstream\n`, stream, '\nendstream']));
    }
    let file = text('%PDF-1.4\n');
    const offsets = [];
    for (const number of [...objects.keys()].sort((a, b) => a - b)) {
        offsets.push(file.length);
        file = join([file, `${number} 0 obj\n`, objects.get(number), '\nendobj\n']);
    }
    const hex = id.toString('hex');
    return new Uint8Array(join([file, `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`,
        offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join(''),
        `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R /ID [<${hex}> <${hex}>]${encrypt} >>\nstartxref\n${file.length}\n%%EOF\n`]));
}

const upload = (bytes, name = 'plan.pdf', type = 'application/pdf') =>
    ({ name, type, size: bytes.length, arrayBuffer: async () => bytes.slice().buffer });

test('a PDF opens with the number of pages it has', async () => {
    for (const pages of [1, 4]) {
        const opened = await openPdf(pdf({ pages }));
        assert.equal(opened.pages, pages);
        opened.close();
    }
});

test('a PDF that only restricts what may be done with it opens without a password', async () => {
    const opened = await openPdf(pdf({ pages: 2, userPassword: '' }));
    assert.equal(opened.pages, 2);
    opened.close();
});

test('a PDF that needs a password, a broken one and an empty one each fail with a code', async () => {
    await assert.rejects(openPdf(pdf({ userPassword: 'secret' })), error => error.code === 'password');
    await assert.rejects(openPdf(text('%PDF-1.4\nthis is not a real document\n')), error => error.code === 'pdf');
    await assert.rejects(openPdf(text('just some text')), error => error.code === 'pdf');
    await assert.rejects(openPdf(new Uint8Array(0)), error => error.code === 'pdf');
});

test('problems reported by pdf.js become one of the two codes', () => {
    assert.equal(pdfProblem({ name: 'PasswordException', code: 1 }).code, 'password');
    assert.equal(pdfProblem({ name: 'PasswordException', code: 2 }).code, 'password');
    assert.equal(pdfProblem({ name: 'InvalidPDFException' }).code, 'pdf');
    assert.equal(pdfProblem(new TypeError('Something else')).code, 'pdf');
    assert.equal(pdfProblem(undefined).code, 'pdf');
    const blank = pdfProblem(new Error('Any'));
    assert.equal(pdfProblem(blank), blank);
});

test('an uploaded PDF with several pages asks which page to use, and cancelling changes nothing', async () => {
    const asked = [];
    const result = await loadUnderlay(upload(pdf({ pages: 3 })), opened => {
        asked.push(opened.pages);
        return null;
    });
    assert.equal(result, null);
    assert.deepEqual(asked, [3]);
    // The type is missing on some systems; the name is enough.
    assert.equal(await loadUnderlay(upload(pdf({ pages: 2 }), 'PLAN.PDF', ''), () => null), null);
});

test('an uploaded PDF that cannot be used is reported with its own message', async () => {
    const choosePage = () => assert.fail('No page to choose');
    await assert.rejects(loadUnderlay(upload(pdf({ pages: 3, userPassword: 'secret' })), choosePage),
        error => underlayMessage(error) === 'underlay_pdf_password');
    await assert.rejects(loadUnderlay(upload(text('%PDF-1.4\nbroken')), choosePage),
        error => underlayMessage(error) === 'underlay_pdf_error');
});
