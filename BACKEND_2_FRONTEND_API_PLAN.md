# План пункта 2: Подключение фронта к API

Ссылка на родительский план: [BACKEND_DEVELOPING_PLAN.md](BACKEND_DEVELOPING_PLAN.md) → п. 2

Ветка: `front-backend-integration` (отдельная от master, чтобы не затронуть работающую версию на GitHub Pages).

## Стратегия

Подключение идёт в два этапа:

1. **Теневые записи (шаги 3–8).** Для каждой мутации добавляется вызов API *параллельно* с существующим вызовом Dexie. Dexie остаётся источником данных для UI — приложение продолжает работать как раньше. Результат каждого шага проверяется: операция в UI + запись появилась в Swagger/БД.
2. **Переключение чтения (шаг 9).** Когда все мутации пишут в API, чтение переключается с Dexie `liveQuery` на загрузку через API. UI живёт на данных из PostgreSQL.
3. **Экспорт/импорт (шаг 10).** Компонент `DataActions` переводится с Dexie на API: экспорт читает через API, импорт использует `POST /api/v1/import`.
4. **Очистка (шаг 11).** Dexie удаляется.

---

## 1. ✅ Ветка и конфигурация

Ветка `front-backend-integration` уже создана. Переключиться на неё: `git checkout front-backend-integration`.

Добавить `VITE_API_BASE_URL` в `.env.example` с плейсхолдером и в `.env` с реальным URL задеплоенного бэкенда. Настроить Vite dev-прокси для `/api`.

**Проверка:** `git branch` показывает `* front-backend-integration`. `npm run dev`, открыть `http://localhost:5173/api/v1/health` — возвращает `{"status":"ok"}`.

---

## 2. ✅ CORS на бэкенде

Добавить CORS middleware в `backend/cmd/server/main.go` (разрешить origin GitHub Pages и localhost с любым портом). Задеплоить обновлённый бэкенд на хост.

**Проверка:** `curl -H "Origin: http://localhost:5173" -v <API_URL>/api/v1/health` — в ответе есть `Access-Control-Allow-Origin`.

---

## 3. ✅ Создание активности через API (первая теневая мутация)

Создать три файла:
- `src/api/types.ts` — интерфейсы `ApiActivity`, `ApiSeriesDefinition`, `ApiActivityWithDef`, `ApiError` (snake_case-поля, даты — строки)
- `src/api/mapping.ts` — функции `toActivity()` и `toSeriesDefinition()` (snake_case → camelCase, строки дат → Date)
- `src/api/client.ts` — fetch-обёртка `apiFetch()` и функция `createActivity(name, seriesLength, reward, currency)`, вызывающая `POST /api/v1/activities`

В `useActivities.addActivity`: после Dexie-вызовов добавить вызов `createActivity(...)`. Вызов API — «в фоне» (не блокирует UI, ошибка пишется в консоль).

**Проверка:** создать активность в UI → появилась в списке (Dexie) + видна в Swagger `GET /api/v1/activities` (API).

---

## 4. ✅ Отметка выполнения через API

Добавить в `src/api/types.ts`: `ApiCompletion`, `ApiToggleResponse`. В `mapping.ts`: `toCompletion()`. В `client.ts`: `toggleCompletion(activityId, date)` → `POST /api/v1/completions/toggle`.

В `useActivities.toggleDone` и `toggleDate`: после Dexie добавить вызов `toggleCompletion(...)`.

**Проверка:** отметить/отменить день в UI → работает как раньше + completion появляется/исчезает в Swagger `GET /api/v1/completions`.

---

## 5. ✅ Переименование активности через API

Добавить в `client.ts`: `updateActivity(id, name)` → `PATCH /api/v1/activities/{id}`. В `useActivities.updateName`: после Dexie добавить вызов API.

**Проверка:** переименовать активность → название изменилось в UI + в Swagger `GET /api/v1/activities` новое имя.

---

## 6. ✅ Архивирование, восстановление и удаление через API

Добавить в `client.ts`:
- `archiveActivity(id)` → `POST /api/v1/activities/{id}/archive`
- `restoreActivity(id)` → `POST /api/v1/activities/{id}/restore`
- `deleteActivityHard(id)` → `DELETE /api/v1/activities/{id}` (может вернуть 409)

В `useActivities.deleteActivity`: после Dexie-логики добавить вызов API — сначала `deleteActivityHard()`, если вернулся 409 (есть связанные записи) → `archiveActivity()`. В `useActivities.unarchiveActivity`: после Dexie добавить вызов `restoreActivity(...)`.

**Проверка:**
- Удалить активность без выполнений → жёсткое удаление, исчезла из Swagger `GET /api/v1/activities`.
- Удалить активность с выполнениями → soft-delete, в архиве (UI) + `archived: true` в Swagger.
- Восстановить → в основном списке (UI) + `archived: false` в Swagger.

---

## 7. ✅ Параметры серии через API

Добавить в `client.ts`:
- `fetchSeriesDefinitions(activityId)` → `GET /api/v1/activities/{id}/series-definitions`
- `createSeriesDefinition(activityId, seriesLength, reward, currency)` → `POST /api/v1/activities/{id}/series-definitions`
- `deleteSeriesDefinition(activityId, defId)` → `DELETE /api/v1/activities/{id}/series-definitions/{defId}`

В `useActivities.addSeriesDefinition` и `deleteSeriesDefinition`: после Dexie добавить вызов API.

**Проверка:** создать новую версию параметров → в таблице (UI) + в Swagger `GET .../series-definitions`. Удалить версию → исчезла из UI и из Swagger.

---

## 8. ✅ Награды через API

Добавить в `src/api/types.ts`: `ApiRewardIssue`, `ApiPaginatedRewardIssues`. В `mapping.ts`: `toRewardIssue()`. В `client.ts`:
- `createRewardIssue(activityId, amount, currency, date)` → `POST /api/v1/reward-issues`
- `updateRewardIssue(id, amount, currency, date)` → `PATCH /api/v1/reward-issues/{id}` (все три поля опциональны, PATCH-семантика)
- `deleteRewardIssue(id)` → `DELETE /api/v1/reward-issues/{id}`

В `useActivities.addRewardIssue`, `updateRewardIssue`, `deleteRewardIssue`: после Dexie добавить вызов API.

**Проверка:** выдать награду → в таблице (UI) + в Swagger `GET /api/v1/reward-issues`. Изменить сумму/дату/валюту → работает в UI и в Swagger. Удалить → исчезла из UI и из Swagger.

---

## 9. ✅ Переключение чтения с Dexie на API

В `useActivities`:
- Добавить в `client.ts` недостающие функции чтения: `fetchActivities()`, `fetchArchivedActivities()`, `fetchCompletions(activityId, from, to)`, `fetchRewardIssues(activityId, limit, offset)`. Функции `fetchSeriesDefinitions` уже есть с шага 7.
- Заменить `liveQuery` (Dexie) на `useEffect` + асинхронную загрузку всех данных через API: активности → для каждой: series-definitions, completions за диапазон, reward-issues.
- Убрать Dexie-вызовы из всех мутаций, оставить только API-вызовы. После каждой мутации — перезагрузка данных (`reload()`).
- Убрать импорт `db` и `liveQuery`.

**Проверка:** все данные в UI загружаются из API. Создание/изменение/удаление работает, изменения видны после перезагрузки. Dexie больше не используется для операций с данными.

---

## 10. ✅ Экспорт и импорт через API

Компонент `DataActions` (кнопки ⤓/⤒ в шапке) работает с Dexie напрямую, минуя `useActivities`.

**Экспорт:** заменить чтение из Dexie (`db.activities.toArray()` и т.д.) на вызовы API-функций чтения. Собрать полученные данные в JSON той же структуры (`{activities, seriesDefinitions, completions, rewardIssues}`), скачать файлом.

**Импорт:** заменить Dexie-транзакцию (clear + bulkAdd) на вызов `POST /api/v1/import`. Этот эндпоинт уже существует на бэкенде, принимает тот же формат JSON. Перед импортом — подтверждение, после успеха — перезагрузка страницы.

**Проверка:**
- Экспорт: нажать ⤓ → скачался JSON-файл. Сравнить содержимое с данными в Swagger `/api/v1/activities` + `/api/v1/completions`.
- Импорт: очистить БД (или использовать другую), нажать ⤒ → загрузить файл → данные появились в UI и в Swagger.

---

## 11. ✅ Удаление Dexie

Удалить пакет `dexie` (`npm uninstall dexie`). Удалить `src/db/db.ts` и директорию `src/db/`. Убедиться что `npm run build` и `npm run test` проходят.

**Проверка:** `npm run dev` стартует, приложение работает. `npm run build` без ошибок. В `node_modules` нет dexie.
