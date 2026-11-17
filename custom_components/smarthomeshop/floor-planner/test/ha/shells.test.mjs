// The editor pages in src/ha/shells carry their own markup and text, so what
// the planner script expects to find has to be there in every language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shells = ['en', 'nl', 'de', 'fr', 'es'].map(language => {
    const html = readFileSync(new URL(`../../src/ha/shells/${language}.html`, import.meta.url), 'utf8');
    return { language, html, copy: JSON.parse(html.match(/id="fp-copy">([\s\S]*?)<\/script>/)[1]) };
});
// Long dashes, curly quotes and the ellipsis character do not belong in the text.
const typographic = /[\u2013\u2014\u2018\u2019\u201c\u201d\u2026]/;

test('every planner shell can make rooms see-through over an uploaded plan', () => {
    for (const { language, html, copy } of shells) {
        assert.ok(copy.underlay_room_transparency, language);
        assert.match(html, new RegExp(`<label>${copy.underlay_room_transparency} <input type="range" id="fp-underlay-rooms" min="0" max="100" step="5"></label>`), language);
        assert.doesNotMatch(copy.underlay_room_transparency, typographic, language);
    }
});

test('every planner shell says that drawing tools stay active and how to stop', () => {
    for (const { language, html, copy } of shells) {
        assert.match(copy.tool_repeat, /Esc|\u00c9chap/, language);
        assert.match(html, new RegExp(`id="fp-tool-stop" hidden><button type="button" data-action="stop_tool">${copy.tool_done}</button>`), language);
        for (const key of ['tool_repeat', 'tool_done']) assert.doesNotMatch(copy[key], typographic, `${language}.${key}`);
    }
});

test('every planner shell accepts a PDF and lets a page be chosen', () => {
    const keys = ['underlay_pdf_opening', 'underlay_pdf_password', 'underlay_pdf_error', 'underlay_pdf_title', 'underlay_pdf_intro',
        'underlay_pdf_page', 'underlay_pdf_use'];
    for (const { language, html, copy } of shells) {
        assert.match(html, /id="fp-underlay-file" accept="[^"]*application\/pdf,\.pdf"/, language);
        for (const key of [...keys, 'start_image', 'underlay_import', 'underlay_error']) {
            assert.ok(copy[key]?.trim(), `${language}.${key}`);
            assert.doesNotMatch(copy[key], typographic, `${language}.${key}`);
        }
        for (const key of ['start_image', 'underlay_import', 'underlay_error']) assert.match(copy[key], /PDF/, `${language}.${key}`);
        assert.match(copy.underlay_pdf_page, /:count/, language);
        for (const id of ['fp-pdf-pages', 'fp-pdf-preview', 'fp-pdf-page', 'fp-pdf-page-label', 'fp-pdf-status']) {
            assert.equal(html.split(`id="${id}"`).length, 2, `${language} #${id}`);
        }
        // The buttons that open the upload name what can be opened.
        assert.ok(html.includes(`data-action="import_underlay">${copy.start_image}</button>`), language);
        assert.ok(html.includes(`${copy.underlay_import}\n`), language);
        assert.ok(html.includes(`<h2 id="fp-pdf-title">${copy.underlay_pdf_title}</h2><p id="fp-pdf-intro">${copy.underlay_pdf_intro}</p>`), language);
        assert.ok(html.includes(`value="use">${copy.underlay_pdf_use}</button>`), language);
    }
});

test('every planner shell lets a part of an uploaded image be chosen', () => {
    const keys = ['underlay_crop_title', 'underlay_crop_intro', 'underlay_crop_area', 'underlay_crop_whole', 'underlay_crop_use'];
    for (const { language, html, copy } of shells) {
        for (const key of keys) {
            assert.ok(copy[key]?.trim(), `${language}.${key}`);
            assert.doesNotMatch(copy[key], typographic, `${language}.${key}`);
        }
        for (const id of ['fp-crop', 'fp-crop-stage', 'fp-crop-box']) assert.equal(html.split(`id="${id}"`).length, 2, `${language} #${id}`);
        assert.ok(html.includes(`<h2 id="fp-crop-title">${copy.underlay_crop_title}</h2><p id="fp-crop-intro">${copy.underlay_crop_intro}</p>`), language);
        // The picture can be reached and used with the keyboard, and says how.
        assert.ok(html.includes(`id="fp-crop-stage" role="group" tabindex="0" aria-label="${copy.underlay_crop_area}" autofocus>`), language);
        assert.match(copy.underlay_crop_area, /Shift|Umschalt|Maj|May\u00fas/, language);
        // The whole image is the first answer, so it is what Enter gives; a part needs a box first.
        assert.ok(html.includes(`<button type="submit" class="fp-primary" value="whole">${copy.underlay_crop_whole}</button>\n`
            + `                    <button type="submit" value="part" disabled>${copy.underlay_crop_use}</button>`), language);
        assert.equal(html.split('data-action="close_crop"').length, 3, language);
        assert.equal(html.match(/<span data-corner="(?:nw|ne|sw|se)"><\/span>/g)?.length, 4, language);
    }
});

test('every planner shell can open and close a door and says what that does', () => {
    for (const { language, copy } of shells) {
        for (const key of ['door_open', 'door_close', 'door_note']) {
            assert.ok(copy[key]?.trim(), `${language}.${key}`);
            assert.doesNotMatch(copy[key], typographic, `${language}.${key}`);
        }
        assert.notEqual(copy.door_open, copy.door_close, language);
    }
});

test('every planner shell can zoom on the map and asks before a room is removed', () => {
    for (const { language, copy } of shells) {
        // The zoom bar on the map takes its names from the texts of the view menu.
        for (const key of ['zoom_in', 'zoom_out', 'fit', 'zoom_controls', 'cancel_place']) assert.ok(copy[key]?.trim(), `${language}.${key}`);
        for (const key of ['room_delete_title', 'room_delete_text', 'room_delete_confirm']) {
            assert.ok(copy[key]?.trim(), `${language}.${key}`);
            assert.doesNotMatch(copy[key], typographic, `${language}.${key}`);
        }
        assert.match(copy.room_delete_text, /^:name /, language);
        assert.match(copy.room_delete_title, /\?$/, language);
    }
});

test('every planner shell has the same text keys', () => {
    const keys = shell => Object.keys(shell.copy).sort();
    for (const shell of shells) assert.deepEqual(keys(shell), keys(shells[0]), shell.language);
});
