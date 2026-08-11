# Дневник

## 2026-08-11

- Исследован Supabase как бесплатный хостинг PostgreSQL: не подходит — прямой доступ к БД (IPv4) платный аддон ($25/мес Pro)
- Исследован Neon Free Tier: 0.5 GB, 100 CU-часов/мес, прямое подключение работает, проект создан
- Обе задачи перенесены в DONE.md
- Инициализирован Go-бэкенд (`backend/`): модуль `routine-series/backend`, структура директорий, зависимости (chi, pgx, swaggo), `.env.example`, `README.md`
- Реализован скелет API: ErrorResponse, Config, chi-роутер с middleware (Recoverer, логгер, Content-Type JSON), graceful shutdown (SIGINT/SIGTERM, 30с)
- Настроен Swagger/OpenAPI: аннотации в main.go, генерация docs/, отдача Swagger UI (`/swagger/`) и `swagger.json` (`/api/v1/swagger.json`)

## 2026-08-10

- Настроен GitHub Pages деплой: workflow с configure-pages + deploy-pages, приложение раскатано и доступно
- Обновлён BACKEND_DEVELOPING_PLAN.md: реструктурирован план, п.0 (раскатка на github pages) отмечен выполненным
- В TODO.md добавлен раздел «Разработка бэка» с первым пунктом про Supabase Postgres
- В CLAUDE.md добавлено правило import aliases: `@/` для кросс-модулей, `@components/` для компонентов, относительные импорты только внутри одной папки компонента

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

## 2026-07-21

- На карточке активности показывается награда из SeriesDefinition

## 2026-07-20

- Рефакторинг: добавлены алиасы `@/` и `@components/` для импортов

## 2026-07-18

- Реализован алгоритм v2: super-series, MAX-def matching, 27/27 тестов
- Исправлен баг множественных активных серий

## 2026-07-17

- Техдолг: удалён мёртвый код, компоненты разнесены по папкам

## 2026-07-16

- Удаление seriesDefinition (createdAt >= virtualToday, не единственная)
- Исправлен баг: completions до createdAt первого SeriesDefinition не попадали в серию
- Написан тест на этот сценарий (26/26)

## 2026-07-11

- SeriesContext: вычисление серий один раз вместо дублирования в компонентах
- findCurrentSeries: исключает broken, находит active и completed
- Исправлен баг: неверная seriesDefinition при формировании серий
- Исправлен баг: длинные серии выходят за пределы карточки (flex-wrap, left-align)
- Исправлен баг: разрывы в SeriesProgress при перемотке времени (текущая серия + фильтрация будущих дат)

## 2026-07-10 (финал)

- Исправлен баг: форма SeriesDefinition пропадала после добавления (убран флаг expanded)
- Исправлен баг: ошибка `Cannot read properties of undefined (reading 'seriesLength')` при добавлении активности
- Добавлены проверки пустоты seriesDefinitions во всех компонентах-потребителях

## 2026-07-10 (завершение)

- 20. Экспорт/Импорт: JSON-файл со всеми таблицами БД
  - Экспорт: скачивание всех данных одним файлом
  - Импорт: валидация структуры, подтверждение, конвертация Date, reload
- Все задачи из TODO.md выполнены
- В работе остались только отложенные и баги

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

## 2026-07-10

- Синхронизированы VISION.md и TARGET_SCHEMA.md (устранены все несостыковки)
- SeriesDefinitionTab добавлен в целевую схему
- TODO.md очищен от выполненных задач, оставлен только 13 и отложенные
- DONE.md пополнен записями за 08-09.07
