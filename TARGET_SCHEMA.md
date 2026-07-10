# Целевая схема вложенности компонентов

```
App
├── AppHeader
│   ├── LangSwitcher
│   ├── PageTabs                («Выполнение» | «Мониторинг» | «Архив»)
│   └── TimeTravel              (◀ YYYY-MM-DD ▶ «Сегодня»)
│
├── [«Выполнение»] Dashboard
│   ├── AddActivity             (название + длина/награда/валюта)
│   ├── Section «Не выполнено»
│   │   └── ActivityCard[]
│   │       ├── EditableName
│   │       ├── SeriesProgress  (квадратики, только отображение)
│   │       ├── MarkDoneButton  («Отметить»)
│   │       └── DeleteButton
│   └── Section «Выполнено»
│       └── ActivityCard[]
│           ├── EditableName
│           ├── SeriesProgress  (квадратики, только отображение)
│           ├── UndoButton      («Отменить»)
│           └── DeleteButton
│
├── [«Мониторинг»] MonitoringPage
│   └── ActivityAccordion[]
│       ├── Заголовок: activity.name + RewardCounters + «Начислить»
│       ├── IssueRewardModal    (дата/сумма/валюта → addRewardIssue)
│       ├── TabSwitcher («SeriesDefinition» / «История начислений» / «История серий» / «Completions»)
│       ├── [«SeriesDefinition»] SeriesDefinitionTab ⏳
│       │   └── Список всех SeriesDefinition + добавление новой (длина / награда / валюта)
│       ├── [«История начислений»] RewardHistoryTab
│       │   ├── Таблица RewardIssue (дата | сумма | валюта | действия)
│       │   ├── EditableCell    (inline-редактирование)
│       │   ├── DeleteButton    (с подтверждением)
│       │   └── Paginator
│       ├── [«История серий»] SeriesHistoryTab
│       │   ├── Группы по SeriesDefinition
│       │   │   └── SeriesWidget[]  (статус, квадратики с кликами, даты)
│       │   └── Paginator
│       └── [«Completions»] CompletionsTab ⏳
│           └── Календарь по месяцам (по 3 месяца, пагинация)
│               └── Клик по дню → тоггл completion
│
└── [«Архив»] ArchivePage
    └── ArchivedActivityRow[]
        ├── Название + количество completions (информационно)
        └── RestoreButton (с подтверждением)
```
