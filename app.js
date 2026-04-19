/* ============================================================
   WORD SPLITTER — app.js
   Перевод: MyMemory API (бесплатно, без ключа, до 5000 слов/день)
   ============================================================ */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────
  const inputText         = document.getElementById('inputText');
  const outputText        = document.getElementById('outputText');
  const outputUk          = document.getElementById('outputUk');
  const btnRun            = document.getElementById('btnRun');
  const btnCopy           = document.getElementById('btnCopy');
  const btnCopyUk         = document.getElementById('btnCopyUk');
  const btnClear          = document.getElementById('btnClear');
  const btnTranslate      = document.getElementById('btnTranslate');
  const btnTranslateLabel = document.getElementById('btnTranslateLabel');
  const translateStatus   = document.getElementById('translateStatus');
  const metaChars         = document.getElementById('metaChars');
  const metaWords         = document.getElementById('metaWords');
  const statTotal         = document.getElementById('statTotal');
  const statUnique        = document.getElementById('statUnique');
  const statLongest       = document.getElementById('statLongest');
  const statUkWords       = document.getElementById('statUkWords');

  const optPunct = document.getElementById('optPunct');
  const optLower = document.getElementById('optLower');
  const optDupes = document.getElementById('optDupes');
  const optSort  = document.getElementById('optSort');

  // ── Core logic ────────────────────────────────────────────

  const PUNCT_RE       = /^[«»""''„"‹›\[\]{}()\.\,\!\?\:\;—–\/\\@#\$%\^&\*\+\=<>\|`~''""`]+|[«»""''„"‹›\[\]{}()\.\,\!\?\:\;—–\/\\@#\$%\^&\*\+\=<>\|`~''""`]+$/g;
  const HYPHEN_EDGE_RE = /^-+|-+$/g;
  const APOS_INNER_RE  = /(?<=\S)['\`\u02BC\u2032\u2018\u201A\u201B\u02B9\u02BB\u02BD\uFF07](?=\S)/g;
  const APOS_TARGET    = '\u0027';

  function splitWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0);
  }

  function processWords(text) {
    let words = splitWords(text);
    if (optPunct.checked) {
      words = words
        .map(w => w.replace(APOS_INNER_RE, APOS_TARGET))
        .map(w => w.replace(PUNCT_RE, '').replace(HYPHEN_EDGE_RE, '').trim())
        .filter(w => w.length > 0);
    }
    if (optLower.checked)  words = words.map(w => w.toLowerCase());
    if (optDupes.checked)  words = [...new Set(words)];
    if (optSort.checked)   words = words.sort((a, b) => a.localeCompare(b, ['ru', 'uk', 'en'], { sensitivity: 'base' }));
    return words;
  }

  function formatWords(words) {
    const fmt = document.querySelector('input[name="format"]:checked').value;
    switch (fmt) {
      case 'lines':    return words.join('\n');
      case 'comma':    return words.join(', ');
      case 'json':     return JSON.stringify(words, null, 2);
      case 'numbered': return words.map((w, i) => `${i + 1}. ${w}`).join('\n');
      default:         return words.join('\n');
    }
  }

  // ── Run ───────────────────────────────────────────────────

  let lastWords = [];

  function run() {
    const text = inputText.value.trim();
    if (!text) { showToast('сначала введите текст'); return; }

    lastWords = processWords(text);
    outputText.value = formatWords(lastWords);

    outputUk.value = '';
    statUkWords.textContent = '—';
    translateStatus.textContent = '';

    const rawWords = splitWords(text);
    const uniqueSet = new Set(
      rawWords.map(w => (optPunct.checked ? w.replace(PUNCT_RE, '') : w).toLowerCase())
              .filter(w => w.length > 0)
    );
    const longest = lastWords.reduce((max, w) => w.length > max.length ? w : max, '');

    statTotal.textContent   = lastWords.length.toLocaleString('ru');
    statUnique.textContent  = uniqueSet.size.toLocaleString('ru');
    statLongest.textContent = longest || '—';
  }

  // ── Translation via MyMemory API ──────────────────────────
  // Бесплатно, без ключа. Лимит: 5000 слов/день.
  // Отправляем слова батчами по 30 штук чтобы не превысить лимит символов за запрос.

  const BATCH_SIZE = 30;
  const SEPARATOR  = '\n';

  async function translateBatch(words) {
    const q = words.join(SEPARATOR);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=ru|uk`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'API error');
    // MyMemory returns translated text as a single string — split back
    return data.responseData.translatedText.split(SEPARATOR);
  }

  async function translate() {
    if (!lastWords.length) { showToast('сначала разберите текст'); return; }

    btnTranslate.disabled = true;
    btnTranslateLabel.textContent = 'переводим…';

    const total = lastWords.length;
    let translated = [];

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = lastWords.slice(i, i + BATCH_SIZE);
        translateStatus.textContent = `${Math.min(i + BATCH_SIZE, total)} / ${total} слов…`;
        const result = await translateBatch(batch);
        translated = translated.concat(result);
        // Small pause between batches to be polite to the free API
        if (i + BATCH_SIZE < total) await new Promise(r => setTimeout(r, 300));
      }

      // Format same as original
      const fmt = document.querySelector('input[name="format"]:checked').value;
      let output;
      switch (fmt) {
        case 'lines':    output = translated.join('\n'); break;
        case 'comma':    output = translated.join(', '); break;
        case 'json':     output = JSON.stringify(translated, null, 2); break;
        case 'numbered': output = translated.map((w, i) => `${i + 1}. ${w}`).join('\n'); break;
        default:         output = translated.join('\n');
      }

      outputUk.value = output;
      statUkWords.textContent = translated.length.toLocaleString('ru');
      translateStatus.textContent = 'готово ✓';

    } catch (e) {
      translateStatus.textContent = 'ошибка: ' + e.message;
      showToast('ошибка перевода');
    } finally {
      btnTranslate.disabled = false;
      btnTranslateLabel.textContent = 'Перевести список';
    }
  }

  // ── Input meta ────────────────────────────────────────────

  function updateMeta() {
    const text  = inputText.value;
    const chars = text.replace(/\s/g, '').length;
    const words = splitWords(text).length;
    metaChars.textContent = `${chars.toLocaleString('ru')} символов`;
    metaWords.textContent = `${words.toLocaleString('ru')} слов`;
  }

  // ── Copy ─────────────────────────────────────────────────

  async function copyText(text) {
    if (!text) { showToast('нечего копировать'); return; }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('скопировано ✓');
  }

  // ── Clear ─────────────────────────────────────────────────

  function clearAll() {
    inputText.value  = '';
    outputText.value = '';
    outputUk.value   = '';
    lastWords = [];
    metaChars.textContent   = '0 символов';
    metaWords.textContent   = '0 слов';
    statTotal.textContent   = '—';
    statUnique.textContent  = '—';
    statLongest.textContent = '—';
    statUkWords.textContent = '—';
    translateStatus.textContent = '';
    inputText.focus();
  }

  // ── Toast ─────────────────────────────────────────────────

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className   = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  // ── Events ────────────────────────────────────────────────

  btnRun.addEventListener('click', run);
  btnCopy.addEventListener('click', () => copyText(outputText.value));
  btnCopyUk.addEventListener('click', () => copyText(outputUk.value));
  btnClear.addEventListener('click', clearAll);
  btnTranslate.addEventListener('click', translate);
  inputText.addEventListener('input', updateMeta);
  inputText.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  inputText.addEventListener('paste', () => setTimeout(updateMeta, 0));

})();
