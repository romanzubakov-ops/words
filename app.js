/* ============================================================
   WORD SPLITTER — app.js
   ============================================================ */

(function () {
  'use strict';

  const WORKER_URL = 'https://ancient-shadow-1f82.roman-zubakov.workers.dev';

  // ── DOM refs ──────────────────────────────────────────────
  const inputText         = document.getElementById('inputText');
  const outputText        = document.getElementById('outputText');
  const outputUk          = document.getElementById('outputUk');
  const outputCollect     = document.getElementById('outputCollect');
  const panelCollect      = document.getElementById('panelCollect');
  const btnRun            = document.getElementById('btnRun');
  const btnCopy           = document.getElementById('btnCopy');
  const btnCopyUk         = document.getElementById('btnCopyUk');
  const btnCopyCollect    = document.getElementById('btnCopyCollect');
  const btnClear          = document.getElementById('btnClear');
  const btnTranslate      = document.getElementById('btnTranslate');
  const btnTranslateLabel = document.getElementById('btnTranslateLabel');
  const translateStatus   = document.getElementById('translateStatus');
  const btnCollect        = document.getElementById('btnCollect');
  const btnCollectLabel   = document.getElementById('btnCollectLabel');
  const collectStatus     = document.getElementById('collectStatus');
  const metaChars         = document.getElementById('metaChars');
  const metaWords         = document.getElementById('metaWords');
  const statTotal         = document.getElementById('statTotal');
  const statUnique        = document.getElementById('statUnique');
  const statLongest       = document.getElementById('statLongest');
  const statUkWords       = document.getElementById('statUkWords');
  const statCollect       = document.getElementById('statCollect');

  const optPunct      = document.getElementById('optPunct');
  const optLower      = document.getElementById('optLower');
  const optDupes      = document.getElementById('optDupes');
  const optSort       = document.getElementById('optSort');
  const optStopsFunc  = document.getElementById('optStopsFunc');
  const optStopsInfo  = document.getElementById('optStopsInfo');
  const optCollectRu  = document.getElementById('optCollectRu');
  const optCollectUk  = document.getElementById('optCollectUk');

  // ── Stopwords ─────────────────────────────────────────────

  const STOPWORDS_FUNC = new Set([
    'в','во','на','с','со','из','к','ко','по','до','от','ото','за','под','над','при','про',
    'без','безо','через','сквозь','между','среди','около','вокруг','вдоль','напротив',
    'вместо','кроме','помимо','для','ради','насчёт','о','об','обо','у','перед','передо',
    'и','или','но','а','да','зато','однако','либо','ни','не','же','бы','ли','ведь','вот',
    'вон','ну','уж','даже','именно','лишь','только','хоть','хотя','если','пока','пусть',
    'чтобы','чтоб','то','это','этот','эта','эти','те','тот','та','так',
    'я','ты','он','она','оно','мы','вы','они','мне','тебе','ему','ей','нам','вам','им',
    'меня','тебя','его','её','нас','вас','их','себя','себе',
    'свой','своя','своё','свои','мой','моя','моё','мои','твой','твоя','твоё','твои',
    'наш','наша','наше','наши','ваш','ваша','ваше','ваши',
    'который','которая','которое','которые',
    'быть','есть','был','была','было','были','буду','будет','будут','будем','будете',
    'весь','вся','всё','все','каждый','каждая','каждое','каждые',
    'любой','любая','любое','любые','один','одна','одно','одни',
    'другой','другая','другое','другие','такой','такая','такое','такие',
    'очень','более','менее','уже','ещё','тоже','также','потому','поэтому',
    'здесь','там','тут','сюда','туда','из-за','из-под',
    'у','з','із','зі','від','між','серед','біля','навколо','вздовж','замість','крім',
    'окрім','заради','й','та','але','проте','однак','або','чи','ж','б','би','адже',
    'ось','он','навіть','саме','лише','тільки','хоч','хоча','якщо','поки','нехай',
    'щоб','це','цей','ця','ці','той','те','ті','він','вона','воно','вони','мені',
    'тобі','йому','їй','їм','себе','собі','свій','своя','своє','свої',
    'мій','моя','моє','мої','твій','твоя','твоє','твої',
    'який','яка','яке','які','бути','є','буде','будуть','будемо','будете',
    'весь','вся','всі','кожний','кожна','кожне','кожні',
    'будь-який','інший','інша','інше','інші','такий','така','таке','такі',
    'дуже','більш','менш','ще','теж','також','тому','сюди','туди','звідки',
    'ні','не','а','і','в','на','з','до','по','за','під','над','при','про','без',
    'через','для','о','об',
  ]);

  const STOPWORDS_INFO = new Set([
    'як','навіщо','чому','скільки','де','коли','куди','звідки','хто','що','чий',
    'який','яка','яке','які','можна','треба','потрібно','варто','слід',
    'відгук','відгуки','огляд','огляди','форум','вікі',
    'своїми','руками','сам','сама','самі','самостійно','безкоштовно',
    'завантажити','онлайн','дивитись','читати','слухати',
    'как','зачем','почему','сколько','где','когда','куда','откуда','кто','что','чей',
    'какой','какая','какое','какие','который','которая','которое','которые',
    'можно','нельзя','нужно','надо','стоит','следует',
    'отзыв','отзывы','обзор','обзоры','форум','вики','wikipedia',
    'своими','руками','самому','самостоятельно','бесплатно',
    'скачать','загрузить','онлайн','смотреть','читать','слушать',
  ]);

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
    if (optLower.checked)      words = words.map(w => w.toLowerCase());
    if (optDupes.checked)      words = [...new Set(words)];
    if (optSort.checked)       words = words.sort((a, b) => a.localeCompare(b, ['ru', 'uk', 'en'], { sensitivity: 'base' }));
    if (optStopsFunc.checked)  words = words.filter(w => !STOPWORDS_FUNC.has(w.toLowerCase()));
    if (optStopsInfo.checked)  words = words.filter(w => !STOPWORDS_INFO.has(w.toLowerCase()));
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
    outputCollect.value = '';
    panelCollect.style.display = 'none';
    statUkWords.textContent = '—';
    statCollect.textContent = '—';
    translateStatus.textContent = '';
    collectStatus.textContent = '';

    const uniqueSet = new Set(lastWords.map(w => w.toLowerCase()));
    const longest   = lastWords.reduce((max, w) => w.length > max.length ? w : max, '');
    statTotal.textContent   = lastWords.length.toLocaleString('ru');
    statUnique.textContent  = uniqueSet.size.toLocaleString('ru');
    statLongest.textContent = longest || '—';
  }

  // ── Translate ─────────────────────────────────────────────

  async function translate() {
    if (!lastWords.length) { showToast('сначала разберите текст'); return; }
    btnTranslate.disabled = true;
    btnTranslateLabel.textContent = 'переводим…';
    translateStatus.textContent = `${lastWords.length} слов…`;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: lastWords }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!Array.isArray(data.words)) throw new Error('неверный ответ');
      outputUk.value = formatWords(data.words);
      statUkWords.textContent = data.words.length.toLocaleString('ru');
      translateStatus.textContent = 'готово ✓';
    } catch (e) {
      translateStatus.textContent = 'ошибка: ' + e.message;
      showToast('ошибка перевода');
    } finally {
      btnTranslate.disabled = false;
      btnTranslateLabel.textContent = 'Перевести список';
    }
  }

  // ── Collect all forms ─────────────────────────────────────

  const COLLECT_BATCH = 20; // слов за один запрос

  async function collect() {
    if (!lastWords.length) { showToast('сначала разберите текст'); return; }

    const langs = [];
    if (optCollectRu.checked) langs.push('ru');
    if (optCollectUk.checked) langs.push('uk');
    if (!langs.length) { showToast('выберите хотя бы один язык'); return; }

    btnCollect.disabled = true;
    btnCollectLabel.textContent = 'собираем…';
    outputCollect.value = '';
    panelCollect.style.display = 'none';

    const totalBatches = Math.ceil(lastWords.length / COLLECT_BATCH) * langs.length;
    let doneBatches = 0;
    const allForms = new Set();
    const startTime = Date.now();

    // Таймер — обновляет каждую секунду
    const timerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      const pct = totalBatches ? Math.round(doneBatches / totalBatches * 100) : 0;
      collectStatus.textContent = `батч ${doneBatches}/${totalBatches} · ${pct}% · ${sec}с`;
    }, 1000);

    try {
      // Все батчи запускаем параллельно через Promise.all
      const tasks = [];
      for (const lang of langs) {
        for (let i = 0; i < lastWords.length; i += COLLECT_BATCH) {
          const batch = lastWords.slice(i, i + COLLECT_BATCH);
          tasks.push({ batch, lang });
        }
      }

      await Promise.all(tasks.map(async ({ batch, lang }) => {
        const res = await fetch(WORKER_URL + '/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: batch, lang }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!Array.isArray(data.forms)) throw new Error('неверный ответ');
        data.forms.forEach(f => allForms.add(f));
        doneBatches++;
        const pct = Math.round(doneBatches / totalBatches * 100);
        const sec = Math.floor((Date.now() - startTime) / 1000);
        collectStatus.textContent = `батч ${doneBatches}/${totalBatches} · ${pct}% · ${sec}с`;
      }));

      const sorted = [...allForms].sort((a, b) => a.localeCompare(b, ['ru', 'uk'], { sensitivity: 'base' }));
      const sec = Math.floor((Date.now() - startTime) / 1000);

      outputCollect.value = sorted.join('\n');
      statCollect.textContent = sorted.length.toLocaleString('ru');
      panelCollect.style.display = 'flex';
      collectStatus.textContent = `готово ✓ — ${sorted.length} форм за ${sec}с`;

    } catch (e) {
      collectStatus.textContent = 'ошибка: ' + e.message;
      showToast('ошибка сборки');
    } finally {
      clearInterval(timerInterval);
      btnCollect.disabled = false;
      btnCollectLabel.textContent = 'Собрать всё';
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
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    showToast('скопировано ✓');
  }

  // ── Clear ─────────────────────────────────────────────────

  function clearAll() {
    inputText.value = ''; outputText.value = ''; outputUk.value = ''; outputCollect.value = '';
    lastWords = [];
    panelCollect.style.display = 'none';
    metaChars.textContent = '0 символов'; metaWords.textContent = '0 слов';
    statTotal.textContent = '—'; statUnique.textContent = '—'; statLongest.textContent = '—';
    statUkWords.textContent = '—'; statCollect.textContent = '—';
    translateStatus.textContent = ''; collectStatus.textContent = '';
    inputText.focus();
  }

  // ── Toast ─────────────────────────────────────────────────

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  // ── Events ────────────────────────────────────────────────

  btnRun.addEventListener('click', run);
  btnCopy.addEventListener('click', () => copyText(outputText.value));
  btnCopyUk.addEventListener('click', () => copyText(outputUk.value));
  btnCopyCollect.addEventListener('click', () => copyText(outputCollect.value));
  btnClear.addEventListener('click', clearAll);
  btnTranslate.addEventListener('click', translate);
  btnCollect.addEventListener('click', collect);
  inputText.addEventListener('input', updateMeta);
  inputText.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  inputText.addEventListener('paste', () => setTimeout(updateMeta, 0));

})();
