# План фиксации MVP ЛР №6

Дата: 26.10.2026. Ветка: `main`. HEAD: `2e0af39`. Индекс пуст.
Remote: `https://github.com/alexeybardok-commits/dolgoletie-marshrut.git`.
26.10.2026 `git fetch origin` выполнен успешно. На момент проверки `main` и
`origin/main` совпали на SHA `2e0af39c657c4670c98d6715426bc242d0ac00fc`.
Расхождение составляло 0 локальных и 0 удалённых коммитов.

Предлагаемое сообщение: `feat: deliver working MVP for lab 6`.

## Точный состав будущего коммита

Всего 102 пути: 7 изменённых, 90 новых, 5 удалённых при предыдущей TS-миграции.
Это план; ни один файл ещё не добавлен в индекс.

| Статус | Путь |
| --- | --- |
| M | `.gitignore` |
| M | `README.md` |
| M | `app/README.md` |
| A | `app/UI_REVIEW_FE033_037.md` |
| M | `app/eslint.config.js` |
| M | `app/index.html` |
| M | `app/package-lock.json` |
| M | `app/package.json` |
| A | `app/scripts/check-catalog.mjs` |
| D | `app/src/App.css` |
| D | `app/src/App.jsx` |
| A | `app/src/README.md` |
| A | `app/src/app/App.tsx` |
| A | `app/src/app/__tests__/catalogTemporaryState.test.ts` |
| A | `app/src/app/__tests__/planSession.test.ts` |
| A | `app/src/app/additionContext.ts` |
| A | `app/src/app/planSession.ts` |
| A | `app/src/components/activities/ActiveFilters.tsx` |
| A | `app/src/components/activities/ActivityCard.tsx` |
| A | `app/src/components/activities/ActivityParts.tsx` |
| A | `app/src/components/activities/AdditionalFilters.tsx` |
| A | `app/src/components/activities/DetailSections.tsx` |
| A | `app/src/components/activities/PlanWarnings.tsx` |
| A | `app/src/components/activities/WeeklySchedule.tsx` |
| A | `app/src/components/activities/catalogPresentation.ts` |
| A | `app/src/components/common/CatalogFields.tsx` |
| A | `app/src/components/common/PreferenceFields.tsx` |
| A | `app/src/components/layout/Layout.tsx` |
| A | `app/src/components/layout/RouteFocus.tsx` |
| A | `app/src/data/activities.json` |
| A | `app/src/data/catalog/README.md` |
| A | `app/src/data/catalog/contracts.ts` |
| A | `app/src/data/catalog/demo/directions.json` |
| A | `app/src/data/catalog/demo/groups.json` |
| A | `app/src/data/catalog/demo/instructors.json` |
| A | `app/src/data/catalog/demo/organizers.json` |
| A | `app/src/data/catalog/demo/schedules.json` |
| A | `app/src/data/catalog/demo/venues.json` |
| A | `app/src/data/catalog/index.ts` |
| A | `app/src/data/catalog/normalize.ts` |
| D | `app/src/index.css` |
| D | `app/src/main.jsx` |
| A | `app/src/main.tsx` |
| A | `app/src/pages/ActivitiesPage.tsx` |
| A | `app/src/pages/ActivityAddedPage.tsx` |
| A | `app/src/pages/ActivityDetailPage.tsx` |
| A | `app/src/pages/CatalogPage.tsx` |
| A | `app/src/pages/HelpSelectPage.tsx` |
| A | `app/src/pages/HomePage.tsx` |
| A | `app/src/pages/MyPlanPage.tsx` |
| A | `app/src/pages/PendingPages.tsx` |
| A | `app/src/pages/PlanPage.tsx` |
| A | `app/src/pages/PreferencesPage.tsx` |
| A | `app/src/pages/__tests__/Accessibility.test.ts` |
| A | `app/src/pages/__tests__/CatalogSearch.test.ts` |
| A | `app/src/pages/__tests__/MyPlanPage.test.ts` |
| A | `app/src/storage/README.md` |
| A | `app/src/storage/__tests__/activityPlanStorage.test.ts` |
| A | `app/src/storage/activityPlanStorage.ts` |
| A | `app/src/storage/usePlanPersistence.ts` |
| A | `app/src/storage/useStoredState.ts` |
| A | `app/src/styles/App.css` |
| A | `app/src/styles/index.css` |
| A | `app/src/types/domain.ts` |
| A | `app/src/types/index.ts` |
| A | `app/src/types/legacy.ts` |
| A | `app/src/utils/business/README.md` |
| A | `app/src/utils/business/__tests__/additionalFilters.test.ts` |
| A | `app/src/utils/business/__tests__/catalog.test.ts` |
| A | `app/src/utils/business/__tests__/cost.test.ts` |
| A | `app/src/utils/business/__tests__/detail.test.ts` |
| A | `app/src/utils/business/__tests__/fixtures.ts` |
| A | `app/src/utils/business/__tests__/helpSelect.test.ts` |
| A | `app/src/utils/business/__tests__/plan.test.ts` |
| A | `app/src/utils/business/__tests__/schedule.test.ts` |
| A | `app/src/utils/business/__tests__/search.test.ts` |
| A | `app/src/utils/business/__tests__/selection.test.ts` |
| A | `app/src/utils/business/additionalFilters.ts` |
| A | `app/src/utils/business/conflicts.ts` |
| A | `app/src/utils/business/cost.ts` |
| A | `app/src/utils/business/filter.ts` |
| A | `app/src/utils/business/helpSelect.ts` |
| A | `app/src/utils/business/index.ts` |
| A | `app/src/utils/business/legacyModel.ts` |
| A | `app/src/utils/business/order.ts` |
| A | `app/src/utils/business/plan.ts` |
| A | `app/src/utils/business/road.ts` |
| A | `app/src/utils/business/schedule.ts` |
| A | `app/src/utils/business/search.ts` |
| A | `app/src/utils/business/selection.ts` |
| A | `app/src/utils/business/types.ts` |
| A | `app/tsconfig.app.json` |
| A | `app/tsconfig.json` |
| A | `app/tsconfig.node.json` |
| D | `app/vite.config.js` |
| A | `app/vite.config.ts` |
| A | `app/vitest.config.ts` |
| A | `docs/LAB6_COMMIT_FILES.txt` |
| A | `docs/LAB6_COMMIT_PLAN.md` |
| A | `docs/LAB6_REPORT.md` |
| A | `docs/backlog_Долголетие_Маршрут_FRONTEND_FINAL (1).docx` |
| A | `docs/Техническое_задание_Долголетие_Маршрут_v1.15_FINAL_Development_Baseline (1).docx` |

Машиночитаемый список: [LAB6_COMMIT_FILES.txt](LAB6_COMMIT_FILES.txt).
Изменённые README, правила исключений и отчёт включены вместе с реализацией.
Два утверждённых DOCX включены как источник требований. Старые пути JS/CSS
удалены предыдущей миграцией: фиксировать их следует вместе с заменами TSX/TS/CSS.

## Что исключено

- `node_modules`, `dist`, `.env`, coverage, кэши и логи.
- `mobile-check.png`, `route-check.pdf`, `verify-scenario.mjs`, `.stage-*`.
- Неизменённые материалы `tempPage` и остальные прежние файлы: они уже в репозитории.

## Порядок после подтверждения владельца

1. Подтвердить ветку `main`, все 102 пути, включение исходных DOCX и сообщение.
2. Проверить актуальность remote перед публикацией; при расхождении остановиться и согласовать интеграцию.
3. Подготовить индекс только по manifest, проверить `git diff --cached --stat`, полный staged diff и `git diff --cached --check`.
4. Создать один логический коммит реализации MVP и документации ЛР №6.
5. Push выполнять после отдельного явного подтверждения назначения и ветки.

Возможная команда подготовки индекса (в этом этапе НЕ выполнялась):

```powershell
git --literal-pathspecs add --pathspec-from-file=docs/LAB6_COMMIT_FILES.txt
```

При новых изменениях обновить manifest и повторно проверить состав.
Существующие тесты включены в MVP; ЛР №7 требует отдельного последующего
коммита с дополнительными тестами.

Проверки и ограничения: [LAB6_REPORT.md](LAB6_REPORT.md).
Commit, push, reset, clean и rebase не выполнялись.
