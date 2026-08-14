# Дневник

## 2026-07-03

- Инициализирован проект
- Создан приватный репозиторий на GitHub
- Развёрнут стек: Vite 4 + React 18 + TypeScript + Dexie.js
- Реализован трекер ежедневных серий
- Настроена сборка и type-check
- Созданы README.md, CLAUDE.md, TODO.md, DONE.md, JOURNAL.md
- Добавлена локализация русский/английский
- Переработана доменная модель (Activity, Series, Completion, миграция БД)
- Добавлено редактирование дней активной серии задним числом (клик по клеткам в модалке)
- Переработан дашборд: сводка наград по валютам, группировка по активностям, лента серий
- Сетка дней в карточке и модалке приведена к размеру seriesLength (квадратики = дням серии)

## 2026-07-08

- Создана страница мониторинга: MonitoringPage, ActivityAccordion
- Аккордеон с RewardCounters, TabSwitcher, раскрытием (один одновременно)
- SeriesHistoryTab: список SeriesWidget сгруппирован по SeriesDefinition, пагинация
- Визуальные статусы серий (active/completed/broken) с бейджами и цветом
- SeriesWidget layout: swidget__progress (даты + квадратики) + swidget__badge
- RewardHistoryTab: таблица RewardIssue, inline-редактирование (EditableCell), удаление
- IssueRewardModal: оверлей выдачи награды (дата/сумма/валюта)
- Вынесены переиспользуемые компоненты: Paginator, TabSwitcher, RewardCounters
- CSS разбит на 14 per-component файлов
- Актуализирован README: data flow, индексы БД, реализованная схема компонентов

## 2026-07-09

- VirtualTodayContext: замена TimeOffsetContext (offset) на виртуальное «сегодня» (string)
- TimeTravel переписан: работает напрямую с setVirtualToday
- Все компоненты переведены на useVirtualToday, TimeOffsetContext удалён
- EditSeriesDefinition: inline-форма с версионированием (создаёт новый SeriesDefinition)
- ArchivePage: список архивных активностей, кнопка восстановления с подтверждением
- unarchiveActivity в хуке, archivedActivities в liveQuery
- Документация: VISION.md (целевое состояние), TARGET_SCHEMA.md (целевая схема)
- Актуализированы структура данных и индексы БД в README

## 2026-07-10

- Синхронизированы VISION.md и TARGET_SCHEMA.md (устранены все несостыковки)
- SeriesDefinitionTab добавлен в целевую схему
- TODO.md очищен от выполненных задач, оставлен только 13 и отложенные
- DONE.md пополнен записями за 08-09.07

## 2026-07-10 (продолжение)

- 13. SeriesDefinitionTab: вкладка с историей SeriesDefinition + добавление
- 14. CompletionsTab: календарь completions по месяцам, клик-тоггл
- 15. Группировка серий по SeriesDefinition в истории
- 16. Мультивалютные счётчики наград (earnedByCurrency и т.д.)
- 17. Хедер аккордеона переработан под VISION (UnissuedRow, per-currency)
- 18. RewardCounters в RewardHistoryTab с inline-кнопками «Начислить»
- 19. IssueBanner на Dashboard: список предложений к начислению
- Доработка SeriesWidget: display-only, сырые входные параметры
- Исправлен баг перемотки времени: computeSeries в компонентах, текущая серия
- Модель ActivityWithStreak очищена от dead fields (6 полей удалено)
- Расчёт наград вынесен в utils/rewards.ts
- Актуализированы README, CLAUDE.md, DONE.md, JOURNAL.md

## 2026-07-10 (завершение)

- 20. Экспорт/Импорт: JSON-файл со всеми таблицами БД
  - Экспорт: скачивание всех данных одним файлом
  - Импорт: валидация структуры, подтверждение, конвертация Date, reload
- Все задачи из TODO.md выполнены
- В работе остались только отложенные и баги

## 2026-07-10 (финал)

- Исправлен баг: форма SeriesDefinition пропадала после добавления (убран флаг expanded)
- Исправлен баг: ошибка `Cannot read properties of undefined (reading 'seriesLength')` при добавлении активности
- Добавлены проверки пустоты seriesDefinitions во всех компонентах-потребителях

## 2026-07-11

- SeriesContext: вычисление серий один раз вместо дублирования в компонентах
- findCurrentSeries: исключает broken, находит active и completed
- Исправлен баг: неверная seriesDefinition при формировании серий
- Исправлен баг: длинные серии выходят за пределы карточки (flex-wrap, left-align)
- Исправлен баг: разрывы в SeriesProgress при перемотке времени (текущая серия + фильтрация будущих дат)

## 2026-07-16

- Удаление seriesDefinition (createdAt >= virtualToday, не единственная)
- Исправлен баг: completions до createdAt первого SeriesDefinition не попадали в серию
- Написан тест на этот сценарий (26/26)

## 2026-07-17

- Техдолг: удалён мёртвый код, компоненты разнесены по папкам

## 2026-07-18

- Реализован алгоритм v2: super-series, MAX-def matching, 27/27 тестов
- Исправлен баг множественных активных серий

## 2026-07-20

- Рефакторинг: добавлены алиасы `@/` и `@components/` для импортов

## 2026-07-21

- На карточке активности показывается награда из SeriesDefinition

## 2026-08-10

- Настроен GitHub Pages деплой: workflow с configure-pages + deploy-pages, приложение раскатано и доступно
- Обновлён BACKEND_DEVELOPING_PLAN.md: реструктурирован план, п.0 (раскатка на github pages) отмечен выполненным
- В TODO.md добавлен раздел «Разработка бэка» с первым пунктом про Supabase Postgres
- В CLAUDE.md добавлено правило import aliases: `@/` для кросс-модулей, `@components/` для компонентов, относительные импорты только внутри одной папки компонента

## 2026-08-11

- Исследован Supabase как бесплатный хостинг PostgreSQL: не подходит — прямой доступ к БД (IPv4) платный аддон ($25/мес Pro)
- Исследован Neon Free Tier: 0.5 GB, 100 CU-часов/мес, прямое подключение работает, проект создан
- Обе задачи перенесены в DONE.md
- Инициализирован Go-бэкенд (`backend/`): модуль `routine-series/backend`, структура директорий, зависимости (chi, pgx, swaggo), `.env.example`, `README.md`
- Реализован скелет API: ErrorResponse, Config, chi-роутер с middleware (Recoverer, логгер, Content-Type JSON), graceful shutdown (SIGINT/SIGTERM, 30с)
- Настроен Swagger/OpenAPI: аннотации в main.go, генерация docs/, отдача Swagger UI (`/swagger/`) и `swagger.json` (`/api/v1/swagger.json`)
- Подключена БД + health-check: `Config.DatabaseURL`, `pgxpool` (max=10, min=1), startup `SELECT 1`, структура `App` для DI, `GET /api/v1/health` с проверкой БД, graceful shutdown закрывает пул
- Написаны миграции БД: `golang-migrate`, 4 таблицы (`activities`, `series_definitions`, `completions`, `reward_issues`), 3 индекса, автозапуск UP при старте сервера
- Реализовано создание активности: модели (Activity, SeriesDefinition, ActivityWithDef), CRUD (транзакция activities + series_definitions), `POST /api/v1/activities` с валидацией, Swagger-аннотации
- Реализован импорт данных: `POST /api/v1/import` принимает JSON-файл (multipart), camelCase-модели как в дампе IndexedDB, батчевая вставка через CopyFrom, TRUNCATE CASCADE перед импортом

## 2026-08-12

- Реализован просмотр активностей: `GET /api/v1/activities`, `GET /api/v1/activities/archived`, `GET /api/v1/activities/{id}`, LATERAL JOIN для актуального SeriesDefinition, Swagger
- Реализована подготовка к деплою: Dockerfile, docker-compose, env-переменные
- Реализовано переименование активности: `PATCH /api/v1/activities/{id}/rename`
- Реализовано архивирование и восстановление: `POST /api/v1/activities/{id}/archive`, `POST /api/v1/activities/{id}/restore`
- Реализовано управление параметрами серии: `POST /api/v1/activities/{id}/series-definition`
- Рефакторинг: выделены валидаторы для хендлеров со сложными входными данными, правило зафиксировано в developing design
- Рефакторинг: пакеты организованы по смыслам (activity, series_definition, app, pool) вместо слоёв (handlers, db, models)
- Реализован toggle ежедневных отметок: `POST /api/v1/completions/toggle`
- Реализован просмотр ежедневных отметок: `GET /api/v1/completions`
- Реализовано создание и просмотр наград: `POST /api/v1/reward-issues`, `GET /api/v1/reward-issues`
- Реализовано редактирование наград: `PATCH /api/v1/reward-issues/{id}`
- Реализовано удаление наград: `DELETE /api/v1/reward-issues/{id}`
- Перенос выполненных задач из TODO.md в DONE.md
- Фиксы API вне плана: `PATCH /api/v1/reward-issues/{id}` расширен на изменение currency и date; `DELETE /api/v1/activities/{id}` — жёсткое удаление активности без связанных записей
- Составлен план BACKEND_2_FRONTEND_API_PLAN.md (подключение фронта к API), новые задачи добавлены в TODO
- п.1 «Ветка и конфигурация»: подготовка фронта к API — ветка `front-backend-integration`, `VITE_API_BASE_URL`, Vite dev-прокси `/api`
- п.2 «CORS на бэкенде»: CORS middleware для localhost и GitHub Pages

## 2026-08-13

- п.3 «Создание активности через API»: теневая мутация `createActivity` — `src/api/` (types, mapping, client, fetch), вызов после Dexie в `useActivities.addActivity`
- п.4 «Отметка выполнения через API»: теневая мутация `toggleCompletion` — `ApiCompletion`, `ApiToggleResponse`, `toCompletion()`, вызовы в `toggleDone` и `toggleDate`
- Фиксы вне TODO:
  - CORS: разрешённые origins вынесены в env-переменную `ALLOWED_ORIGINS`
  - Swagger: убран захардкоженный host, используется origin страницы
  - Обработка ошибок в API: общий `api.WriteError` вместо дублей `writeError`, внедряемый Logger, логируется причина сбоя импорта

## 2026-08-14

- п.5 «Переименование активности через API»: теневая мутация `updateActivity` → `PATCH /api/v1/activities/{id}`, вызов после Dexie в `useActivities.updateName`
- Фикс вне TODO: dataimport — `setval` только для непустых таблиц (пустой импорт падал с «value 0 is out of bounds for sequence»)
- п.6 «Архивирование, восстановление и удаление через API»: теневые мутации archive/restore/hard-delete (409 → fallback на archive), `client.ts` разбит на per-section файлы (`activities.ts`, `completions.ts`)
- п.7 «Параметры серии через API»: теневые мутации создания/удаления seriesDefinition (`seriesDefinitions.ts`), попутно исправлены conditional hooks в SeriesDefinitionTab
- п.8 «Награды через API»: теневые мутации create/update/delete (`rewardIssues.ts`), типы `ApiRewardIssue`, `ApiPaginatedRewardIssues`, `toRewardIssue()`
- п.9 «Переключение чтения с Dexie на API»: `ActivitiesProvider`/`ActivitiesContext` — данные загружаются через API, `useActivities` стал консьюмером контекста, `main.tsx` обёрнут в провайдер, Dexie-чтение (liveQuery) убрано
- п.10 «Экспорт и импорт через API»: DataActions переведён с Dexie на API — экспорт собирает данные через API-чтение, импорт через `POST /api/v1/import`; добавлены `dataimport.ts`, экспортные типы и обратный маппинг
- п.11 «Удаление Dexie»: пакет `dexie` удалён, `src/db/db.ts` удалён
- Обновлена документация после миграции: README.md, CLAUDE.md, BACKEND_DEVELOPING_PLAN.md
- Ветка `front-backend-integration` влита в master (PR #1), фронт на GitHub Pages работает через API и БД на хосте
- Деплой: адрес API задаётся переменной репозитория `VITE_API_BASE_URL`
- Составлен план email-авторизации EMAIL_AUTH_DEV_PLAN.md, добавлено правило сквозных фич
- 0. Первоначальная подготовка: создана ветка `dev`, создана dev-БД (бранч Neon dev), локальный бэк настроен на dev-БД, `http://localhost:5173` добавлен в CORS, локальный фронт настроен на локальный бэк
