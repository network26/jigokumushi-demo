#!/usr/bin/env node
/* Checks queue/i18n.js: every key exists in all 13 languages, no empty values, {n} placeholders match,
 * and no value is a verbatim copy of the English text (= English fallback leaking). Usage: node tools/check-queue-i18n.js */
global.window = {}; require('../queue/i18n.js');
const D = window.QI18N, en = D.en, langs = Object.keys(D), bad = [];
const ALLOW_SAME = new Set([]); // keys that may legitimately equal English
for (const l of langs) {
  for (const k of Object.keys(en)) {
    const v = D[l][k];
    if (v == null || v === '') { bad.push(`${l}: missing ${k}`); continue; }
    if (/\{n\}/.test(en[k]) !== /\{n\}/.test(v)) bad.push(`${l}: placeholder mismatch ${k}`);
    if (l !== 'en' && v === en[k] && !ALLOW_SAME.has(k)) bad.push(`${l}: same as English ${k} -> ${v}`);
  }
  for (const k of Object.keys(D[l])) if (!(k in en)) bad.push(`${l}: extra key ${k}`);
}
console.log(`${langs.length} languages, ${Object.keys(en).length} keys`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); } else console.log('OK: all keys translated in every language');
