# components/reader/

Reserved for components extracted from
`app/(content)/read/[slug]/page.tsx` (~1,030 lines) — e.g. `ReaderToolbar`,
`ChapterNav`, `PageViewer`, `ReaderComments`.

Not populated yet: splitting this page means touching reader business logic
(page state, chapter navigation, progress sync), not just moving files, so
it needs to be done with the ability to run and test the app. See
`AI_REFACTOR_REPORT.md` → Recommendations for details.
