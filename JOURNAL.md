# Дневник

## 2026-07-03

- Инициализирован проект
- Создан приватный репозиторий на GitHub
- Развёрнут стек: Vite 4 + React 18 + TypeScript + Dexie.js
- Реализован трекер ежедневных серий
- Настроена сборка и type-check
- Созданы README.md, CLAUDE.md, TODO.md, DONE.md, JOURNAL.md
- Добавлена локализация русский/английский
- Переработана доменная модель:
  - Activity: seriesLength, reward, currency
  - Новая сущность Series (active/completed/broken, rewardIssued)
  - Completion привязан к Series
  - Прогресс-бар, получение награды, история серий
