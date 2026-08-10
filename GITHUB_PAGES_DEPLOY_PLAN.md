# План деплоя на GitHub Pages

## 1. Настроить base в vite.config.ts

GitHub Pages хостит проект по пути /Routine-Series/ (а не в корне домена). Vite должен знать этот путь, чтобы правильно генерировать ссылки на JS/CSS/картинки. Нужно добавить:

`base: '/Routine-Series/',`

Без этого после деплоя браузер будет пытаться загрузить `vladislavkashafutdinov.github.io/assets/index.js` вместо `vladislavkashafutdinov.github.io/Routine-Series/assets/index.js` — и приложение упадёт с 404.

## 2. Создать GitHub Actions workflow

Создать файл `.github/workflows/deploy.yml`. Он будет автоматически собирать и публиковать приложение при каждом пуше в master:

```
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 16
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 3. Настроить GitHub Pages в репозитории

В настройках репозитория на GitHub:

* Settings → Pages → Source — выбрать GitHub Actions (не branch).

После первого успешного прогона workflow GitHub сам опубликует страницу.

## 4. Запушить и проверить

Сделать коммит с изменениями и `git push`. После этого:

1. Во вкладке Actions появится workflow — дождаться зелёного статуса.
2. В Settings → Pages появится URL: `https://vladislavkashafutdinov.github.io/Routine-Series/`.
3. Открыть URL и убедиться, что приложение работает.

## Что нужно учесть

* **Node.js 16** — проект завязан на ноду 16, в Actions workflow я указал node-version: 16. Всё совместимо.
* **SPA и 404** — GitHub Pages не умеет SPA-fallback (любой путь кроме / отдаст 404). Но у вас нет роутинга — переключение страниц через Page state, так что это не проблема. Если в будущем появится роутер, нужно будет добавить 404.html с редиректом на index.html.
* **IndexedDB** — данные хранятся в браузере пользователя, никакого бэкенда не требуется. GitHub Pages подходит идеально.

## Локально всё будет работать как и прежде.

Vite применяет `base` только к production-сборке (`vite build`). В dev-режиме (`npm run dev`) сервер разработки всегда отдаёт файлы с корня `/`, игнорируя `base`.

То есть:

* `npm run dev` → `localhost:5173` — без изменений ✅
* `npm run build && npm run preview` → будет отдавать с `/Routine-Series/`, как и GitHub Pages.