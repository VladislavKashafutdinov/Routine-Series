# Архив

Выполненные и отменённые задачи.

---

### 2026-08-12 — API на Go: награды (создание, просмотр, редактирование, удаление)

- `POST /api/v1/reward-issues` — создание записи выдачи награды
- `GET /api/v1/reward-issues` — просмотр всех записей выдачи наград
- `PATCH /api/v1/reward-issues/{id}` — редактирование записи (дата, сумма, валюта)
- `DELETE /api/v1/reward-issues/{id}` — удаление записи

### 2026-08-12 — API на Go: ежедневные отметки (toggle + просмотр)

- `POST /api/v1/completions/toggle` — toggle отметки на дату (добавить/убрать)
- `GET /api/v1/completions` — просмотр отметок с фильтрацией по activityId и диапазону дат

### 2026-08-12 — API на Go: переименование, архив, параметры серии

- `PATCH /api/v1/activities/{id}/rename` — переименование активности
- `POST /api/v1/activities/{id}/archive` — архивирование (soft-delete)
- `POST /api/v1/activities/{id}/restore` — восстановление из архива
- `POST /api/v1/activities/{id}/series-definition` — создание новой версии параметров серии

### 2026-08-12 — API на Go: подготовка к деплою + рефакторинг

- Dockerfile, docker-compose, env-переменные для деплоя
- Рефакторинг: валидаторы вынесены из хендлеров в отдельные функции, правило зафиксировано в developing design
- Рефакторинг: пакеты организованы по смыслам (activity, series_definition, app, pool) вместо слоёв (handlers, db, models)

### 2026-08-12 — API на Go: просмотр активностей

- `GET /api/v1/activities` — список активных (неархивных) с актуальным SeriesDefinition через LATERAL JOIN
- `GET /api/v1/activities/archived` — список архивных
- `GET /api/v1/activities/{id}` — одна активность по ID
- Swagger-аннотации для всех endpoint'ов

### 2026-08-11 — API на Go: создание активности и импорт

- **Создание активности:** модели (Activity, SeriesDefinition, ActivityWithDef), CRUD-функции с транзакцией (activities + series_definitions), `POST /api/v1/activities` с валидацией
- **Импорт данных:** `POST /api/v1/import` — multipart JSON-файл, camelCase-модели как в дампе IndexedDB, батчевая вставка через CopyFrom, TRUNCATE CASCADE перед импортом

### 2026-08-11 — API на Go: инициализация, скелет, БД, миграции

- Инициализация Go-модуля `routine-series/backend`, структура директорий, зависимости (chi, pgx, swaggo)
- Скелет API: ErrorResponse, Config, chi-роутер, middleware (Recoverer, логгер, Content-Type JSON), graceful shutdown
- Swagger/OpenAPI: аннотации в main.go, генерация docs/, Swagger UI (`/swagger/`), `swagger.json`
- Подключение к БД: `Config.DatabaseURL`, pgxpool (max=10, min=1), startup `SELECT 1`, `GET /api/v1/health`
- Миграции: golang-migrate, 4 таблицы, 3 индекса, автозапуск UP при старте

### 2026-08-10 — Деплой на GitHub Pages

- Настроен GitHub Actions workflow: configure-pages + deploy-pages
- Приложение раскатано и доступно

### 2026-08-11 — Бесплатный хостинг PostgreSQL: выбор Neon

- Supabase не подошёл: прямой доступ к БД (IPv4/Direct connections) требует платный аддон ($25/мес Pro)
- Neon Free Tier подтверждён: 0.5 GB, 100 CU-часов/мес, scale-to-zero, прямое подключение работает из коробки
- Проект создан, connection string получена

### 2026-07-21 — Отображение награды на карточке активности

- На ActivityCard показывается награда из SeriesDefinition под прогрессом (₽100)

### 2026-07-20 — Алиасы импортов

- Настроены `@/` → `src/` и `@components/` → `src/components/`
- Все не-компонентные импорты через `@/` (types, hooks, utils, i18n, db)
- Все межкомпонентные импорты через `@components/`

### 2026-07-18 — Алгоритм v2: исправление множественных активных серий

- Реализован новый алгоритм серий (VISION algorithm v2): super-series вместо разбиения по def
- Исправлен баг: больше нет двух активных серий одновременно
- 27/27 тестов проходят
- def matching: MAX creationDate (свежий def применяется корректно)

### 2026-07-17 — Техдолг: чистка кода и структура папок

- Удалён мёртвый код: EditSeriesDefinition, streak.ts, getDateRange
- Компоненты размещены по папкам (каждый со своим CSS)

### 2026-07-16 — Удаление seriesDefinition

- Кнопка удаления в SeriesDefinitionTab для def с createdAt >= virtualToday
- Нельзя удалить единственную seriesDefinition

### 2026-07-16 — Баг: completions до createdAt первого SeriesDefinition не попадали в серию

- Исправлен computeSeries: для первого def включать completions с date < defCreatedDate
**Воспроизведение:**
- Создать активность с длительностью серии 10
- Открыть календарь
- Выставить отмеченные дни так, чтобы на текущую дату выглядело:
[x] - минус 10 дней от сегодня (например, сегодня 16е число, тогда эта дата - 6е число)
[x]
[x]
[x]
[x]
[x]
[]
[x]
[x]
[x]
[] - сегодня
- На основной странице видим пустую серию - неверный результат. 

**Ожидаемый результат:** Текущая серия должна содержать 3 отмеченных дня и один пустой (сегодня)

**Вероятная причина:** completion, которые отмечены до даты создания первого seriesDefinition, не попадают в серию.
- Добавлен тест на этот сценарий (26/26)

### 2026-07-11 — SeriesContext + findCurrentSeries fix

- SeriesContext: централизованное вычисление серий, useSeries/useAllSeries
- findCurrentSeries: исключает broken, находит active и completed по virtualToday
- computeSeries: фильтрация future дат, правильное соотнесение completion↔seriesDefinition

### 2026-07-11 — Баг: длинные серии выходят за пределы карточки

- SeriesProgress и SeriesWidget: flex-wrap для квадратиков
- Выравнивание по левому краю (flex-start)

### 2026-07-11 — Алгоритм computeSeries: фильтрация будущих дат

- computeSeries теперь исключает completions и seriesDefinitions с датой > virtualToday
- findCurrentSeries вынесена в utils/series.ts + 7 тестов
- SeriesProgress: startDate/seriesLength/doneCount вместо сырых completions
- isDoneToday убран из ActivityWithStreak, вычисляется локально

### 2026-07-11 — Баг: разрывы в SeriesProgress при перемотке времени

- SeriesProgress теперь получает completions текущей серии (по virtualToday), а не все

### 2026-07-10 — Баг: пропадала форма SeriesDefinition

- Убран флаг `expanded` в AddActivity, форма параметров всегда видна

### 2026-07-10 — Баг: пустой seriesDefinitions при добавлении активности

- Добавлены проверки на пустоту seriesDefinitions в ActivityCard, ActivityAccordion, EditSeriesDefinition, SeriesDefinitionTab
- При пустом списке показывается плейсхолдер вместо краша

### 2026-07-10 — Экспорт/Импорт

- 20. DataActions: экспорт всех таблиц БД в JSON, импорт с валидацией и подтверждением
- Конвертация Date при импорте (createdAt)

### 2026-07-10 — Список предложений к начислению + рефакторинг

- 19. IssueBanner: баннер на дашборде с unissued > 0, кнопки «Начислить»
- 18. RewardCounters в RewardHistoryTab с inline-кнопками «Начислить»
- 17. Хедер аккордеона: unissued per-currency, UnissuedRow
- Баг: исправлена перемотка времени (computeSeries в компоненте, текущая серия)
- Модель ActivityWithStreak очищена от dead fields
- Расчёт наград вынесен в utils/rewards.ts (calcEarnedByCurrency, calcIssuedByCurrency, calcUnissuedByCurrency, getCurrencies)
- SeriesWidget: только отображение, входные параметры — сырые данные

### 2026-07-09 — SeriesDefinitionTab, CompletionsTab, группировка

- 13. SeriesDefinitionTab: вкладка с историей SeriesDefinition + добавление
- 14. CompletionsTab: календарь completions по месяцам с тогглом
- 15. Группировка серий по SeriesDefinition в истории
- 16. Мультивалютные счётчики наград

### 2026-07-08 — Страница мониторинга (MonitoringPage)

- **10a. MonitoringPage + ActivityAccordion** — раскрывающиеся блоки, один открыт одновременно
- **10b. VirtualTodayContext** — замена TimeOffsetContext на виртуальное «сегодня»
- **10c. SeriesHistoryTab** — список SeriesWidget с пагинацией, визуальное различие по статусам
- **10d. IssueRewardModal** — модалка выдачи награды (дата/сумма/валюта)
- **10e. RewardHistoryTab** — таблица RewardIssue с inline-редактированием, удалением, пагинацией
- Извлечены 4 переиспользуемых компонента: RewardCounters, TabSwitcher, Paginator, EditableCell
- CSS разбит на 14 per-component файлов

### 2026-07-09 — Архив + SeriesDefinition + Node.js

- **11. EditSeriesDefinition** — inline-форма изменения параметров серии, версионирование
- **12. ArchivePage** — список архивных активностей, кнопка восстановления
- **9. Node.js** — апгрейд с v16 до v24 (ESLint заработал)
- README.md: актуализирован data flow, структура данных, индексы БД
- VISION.md + TARGET_SCHEMA.md: разделение фактического и целевого состояния

### 2026-07-03 — Сетка дней по размеру серии

- ActivityGroup: ряд квадратиков равен seriesLength (вместо фиксированного числа)
- HistoryModal: сетка теперь seriesLength вместо 60
- Каждый квадрат = один день серии, заполняется по мере выполнения

---

### 2026-07-03 — Дашборд

- RewardSummary: баннер с totals по валютам для незатребованных наград
- ActivityGroup: карточка активности с прогресс-баром, кнопкой, лентой последних серий
- Серии сгруппированы по активностям, каждая в своём блоке
- Цветовая индикация статусов серий (зелёный/красный/оранжевый)

---

### 2026-07-03 — Добавление/удаление дней в серии задним числом

- `toggleDate` в хуке: общая логика для любой даты, `toggleDone` через неё
- Сетка 60 дней в модалке стала кликабельной для активной серии
- Будущие даты заблокированы, прошлые и сегодня — кликабельны
- Визуал: активная серия (яркие), старые серии (блёклые), hover-эффект

---

### 2026-07-03 — Изменение доменной модели

- Activity: поля seriesLength, reward, currency
- Series: новая сущность (active/completed/broken, rewardIssued)
- Completion: связь с Series через seriesId
- Миграция БД v1→v2
- Логика жизненного цикла серии: авто-завершение, авто-срыв
- UI: прогресс-бар, кнопка «Получить награду», история серий в модалке
- AddActivity: выпадающие поля длины серии, награды, валюты

---

### 2026-07-03 — Локализация русский/английский

- Контекст `LocaleProvider` + `useLocale` hook
- Переводы en/ru: все строки интерфейса + русские plural-формы
- Автоопределение языка из браузера, сохранение в localStorage
- Кнопка переключения RU/EN в шапке
