
Fix the blank-print bug by hardening the report print path in `src/pages/ReportBuilderPage.tsx` and keeping the existing dashboard/mobile UI intact.

1. Isolate the true print target
- Keep the current on-screen split layout, but make the printable area explicit and self-contained around `#print-report`.
- Ensure only the report preview is printed, while the dashboard shell, sidebar, mobile header/drawer, controls, chatbot, and action buttons stay hidden.
- Add a print-mode wrapper/class on the page root so print rules target this screen precisely instead of relying on broad selectors alone.

2. Replace fragile print CSS with a safer, browser-tolerant print layer
- Update the inline `@media print` block in `ReportBuilderPage.tsx` so it:
  - forces `html`, `body`, `#root`, dashboard wrappers, motion wrappers, and the main scroll container to `height: auto`, `overflow: visible`, `max-height: none`, `transform: none`, `filter: none`
  - removes clipping sources such as `overflow-hidden`, `aspect-ratio`, `min-h/full-height`, and shadowed/staged containers during print
  - guarantees `display: block`, `visibility: visible`, and `opacity: 1` for `#print-report` and all descendants
  - explicitly neutralizes print-breaking positioning when needed (`fixed`/`absolute`/sticky wrappers that can detach content from printable flow)
  - preserves A4 output with `@page`, white background, black text, and `break-inside: avoid` on important sections
- Keep the rules narrowly scoped to the report route so other pages are unaffected.

3. Make the report flow like a real document in print
- Remove print-time constraints from the preview container:
  - no `aspect-[1/1.414]` behavior in print
  - no internal scroll area in print
  - no `min-h-full` / `mt-auto` behavior that can push content off-page unexpectedly
- Convert the A4 preview from a screen-styled canvas into a normal document flow during print, so long reports paginate naturally instead of rendering as a blank staged box.

4. Harden the print trigger
- Upgrade `handlePrint()` so printing only runs after the report is fully present in the DOM:
  - wait for fonts
  - wait for the next paint cycle(s)
  - verify `printRef.current` exists and has measurable rendered height/content before calling `window.print()`
  - add a slightly more robust delay/fallback for Chromium/WebKit print-preview timing
- If needed, temporarily add a `printing` state/class to the document body before `window.print()` and clean it up with `afterprint`, so print-only layout is stable before preview opens.

5. Preserve markdown/AI content in print
- Ensure the `ReactMarkdown` output inside the prose container is not being visually rendered on screen but excluded in print by inherited styles.
- Add print-safe typography rules for headings, paragraphs, lists, and emphasis so generated medical text remains visible and readable in the print preview.

6. Verify interactions that must not regress
- Keep the existing dashboard scroll architecture from `DashboardLayout.tsx`.
- Do not change the mobile drawer behavior in `AppSidebar.tsx` except, if necessary, to ensure drawer/header elements are always hidden in print.
- Keep the on-screen report preview appearance essentially unchanged while improving only the print pathway.

Files to update
- `src/pages/ReportBuilderPage.tsx` — main fix: print CSS, print handler, print-target scoping, document-flow cleanup
- `src/components/layout/DashboardLayout.tsx` — only if a tiny print-only class/attribute is needed on wrappers for safer targeting
- `src/components/layout/AppSidebar.tsx` — only if explicit print hiding is needed for mobile/desktop shell elements

Technical details
```text
Likely failure mode:
Dashboard route uses a locked viewport + scrolling main area.
Report preview lives inside animated/staged wrappers with fixed-height and overflow behavior.
In print preview, one ancestor still clips or detaches the report, so the browser prints an empty white page.

Implementation goal:
Screen mode = current split preview UI
Print mode  = flattened document flow with one visible report root
```

Expected result
- Print preview shows the full report content instead of a blank white page.
- AI-generated text, demographics, metrics, and footer all appear in print.
- Multi-page reports paginate cleanly on A4.
- Desktop/mobile app UI remains unchanged outside print mode.
