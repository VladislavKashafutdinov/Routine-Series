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
