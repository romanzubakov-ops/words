# [ws] Word Splitter

Статический веб-сервис: вставляешь текст — получаешь список слов. Опционально — перевод каждого слова на украинский через Claude API.

## Файлы

```
word-splitter/
├── index.html   — интерфейс
├── style.css    — стили
├── app.js       — логика (разбивка + вызов Worker)
├── worker.js    — Cloudflare Worker (прокси к Anthropic API)
└── README.md
```

## Деплой — два шага

### 1. GitHub Pages (статика)

1. Залей репо на GitHub
2. Settings → Pages → Branch: `main` → Save
3. Сайт будет на `https://YOUR_NAME.github.io/REPO_NAME/`

### 2. Cloudflare Worker (перевод)

Нужен только если хочешь использовать функцию перевода на украинский.

1. Зайди на [workers.cloudflare.com](https://workers.cloudflare.com) → **Create Worker**
2. Вставь содержимое `worker.js` в редактор
3. **Settings → Variables → Add variable:**
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (твой ключ с [console.anthropic.com](https://console.anthropic.com))
   - ✅ поставь галку **Encrypt**
4. **Save & Deploy**
5. Скопируй URL воркера — выглядит как `https://xxx.YOUR_SUBDOMAIN.workers.dev`
6. Открой `app.js`, найди строку:
   ```js
   const WORKER_URL = 'https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev';
   ```
   Замени на свой URL и запушь.

### Лимиты

- Максимум 500 слов за один запрос перевода
- Cloudflare Workers бесплатный план: 100 000 запросов/день
- Anthropic API: платится по токенам (Haiku — самый дешёвый)

## Возможности

- Разбивка по пробелам, переносам строк, табуляции
- Убирает пунктуацию с краёв слов (дефис внутри сохраняет: `во-первых`)
- Нормализует апострофы внутри слов → ASCII `'` (Google-совместимый)
- Нижний регистр / дедупликация / сортировка
- Форматы: строки / запятая / JSON / нумерованный список
- Перевод списка на украинский язык (через Cloudflare Worker → Claude API)
- Копирование оригинала и перевода раздельно
- Адаптивный, работает на мобильных
- Нет зависимостей, нет сборки

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Ctrl+Enter` | Разобрать текст |
