/* ============================================================
   WORD SPLITTER — app.js
   ============================================================ */

(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────
  // Вставь URL своего Cloudflare Worker:
  const WORKER_URL = 'https://ancient-shadow-1f82.roman-zubakov.workers.dev';

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
  const optSort      = document.getElementById('optSort');
  const optStopsFunc = document.getElementById('optStopsFunc');
  const optStopsInfo = document.getElementById('optStopsInfo');

  // ── Core logic ────────────────────────────────────────────

  // ── Stopwords ─────────────────────────────────────────────

  // Предлоги, союзы, частицы, местоимения — Google их игнорирует, минусовать не нужно
  const STOPWORDS_FUNC = new Set([
    // RU
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
    // UK
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

  // Информационные слова — для фильтрации информационных запросов
  const STOPWORDS_INFO = new Set([
    // RU
    'как','зачем','почему','сколько','где','когда','куда','откуда','кто','что','чей',
    'какой','какая','какое','какие','который','которая','которое','которые',
    'отчего','доколе','доколь','насколько','поскольку','постольку',
    'можно','нельзя','нужно','надо','стоит','следует',
    'отзыв','отзывы','отзыве','обзор','обзоры','форум','вики','wikipedia',
    'своими','руками','сам','сама','сами','самому','самостоятельно','бесплатно',
    'скачать','скачай','загрузить','онлайн','смотреть','читать','слушать',
    // UK
    'як','навіщо','чому','скільки','де','коли','куди','звідки','хто','що','чий',
    'який','яка','яке','які','можна','не можна','треба','потрібно','варто','слід',
    'відгук','відгуки','огляд','огляди','форум','вікі',
    'своїми','руками','сам','сама','самі','самостійно','безкоштовно',
    'завантажити','онлайн','дивитись','читати','слухати',
  ]);


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
    if (optSort.checked)       words = words.sort((a, b) => a.localeCompare(b, ['ru', 'uk', 'en'], { sensitivity: 'base' }));
    if (optStopsFunc && optStopsFunc.checked) words = words.filter(w => !STOPWORDS_FUNC.has(w.toLowerCase()));
    if (optStopsInfo && optStopsInfo.checked) words = words.filter(w => !STOPWORDS_INFO.has(w.toLowerCase()));
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

  // ── Translation via Cloudflare Worker → OpenAI ────────────

  async function translate() {
    if (!lastWords.length) { showToast('сначала разберите текст'); return; }

    btnTranslate.disabled = true;
    btnTranslateLabel.textContent = 'переводим…';
    translateStatus.textContent = `отправляем ${lastWords.length} слов…`;

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: lastWords }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }

      const data = await res.json();
      if (!Array.isArray(data.words)) throw new Error('неверный ответ от сервера');

      const translated = data.words;
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


  // ── Declension ────────────────────────────────────────────

  const btnDecline      = document.getElementById('btnDecline');
  const btnDeclineLabel = document.getElementById('btnDeclineLabel');
  const declineStatus   = document.getElementById('declineStatus');
  const declineOutput   = document.getElementById('declineOutput');
  const declineContent  = document.getElementById('declineContent');
  const btnCopyDecline  = document.getElementById('btnCopyDecline');
  const optDeclRu       = document.getElementById('optDeclRu');
  const optDeclUk       = document.getElementById('optDeclUk');

  async function decline() {
    if (!lastWords.length) { showToast('сначала разберите текст'); return; }

    const langs = [];
    if (optDeclRu.checked) langs.push('ru');
    if (optDeclUk.checked) langs.push('uk');
    if (!langs.length) { showToast('выберите хотя бы один язык'); return; }

    btnDecline.disabled = true;
    btnDeclineLabel.textContent = 'склоняем…';
    declineStatus.textContent = `отправляем ${lastWords.length} слов…`;

    try {
      const res = await fetch(WORKER_URL + '/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: lastWords, langs }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      declineContent.innerHTML = '';
      const langLabel = { ru: 'русский', uk: 'украинский' };

      for (const lang of langs) {
        const forms = data[lang];
        if (!forms || forms.error) continue;

        const lbl = document.createElement('div');
        lbl.className = 'decline-lang-label';
        lbl.textContent = langLabel[lang];
        declineContent.appendChild(lbl);

        for (const word of lastWords) {
          const block = document.createElement('div');
          block.className = 'decline-block';

          const wordEl = document.createElement('div');
          wordEl.className = 'decline-word';
          wordEl.textContent = word;

          const formsEl = document.createElement('div');
          formsEl.className = 'decline-forms';
          formsEl.textContent = forms[word] || '—';
          formsEl.title = 'нажми чтобы скопировать';
          formsEl.addEventListener('click', () => copyText(formsEl.textContent));

          block.appendChild(wordEl);
          block.appendChild(formsEl);
          declineContent.appendChild(block);
        }
      }

      declineOutput.style.display = 'block';
      declineStatus.textContent = 'готово ✓';

    } catch (e) {
      declineStatus.textContent = 'ошибка: ' + e.message;
      showToast('ошибка склонения');
    } finally {
      btnDecline.disabled = false;
      btnDeclineLabel.textContent = 'Склонять список';
    }
  }

  function copyAllDecline() {
    const blocks = declineContent.querySelectorAll('.decline-forms');
    const text = Array.from(blocks).map(b => b.textContent).join('\n');
    copyText(text);
  }

  btnDecline.addEventListener('click', decline);
  btnCopyDecline.addEventListener('click', copyAllDecline);

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
