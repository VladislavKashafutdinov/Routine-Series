# Реализованная схема вложенности компонентов

Актуально на момент последнего изменения кода. Обновляется после каждого выполненного пункта из TODO.md.

```
App
├── AppHeader
│   ├── LangSwitcher
│   ├── PageTabs                («Выполнение» | «Мониторинг» | «Архив»)
│   └── TimeTravel              (◀ YYYY-MM-DD ▶ «Сегодня», VirtualTodayContext)
│
├── [«Выполнение»] Dashboard
│   ├── AddActivity             (название + длина/награда/валюта)
│   ├── Section «Не выполнено»
│   │   └── ActivityCard[]
│   │       ├── EditableName    (inline-редактирование)
│   │       ├── SeriesProgress  (квадратики, без кликов)
│   │       ├── ToggleDoneBtn   («Отметить»)
│   │       └── DeleteButton    (×, с подтверждением)
│   └── Section «Выполнено»
│       └── ActivityCard[]
│           ├── EditableName
│           ├── SeriesProgress
│           ├── ToggleDoneBtn   («Отменить»)
│           └── DeleteButton
│
├── [«Мониторинг»] MonitoringPage
│   └── ActivityAccordion[]     (один открыт одновременно)
│       ├── Header: activity.name + RewardCounters + «Начислить»
│       ├── IssueRewardModal    (оверлей: дата/сумма/валюта → addRewardIssue)
│       ├── EditSeriesDefinition (кнопка → inline-форма, создаёт новый SeriesDefinition)
│       ├── TabSwitcher         («История серий» / «История начислений»)
│       ├── [series] SeriesHistoryTab
│       │   ├── SeriesWidget[]  (swidget__progress: даты + квадратики; swidget__badge: статус)
│       │   └── Paginator       (◀ N/M ▶)
│       └── [rewards] RewardHistoryTab
│           ├── Таблица (дата | сумма | валюта | действия)
│           ├── EditableCell    (клик → input, Enter/blur → updateRewardIssue, Esc → отмена)
│           ├── DeleteButton    (confirm → deleteRewardIssue)
│           └── Paginator       (◀ N/M ▶)
│
└── [«Архив»] ArchivePage
    └── ArchivedActivityRow[]
        ├── Название + количество completions
        └── RestoreButton      (confirm → unarchiveActivity)
```
